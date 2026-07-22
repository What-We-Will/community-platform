"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";
import { safeTimezone } from "@/lib/utils/timezone";
import { escapeHtml } from "@/lib/utils/html";
import { validateHttpsUrl } from "@/lib/utils/url";

export type OnboardingResult = { error?: string };

export async function completeOnboarding(
  data: {
    display_name: string;
    avatar_url?: string | null;
    headline?: string | null;
    location?: string | null;
    bio?: string | null;
    skills: string[];
    open_to_referrals: boolean;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    timezone?: string;
  }
): Promise<OnboardingResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to complete onboarding." };
  }

  const linkedinUrl = data.linkedin_url?.trim() || null;
  const githubUrl = data.github_url?.trim() || null;
  const portfolioUrl = data.portfolio_url?.trim() || null;

  if (!linkedinUrl && !githubUrl && !portfolioUrl) {
    return {
      error:
        "Please provide at least one of LinkedIn, GitHub, or a personal website so we can verify your background.",
    };
  }

  const urlValidationErrors = [
    validateHttpsUrl(linkedinUrl),
    validateHttpsUrl(githubUrl),
    validateHttpsUrl(portfolioUrl),
  ].filter((e): e is string => e !== null);
  if (urlValidationErrors.length > 0) {
    return { error: urlValidationErrors[0] };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: data.display_name,
      avatar_url: data.avatar_url ?? null,
      headline: data.headline || null,
      location: data.location || null,
      bio: data.bio || null,
      skills: data.skills,
      open_to_referrals: data.open_to_referrals,
      linkedin_url: linkedinUrl,
      github_url: githubUrl,
      portfolio_url: portfolioUrl,
      timezone: safeTimezone(data.timezone),
      is_onboarded: true,
      approval_status: "pending",
    },
    { onConflict: "id" }
  );

  if (error) {
    return { error: error.message };
  }

  // Notify admin that a new account needs review
  await notifyAdminOfNewApplication({
    displayName: data.display_name,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    userEmail: user.email ?? "unknown",
  });

  revalidatePath("/", "layout");
  return {};
}

async function notifyAdminOfNewApplication({
  displayName,
  linkedinUrl,
  githubUrl,
  portfolioUrl,
  userEmail,
}: {
  displayName: string;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  userEmail: string;
}) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL ?? gmailUser;

  if (!gmailUser || !gmailPass || !adminEmail) return;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    const { getSiteUrl } = await import("@/lib/utils/get-site-url");
    const approvalUrl = `${getSiteUrl()}/admin/approvals`;

    const links = [
      { label: "LinkedIn", url: linkedinUrl },
      { label: "GitHub", url: githubUrl },
      { label: "Website", url: portfolioUrl },
    ].filter((link): link is { label: string; url: string } => Boolean(link.url));

    const linksHtml = links
      .map(
        (link) =>
          `<p><strong>${link.label}:</strong> <a href="${escapeHtml(link.url)}">${escapeHtml(link.url)}</a></p>`
      )
      .join("\n        ");

    await transporter.sendMail({
      from: `What We Will <${gmailUser}>`,
      to: adminEmail,
      // Subject is a plain-text header — strip CRLF to block header injection,
      // but do not HTML-escape: entities would render literally in the inbox.
      subject: `[New Application] ${displayName.replace(/[\r\n]/g, "")} is requesting membership`,
      html: `
        <h2>New Membership Application</h2>
        <p><strong>Name:</strong> ${escapeHtml(displayName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
        ${linksHtml}
        <br />
        <a href="${approvalUrl}" style="background:#000;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
          Review in Admin Panel
        </a>
      `,
    });
  } catch (err) {
    // Non-critical — log but don't fail the onboarding
    console.error("[onboarding] Failed to notify admin:", err);
  }
}

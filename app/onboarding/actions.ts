"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";
import { safeTimezone } from "@/lib/utils/timezone";

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

  if (!data.linkedin_url?.trim()) {
    return { error: "LinkedIn URL is required to verify your background." };
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
      linkedin_url: data.linkedin_url || null,
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
    linkedinUrl: data.linkedin_url,
    userEmail: user.email ?? "unknown",
  });

  revalidatePath("/", "layout");
  return {};
}

async function notifyAdminOfNewApplication({
  displayName,
  linkedinUrl,
  userEmail,
}: {
  displayName: string;
  linkedinUrl: string;
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

    const approvalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://community-platform-x74m.vercel.app"}/admin/approvals`;

    await transporter.sendMail({
      from: `What We Will <${gmailUser}>`,
      to: adminEmail,
      subject: `[New Application] ${displayName} is requesting membership`,
      html: `
        <h2>New Membership Application</h2>
        <p><strong>Name:</strong> ${displayName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>LinkedIn:</strong> <a href="${linkedinUrl}">${linkedinUrl}</a></p>
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

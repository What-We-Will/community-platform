import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Shared Gmail transport for member-facing email (DM notifications, My Tools reminders).
 * Requires GMAIL_USER + GMAIL_APP_PASSWORD in the environment.
 */
export function createGmailTransport(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export function getMailFromHeader(): string | null {
  const user = process.env.GMAIL_USER;
  if (!user) return null;
  return `What We Will <${user}>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Weekly-style reminder: links to My Tools (user must click Refresh for Pulsar; no API cost here).
 */
export async function sendMyToolsReminderEmail(opts: {
  to: string;
  displayName: string;
  myToolsUrl: string;
  profileUrl: string;
  tips: string[];
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const transport = createGmailTransport();
  const from = getMailFromHeader();
  if (!transport || !from) {
    return { ok: false, reason: "mail_not_configured" };
  }

  const tipsHtml =
    opts.tips.length > 0
      ? `<p style="color:#555;margin:12px 0 8px;">Ideas to improve your matches:</p><ul style="padding-left:20px;color:#444;margin-top:0;">${opts.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`
      : "";

  const first = escapeHtml(opts.displayName.split(" ")[0] || opts.displayName);

  try {
    await transport.sendMail({
      from,
      to: opts.to,
      subject: "Refresh your job matches on What We Will",
      html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
            <h2 style="margin-bottom:4px;">Hi ${first}</h2>
            <p style="color:#555;margin-top:0;">
              Job postings change often. Open <strong>My Tools</strong> and tap
              <strong>Refresh matches</strong> when you&apos;re ready—matches only update when you run them (we don&apos;t auto-call external APIs for you).
            </p>
            ${tipsHtml}
            <a href="${opts.myToolsUrl}"
               style="display:inline-block;background:#f97316;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px;">
              Open My Tools
            </a>
            <p style="margin-top:16px;">
              <a href="${opts.profileUrl}" style="color:#ea580c;">Update your profile</a>
              for better results (headline, bio, skills, location).
            </p>
            <p style="color:#aaa;font-size:12px;margin-top:24px;">
              You opted in to these reminders in your profile settings.
              Turn them off anytime under My Profile.
            </p>
          </div>
        `,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] My Tools reminder failed:", err);
    return { ok: false, reason: "send_failed" };
  }
}

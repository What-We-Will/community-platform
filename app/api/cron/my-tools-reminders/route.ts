import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendMyToolsReminderEmail } from "@/lib/email";
import { getProfileCompleteness } from "@/lib/profile-completeness";
import { missingFieldToReminderTip } from "@/lib/my-tools-reminder-tips";
import {
  MY_TOOLS_REMINDER_COOLDOWN_DAYS,
  canSendReminderEmail,
} from "@/lib/my-tools-reminder-schedule";

export const dynamic = "force-dynamic";
/** Cap per invocation to stay within serverless time limits. */
const MAX_SEND_PER_RUN = 40;

/**
 * Weekly cron (see `vercel.json`). Sends opt-in reminder emails only.
 * Secured with `Authorization: Bearer ${CRON_SECRET}` (set CRON_SECRET in Vercel).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let service;
  try {
    service = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured (Supabase service role)" },
      { status: 503 }
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://members.wwwrise.org";
  const myToolsUrl = `${siteUrl.replace(/\/$/, "")}/my-tools`;
  const profileUrl = `${siteUrl.replace(/\/$/, "")}/profile`;

  const now = new Date();

  const { data: candidates, error: qErr } = await service
    .from("profiles")
    .select(
      "id, display_name, headline, bio, skills, linkedin_url, location, last_my_tools_reminder_sent_at, approval_status, is_onboarded, email_my_tools_reminders"
    )
    .eq("email_my_tools_reminders", true)
    .eq("is_onboarded", true)
    .eq("approval_status", "approved");

  if (qErr) {
    console.error("[cron/my-tools-reminders] query error:", qErr.message);
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const eligible = (candidates ?? [])
    .filter((p) =>
      canSendReminderEmail(
        p.last_my_tools_reminder_sent_at ?? null,
        now,
        MY_TOOLS_REMINDER_COOLDOWN_DAYS
      )
    )
    .slice(0, MAX_SEND_PER_RUN);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of eligible) {
    const { data: authUser, error: authErr } =
      await service.auth.admin.getUserById(row.id);
    if (authErr || !authUser.user?.email) {
      failed += 1;
      errors.push(`no email for ${row.id}`);
      continue;
    }

    const completeness = getProfileCompleteness({
      headline: row.headline,
      bio: row.bio,
      skills: row.skills,
      linkedin_url: row.linkedin_url,
      location: row.location,
    });

    const tips =
      completeness.score < 80
        ? completeness.missing.map((m) => missingFieldToReminderTip(m))
        : [];

    const result = await sendMyToolsReminderEmail({
      to: authUser.user.email,
      displayName: row.display_name,
      myToolsUrl,
      profileUrl,
      tips,
    });

    if (!result.ok) {
      failed += 1;
      errors.push(`${authUser.user.email}: ${result.reason}`);
      continue;
    }

    const { error: upErr } = await service
      .from("profiles")
      .update({ last_my_tools_reminder_sent_at: new Date().toISOString() })
      .eq("id", row.id);

    if (upErr) {
      failed += 1;
      errors.push(`update ${row.id}: ${upErr.message}`);
      continue;
    }

    sent += 1;
  }

  return NextResponse.json({
    ok: true,
    eligible: eligible.length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
}

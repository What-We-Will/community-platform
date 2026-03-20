# My Tools refresh model (Pulsar)

## User-triggered (default)

- **Live matches** and **career brief** are only requested from Pulsar when a signed-in member clicks **Refresh matches** or **Generate brief** on [My Tools](/app/(app)/my-tools/).
- Each run is stored in Supabase (`member_match_runs`, `member_career_briefs`) for display and history.
- **Cost scales with actual usage**, not with total membership.

## No automatic batch refresh (by design)

Running matches or briefs on a schedule for every member would multiply **ATS + LLM** cost by **N users × frequency**. If you add batch jobs later:

- Use a **hard cap** per day (e.g. max users or max API calls).
- Prefer **cohorts** (e.g. active in the last 7 days).
- Store **last auto-run** timestamps and respect per-user cooldowns.

## Weekly email reminder (opt-in)

- Members can enable **“Email me a weekly reminder…”** on **My Profile**.
- The Vercel cron job (`vercel.json` → `/api/cron/my-tools-reminders`) runs **weekly** and sends **at most one email per member per 7 days** (tracked on `profiles.last_my_tools_reminder_sent_at`).
- The email **does not call Pulsar**; it only links members back to the app to refresh manually.

### Required environment variables

- `CRON_SECRET` — must match the secret Vercel sends as `Authorization: Bearer …` on cron invocations.
- `GMAIL_USER`, `GMAIL_APP_PASSWORD` — same Gmail app password used for DM notifications.
- `NEXT_PUBLIC_SITE_URL` — production site base URL for links in the email.
- `SUPABASE_SERVICE_ROLE_KEY` — service role client updates `last_my_tools_reminder_sent_at` and reads opted-in profiles.

### After deploy

1. Apply migration `058_profile_my_tools_email_prefs.sql` (adds `email_my_tools_reminders`, `last_my_tools_reminder_sent_at`).
2. Set `CRON_SECRET` in Vercel (generate a long random string).
3. Confirm the cron appears under the project’s **Cron Jobs** tab.

**Plan note:** Scheduled jobs may require a Vercel plan that includes [Cron Jobs](https://vercel.com/docs/cron-jobs); if cron is unavailable, members can still use in-app nudges and manual refresh.

## In-app nudges

- **Profile completeness** (headline, bio, skills, location, LinkedIn) is shown on My Tools when the score is below 80/100, with a link to `/profile`.
- If the last match run is **7+ days** old, a non-blocking “stale matches” note encourages a manual refresh.

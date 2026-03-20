"use server";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_TIMEZONE = "America/Chicago";

/**
 * If the user's profile still has the default timezone and their
 * browser reports a different one, update the profile.
 *
 * No-op if:
 * - User is not authenticated
 * - Profile timezone is already non-default (user or onboarding set it)
 * - Browser timezone matches the default
 */
export async function syncBrowserTimezone(
  browserTimezone: string
): Promise<void> {
  if (!browserTimezone || browserTimezone === DEFAULT_TIMEZONE) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  if (profile?.timezone !== DEFAULT_TIMEZONE) return;

  await supabase
    .from("profiles")
    .update({ timezone: browserTimezone })
    .eq("id", user.id);
}

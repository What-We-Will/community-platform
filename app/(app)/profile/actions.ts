"use server";

import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateResult = { error?: string };

export async function updateProfile(
  data: {
    display_name: string;
    headline?: string | null;
    location?: string | null;
    bio?: string | null;
    skills: string[];
    open_to_referrals: boolean;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
  }
): Promise<ProfileUpdateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your profile." };
  }

  // Upsert: insert if profile doesn't exist, otherwise update
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: data.display_name,
      headline: data.headline || null,
      location: data.location || null,
      bio: data.bio || null,
      skills: data.skills,
      open_to_referrals: data.open_to_referrals,
      linkedin_url: data.linkedin_url || null,
      github_url: data.github_url || null,
      portfolio_url: data.portfolio_url || null,
      is_onboarded: true,
    },
    { onConflict: "id" }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Updates the current user's last_seen_at so they show as online/away to others.
 * Call periodically from the client (e.g. every 45s) while the app is open.
 */
export async function updateLastSeen(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id);
}

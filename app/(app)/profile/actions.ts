"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeTimezone } from "@/lib/utils/timezone";

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
    timezone?: string | null;
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
      timezone: safeTimezone(data.timezone),
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

export async function updateAvatarUrl(avatarUrl: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/members");
  return {};
}

export async function updateResumePath(resumePath: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ resume_path: resumePath })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  return {};
}

export async function getResumeSignedUrl(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_path")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.resume_path) return null;

  const { data } = await supabase.storage
    .from("resumes")
    .createSignedUrl(profile.resume_path, 3600);

  return data?.signedUrl ?? null;
}

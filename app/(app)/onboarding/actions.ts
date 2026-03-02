"use server";

import { createClient } from "@/lib/supabase/server";

export type OnboardingResult = { error?: string };

export async function completeOnboarding(
  data: {
    display_name: string;
    headline?: string | null;
    location?: string | null;
    bio?: string | null;
    skills: string[];
    open_to_referrals: boolean;
    linkedin_url?: string | null;
  }
): Promise<OnboardingResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to complete onboarding." };
  }

  // Upsert: insert if profile doesn't exist (e.g. trigger failed), otherwise update
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
      is_onboarded: true,
    },
    { onConflict: "id" }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}

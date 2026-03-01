export type ProfileRole = "member" | "admin" | "moderator";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  open_to_referrals: boolean;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  timezone: string;
  is_onboarded: boolean;
  role: ProfileRole;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: string[];
  open_to_referrals?: boolean;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  timezone?: string;
  is_onboarded?: boolean;
  role?: ProfileRole;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: string[];
  open_to_referrals?: boolean;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  timezone?: string;
  is_onboarded?: boolean;
}

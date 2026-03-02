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

// ─── Messaging ───────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  type: "dm" | "group";
  group_id: string | null;
  created_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  muted: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  message_type: "text" | "file" | "system" | "video_invite";
  metadata: Record<string, unknown>;
  edited_at: string | null;
  created_at: string;
}

export interface ConversationWithDetails {
  conversation: Conversation;
  participants: Profile[];
  lastMessage: Message | null;
  unreadCount: number;
}

export interface MessageWithSender extends Message {
  sender: Profile | null;
}

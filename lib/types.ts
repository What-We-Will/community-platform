export type ProfileRole = "member" | "admin" | "moderator";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  resume_path: string | null;
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
  resume_path?: string | null;
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
  resume_path?: string | null;
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
  // Populated for group conversations
  groupName?: string;
  groupSlug?: string;
}

export interface MessageWithSender extends Message {
  sender: Profile | null;
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  avatar_url: string | null;
  is_private: boolean;
  is_discoverable: boolean;
  archived?: boolean;
  max_members: number | null;
  created_by: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "member" | "admin" | "moderator";
  joined_at: string;
}

export interface GroupWithDetails extends Group {
  memberCount: number;
  isMember: boolean;
  currentUserRole: "member" | "admin" | "moderator" | null;
  recentMembers: Profile[];
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  created_at: string;
}

export interface GroupJoinRequestWithProfile extends GroupJoinRequest {
  profile: Profile;
}

// ─── Polls ──────────────────────────────────────────────────────────────────

export interface Poll {
  id: string;
  question: string;
  created_by: string | null;
  group_id: string | null;
  allow_multiple: boolean;
  closes_at: string | null;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  order_index: number;
}

export interface PollVote {
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface PollWithDetails extends Poll {
  options: (PollOption & { voteCount: number })[];
  totalVotes: number;
  userVotes: string[]; // option IDs the current user voted for
  creator: Profile | null;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventType =
  | "skillshare"
  | "workshop"
  | "ama"
  | "mock_interview"
  | "social"
  | "other";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  host_id: string | null;
  group_id: string | null;
  location: string | null;
  video_room_name: string | null;
  starts_at: string;
  ends_at: string;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventRsvp {
  event_id: string;
  user_id: string;
  status: "going" | "maybe" | "declined";
  created_at: string;
}

export interface EventWithDetails extends Event {
  host: Profile | null;
  group: Group | null;
  rsvpCounts: { going: number; maybe: number; declined: number };
  currentUserRsvp: EventRsvp | null;
  isLive: boolean;
  isPast: boolean;
}

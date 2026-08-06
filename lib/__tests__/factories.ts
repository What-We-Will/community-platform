import type { Message, MessageWithSender, Profile } from "@/lib/types";

/**
 * Test data factories. Per TESTING_STANDARDS.preamble.md rule 5, test objects
 * come from here rather than being constructed inline, so a field added to a
 * domain type is filled in one place instead of across every test file.
 *
 * Each factory takes an overrides object and applies it last, so a test states
 * only the fields its assertion actually depends on.
 */

export function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile-1",
    display_name: "Test Member",
    avatar_url: null,
    resume_path: null,
    headline: null,
    bio: null,
    location: null,
    skills: [],
    open_to_referrals: false,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    timezone: "UTC",
    is_onboarded: true,
    approval_status: "approved",
    role: "member",
    last_seen_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "message-1",
    conversation_id: "conversation-1",
    sender_id: "profile-1",
    content: "Hello there",
    message_type: "text",
    metadata: {},
    edited_at: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildMessageWithSender(
  overrides: Partial<MessageWithSender> = {}
): MessageWithSender {
  const { sender, ...messageOverrides } = overrides;
  return {
    ...buildMessage(messageOverrides),
    sender: sender === undefined ? buildProfile() : sender,
  };
}

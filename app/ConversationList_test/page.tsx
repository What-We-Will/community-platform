"use client";

import { ConversationList } from "@/components/messages/ConversationList";
import type { ConversationWithDetails, Message, Profile } from "@/lib/types";

// Mock utility functions
const formatRelativeTime = (date: string) =>
  new Date(date).toLocaleTimeString();
const getAvatarColor = (_name: string) => "bg-blue-500 text-white";
const LiveStatusAvatar = ({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) => (
  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
    {displayName[0]}
  </div>
);

export default function MockConversationList() {
  const currentUserId = "user_1";
  const selfNotesId = "notes_1";

  const initialConversations: ConversationWithDetails[] = [
    // My Notes
    {
      conversation: {
        id: selfNotesId,
        type: "dm",
        group_id: null,
        created_at: new Date().toISOString(),
      },
      participants: [],
      lastMessage: {
        id: "msg_0",
        conversation_id: selfNotesId,
        sender_id: currentUserId,
        content: "Remember to mock this component!",
        created_at: new Date().toISOString(),
        message_type: "system",
        metadata: {},
        edited_at: null,
      },
      unreadCount: 0,
    },
    // DM with Alice
    {
      conversation: {
        id: "conv_2",
        type: "dm",
        group_id: null,
        created_at: new Date().toISOString(),
      },
      participants: [
        {
          id: "user_2",
          display_name: "Alice",
          avatar_url: null,
          resume_path: null,
          headline: null,
          bio: null,
          location: null,
          skills: [],
          open_to_referrals: true,
          linkedin_url: null,
          github_url: null,
          portfolio_url: null,
          timezone: "UTC",
          is_onboarded: true,
          approval_status: "approved",
          role: "member",
          last_seen_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      lastMessage: {
        id: "msg_1",
        conversation_id: "conv_2",
        sender_id: "user_2",
        content: "Hey there!",
        created_at: new Date().toISOString(),
        message_type: "text",
        metadata: {},
        edited_at: null,
      },
      unreadCount: 1,
    },
    // DM with Bob
    {
      conversation: {
        id: "conv_3",
        type: "dm",
        group_id: null,
        created_at: new Date().toISOString(),
      },
      participants: [
        {
          id: "user_3",
          display_name: "Bob",
          avatar_url: null,
          resume_path: null,
          headline: null,
          bio: null,
          location: null,
          skills: [],
          open_to_referrals: true,
          linkedin_url: null,
          github_url: null,
          portfolio_url: null,
          timezone: "UTC",
          is_onboarded: true,
          approval_status: "approved",
          role: "member",
          last_seen_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      lastMessage: {
        id: "msg_2",
        conversation_id: "conv_3",
        sender_id: currentUserId,
        content: "Hi Bob, how are you?",
        created_at: new Date().toISOString(),
        message_type: "text",
        metadata: {},
        edited_at: null,
      },
      unreadCount: 0,
    },
    // Group conversation (will be filtered out in your component)
    {
      conversation: {
        id: "group_1",
        type: "group",
        group_id: "group_1",
        created_at: new Date().toISOString(),
      },
      participants: [],
      lastMessage: {
        id: "msg_3",
        conversation_id: "group_1",
        sender_id: "user_2",
        content: "Welcome to the group!",
        created_at: new Date().toISOString(),
        message_type: "text",
        metadata: {},
        edited_at: null,
      },
      unreadCount: 2,
      groupName: "Study Group",
      groupSlug: "study-group",
    },
  ];

  return (
    <div className="h-screen w-80 border">
      <ConversationList
        initialConversations={initialConversations}
        currentUserId={currentUserId}
        selfNotesId={selfNotesId}
      />
    </div>
  );
}

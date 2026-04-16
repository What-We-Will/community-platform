import { render, act, screen } from "@testing-library/react";
import { ConversationList } from "../ConversationList";
import type { ConversationWithDetails } from "@/lib/types";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => "/messages",
}));

// ConversationList binds two subscriptions on one channel (conversation_participants
// and messages). Filter on table+event so we capture the messages INSERT handler
// specifically — positional capture would be ambiguous.
let onMessagesInsert: (payload: { new: Record<string, unknown> }) => void;

function makeMockChannel() {
  const self: Record<string, jest.Mock> = {
    on: jest.fn().mockImplementation(function (_event: string, opts: unknown, cb: (...args: unknown[]) => void) {
      const optsObj = opts as Record<string, unknown> | undefined;
      if (optsObj?.table === "messages" && optsObj?.event === "INSERT") {
        onMessagesInsert = cb as typeof onMessagesInsert;
      }
      return self;
    }),
    subscribe: jest.fn().mockReturnThis(),
  };
  return self;
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => makeMockChannel(),
    removeChannel: jest.fn(),
  }),
}));

jest.mock("@/components/shared/LiveStatusAvatar", () => ({
  LiveStatusAvatar: () => <div data-testid="avatar" />,
}));

jest.mock("../NewMessageDialog", () => ({
  NewMessageDialog: () => <div data-testid="new-message-dialog" />,
}));

const OTHER_USER = {
  id: "other-user",
  display_name: "Other User",
  avatar_url: null,
  resume_path: null,
  headline: null,
  bio: null,
  location: null,
  skills: [],
  open_to_referrals: false,
  role: "member" as const,
  approval_status: "approved" as const,
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  timezone: "",
  is_onboarded: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  last_seen_at: null,
};

const KNOWN_CONVERSATION: ConversationWithDetails = {
  conversation: { id: "conv-1", type: "dm", group_id: null, created_at: "2026-01-01T00:00:00Z" },
  participants: [OTHER_USER],
  lastMessage: null,
  unreadCount: 0,
};

function simulateIncomingMessage(conversationId: string, senderId: string, content: string) {
  act(() => {
    onMessagesInsert({
      new: {
        id: `msg-${Math.random()}`,
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: "text",
        metadata: {},
        edited_at: null,
        created_at: "2026-01-01T00:01:00Z",
      },
    });
  });
}

function renderList() {
  return render(
    <ConversationList
      initialConversations={[KNOWN_CONVERSATION]}
      currentUserId="current-user"
      selfNotesId="self-notes"
    />
  );
}

describe("ConversationList Realtime INSERT handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refreshes from the server when the message belongs to a conversation not in local state", () => {
    renderList();

    simulateIncomingMessage("unknown-conv", "someone", "hello");

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("updates local state without refreshing when the message belongs to a known conversation", () => {
    renderList();

    simulateIncomingMessage("conv-1", "other-user", "new message body");

    expect(refreshMock).not.toHaveBeenCalled();
    expect(screen.getByText("new message body")).toBeInTheDocument();
  });
});

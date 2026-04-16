import { render, act } from "@testing-library/react";
import { ConversationList } from "../ConversationList";
import type { ConversationWithDetails } from "@/lib/types";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => "/messages",
}));

// Capture the Realtime INSERT callback so tests can fire it manually.
let messagesInsertCallback: (payload: { new: Record<string, unknown> }) => void;

function makeMockChannel() {
  const self: Record<string, jest.Mock> = {
    on: jest.fn().mockImplementation(function (_event: string, opts: unknown, cb: (...args: unknown[]) => void) {
      const optsObj = opts as Record<string, unknown> | undefined;
      if (optsObj?.table === "messages" && optsObj?.event === "INSERT") {
        messagesInsertCallback = cb as typeof messagesInsertCallback;
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

const CONVERSATION: ConversationWithDetails = {
  conversation: { id: "conv-1", type: "dm", group_id: null, created_at: "2026-01-01T00:00:00Z" },
  participants: [{ id: "other-user", display_name: "Other User", avatar_url: null, resume_path: null, headline: null, bio: null, role: "member", approval_status: "approved", linkedin_url: null, phone: null, timezone: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", last_seen_at: null, availability_status: null }],
  lastMessage: null,
  unreadCount: 0,
};

describe("ConversationList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls router.refresh() outside the state updater when a message arrives for an unknown conversation", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ConversationList
        initialConversations={[CONVERSATION]}
        currentUserId="current-user"
        selfNotesId="self-notes"
      />
    );

    // Fire a Realtime INSERT for a conversation not in the list (idx === -1).
    act(() => {
      messagesInsertCallback({
        new: {
          id: "msg-1",
          conversation_id: "unknown-conv",
          sender_id: "someone",
          content: "hello",
          message_type: "text",
          metadata: {},
          edited_at: null,
          created_at: "2026-01-01T00:01:00Z",
        },
      });
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);

    // The fix: no React "Cannot update a component" error should appear.
    const reactUpdateError = consoleErrorSpy.mock.calls.find((call) =>
      String(call[0]).includes("Cannot update a component")
    );
    expect(reactUpdateError).toBeUndefined();

    consoleErrorSpy.mockRestore();
  });
});

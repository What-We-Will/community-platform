import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationView } from "../ConversationView";
import type { Profile } from "@/lib/types";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

// Capture the Realtime messages INSERT callback so tests can fire it.
let messagesInsertCb: (payload: { new: Record<string, unknown> }) => void;

function makeMockChannel() {
  return {
    on: jest.fn().mockImplementation(function (this: unknown, _event: string, opts: unknown, cb: (...args: unknown[]) => void) {
      // Identify the messages INSERT subscription by its filter config.
      const optsObj = opts as Record<string, unknown> | undefined;
      if (optsObj?.table === "messages" && optsObj?.event === "INSERT") {
        messagesInsertCb = cb as typeof messagesInsertCb;
      }
      return this;
    }),
    subscribe: jest.fn().mockReturnThis(),
    presenceState: jest.fn().mockReturnValue({}),
    track: jest.fn(),
    untrack: jest.fn(),
  };
}

// Chainable mock that returns itself for any method call, resolving to empty data.
function mockChain(): Record<string, jest.Mock> {
  const chain: Record<string, jest.Mock> = {};
  const handler: ProxyHandler<Record<string, jest.Mock>> = {
    get(_target, prop: string) {
      if (prop === "then") return undefined; // prevent auto-await
      if (!chain[prop]) {
        chain[prop] = jest.fn().mockReturnValue(new Proxy({}, handler));
      }
      return chain[prop];
    },
  };
  return new Proxy(chain, handler);
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => makeMockChannel(),
    removeChannel: jest.fn(),
    from: jest.fn().mockImplementation(() => mockChain()),
  }),
}));

// crypto.randomUUID is not available in jsdom.
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      ...globalThis.crypto,
      randomUUID: () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        }),
    },
  });
}

jest.mock("@/components/shared/UserAvatar", () => ({
  UserAvatar: () => <div data-testid="avatar" />,
}));

jest.mock("@/components/video/VideoCallModal", () => ({
  VideoCallModal: () => null,
}));

jest.mock("../MessageBubble", () => ({
  MessageBubble: ({ message }: { message: { content: string } }) => (
    <div data-testid="message-bubble">{message.content}</div>
  ),
}));

jest.mock("../MessageInput", () => ({
  MessageInput: ({ onSend }: { onSend: (text: string) => void }) => (
    <button data-testid="send-btn" onClick={() => onSend("hello world")}>
      Send
    </button>
  ),
}));

jest.mock("../TypingIndicator", () => ({
  TypingIndicator: () => null,
}));

// scrollIntoView is not implemented in jsdom.
Element.prototype.scrollIntoView = jest.fn();

const CURRENT_USER = { id: "user-1", display_name: "Test User", avatar_url: null };
const OTHER_USER: Profile = {
  id: "user-2", display_name: "Other User", avatar_url: null,
  resume_path: null, headline: null, bio: null, location: null,
  skills: [], open_to_referrals: false, role: "member",
  approval_status: "approved", linkedin_url: null, github_url: null,
  portfolio_url: null, timezone: "", is_onboarded: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  last_seen_at: null,
};

const SAVED_MSG_ID = "db-msg-id-123";

let resolveApiFetch: (value: { ok: boolean; json: () => Promise<unknown> }) => void;

describe("ConversationView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    messagesInsertCb = undefined as unknown as typeof messagesInsertCb;

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/messages") {
        return new Promise((resolve) => {
          resolveApiFetch = resolve;
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not render duplicate messages when Realtime INSERT arrives before API response", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <ConversationView
        conversationId="conv-1"
        currentUser={CURRENT_USER}
        initialMessages={[]}
        otherUser={OTHER_USER}
        participants={[OTHER_USER]}
      />
    );

    // 1. User sends a message — optimistic entry added with random UUID.
    await user.click(screen.getByTestId("send-btn"));
    expect(screen.getAllByText("hello world")).toHaveLength(1);

    // 2. Realtime INSERT arrives BEFORE the API response (the race).
    act(() => {
      messagesInsertCb({
        new: {
          id: SAVED_MSG_ID,
          conversation_id: "conv-1",
          sender_id: CURRENT_USER.id,
          content: "hello world",
          message_type: "text",
          metadata: {},
          edited_at: null,
          created_at: "2026-01-01T00:01:00Z",
        },
      });
    });

    // 3. API response arrives — swaps optimistic UUID → real DB id.
    const savedMsg = {
      id: SAVED_MSG_ID,
      conversation_id: "conv-1",
      sender_id: CURRENT_USER.id,
      content: "hello world",
      message_type: "text",
      metadata: {},
      edited_at: null,
      created_at: "2026-01-01T00:01:00Z",
    };
    await act(async () => {
      resolveApiFetch({ ok: true, json: () => Promise.resolve(savedMsg) });
    });

    // 4. Message should appear exactly once — no duplicate.
    await waitFor(() => {
      expect(screen.getAllByText("hello world")).toHaveLength(1);
    });

    const duplicateKeyError = consoleErrorSpy.mock.calls.find((call) =>
      String(call[0]).includes("same key")
    );
    expect(duplicateKeyError).toBeUndefined();

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
});

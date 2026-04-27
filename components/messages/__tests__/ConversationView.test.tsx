import { render, screen, act, fireEvent } from "@testing-library/react";
import { ConversationView } from "../ConversationView";
import type { Profile } from "@/lib/types";

// Keep stable — an unstable mock masks stale-closure bugs in effect deps.
const routerMock = { push: jest.fn(), refresh: jest.fn() };

jest.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

// ConversationView binds two Realtime channels (messages and typing).
// Capture the messages INSERT handler by filtering on table+event so
// tests fire the handler under test unambiguously.
let onMessagesInsert: (payload: { new: Record<string, unknown> }) => void;

function makeQueryChain() {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.update = self;
  chain.select = self;
  chain.eq = self;
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null });
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null }).then(resolve);
  return chain;
}

function makeChannel() {
  const channel: Record<string, unknown> = {};
  channel.on = jest.fn(
    (
      _event: string,
      opts: Record<string, unknown> | undefined,
      cb: (...args: unknown[]) => void
    ) => {
      if (opts?.table === "messages" && opts?.event === "INSERT") {
        onMessagesInsert = cb as typeof onMessagesInsert;
      }
      return channel;
    }
  );
  channel.subscribe = jest.fn(() => channel);
  channel.presenceState = jest.fn(() => ({}));
  channel.track = jest.fn();
  channel.untrack = jest.fn();
  return channel;
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => makeQueryChain(),
    channel: () => makeChannel(),
    removeChannel: jest.fn(),
  }),
}));

// Render message content as plain text so assertions can query by it.
jest.mock("../MessageBubble", () => ({
  MessageBubble: ({ message }: { message: { content: string | null } }) => (
    <div data-testid="bubble">{message.content}</div>
  ),
}));

// Expose onSend via a click so tests can trigger handleSend directly.
jest.mock("../MessageInput", () => ({
  MessageInput: ({ onSend }: { onSend: (content: string) => void }) => (
    <button data-testid="send-trigger" onClick={() => onSend("hello from me")}>
      send
    </button>
  ),
}));

jest.mock("../TypingIndicator", () => ({
  TypingIndicator: () => null,
}));

jest.mock("@/components/video/VideoCallModal", () => ({
  VideoCallModal: () => null,
}));

jest.mock("@/components/shared/UserAvatar", () => ({
  UserAvatar: () => <div data-testid="avatar" />,
}));

const CURRENT_USER = {
  id: "user-me",
  display_name: "Me",
  avatar_url: null,
};

const OTHER_USER: Profile = {
  id: "user-other",
  display_name: "Other",
  avatar_url: null,
  resume_path: null,
  headline: null,
  bio: null,
  location: null,
  skills: [],
  open_to_referrals: false,
  role: "member",
  approval_status: "approved",
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  timezone: "",
  is_onboarded: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  last_seen_at: null,
};

function simulateRealtimeInsert(id: string, content: string) {
  act(() => {
    onMessagesInsert({
      new: {
        id,
        conversation_id: "conv-1",
        sender_id: "user-me",
        content,
        message_type: "text",
        metadata: {},
        edited_at: null,
        created_at: "2026-01-01T00:01:00Z",
      },
    });
  });
}

function renderView() {
  return render(
    <ConversationView
      conversationId="conv-1"
      currentUser={CURRENT_USER}
      initialMessages={[]}
      otherUser={OTHER_USER}
    />
  );
}

describe("ConversationView Realtime INSERT handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Element.prototype.scrollIntoView = jest.fn();
    (global as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "server-msg-1",
        conversation_id: "conv-1",
        sender_id: "user-me",
        content: "hello from me",
        message_type: "text",
        metadata: {},
        edited_at: null,
        created_at: "2026-01-01T00:01:00Z",
      }),
    });
  });

  it("should not display the sender's own message until the Realtime INSERT arrives", async () => {
    renderView();

    await act(async () => {
      fireEvent.click(screen.getByTestId("send-trigger"));
    });
    await act(async () => {});

    // The API call fired, but state is unchanged — there is no optimistic prepend.
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/messages",
      expect.objectContaining({ method: "POST" })
    );
    expect(screen.queryByText("hello from me")).toBeNull();

    simulateRealtimeInsert("server-msg-1", "hello from me");

    expect(screen.getByText("hello from me")).toBeInTheDocument();
  });

  it("should deduplicate when the same Realtime INSERT arrives twice", () => {
    renderView();

    simulateRealtimeInsert("server-msg-1", "hello from me");
    simulateRealtimeInsert("server-msg-1", "hello from me");

    expect(screen.getAllByText("hello from me")).toHaveLength(1);
  });
});

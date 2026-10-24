import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { ConversationView } from "../ConversationView";
import { createClient } from "@/lib/supabase/client";
import { makeBaseProfile } from "@/lib/__tests__/factories";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function stubSupabaseClient() {
  const { client } = buildMockSupabaseClient({
    tables: { profiles: { data: null, error: null } },
  });
  vi.mocked(createClient).mockReturnValue(
    client as unknown as ReturnType<typeof createClient>
  );
}

// JitsiMeet injects the external Jitsi script; stand in for the iframe it would mount.
vi.mock("@/components/video/JitsiMeet", () => ({
  default: ({ roomName }: { roomName: string }) => <p>Jitsi room {roomName}</p>,
}));

type Props = ComponentProps<typeof ConversationView>;

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

function renderView(overrides: Partial<Props> = {}) {
  const props: Props = {
    conversationId: "conv-1",
    currentUser: { id: "user-me", display_name: "Me", avatar_url: null },
    initialMessages: [],
    otherUser: makeBaseProfile({ id: "user-other", display_name: "Other" }),
    ...overrides,
  };
  const { rerender } = render(<ConversationView {...props} />);
  return {
    rerenderWith: (next: Partial<Props>) =>
      rerender(<ConversationView {...props} {...next} />),
  };
}

// "Join call" in the conversation list links here with ?videoRoom=; landing on
// that link opens the call once and takes the parameter out of the address so a
// reload or a shared URL doesn't drop the member back into the call.
describe("ConversationView — arriving from a join-call link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubSupabaseClient();
    Element.prototype.scrollIntoView = vi.fn();
    window.history.replaceState({}, "", "/messages/conv-1");
  });

  it("should open the call and strip videoRoom from the address when the link carries one", () => {
    window.history.replaceState({}, "", "/messages/conv-1?videoRoom=room-abc&tab=files");

    renderView({ initialVideoRoom: "room-abc" });

    expect(screen.getByRole("button", { name: /leave call/i })).toBeInTheDocument();
    expect(screen.getByText("Jitsi room room-abc")).toBeInTheDocument();
    expect(window.location.search).toBe("?tab=files");
  });

  it("should not open a call when the link has no videoRoom", () => {
    renderView({ initialVideoRoom: null });

    expect(screen.queryByRole("button", { name: /leave call/i })).not.toBeInTheDocument();
  });
});

describe("ConversationView — the header status follows the member being messaged", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubSupabaseClient();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("should show the new member's status when the conversation switches to someone else", () => {
    const { rerenderWith } = renderView({
      otherUser: makeBaseProfile({ id: "user-a", last_seen_at: minutesAgo(1) }),
    });

    rerenderWith({
      otherUser: makeBaseProfile({ id: "user-b", last_seen_at: minutesAgo(120) }),
    });

    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});

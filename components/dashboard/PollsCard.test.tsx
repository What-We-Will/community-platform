import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PollsCard } from "./PollsCard";
import { createClient } from "@/lib/supabase/client";
import { makeBasePoll, makePollOption } from "@/lib/__tests__/factories";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";

// Radix radio/checkbox indicators measure themselves, which needs ResizeObserver — absent in jsdom.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

vi.mock("@/lib/actions/polls", () => ({
  createPollAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// The dashboard re-renders this card with a fresh poll object on every
// router.refresh(). The card resets only when the poll itself changed — a new
// poll, or new vote totals — so a refresh can't wipe a selection in progress.
describe("PollsCard — the card follows the poll the server sends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { client } = buildMockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>
    );
  });

  it("should show the new question and clear the selection when a different poll arrives", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PollsCard userId="user-1" initialPoll={makeBasePoll()} />
    );
    await user.click(screen.getByRole("radio", { name: "Resume review" }));

    rerender(
      <PollsCard
        userId="user-1"
        initialPoll={makeBasePoll({ id: "poll-2", question: "Best meetup day?" })}
      />
    );

    expect(screen.getByText("Best meetup day?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Resume review" })).not.toBeChecked();
  });

  it("should keep the selection when the same poll re-renders unchanged", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PollsCard userId="user-1" initialPoll={makeBasePoll()} />
    );
    await user.click(screen.getByRole("radio", { name: "Resume review" }));

    rerender(<PollsCard userId="user-1" initialPoll={makeBasePoll()} />);

    expect(screen.getByRole("radio", { name: "Resume review" })).toBeChecked();
  });

  it("should show results when the refreshed poll records the member's vote", () => {
    const { rerender } = render(
      <PollsCard userId="user-1" initialPoll={makeBasePoll()} />
    );

    rerender(
      <PollsCard
        userId="user-1"
        initialPoll={makeBasePoll({
          options: [
            makePollOption({ id: "option-1", label: "Resume review", voteCount: 3 }),
            makePollOption({ id: "option-2", label: "Mock interviews", voteCount: 1 }),
          ],
          totalVotes: 4,
          userVotes: ["option-1"],
        })}
      />
    );

    expect(screen.getByText(/resume review \(your vote\)/i)).toBeInTheDocument();
    expect(screen.getByText("4 votes total")).toBeInTheDocument();
  });
});

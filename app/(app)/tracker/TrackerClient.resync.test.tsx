import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackerClient, type Application } from "./TrackerClient";
import { makeApplication } from "@/lib/__tests__/factories";

vi.mock("./actions", () => ({
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
  updateStatusDate: vi.fn(),
  deleteApplication: vi.fn(),
  syncCommunityNote: vi.fn(),
  addInterview: vi.fn(),
  deleteInterview: vi.fn(),
  requestHelp: vi.fn(),
  cancelHelp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function renderTracker(applications: Application[]) {
  const ui = (apps: Application[]) => (
    <TrackerClient
      applications={apps}
      interviews={[]}
      helpRequests={[]}
      currentUserId="user-1"
    />
  );
  const { rerender } = render(ui(applications));
  return { rerenderWith: (apps: Application[]) => rerender(ui(apps)) };
}

// The board keeps its own copy of the applications so a drag can move a card
// before the server confirms. When router.refresh() delivers the stored list,
// that copy has to be replaced, or the board keeps showing the pre-refresh state.
describe("TrackerClient — the board follows the applications the server sends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show the server's status when a refreshed application has moved", async () => {
    const user = userEvent.setup();
    const { rerenderWith } = renderTracker([makeApplication({ status: "applied" })]);
    await user.click(screen.getByRole("button", { name: /list/i }));

    rerenderWith([makeApplication({ status: "phone_screen" })]);

    expect(screen.getByText("Phone Screen")).toBeInTheDocument();
    expect(screen.queryByText("Applied")).not.toBeInTheDocument();
  });

  it("should add and drop cards when the refreshed list changes membership", async () => {
    const user = userEvent.setup();
    const { rerenderWith } = renderTracker([
      makeApplication({ id: "app-1", company: "Acme" }),
    ]);
    await user.click(screen.getByRole("button", { name: /list/i }));

    rerenderWith([makeApplication({ id: "app-2", company: "Globex" })]);

    expect(screen.getByText("Globex")).toBeInTheDocument();
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
  });
});

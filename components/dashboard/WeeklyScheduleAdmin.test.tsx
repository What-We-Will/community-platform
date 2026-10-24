import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { WeeklyScheduleAdmin } from "./WeeklyScheduleAdmin";
import { makeScheduleRow } from "@/lib/__tests__/factories";

vi.mock("@/app/(app)/dashboard/schedule-actions", () => ({
  createScheduleRow: vi.fn(),
  updateScheduleRow: vi.fn(),
  deleteScheduleRow: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

type Props = ComponentProps<typeof WeeklyScheduleAdmin>;

// The component renders a <tbody>, so it needs a table around it.
function renderAdmin(props: Props) {
  const ui = (p: Props) => (
    <table>
      <WeeklyScheduleAdmin {...p} />
    </table>
  );
  const { rerender } = render(ui(props));
  return { rerenderWith: (p: Props) => rerender(ui(p)) };
}

describe("WeeklyScheduleAdmin — switching category starts the editor fresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should close the add-row form and report it closed when the category changes", async () => {
    const user = userEvent.setup();
    const onAddingChange = vi.fn();
    const { rerenderWith } = renderAdmin({ rows: [], activeCategory: "general", onAddingChange });
    await user.click(screen.getByRole("button", { name: /add row/i }));

    rerenderWith({ rows: [], activeCategory: "job_seekers", onAddingChange });

    expect(screen.queryByPlaceholderText("Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add row/i })).toBeInTheDocument();
    expect(onAddingChange).toHaveBeenLastCalledWith(false);
  });

  it("should discard a half-typed new row when the category changes", async () => {
    const user = userEvent.setup();
    const { rerenderWith } = renderAdmin({ rows: [], activeCategory: "general" });
    await user.click(screen.getByRole("button", { name: /add row/i }));
    await user.type(screen.getByPlaceholderText("Name"), "Draft meeting");

    rerenderWith({ rows: [], activeCategory: "job_seekers" });
    await user.click(screen.getByRole("button", { name: /add row/i }));

    expect(screen.getByPlaceholderText("Name")).toHaveValue("");
  });
});

// After a save, router.refresh() hands back the stored rows; the table must
// show those rather than its pre-save copy.
describe("WeeklyScheduleAdmin — the table follows the rows the server sends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show the refreshed rows when new rows arrive", () => {
    const { rerenderWith } = renderAdmin({
      rows: [makeScheduleRow({ id: "row-1", name: "Weekly check-in" })],
      activeCategory: "general",
    });

    rerenderWith({
      rows: [makeScheduleRow({ id: "row-2", name: "Resume clinic" })],
      activeCategory: "general",
    });

    expect(screen.getByText("Resume clinic")).toBeInTheDocument();
    expect(screen.queryByText("Weekly check-in")).not.toBeInTheDocument();
  });

  it("should keep the add-row form open when the same rows re-render", async () => {
    const user = userEvent.setup();
    const rows = [makeScheduleRow()];
    const { rerenderWith } = renderAdmin({ rows, activeCategory: "general" });
    await user.click(screen.getByRole("button", { name: /add row/i }));
    await user.type(screen.getByPlaceholderText("Name"), "Draft meeting");

    rerenderWith({ rows, activeCategory: "general" });

    expect(screen.getByPlaceholderText("Name")).toHaveValue("Draft meeting");
  });
});

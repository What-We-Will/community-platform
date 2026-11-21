/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { buildMockSupabaseClient, type MockQueryResult } from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagRow, makePostgrestError } from "@/lib/__tests__/factories";
import FeatureFlagsPage from "./page";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("server-only", () => ({}));
vi.mock("./actions", () => ({ setFeatureFlagEnabled: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const ALL_ROWS = [
  makeFeatureFlagRow({ key: "jobApplicationTracker", enabled: true }),
  makeFeatureFlagRow({ key: "learningTracker" }),
  makeFeatureFlagRow({ key: "ghostJobBoard" }),
  makeFeatureFlagRow({ key: "groupLearning" }),
  makeFeatureFlagRow({ key: "projects" }),
];

function mockFlags(result: MockQueryResult) {
  const { client } = buildMockSupabaseClient({
    tables: {
      feature_flags: result,
      feature_flag_changes: { data: [], error: null },
    },
  });
  createClient.mockResolvedValue(client);
}

async function renderPage() {
  render(await FeatureFlagsPage());
}

describe("Feature flags admin page — current flag state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show one labelled switch per flag in the declared order when every row exists", async () => {
    mockFlags({ data: ALL_ROWS, error: null });

    await renderPage();

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(5);
    expect(switches[0]).toHaveAccessibleName("Job Application Tracker");
    expect(switches[1]).toHaveAccessibleName("Learning Tracker");
    expect(switches[2]).toHaveAccessibleName("Ghost Job Board");
    expect(switches[3]).toHaveAccessibleName("Group Learning");
    expect(switches[4]).toHaveAccessibleName("Projects");
  });

  it("should reflect each flag's stored state when rendering", async () => {
    mockFlags({ data: ALL_ROWS, error: null });

    await renderPage();

    expect(screen.getByRole("switch", { name: "Job Application Tracker" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Projects" })).not.toBeChecked();
  });

  it("should mark a flag as undefined with no switch when its row is missing", async () => {
    mockFlags({ data: ALL_ROWS.filter((row) => row.key !== "projects"), error: null });

    await renderPage();

    expect(
      screen.getByText("Not defined in the database. Resolves to off.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Projects" })).toBeNull();
    expect(screen.getAllByRole("switch")).toHaveLength(4);
  });

  it("should ignore rows for keys the code does not know when rendering", async () => {
    mockFlags({
      data: [...ALL_ROWS, makeFeatureFlagRow({ key: "retiredFlag", enabled: true })],
      error: null,
    });

    await renderPage();

    expect(screen.getAllByRole("switch")).toHaveLength(5);
    expect(screen.queryByText("retiredFlag")).toBeNull();
  });

  it("should show an alert and no switches when the flag read fails", async () => {
    mockFlags({ data: null, error: makePostgrestError({ code: "PGRST000", message: "connection refused" }) });

    await renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load feature flags. Try again shortly."
    );
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
  });

  it("should explain propagation delay and what admins can do in features that are off when the page loads", async () => {
    mockFlags({ data: ALL_ROWS, error: null });

    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Feature flags" })).toBeInTheDocument();
    expect(screen.getByText(/usually reach members within about 30 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/cannot make changes within them/)).toBeInTheDocument();
    expect(screen.getByText(/member account/)).toBeInTheDocument();
  });
});

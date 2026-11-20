/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { appliedFilter, buildMockSupabaseClient, type MockQueryResult } from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagChangeRow, makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { makePostgrestError, makeProfileNameRow } from "@/lib/__tests__/factories";
import FeatureFlagsPage from "./page";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("server-only", () => ({}));
vi.mock("./actions", () => ({ setFeatureFlagEnabled: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const ADMIN_ID = "00000000-0000-0000-0000-000000000202";
const OTHER_ADMIN_ID = "00000000-0000-0000-0000-000000000209";

const change = (overrides: Parameters<typeof makeFeatureFlagChangeRow>[0] = {}) =>
  makeFeatureFlagChangeRow({ changed_by: ADMIN_ID, ...overrides });
const actor = (id: string, display_name: string) => makeProfileNameRow({ id, display_name });

function mockHistory(changes: MockQueryResult, profiles: MockQueryResult = { data: [], error: null }) {
  const mock = buildMockSupabaseClient({
    tables: {
      feature_flags: { data: [makeFeatureFlagRow({ key: "projects" })], error: null },
      feature_flag_changes: changes,
      profiles,
    },
  });
  createClient.mockResolvedValue(mock.client);
  return mock;
}

async function renderPage() {
  render(await FeatureFlagsPage());
}

function historySection() {
  return screen.getByRole("region", { name: "Recent changes" });
}

function historyItems() {
  return within(historySection()).queryAllByRole("listitem");
}

describe("Feature flags admin page — recent changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list each change in the order returned with the admin who made it when actors are known", async () => {
    const { queries } = mockHistory(
      {
        data: [
          change({ id: 2, old_enabled: true, new_enabled: false }),
          change({ id: 1, flag_key: "groupLearning", changed_by: OTHER_ADMIN_ID }),
        ],
        error: null,
      },
      { data: [actor(OTHER_ADMIN_ID, "Blake Admin"), actor(ADMIN_ID, "Avery Admin")], error: null }
    );

    await renderPage();

    const [newest, older] = historyItems();
    expect(newest).toHaveTextContent(/Projects.*On → Off.*Avery Admin/);
    expect(older).toHaveTextContent(/Group Learning.*Off → On.*Blake Admin/);
    // <time> has no accessible role in jsdom; the e2e spec reads this attribute.
    expect(newest.querySelector("time")).toHaveAttribute("datetime", "2026-11-20T10:00:00.000Z");
    expect(newest.querySelector("time")).toHaveAttribute("title", "20 Nov 2026, 10:00 UTC");
    const history = queries.find(({ table }) => table === "feature_flag_changes")!;
    expect(appliedFilter(history, "order", "changed_at", { ascending: false })).toBe(true);
    expect(appliedFilter(history, "limit", 20)).toBe(true);
  });

  it("should say no changes are recorded when the history is empty", async () => {
    mockHistory({ data: [], error: null });

    await renderPage();

    expect(screen.getByText("No changes recorded yet.")).toBeInTheDocument();
    expect(historyItems()).toHaveLength(0);
  });

  it("should alert in the history section and still render switches when the history read fails", async () => {
    mockHistory({ data: null, error: makePostgrestError() });

    await renderPage();

    expect(within(historySection()).getByRole("alert")).toHaveTextContent(
      "Could not load recent changes."
    );
    expect(screen.getByRole("switch", { name: "Projects" })).toBeInTheDocument();
  });
});

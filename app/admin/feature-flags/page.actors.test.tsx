/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { buildMockSupabaseClient, writeArgs, type MockQueryResult } from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagChangeRow, makeFeatureFlagRow } from "@/lib/__tests__/factories";
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

function historyItems() {
  const section = screen.getByRole("region", { name: "Recent changes" });
  return within(section).queryAllByRole("listitem");
}

describe("Feature flags admin page — who made each change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should look up each named admin once when changes repeat an admin or have no actor", async () => {
    const { queries } = mockHistory({
      data: [
        change({ id: 4 }),
        change({ id: 3, changed_by: null }),
        change({ id: 2, changed_by: OTHER_ADMIN_ID }),
        change({ id: 1 }),
      ],
      error: null,
    });

    await renderPage();

    const lookup = queries.find(({ table }) => table === "profiles");
    const [column, ids] = (lookup && writeArgs(lookup, "in")) ?? [];
    expect(column).toBe("id");
    expect([...((ids as string[] | undefined) ?? [])].sort()).toEqual([ADMIN_ID, OTHER_ADMIN_ID].sort());
  });

  it("should name the actor as outside the app when a change has no actor", async () => {
    const { queries } = mockHistory({
      data: [change({ changed_by: null, old_enabled: true, new_enabled: false })],
      error: null,
    });

    await renderPage();

    const [item] = historyItems();
    expect(item).toHaveTextContent("On → Off");
    expect(item).toHaveTextContent("Outside the app");
    expect(queries.some(({ table }) => table === "profiles")).toBe(false);
  });

  it("should name the actor as an unknown member when their profile is missing", async () => {
    mockHistory({ data: [change()], error: null }, { data: [], error: null });

    await renderPage();

    expect(historyItems()[0]).toHaveTextContent("Unknown member");
  });
});

/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeAdoptionRow } from "@/lib/__tests__/factories";
import FeaturePreferencesPage from "./page";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

// The RPC orders rows alphabetically; the page must present them in the
// FEATURE_KEYS order, so the fixture deliberately arrives out of that order.
const ADOPTION_ROWS = [
  makeAdoptionRow({ feature: "discussions", enabled_count: 1 }),
  makeAdoptionRow({ feature: "events", enabled_count: 2 }),
  makeAdoptionRow({ feature: "job_referrals", enabled_count: 0 }),
  makeAdoptionRow({ feature: "resource_hub", enabled_count: 0 }),
];

function mockRpc(result: { data: unknown; error: { message: string } | null }) {
  const { client } = buildMockSupabaseClient({
    rpc: { get_feature_adoption_counts: result },
  });
  createClient.mockResolvedValue(client);
}

async function renderPage() {
  render(await FeaturePreferencesPage());
}

function cells(rowName: RegExp) {
  return within(screen.getByRole("row", { name: rowName }))
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

describe("Member feature preferences page — admin adoption summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render every supported feature when one of them has no adopters", async () => {
    mockRpc({ data: ADOPTION_ROWS, error: null });

    await renderPage();

    expect(cells(/events/i)).toEqual(["2", "67%"]);
    expect(cells(/discussions/i)).toEqual(["1", "33%"]);
    expect(cells(/job referrals/i)).toEqual(["0", "0%"]);
    expect(cells(/resource hub/i)).toEqual(["0", "0%"]);
  });

  it("should present features in the FEATURE_KEYS order when the RPC returns them alphabetically", async () => {
    mockRpc({ data: ADOPTION_ROWS, error: null });

    await renderPage();

    const labels = screen
      .getAllByRole("rowheader")
      .map((header) => header.textContent);

    expect(labels).toEqual([
      "Events",
      "Discussions",
      "Job referrals",
      "Resource hub",
    ]);
  });

  it("should state the counted cohort and its size when rows are returned", async () => {
    mockRpc({ data: ADOPTION_ROWS, error: null });

    await renderPage();

    expect(
      screen.getByText(/counted cohort: approved members/i)
    ).toHaveTextContent("3");
  });

  it("should report a zero share without a division error when the cohort is empty", async () => {
    mockRpc({
      data: ADOPTION_ROWS.map((row) =>
        makeAdoptionRow({ ...row, enabled_count: 0, member_total: 0 })
      ),
      error: null,
    });

    await renderPage();

    expect(cells(/events/i)).toEqual(["0", "0%"]);
    expect(
      screen.getByText(/counted cohort: approved members/i)
    ).toHaveTextContent("0");
  });

  it("should show a failure message instead of a table or a cohort line when the RPC errors", async () => {
    mockRpc({ data: null, error: { message: "permission denied" } });

    await renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      /could not load feature preference counts/i
    );
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText(/counted cohort: approved members/i)).toBeNull();
  });

  // A key the RPC stops returning is indistinguishable from genuine zero
  // adoption, so drift between FEATURE_KEYS and the RPC's own key list must
  // fail the load rather than quietly report a zero.
  it("should fail the load when the RPC omits a supported feature", async () => {
    mockRpc({
      data: ADOPTION_ROWS.filter((row) => row.feature !== "resource_hub"),
      error: null,
    });

    await renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      /could not load feature preference counts/i
    );
    expect(screen.queryByRole("table")).toBeNull();
  });
});

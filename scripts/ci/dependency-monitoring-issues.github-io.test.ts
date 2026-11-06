// @vitest-environment node
import { EXPECTED_ASSIGNEE, LABEL, createIssue, fetchExistingIssues } from "./dependency-monitoring-issues.mjs";
import { ID, OTHER, TODAY, finding } from "./dependency-monitoring-issues.fixtures";

type Request = { url: string; body: Record<string, unknown> };

const requests: Request[] = [];

function stubGitHub(respond: (url: string) => unknown) {
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    requests.push({ url, body: init.body ? JSON.parse(String(init.body)) : {} });
    return { ok: true, status: 200, json: async () => respond(url) };
  });
}

const issue = (number: number, id: string, extra = {}) => ({
  number, state: "open", title: `[${id}] pkg`, body: `<!-- dependency-monitoring:id=${id} -->`,
  assignees: [{ login: EXPECTED_ASSIGNEE }], labels: [{ name: LABEL }], ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  requests.length = 0;
  vi.stubEnv("GITHUB_TOKEN", "test-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Filing a new advisory issue", () => {
  it("should include the planned note in the issue body when one is attached", async () => {
    stubGitHub(() => issue(9, ID));
    const create = { id: ID, finding: finding(ID), note: "Waiver expired 2026-01-01." };

    await createIssue("owner/repo", { ...create, today: TODAY });

    expect(requests[0].body.body).toContain("Waiver expired 2026-01-01.");
  });
});

// The search API indexes new issues with a delay, so a run started right after another
// could miss what that run just filed and file it again.
describe("Listing the issues this lane already tracks", () => {
  it("should read labelled issues of every state from the repository issue list", async () => {
    stubGitHub(() => []);

    await fetchExistingIssues("owner/repo");

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe("/repos/owner/repo/issues");
    expect(url.searchParams.get("labels")).toBe(LABEL);
    expect(url.searchParams.get("state")).toBe("all");
    expect(url.searchParams.get("per_page")).toBe("100");
  });

  it("should index issues by advisory id and skip pull requests", async () => {
    stubGitHub(() => [issue(1, ID), issue(2, OTHER, { pull_request: { url: "x" } })]);

    const existing = await fetchExistingIssues("owner/repo");

    expect([...existing.keys()]).toEqual([ID]);
    expect(existing.get(ID)).toMatchObject({ number: 1, state: "open", assignees: [EXPECTED_ASSIGNEE], labels: [LABEL] });
  });

  it("should keep reading while pages come back full", async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => issue(i + 10, `GHSA-aaaa-bbbb-${String(i).padStart(4, "0")}`));
    stubGitHub((url) => (new URL(url).searchParams.get("page") === "1" ? fullPage : [issue(1, ID)]));

    const existing = await fetchExistingIssues("owner/repo");

    expect(existing.size).toBe(101);
    expect(requests).toHaveLength(2);
  });

  it("should keep reading when a full page is mostly pull requests", async () => {
    const mixed = Array.from({ length: 100 }, (_, i) => issue(i + 10, OTHER, { pull_request: { url: "x" } }));
    stubGitHub((url) => (new URL(url).searchParams.get("page") === "1" ? mixed : [issue(1, ID)]));

    const existing = await fetchExistingIssues("owner/repo");

    expect([...existing.keys()]).toEqual([ID]);
  });

  // A pair can exist from before this listing was race-free; the open one is the live record.
  it.each([
    ["the closed one is listed first", [issue(5, ID, { state: "closed" }), issue(9, ID)]],
    ["the open one is listed first", [issue(9, ID), issue(5, ID, { state: "closed" })]],
  ])("should track the open issue when two issues share an advisory and %s", async (_label, items) => {
    stubGitHub(() => items);

    const existing = await fetchExistingIssues("owner/repo");

    expect(existing.get(ID)?.number).toBe(9);
  });
});

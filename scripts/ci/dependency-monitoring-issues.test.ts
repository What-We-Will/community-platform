// @vitest-environment node
import {
  EXPECTED_ASSIGNEE,
  LABEL,
  assertAssigned,
  assertLabeled,
  buildIssueBody,
  buildIssueTitle,
  extractAdvisoryId,
  extractAdvisoryIdFromWaiverMessage,
  markerFor,
  parseSeverityMarker,
  planActions,
  severityMarkerFor,
} from "./dependency-monitoring-issues.mjs";

const ID = "GHSA-mh99-v99m-4gvg";
const OTHER = "GHSA-aaaa-bbbb-cccc";
const TODAY = "2026-08-11";

function finding(id: string, severity = "high", overrides = {}) {
  return { id, severity, name: "brace-expansion", title: `${id} test advisory`, ...overrides };
}

function emptyReport(overrides = {}) {
  return {
    mode: "full-tree",
    ok: true,
    failure: null,
    blocking: [],
    waived: [],
    stale: [],
    expired: [],
    malformedWaivers: [],
    invalid: [],
    unresolved: [],
    suppressed: 0,
    ...overrides,
  };
}

function openIssue(id: string, severity = "high", overrides = {}) {
  return [
    id,
    {
      number: 1,
      state: "open",
      title: buildIssueTitle(finding(id, severity)),
      body: buildIssueBody({ ...finding(id, severity), today: TODAY }),
      assignees: [EXPECTED_ASSIGNEE],
      labels: [LABEL],
      ...overrides,
    },
  ] as const;
}

describe("extractAdvisoryId", () => {
  it("finds a GHSA id embedded in arbitrary text", () => {
    expect(extractAdvisoryId(`prefix ${ID} suffix`)).toBe(ID);
  });

  it("preserves the id's original case", () => {
    expect(extractAdvisoryId(ID.toUpperCase())).toBe(ID.toUpperCase());
  });

  it("returns null when no id is present", () => {
    expect(extractAdvisoryId("nothing here")).toBeNull();
  });
});

describe("extractAdvisoryIdFromWaiverMessage", () => {
  it("reads the id from a well-formed label", () => {
    expect(extractAdvisoryIdFromWaiverMessage(`${ID} — waiver expired 2026-01-01`)).toBe(ID);
  });

  it("returns null when the label has no id (e.g. a non-object entry)", () => {
    expect(extractAdvisoryIdFromWaiverMessage("entry 0 — waiver is a string, expected an object")).toBeNull();
  });
});

describe("buildIssueBody", () => {
  it("states the critical disposition window and includes required fields", () => {
    const body = buildIssueBody({ ...finding(ID, "critical"), today: TODAY });
    expect(body).toContain(ID);
    expect(body).toContain("critical");
    expect(body).toContain("brace-expansion");
    expect(body).toContain("before the next production deploy");
    expect(body).toContain("docs/adr/0012-dependency-risk-control-lanes.md");
    expect(body).toContain(markerFor(ID));
  });

  it("states the high disposition window", () => {
    const body = buildIssueBody({ ...finding(ID, "high"), today: TODAY });
    expect(body).toContain("within two production deploys");
  });
});

describe("parseSeverityMarker", () => {
  it("round-trips through severityMarkerFor", () => {
    const body = `some text\n${severityMarkerFor("critical")}`;
    expect(parseSeverityMarker(body)).toBe("critical");
  });

  it("returns null when absent", () => {
    expect(parseSeverityMarker("no marker here")).toBeNull();
  });
});

describe("assertAssigned", () => {
  it("throws when the create/update response has no matching assignee", () => {
    const issue = { number: 42, assignees: [] };
    expect(() => assertAssigned(issue, ID, "created")).toThrow(/assignee/);
  });

  it("does not throw when the expected assignee is present", () => {
    const issue = { number: 42, assignees: [{ login: EXPECTED_ASSIGNEE }] };
    expect(() => assertAssigned(issue, ID, "created")).not.toThrow();
  });
});

describe("assertLabeled", () => {
  it("throws when the create/update response has no dependency-monitoring label", () => {
    const issue = { number: 42, labels: [] };
    expect(() => assertLabeled(issue, ID, "created")).toThrow(/label/);
  });

  it("throws when the response has other labels but not this one", () => {
    const issue = { number: 42, labels: [{ name: "status: needs-review" }] };
    expect(() => assertLabeled(issue, ID, "created")).toThrow(/label/);
  });

  it("does not throw when the label is present", () => {
    const issue = { number: 42, labels: [{ name: LABEL }] };
    expect(() => assertLabeled(issue, ID, "created")).not.toThrow();
  });
});

describe("planActions — normal report", () => {
  it("files a new issue for a blocking finding with no existing issue", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID)] });
    const plan = planActions({ report, existingIssues: new Map() });

    expect(plan.creates).toEqual([{ id: ID, finding: finding(ID) }]);
    expect(plan.updates).toEqual([]);
    expect(plan.reopens).toEqual([]);
    expect(plan.closes).toEqual([]);
  });

  it("does nothing for a blocking finding whose open issue has the same severity and the correct assignee", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID, "high")] });
    const existingIssues = new Map([openIssue(ID, "high")]);
    const plan = planActions({ report, existingIssues });

    expect(plan.creates).toEqual([]);
    expect(plan.updates).toEqual([]);
  });

  it("plans a reassign update when the tracked open issue has no assignee, even with unchanged severity", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID, "high")] });
    const existingIssues = new Map([openIssue(ID, "high", { assignees: [] })]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].id).toBe(ID);
    expect(plan.updates[0].reassign).toBe(true);
    expect(plan.updates[0].note).toContain(EXPECTED_ASSIGNEE);
  });

  it("plans a reassign update when the tracked open issue is assigned to someone else", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID, "high")] });
    const existingIssues = new Map([openIssue(ID, "high", { assignees: ["someone-else"] })]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].id).toBe(ID);
    expect(plan.updates[0].reassign).toBe(true);
  });

  it("combines severity and assignee drift into one update rather than two", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID, "critical")] });
    const existingIssues = new Map([openIssue(ID, "high", { assignees: [] })]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].note).toContain("high → critical");
    expect(plan.updates[0].note).toContain(EXPECTED_ASSIGNEE);
    expect(plan.updates[0].reassign).toBe(true);
  });

  it("plans a relabel update when the tracked open issue is missing the dependency-monitoring label, even with unchanged severity and correct assignee", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID, "high")] });
    const existingIssues = new Map([openIssue(ID, "high", { labels: [] })]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].id).toBe(ID);
    expect(plan.updates[0].relabel).toBe(true);
    expect(plan.updates[0].reassign).toBe(false);
    expect(plan.updates[0].note).toContain(LABEL);
  });

  it("does not plan a relabel when the label is already present", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID, "high")] });
    const existingIssues = new Map([openIssue(ID, "high")]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toEqual([]);
  });

  it("updates the open issue when severity changed", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID, "critical")] });
    const existingIssues = new Map([openIssue(ID, "high")]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].id).toBe(ID);
    expect(plan.updates[0].note).toContain("high → critical");
    expect(plan.updates[0].reassign).toBe(false);
  });

  it("reopens a closed issue whose advisory reappeared", () => {
    const report = emptyReport({ ok: false, blocking: [finding(ID)] });
    const [id, issue] = openIssue(ID, "high", { state: "closed" });
    const existingIssues = new Map([[id, issue]]);
    const plan = planActions({ report, existingIssues });

    expect(plan.reopens).toHaveLength(1);
    expect(plan.reopens[0].id).toBe(ID);
    expect(plan.closes).toEqual([]);
  });

  it("closes a previously open issue whose advisory no longer appears", () => {
    const report = emptyReport();
    const existingIssues = new Map([openIssue(OTHER, "high")]);
    const plan = planActions({ report, existingIssues });

    expect(plan.closes).toEqual([{ id: OTHER, issue: existingIssues.get(OTHER) }]);
  });

  it("does not close an already-closed issue again", () => {
    const report = emptyReport();
    const [id, issue] = openIssue(OTHER, "high", { state: "closed" });
    const existingIssues = new Map([[id, issue]]);
    const plan = planActions({ report, existingIssues });

    expect(plan.closes).toEqual([]);
  });

  it("is not marked degraded", () => {
    const report = emptyReport();
    const plan = planActions({ report, existingIssues: new Map() });
    expect(plan.degraded).toBe(false);
  });
});

describe("planActions — degraded report (expired/malformed waivers)", () => {
  it("reopens the tracked issue for an expired waiver", () => {
    const report = emptyReport({ ok: false, blocking: [], expired: [{ id: ID, expires: "2026-01-01", reason: "x" }] });
    const [id, issue] = openIssue(ID, "high", { state: "closed" });
    const existingIssues = new Map([[id, issue]]);
    const plan = planActions({ report, existingIssues });

    expect(plan.reopens).toHaveLength(1);
    expect(plan.reopens[0].note).toContain("expired 2026-01-01");
    expect(plan.degraded).toBe(true);
  });

  it("updates (not reopens) an already-open tracked issue for an expired waiver", () => {
    const report = emptyReport({ ok: false, blocking: [], expired: [{ id: ID, expires: "2026-01-01", reason: "x" }] });
    const existingIssues = new Map([openIssue(ID, "high")]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.reopens).toEqual([]);
    // Assignee already correct: the update carries the waiver note, but reassignment
    // is not the reason for it.
    expect(plan.updates[0].reassign).toBe(false);
  });

  // Decision: ownership enforcement does not wait for a clean full-tree scan. The
  // degraded path already touches this issue unconditionally (it never no-ops), so the
  // same touch also repairs the assignee — deferring it would let an unassigned issue
  // survive every degraded run for as long as ALLOWLIST stays broken.
  it("also reassigns an unassigned tracked issue on the degraded path", () => {
    const report = emptyReport({ ok: false, blocking: [], expired: [{ id: ID, expires: "2026-01-01", reason: "x" }] });
    const existingIssues = new Map([openIssue(ID, "high", { assignees: [] })]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].reassign).toBe(true);
    expect(plan.updates[0].note).toContain(EXPECTED_ASSIGNEE);
  });

  it("also relabels an unlabeled tracked issue on the degraded path", () => {
    const report = emptyReport({ ok: false, blocking: [], expired: [{ id: ID, expires: "2026-01-01", reason: "x" }] });
    const existingIssues = new Map([openIssue(ID, "high", { labels: [] })]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].relabel).toBe(true);
    expect(plan.updates[0].note).toContain(LABEL);
  });

  it("warns instead of failing when an expired waiver has no tracked issue yet", () => {
    const report = emptyReport({ ok: false, blocking: [], expired: [{ id: ID, expires: "2026-01-01", reason: "x" }] });
    const plan = planActions({ report, existingIssues: new Map() });

    expect(plan.warnings).toHaveLength(1);
    expect(plan.creates).toEqual([]);
  });

  it("extracts the advisory id from a malformed-waiver message and updates its issue", () => {
    const report = emptyReport({ ok: false, blocking: [], malformedWaivers: [`${ID} — expiry "not-a-date" is not a real YYYY-MM-DD date`] });
    const existingIssues = new Map([openIssue(ID, "high")]);
    const plan = planActions({ report, existingIssues });

    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].id).toBe(ID);
  });

  it("warns rather than acting when a malformed-waiver message has no traceable id", () => {
    const report = emptyReport({ ok: false, blocking: [], malformedWaivers: ["entry 0 — waiver is a string, expected an object"] });
    const plan = planActions({ report, existingIssues: new Map() });

    expect(plan.warnings).toHaveLength(1);
    expect(plan.updates).toEqual([]);
    expect(plan.reopens).toEqual([]);
  });

  it("skips stale-closing entirely on a degraded report", () => {
    const report = emptyReport({ ok: false, blocking: [], expired: [{ id: ID, expires: "2026-01-01", reason: "x" }] });
    const existingIssues = new Map([openIssue(OTHER, "high")]);
    const plan = planActions({ report, existingIssues });

    expect(plan.closes).toEqual([]);
  });
});

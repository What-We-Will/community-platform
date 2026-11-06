// @vitest-environment node
import { planActions } from "./dependency-monitoring-issues.mjs";
import { ID, OTHER, finding, report, tracked } from "./dependency-monitoring-issues.fixtures";

// An entry the audit could not interpret might be hiding any advisory, so its absence
// from `blocking` is not evidence that a tracked advisory went away.
describe("Monitoring lane on a scan with uninterpretable entries", () => {
  const incomplete = [
    ["invalid", { invalid: [{ name: "broken", problem: "entry is null" }] }],
    ["unresolved", { unresolved: [{ name: "eslint", problems: ["ghost-package absent"] }] }],
    ["missing completeness fields", { invalid: undefined, unresolved: undefined }],
  ] as const;

  it.each(incomplete)("should not close a tracked issue when the report has %s entries", (_label, extra) => {
    const existingIssues = new Map([tracked(OTHER)]);

    const plan = planActions({ report: report(extra), existingIssues });

    expect(plan.closes).toEqual([]);
    expect(plan.degraded).toBe(true);
  });

  it.each(incomplete)("should still file blocking advisories when the report has %s entries", (_label, extra) => {
    const blocking = [finding(ID)];

    const plan = planActions({ report: report({ ...extra, blocking }), existingIssues: new Map() });

    expect(plan.creates.map((c) => c.id)).toEqual([ID]);
  });

  it("should warn with the name of each uninterpretable entry when the scan is incomplete", () => {
    const both = report({ ...incomplete[0][1], ...incomplete[1][1] });

    const plan = planActions({ report: both, existingIssues: new Map() });

    expect(plan.warnings.join("\n")).toContain("broken");
    expect(plan.warnings.join("\n")).toContain("eslint");
  });
});

// A report the planner cannot explain must never read as "nothing is blocking".
describe("Monitoring lane on a failed report it cannot explain", () => {
  it("should not close a tracked issue when the report failed with no recorded cause", () => {
    const existingIssues = new Map([tracked(OTHER)]);

    const plan = planActions({ report: report({ ok: false }), existingIssues });

    expect(plan.closes).toEqual([]);
    expect(plan.degraded).toBe(true);
  });

  it("should still close a stale issue when a clean report says ok", () => {
    const existingIssues = new Map([tracked(OTHER)]);

    const plan = planActions({ report: report({ ok: true }), existingIssues });

    expect(plan.closes.map((c) => c.id)).toEqual([OTHER]);
  });

  it("should still close a stale issue when the report failed only because something is blocking", () => {
    const existingIssues = new Map([tracked(OTHER)]);

    const plan = planActions({ report: report({ ok: false, blocking: [finding(ID)] }), existingIssues });

    expect(plan.closes.map((c) => c.id)).toEqual([OTHER]);
  });

  it.each([[undefined], ["GHSA"], [{}]])("should refuse to plan when the blocking list is %o", (blocking) => {
    const broken = report({ blocking });

    const act = () => planActions({ report: broken, existingIssues: new Map() });

    expect(act).toThrow(/blocking/);
  });
});

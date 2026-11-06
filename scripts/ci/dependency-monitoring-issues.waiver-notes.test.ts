// @vitest-environment node
import { planActions } from "./dependency-monitoring-issues.mjs";
import { ID, OTHER, expiredWaiver, finding, report, tracked } from "./dependency-monitoring-issues.fixtures";

const malformedMessage = `${ID} — expiry "not-a-date" is not a real YYYY-MM-DD date`;

describe("Monitoring lane when a waiver problem and a blocking advisory coincide", () => {
  it("should file a new advisory while a different waiver has expired", () => {
    const stale = report({ blocking: [finding(OTHER)], expired: [expiredWaiver(ID)] });

    const plan = planActions({ report: stale, existingIssues: new Map() });

    expect(plan.creates.map((c) => c.id)).toEqual([OTHER]);
  });

  it.each([
    ["expired", { expired: [expiredWaiver(ID)] }, "expired 2026-01-01"],
    ["malformed", { malformedWaivers: [malformedMessage] }, "malformed"],
  ])("should file one issue carrying the note when the %s waiver's advisory has none", (_label, extra, note) => {
    const both = report({ blocking: [finding(ID)], ...extra });

    const plan = planActions({ report: both, existingIssues: new Map() });

    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0].note).toContain(note);
    expect(plan.warnings).toEqual([]);
  });

  it.each([
    ["open", "updates"],
    ["closed", "reopens"],
  ] as const)("should touch a %s tracked issue once when its waiver expired and it is blocking", (state, bucket) => {
    const both = report({ blocking: [finding(ID)], expired: [expiredWaiver(ID)] });

    const plan = planActions({ report: both, existingIssues: new Map([tracked(ID, state)]) });

    expect(plan.updates.length + plan.reopens.length).toBe(1);
    expect(plan[bucket][0].note).toContain("expired 2026-01-01");
    expect(plan[bucket][0].finding).toEqual(finding(ID));
  });
});

// The advisory is gone, so the only action left is deleting the waiver. Reopening its
// issue would add a daily comment that no fix to the dependency tree can clear.
describe("Monitoring lane when a broken waiver names an advisory no longer reported", () => {
  it.each([
    ["expired", { expired: [expiredWaiver(ID)] }],
    ["malformed", { malformedWaivers: [malformedMessage] }],
  ])("should leave the tracked issues alone and ask to delete the %s waiver", (_label, extra) => {
    const gone = report({ ...extra, stale: [{ id: ID }] });
    const existingIssues = new Map([tracked(ID, "closed")]);

    const plan = planActions({ report: gone, existingIssues });

    expect(plan.reopens).toEqual([]);
    expect(plan.updates).toEqual([]);
    expect(plan.warnings.join("\n")).toMatch(new RegExp(`${ID}.*delete`));
  });

  it("should not update an open issue for a stale expired waiver", () => {
    const gone = report({ expired: [expiredWaiver(ID)], stale: [{ id: ID }] });

    const plan = planActions({ report: gone, existingIssues: new Map([tracked(ID)]) });

    expect(plan.updates).toEqual([]);
  });
});

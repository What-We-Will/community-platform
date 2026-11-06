// Shared report and issue builders for the dependency-monitoring-issues test files.
import { EXPECTED_ASSIGNEE, LABEL, buildIssueBody } from "./dependency-monitoring-issues.mjs";

export const ID = "GHSA-mh99-v99m-4gvg";
export const OTHER = "GHSA-aaaa-bbbb-cccc";
export const TODAY = "2026-08-11";

export const finding = (id: string, severity = "high") => ({ id, severity, name: "pkg", title: `${id} advisory` });
export const expiredWaiver = (id: string) => ({ id, expires: "2026-01-01", reason: "x" });

export function report(overrides: Record<string, unknown> = {}) {
  return {
    mode: "full-tree", ok: false, failure: null, blocking: [], waived: [], stale: [],
    expired: [], malformedWaivers: [], invalid: [], unresolved: [], suppressed: 0,
    ...overrides,
  };
}

export function tracked(id: string, state = "open") {
  const body = buildIssueBody({ ...finding(id), today: TODAY });
  return [id, { number: 7, state, title: id, body, assignees: [EXPECTED_ASSIGNEE], labels: [LABEL] }] as const;
}

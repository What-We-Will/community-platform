// @vitest-environment node
import { evaluateAudit } from "./audit-with-allowlist.mjs";

const WAIVED = "GHSA-mh99-v99m-4gvg";
const OTHER = "GHSA-aaaa-bbbb-cccc";
const TODAY = "2026-07-25";

type Waiver = { id: string; expires: string; reason: string };

const valid = (id: string): Waiver => ({ id, expires: "2026-10-23", reason: "valid fixture" });
const expired = (id: string): Waiver => ({ id, expires: "2026-01-01", reason: "expired fixture" });
const malformed = (id: string) => ({ id, expires: "not-a-date", reason: "malformed fixture" });

function rootFinding(id: string, severity = "high") {
  const via = [{ source: 1, name: "pkg", title: `${id} test advisory`, url: `https://github.com/advisories/${id}`, severity }];
  return { name: "pkg", severity, via };
}

function evaluate(vulnerabilities: Record<string, unknown>, allowlist: unknown[]) {
  return evaluateAudit({ vulnerabilities, allowlist: allowlist as Waiver[], today: TODAY });
}

// The monitoring and release lanes read this result. A waiver problem that stopped the
// scan would leave both blind to every other advisory while the waiver stayed broken.
describe("Full-tree audit keeps scanning when a waiver is expired or malformed", () => {
  it.each([
    ["expired", expired(WAIVED)],
    ["malformed", malformed(WAIVED)],
  ])("should still block an un-waived advisory when a different waiver is %s", (_label, waiver) => {
    const vulnerabilities = { pkg: rootFinding(OTHER) };

    const result = evaluate(vulnerabilities, [waiver]);

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([OTHER]);
  });

  it("should report the expired waiver alongside the findings when one has expired", () => {
    const vulnerabilities = { pkg: rootFinding(OTHER) };

    const result = evaluate(vulnerabilities, [expired(WAIVED)]);

    expect(result.expired.map((e) => e.id)).toEqual([WAIVED]);
    expect(result.blocking).toHaveLength(1);
  });

  it.each([
    ["expired", expired(WAIVED)],
    ["malformed", malformed(WAIVED)],
  ])("should block the advisory a waiver names when that waiver is %s", (_label, waiver) => {
    const vulnerabilities = { pkg: rootFinding(WAIVED) };

    const result = evaluate(vulnerabilities, [waiver]);

    expect(result.blocking.map((r) => r.id)).toEqual([WAIVED]);
    expect(result.waived).toEqual([]);
    expect(result.suppressed).toBe(0);
  });

  it("should keep honouring a valid waiver when a different waiver has expired", () => {
    const vulnerabilities = { pkg: rootFinding(WAIVED) };

    const result = evaluate(vulnerabilities, [valid(WAIVED), expired(OTHER)]);

    expect(result.ok).toBe(false);
    expect(result.waived.map((r) => r.id)).toEqual([WAIVED]);
    expect(result.blocking).toEqual([]);
  });

  it("should keep honouring a valid waiver when another entry is not an object", () => {
    const vulnerabilities = { pkg: rootFinding(WAIVED) };

    const result = evaluate(vulnerabilities, [null, valid(WAIVED)]);

    expect(result.ok).toBe(false);
    expect(result.malformedWaivers).toHaveLength(1);
    expect(result.waived.map((r) => r.id)).toEqual([WAIVED]);
  });

  it("should report uninterpretable entries alongside an expired waiver", () => {
    const vulnerabilities = {
      broken: null,
      eslint: { name: "eslint", severity: "high", via: ["ghost-package"] },
    };

    const result = evaluate(vulnerabilities, [expired(WAIVED)]);

    expect(result.invalid.map((e) => e.name)).toEqual(["broken"]);
    expect(result.unresolved.map((e) => e.name)).toEqual(["eslint"]);
    expect(result.expired).toHaveLength(1);
  });

  it("should fail and list the waiver as stale when a malformed waiver is the only problem", () => {
    const result = evaluate({}, [malformed(WAIVED)]);

    expect(result.ok).toBe(false);
    expect(result.stale.map((e) => e.id)).toEqual([WAIVED]);
  });

  // An entry the scan could not read may be the advisory the waiver names.
  it("should list no waiver as stale when the scan could not interpret every finding", () => {
    const vulnerabilities = { eslint: { name: "eslint", severity: "high", via: ["ghost-package"] } };

    const result = evaluate(vulnerabilities, [expired(WAIVED)]);

    expect(result.unresolved).toHaveLength(1);
    expect(result.stale).toEqual([]);
  });

  it("should list an expired waiver as stale when its advisory is no longer reported", () => {
    const result = evaluate({}, [expired(WAIVED)]);

    expect(result.ok).toBe(false);
    expect(result.stale.map((e) => e.id)).toEqual([WAIVED]);
  });
});

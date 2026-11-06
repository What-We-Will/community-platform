// @vitest-environment node
import { evaluateAudit, evaluateDelta } from "./audit-with-allowlist.mjs";

const WAIVED = "GHSA-mh99-v99m-4gvg";
const OTHER = "GHSA-aaaa-bbbb-cccc";
const TODAY = "2026-07-25";

type Waiver = { id: string; expires: string; reason: string };

const valid = (id: string): Waiver => ({ id, expires: "2026-10-23", reason: "valid fixture" });
const expired = (id: string): Waiver => ({ id, expires: "2026-01-01", reason: "expired fixture" });

function tree(id: string) {
  const via = [{ source: 1, name: "pkg", title: `${id} advisory`, url: `https://github.com/advisories/${id}`, severity: "high" }];
  return { pkg: { name: "pkg", severity: "high", via } };
}

const full = (allowlist: unknown[]) =>
  evaluateAudit({ vulnerabilities: tree(WAIVED), allowlist: allowlist as Waiver[], today: TODAY });

const introduced = (allowlist: unknown[]) =>
  evaluateDelta({
    base: { ok: true, vulnerabilities: {} },
    head: { ok: true, vulnerabilities: tree(WAIVED) },
    allowlist: allowlist as Waiver[],
    today: TODAY,
  });

// ADR-0009: a waiver is advisory-scoped, dated, and rationale-bearing.
describe("Audit waiver must carry a written rationale", () => {
  it.each([[undefined], [""], ["   "], [42]])("should not waive an advisory when the reason is %o", (reason) => {
    const waiver = { id: WAIVED, expires: "2026-10-23", reason };

    const result = full([waiver]);

    expect(result.ok).toBe(false);
    expect(result.malformedWaivers).toHaveLength(1);
    expect(result.blocking.map((r) => r.id)).toEqual([WAIVED]);
  });

  it("should block an introduced advisory when its waiver has no reason", () => {
    const waiver = { id: WAIVED, expires: "2026-10-23" };

    const result = introduced([waiver]);

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([WAIVED]);
  });
});

// Two entries for one advisory leave its real expiry ambiguous, and the full-tree and
// pull-request lanes would otherwise each pick a different one.
describe("Audit waiver list must name each advisory once", () => {
  it("should waive nothing for an advisory listed twice in the full-tree audit", () => {
    const result = full([valid(WAIVED), expired(WAIVED)]);

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([WAIVED]);
    expect(result.malformedWaivers.filter((p) => p.includes("listed 2 times"))).toHaveLength(1);
  });

  it("should block an introduced advisory that is listed twice", () => {
    const result = introduced([valid(WAIVED), valid(WAIVED)]);

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([WAIVED]);
  });

  it("should block an introduced advisory listed once valid and once expired", () => {
    const result = introduced([valid(WAIVED), expired(WAIVED)]);

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([WAIVED]);
  });

  it("should accept one waiver each for two different advisories", () => {
    const result = full([valid(WAIVED), valid(OTHER)]);

    expect(result.malformedWaivers).toEqual([]);
    expect(result.waived.map((r) => r.id)).toEqual([WAIVED]);
  });
});

// npm reports advisory ids as GHSA- plus a lowercase body, and waivers match them exactly.
// A waiver in any other case would match nothing and look stale while its advisory blocks.
describe("Audit waiver id must be written as npm reports it", () => {
  it.each([["a lowercase prefix", "ghsa-mh99-v99m-4gvg"], ["an uppercase body", "GHSA-MH99-V99M-4GVG"]])(
    "should flag the waiver as malformed when its id has %s",
    (_label, id) => {
      const result = full([{ ...valid(WAIVED), id }]);

      expect(result.malformedWaivers).toHaveLength(1);
      expect(result.stale).toEqual([]);
      expect(result.blocking.map((r) => r.id)).toEqual([WAIVED]);
    }
  );
});

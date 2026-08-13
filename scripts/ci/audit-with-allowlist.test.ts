// @vitest-environment node
import {
  evaluateAudit,
  evaluateDelta,
  parseAuditReport,
  runAudit,
} from "./audit-with-allowlist.mjs";

const WAIVED = "GHSA-mh99-v99m-4gvg";
const OTHER = "GHSA-aaaa-bbbb-cccc";
const THIRD = "GHSA-dddd-eeee-ffff";
const TODAY = "2026-07-25";

const allowlist = [{ id: WAIVED, expires: "2026-10-23", reason: "test fixture" }];

function advisory(id: string, severity = "high") {
  return {
    source: 1234,
    name: "brace-expansion",
    title: `${id} test advisory`,
    url: `https://github.com/advisories/${id}`,
    severity,
  };
}

function rootFinding(id: string, severity = "high") {
  return { name: "brace-expansion", severity, via: [advisory(id, severity)] };
}

function evaluate(vulnerabilities: Record<string, unknown>, today = TODAY) {
  return evaluateAudit({ vulnerabilities, allowlist, today });
}

describe("Audit gate report validation", () => {
  it("should accept a well-formed report with no findings", () => {
    const parsed = parseAuditReport(JSON.stringify({ vulnerabilities: {} }));

    expect(parsed).toEqual({ ok: true, vulnerabilities: {} });
  });

  it("should reject malformed JSON as unparseable", () => {
    const parsed = parseAuditReport("{ not json");

    expect(parsed.ok).toBe(false);
    expect(parsed.kind).toBe("unparseable");
  });

  // npm reports its own failures as valid JSON, which a lenient parser reads as "no findings".
  it("should reject a JSON error envelope rather than treating it as an empty report", () => {
    const parsed = parseAuditReport(
      JSON.stringify({ message: "network error", error: { code: "ENOTFOUND", summary: "offline" } })
    );

    expect(parsed.ok).toBe(false);
    expect(parsed.kind).toBe("error-envelope");
  });

  it("should reject a report with no vulnerabilities key instead of defaulting to empty", () => {
    const parsed = parseAuditReport(JSON.stringify({ metadata: {} }));

    expect(parsed.ok).toBe(false);
    expect(parsed.kind).toBe("unsupported-shape");
  });

  it.each([
    ["null", "null"],
    ["an array", "[]"],
    ["a vulnerabilities array", JSON.stringify({ vulnerabilities: [] })],
    ["a vulnerabilities scalar", JSON.stringify({ vulnerabilities: 3 })],
  ])("should reject %s as an unsupported shape", (_label, payload) => {
    const parsed = parseAuditReport(payload);

    expect(parsed.ok).toBe(false);
    expect(parsed.kind).toBe("unsupported-shape");
  });
});

describe("Audit gate waiver evaluation", () => {
  it("should pass when the only high finding resolves to an allowlisted advisory", () => {
    const result = evaluate({ "brace-expansion": rootFinding(WAIVED) });

    expect(result.ok).toBe(true);
    expect(result.suppressed).toBe(1);
    expect(result.waived.map((r) => r.id)).toEqual([WAIVED]);
  });

  it("should block a different high advisory even on an allowlisted package", () => {
    const result = evaluate({ "brace-expansion": rootFinding(OTHER) });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([OTHER]);
  });

  it("should block every high finding once a waiver has expired", () => {
    const result = evaluate({ "brace-expansion": rootFinding(WAIVED) }, "2026-10-24");

    expect(result.ok).toBe(false);
    expect(result.expired.map((e) => e.id)).toEqual([WAIVED]);
    expect(result.suppressed).toBe(0);
  });

  it("should ignore findings below the gated severities", () => {
    const result = evaluate({ "some-pkg": rootFinding(OTHER, "moderate") });

    expect(result.ok).toBe(true);
    expect(result.blocking).toEqual([]);
  });

  it("should resolve a high finding through a chain of string via references", () => {
    const result = evaluate({
      eslint: { name: "eslint", severity: "high", via: ["minimatch"] },
      minimatch: { name: "minimatch", severity: "high", via: ["brace-expansion"] },
      "brace-expansion": rootFinding(WAIVED),
    });

    expect(result.ok).toBe(true);
    expect(result.suppressed).toBe(3);
  });

  it("should report a stale waiver when its advisory no longer appears", () => {
    const result = evaluate({});

    expect(result.ok).toBe(true);
    expect(result.stale.map((e) => e.id)).toEqual([WAIVED]);
  });
});

describe("Audit gate fail-closed behavior on unresolvable findings", () => {
  it("should block a via graph that never reaches a root advisory", () => {
    const result = evaluate({
      eslint: { name: "eslint", severity: "high", via: ["minimatch"] },
      minimatch: { name: "minimatch", severity: "high", via: ["brace-expansion"] },
    });

    expect(result.ok).toBe(false);
    expect(result.unresolved.map((f) => f.name)).toContain("eslint");
    expect(result.suppressed).toBe(0);
  });

  it("should block when one finding resolves and another does not", () => {
    const result = evaluate({
      "brace-expansion": rootFinding(WAIVED),
      eslint: { name: "eslint", severity: "high", via: ["ghost-package"] },
    });

    expect(result.ok).toBe(false);
    expect(result.unresolved.map((f) => f.name)).toEqual(["eslint"]);
  });

  // An unresolved finding must never be counted as suppressed — that number is the
  // gate's own claim about what it accounted for.
  it("should not count an unresolved finding as suppressed", () => {
    const result = evaluate({
      "brace-expansion": rootFinding(WAIVED),
      eslint: { name: "eslint", severity: "high", via: ["ghost-package"] },
    });

    expect(result.suppressed).toBe(1);
    expect(result.unresolved).toHaveLength(1);
  });

  it("should block a cyclic via graph instead of recursing forever", () => {
    const result = evaluate({
      a: { name: "a", severity: "high", via: ["b"] },
      b: { name: "b", severity: "high", via: ["a"] },
    });

    expect(result.ok).toBe(false);
    expect(result.unresolved).not.toHaveLength(0);
  });

  it("should block an advisory whose URL yields no GHSA identifier", () => {
    const result = evaluate({
      "brace-expansion": {
        name: "brace-expansion",
        severity: "high",
        via: [{ source: 1, name: "brace-expansion", title: "no url", severity: "high" }],
      },
    });

    expect(result.ok).toBe(false);
    expect(result.unresolved).toHaveLength(1);
  });

  it.each([
    ["an invalid via entry", { name: "x", severity: "high", via: [42] }],
    ["an empty via list", { name: "x", severity: "high", via: [] }],
    ["a missing via list", { name: "x", severity: "high" }],
  ])("should block a high finding with %s", (_label, entry) => {
    const result = evaluate({ x: entry as Record<string, unknown> });

    expect(result.ok).toBe(false);
    expect(result.unresolved).toHaveLength(1);
  });

  it("should block a high finding whose only root advisory is below the gated severities", () => {
    const result = evaluate({
      "brace-expansion": { name: "brace-expansion", severity: "high", via: [advisory(OTHER, "low")] },
    });

    expect(result.ok).toBe(false);
    expect(result.unresolved).toHaveLength(1);
  });
});

describe("Audit gate entry validation before severity filtering", () => {
  it("should block a non-object entry inside an otherwise valid map", () => {
    const result = evaluate({ malformed: null });

    expect(result.ok).toBe(false);
    expect(result.invalid.map((e) => e.name)).toEqual(["malformed"]);
  });

  it("should block a non-object entry even when every other finding is waived", () => {
    const result = evaluate({ "brace-expansion": rootFinding(WAIVED), malformed: null });

    expect(result.ok).toBe(false);
    expect(result.invalid).toHaveLength(1);
  });

  // Case-normalising here would let a report the author never wrote decide the gate.
  it("should block a differently cased severity rather than normalising it", () => {
    const result = evaluate({
      "brace-expansion": { name: "brace-expansion", severity: "HIGH", via: [advisory(WAIVED)] },
    });

    expect(result.ok).toBe(false);
    expect(result.invalid[0].problem).toContain("HIGH");
  });

  it.each([["bogus"], [""], [undefined], [null], [7]])(
    "should block an entry whose severity is %o",
    (severity) => {
      const result = evaluate({
        x: { name: "x", severity, via: [advisory(OTHER)] } as Record<string, unknown>,
      });

      expect(result.ok).toBe(false);
      expect(result.invalid).toHaveLength(1);
    }
  );

  it("should block an advisory whose severity is unrecognised", () => {
    const result = evaluate({
      "brace-expansion": { name: "brace-expansion", severity: "high", via: [advisory(WAIVED, "HIGH")] },
    });

    expect(result.ok).toBe(false);
    expect(result.unresolved).toHaveLength(1);
  });

  it.each([["info"], ["low"], ["moderate"]])(
    "should treat a recognised '%s' finding as non-gating rather than invalid",
    (severity) => {
      const result = evaluate({ x: { name: "x", severity, via: [advisory(OTHER, severity)] } });

      expect(result.ok).toBe(true);
      expect(result.invalid).toEqual([]);
    }
  );
});

describe("Audit gate waiver format validation", () => {
  const withWaiver = (waiver: Record<string, unknown>, today = TODAY) =>
    evaluateAudit({
      vulnerabilities: { "brace-expansion": rootFinding(WAIVED) },
      allowlist: [waiver] as unknown as { id: string; expires: string; reason: string }[],
      today,
    });

  // Under string comparison an unusable expiry never sorts before today, so the waiver
  // would silently outlive any deadline.
  it("should block a waiver with no expires value", () => {
    const result = withWaiver({ id: WAIVED, reason: "no expiry" });

    expect(result.ok).toBe(false);
    expect(result.malformedWaivers).toHaveLength(1);
  });

  it.each([
    ["not-a-date"],
    ["2026-02-30"],
    ["2026-13-01"],
    ["26-10-23"],
    ["2026-10-23T00:00:00Z"],
    [20261023],
    [null],
  ])("should block a waiver whose expiry is %o", (expires) => {
    const result = withWaiver({ id: WAIVED, expires, reason: "bad expiry" });

    expect(result.ok).toBe(false);
    expect(result.malformedWaivers).toHaveLength(1);
  });

  it.each([[undefined], [""], ["not-a-ghsa"], ["GHSA-short"], [42]])(
    "should block a waiver whose advisory id is %o",
    (id) => {
      const result = withWaiver({ id, expires: "2026-10-23", reason: "bad id" });

      expect(result.ok).toBe(false);
      expect(result.malformedWaivers).toHaveLength(1);
    }
  );

  it("should block a non-object waiver", () => {
    const result = withWaiver(null as unknown as Record<string, unknown>);

    expect(result.ok).toBe(false);
    expect(result.malformedWaivers).toHaveLength(1);
  });

  it("should pass on the exact expiry date", () => {
    const result = withWaiver({ id: WAIVED, expires: "2026-10-23", reason: "ok" }, "2026-10-23");

    expect(result.ok).toBe(true);
    expect(result.expired).toEqual([]);
  });

  it("should fail on the day after the expiry date", () => {
    const result = withWaiver({ id: WAIVED, expires: "2026-10-23", reason: "ok" }, "2026-10-24");

    expect(result.ok).toBe(false);
    expect(result.expired).toHaveLength(1);
  });

  it("should validate waiver format before evaluating expiry", () => {
    const result = withWaiver({ id: WAIVED, expires: "not-a-date", reason: "bad" }, "2030-01-01");

    expect(result.malformedWaivers).toHaveLength(1);
    expect(result.expired).toEqual([]);
  });

  it("should block when the shipped ALLOWLIST is replaced by an empty list", () => {
    const result = evaluateAudit({
      vulnerabilities: { "brace-expansion": rootFinding(WAIVED) },
      allowlist: [],
      today: TODAY,
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([WAIVED]);
  });
});

describe("Audit gate mixed-root and mixed-envelope handling", () => {
  it("should block a finding carrying both a waived and an un-waived high root", () => {
    const result = evaluate({
      "brace-expansion": {
        name: "brace-expansion",
        severity: "high",
        via: [advisory(WAIVED), advisory(OTHER)],
      },
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([OTHER]);
    expect(result.suppressed).toBe(0);
  });

  // A payload carrying both keys is not a report with an incidental error field.
  it("should reject a payload containing both error and vulnerabilities", () => {
    const parsed = parseAuditReport(
      JSON.stringify({ error: { summary: "partial failure" }, vulnerabilities: {} })
    );

    expect(parsed.ok).toBe(false);
    expect(parsed.kind).toBe("error-envelope");
  });
});

const report = (vulnerabilities: Record<string, unknown>) => ({ ok: true, vulnerabilities });
const scannerFailure = { ok: false, kind: "scanner", detail: "spawn npm ENOENT" };
const unparseable = { ok: false, kind: "unparseable", detail: "Unexpected token" };
const malformedMap = report({ malformed: null });
const brokenChain = report({ eslint: { name: "eslint", severity: "high", via: ["ghost-package"] } });

function delta({
  base,
  head,
  list = allowlist,
  today = TODAY,
}: {
  base: unknown;
  head: unknown;
  list?: unknown[];
  today?: string;
}) {
  return evaluateDelta({ base, head, allowlist: list, today });
}

describe("Pre-merge gate scoped to advisories the change introduces", () => {
  it("should pass when an advisory is present only at the merge base", () => {
    const result = delta({ base: report({ "brace-expansion": rootFinding(OTHER) }), head: report({}) });

    expect(result.ok).toBe(true);
    expect(result.introduced).toEqual([]);
  });

  it("should fail and name the advisory when it is present only at the head", () => {
    const result = delta({ base: report({}), head: report({ "brace-expansion": rootFinding(OTHER) }) });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([OTHER]);
    expect(result.blocking[0].baseSeverity).toBeNull();
  });

  it("should pass when the same advisory is present at both sides with the same severity", () => {
    const tree = { "brace-expansion": rootFinding(OTHER) };
    const result = delta({ base: report(tree), head: report(tree) });

    expect(result.ok).toBe(true);
    expect(result.blocking).toEqual([]);
    expect(result.inherited.map((r) => r.id)).toEqual([OTHER]);
  });

  it("should fail when an advisory present at both sides is re-rated upward at the head", () => {
    const result = delta({
      base: report({ "brace-expansion": rootFinding(OTHER, "high") }),
      head: report({ "brace-expansion": rootFinding(OTHER, "critical") }),
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([OTHER]);
    expect(result.blocking[0].baseSeverity).toBe("high");
  });

  it("should pass when an advisory present at both sides is re-rated downward at the head", () => {
    const result = delta({
      base: report({ "brace-expansion": rootFinding(OTHER, "critical") }),
      head: report({ "brace-expansion": rootFinding(OTHER, "high") }),
    });

    expect(result.ok).toBe(true);
    expect(result.blocking).toEqual([]);
  });

  it("should fail on an introduced advisory while ignoring an inherited one in the same head report", () => {
    const result = delta({
      base: report({ "brace-expansion": rootFinding(OTHER) }),
      head: report({ "brace-expansion": rootFinding(OTHER), nanoid: rootFinding(THIRD) }),
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([THIRD]);
    expect(result.inherited.map((r) => r.id)).toEqual([OTHER]);
  });

  it("should ignore an advisory below the gated severities on both sides", () => {
    const result = delta({
      base: report({}),
      head: report({ "some-pkg": rootFinding(OTHER, "moderate") }),
    });

    expect(result.ok).toBe(true);
    expect(result.introduced).toEqual([]);
  });
});

describe("Pre-merge delta gate fail-closed behavior per evaluation", () => {
  it.each([
    ["an unrunnable scanner", unparseable],
    ["an unparseable report", scannerFailure],
  ])("should fail when the merge-base evaluation produced %s", (_label, base) => {
    const result = delta({ base, head: report({}) });

    expect(result.ok).toBe(false);
    expect(result.base.failure).not.toBeNull();
  });

  it.each([
    ["a malformed vulnerabilities map", malformedMap],
    ["an unresolvable dependency chain", brokenChain],
  ])("should fail when the merge-base evaluation contains %s", (_label, base) => {
    const result = delta({ base, head: report({}) });

    expect(result.ok).toBe(false);
    expect(result.base.invalid.length + result.base.unresolved.length).toBeGreaterThan(0);
  });

  it.each([
    ["an unrunnable scanner", scannerFailure],
    ["an unparseable report", unparseable],
  ])("should fail when the head evaluation produced %s", (_label, head) => {
    const result = delta({ base: report({}), head });

    expect(result.ok).toBe(false);
    expect(result.head.failure).not.toBeNull();
  });

  it.each([
    ["a malformed vulnerabilities map", malformedMap],
    ["an unresolvable dependency chain", brokenChain],
  ])("should fail when the head evaluation contains %s", (_label, head) => {
    const result = delta({ base: report({}), head });

    expect(result.ok).toBe(false);
    expect(result.head.invalid.length + result.head.unresolved.length).toBeGreaterThan(0);
  });

  // A merge base that could not be evaluated is not a merge base with no findings; treating
  // it as one would let the head's entire tree pass as inherited.
  it("should never treat a failed merge-base evaluation as an empty baseline", () => {
    const result = delta({
      base: scannerFailure,
      head: report({ "brace-expansion": rootFinding(OTHER) }),
    });

    expect(result.ok).toBe(false);
    expect(result.inherited).toEqual([]);
  });

  it.each([
    ["the head", "head" as const],
    ["the merge base", "base" as const],
  ])("should fail on an unrecognised severity at %s", (_label, side) => {
    const bad = report({ x: { name: "x", severity: "URGENT", via: [advisory(OTHER)] } });
    const result = delta({
      base: side === "base" ? bad : report({}),
      head: side === "head" ? bad : report({}),
    });

    expect(result.ok).toBe(false);
    expect(side === "base" ? result.base.invalid : result.head.invalid).toHaveLength(1);
  });

  it("should fail when an advisory severity is unrecognised at the merge base only", () => {
    const result = delta({
      base: report({
        "brace-expansion": { name: "brace-expansion", severity: "high", via: [advisory(OTHER, "HIGH")] },
      }),
      head: report({ "brace-expansion": rootFinding(OTHER) }),
    });

    expect(result.ok).toBe(false);
    expect(result.base.unresolved).toHaveLength(1);
  });
});

describe("Pre-merge delta gate waiver scope", () => {
  const expiredWaiver = [{ id: OTHER, expires: "2026-01-01", reason: "expired fixture" }];
  const validWaiver = [{ id: OTHER, expires: "2026-10-23", reason: "valid fixture" }];
  const malformedWaiver = [{ id: OTHER, expires: "not-a-date", reason: "malformed fixture" }];

  it("should pass when an introduced advisory is covered by a valid waiver", () => {
    const result = delta({
      base: report({}),
      head: report({ "brace-expansion": rootFinding(OTHER) }),
      list: validWaiver,
    });

    expect(result.ok).toBe(true);
    expect(result.waived.map((r) => r.id)).toEqual([OTHER]);
    expect(result.blocking).toEqual([]);
  });

  it("should fail when an introduced advisory is covered only by an expired waiver", () => {
    const result = delta({
      base: report({}),
      head: report({ "brace-expansion": rootFinding(OTHER) }),
      list: expiredWaiver,
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([OTHER]);
    expect(result.expired.map((e) => e.id)).toEqual([OTHER]);
  });

  it("should fail when an introduced advisory is covered only by a malformed waiver", () => {
    const result = delta({
      base: report({}),
      head: report({ "brace-expansion": rootFinding(OTHER) }),
      list: malformedWaiver,
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([OTHER]);
    expect(result.malformedWaivers).toHaveLength(1);
  });

  // Carrying the full-tree waiver check into delta mode would let one stale waiver on an
  // inherited finding re-block every open pull request.
  it.each([
    ["an expired waiver", expiredWaiver],
    ["a malformed waiver", malformedWaiver],
  ])("should pass when %s covers an advisory already present at the merge base", (_label, list) => {
    const tree = { "brace-expansion": rootFinding(OTHER) };
    const result = delta({ base: report(tree), head: report(tree), list });

    expect(result.ok).toBe(true);
    expect(result.expired).toEqual([]);
    expect(result.malformedWaivers).toEqual([]);
  });

  it("should pass when an expired waiver names an advisory absent from both sides", () => {
    const result = delta({ base: report({}), head: report({}), list: expiredWaiver });

    expect(result.ok).toBe(true);
    expect(result.expired).toEqual([]);
  });

  it("should block an introduced advisory that no waiver names", () => {
    const result = delta({
      base: report({}),
      head: report({ nanoid: rootFinding(THIRD) }),
      list: validWaiver,
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([THIRD]);
  });

  // Waiver coverage is decided on the introduction, not on the advisory's presence at base.
  it("should block an upward re-rating even when the waiver covering it has expired", () => {
    const result = delta({
      base: report({ "brace-expansion": rootFinding(OTHER, "high") }),
      head: report({ "brace-expansion": rootFinding(OTHER, "critical") }),
      list: expiredWaiver,
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.map((r) => r.id)).toEqual([OTHER]);
  });
});

describe("Audit gate npm invocation boundary", () => {
  it("should use the report when npm exits nonzero but still writes one", () => {
    const exec = () => {
      const err = Object.assign(new Error("Command failed"), {
        status: 1,
        stdout: JSON.stringify({ vulnerabilities: {} }),
      });
      throw err;
    };

    const result = runAudit(exec);

    expect(result.ok).toBe(true);
    expect(parseAuditReport(result.stdout).ok).toBe(true);
  });

  it("should report a scanner failure when npm exits nonzero with no output", () => {
    const exec = () => {
      throw Object.assign(new Error("spawn npm ENOENT"), { code: "ENOENT", stdout: "" });
    };

    const result = runAudit(exec);

    expect(result.ok).toBe(false);
    expect(result.detail).toContain("ENOENT");
  });

  it("should pass through a clean report when npm exits zero", () => {
    const result = runAudit(() => JSON.stringify({ vulnerabilities: {} }));

    expect(result.ok).toBe(true);
  });
});

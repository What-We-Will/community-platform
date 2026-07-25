#!/usr/bin/env node
// Replaces `npm audit --audit-level=high`, which can only be satisfied by fixing an
// advisory or lowering the threshold for everything. Keeps the threshold and narrows
// the waiver to named advisories, so an unrelated high finding still fails the build.
import { execFileSync } from 'node:child_process';

const ALLOWLIST = [
  {
    id: 'GHSA-mh99-v99m-4gvg',
    expires: '2026-10-23',
    reason:
      'brace-expansion DoS via unbounded expansion. Reachable only through ' +
      'devDependencies (eslint, eslint-config-next, @vitest/eslint-plugin, shadcn) ' +
      'and only by feeding hostile glob patterns to lint tooling; no production ' +
      'code path. The sole patched release, 5.0.8, changed its CommonJS export ' +
      'from a bare function to a namespace object, so it is not drop-in for the ' +
      'minimatch 3.x/9.x consumers in the tree — an `overrides` pin breaks eslint ' +
      'outright. eslint@10 neither clears the advisory (the eslint plugins carry ' +
      'their own minimatch) nor keeps lint working. Blocked on upstream.',
  },
];

const GATED_SEVERITIES = new Set(['high', 'critical']);

function runAudit() {
  try {
    return execFileSync('npm', ['audit', '--json'], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    // npm audit exits non-zero whenever findings exist, which is the normal case here.
    if (typeof err.stdout === 'string' && err.stdout.length > 0) return err.stdout;
    throw err;
  }
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const expired = ALLOWLIST.filter((entry) => entry.expires < today);
if (expired.length > 0) {
  for (const entry of expired) {
    console.error(`  ${entry.id} — waiver expired ${entry.expires}`);
  }
  fail(
    `${expired.length} audit waiver(s) expired. Re-evaluate: fix the advisory, or ` +
      `renew the entry in scripts/ci/audit-with-allowlist.mjs with fresh rationale.`
  );
}

let report;
try {
  report = JSON.parse(runAudit());
} catch (err) {
  fail(`Could not parse \`npm audit --json\` output: ${err.message}`);
}

const vulnerabilities = report.vulnerabilities ?? {};

// Object-form `via` entries are root advisories; string-form entries name a package
// pulled in by one. Waiving a root waives every finding it explains.
const rootAdvisories = new Map();
for (const vuln of Object.values(vulnerabilities)) {
  for (const via of vuln.via ?? []) {
    if (typeof via !== 'object' || !GATED_SEVERITIES.has(via.severity)) continue;
    const id = via.url?.split('/').pop() ?? `source-${via.source}`;
    rootAdvisories.set(id, { id, name: via.name, title: via.title, severity: via.severity });
  }
}

const gatedFindings = Object.values(vulnerabilities).filter((v) =>
  GATED_SEVERITIES.has(v.severity)
);

// Findings with no root advisory to explain them mean the report shape is not what
// this script models; failing is the only safe reading.
if (gatedFindings.length > 0 && rootAdvisories.size === 0) {
  fail(
    `${gatedFindings.length} high/critical finding(s) present but no root advisory could ` +
      `be identified. Run \`npm audit\` directly — do not trust this gate until resolved.`
  );
}

const allowed = new Set(ALLOWLIST.map((entry) => entry.id));
const blocking = [...rootAdvisories.values()].filter((root) => !allowed.has(root.id));
const waived = [...rootAdvisories.values()].filter((root) => allowed.has(root.id));

for (const root of waived) {
  console.log(`• waived ${root.id} (${root.severity}) — ${root.name}: ${root.title}`);
}

// Reporting rather than failing, so an upstream fix never breaks the build.
for (const entry of ALLOWLIST.filter((e) => !rootAdvisories.has(e.id))) {
  console.log(`• stale waiver ${entry.id} — no longer reported, safe to delete`);
}

if (blocking.length > 0) {
  for (const root of blocking) {
    console.error(`  ${root.id} (${root.severity}) — ${root.name}: ${root.title}`);
  }
  fail(
    `${blocking.length} un-waived high/critical advisory(ies). Fix them, or add a ` +
      `justified, dated entry to ALLOWLIST in scripts/ci/audit-with-allowlist.mjs.`
  );
}

console.log(
  `\n✔ No un-waived high/critical advisories (${waived.length} waived, ${gatedFindings.length} finding(s) suppressed).`
);

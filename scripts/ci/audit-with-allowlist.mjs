#!/usr/bin/env node
// Replaces `npm audit --audit-level=high`, which can only be satisfied by fixing an
// advisory or lowering the threshold for everything. Keeps the threshold and narrows
// the waiver to named advisories, so an unrelated high finding still fails the build.
//
// Every unrecognised condition blocks. A gate that cannot explain what it is looking at
// has no basis for passing.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const ALLOWLIST = [
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
// npm's full severity vocabulary. An entry outside it is not a low-risk finding, it is a
// report this gate does not understand — matched case-sensitively so "HIGH" blocks rather
// than being normalised into a severity the author never wrote.
const KNOWN_SEVERITIES = new Set(['info', 'low', 'moderate', 'high', 'critical']);
const ADVISORY_ID = /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/i;

function describe(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return typeof value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Round-tripping rejects both unparseable strings and ones a Date would silently roll
// over, so "2026-02-30" cannot become a real deadline.
function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// An unusable expiry is indistinguishable from no expiry at all under string comparison,
// which would make the waiver permanent — the one thing the format exists to prevent.
export function validateAllowlist(allowlist) {
  const problems = [];
  for (const [index, entry] of allowlist.entries()) {
    const label = isPlainObject(entry) && typeof entry.id === 'string' ? entry.id : `entry ${index}`;
    if (!isPlainObject(entry)) {
      problems.push(`${label} — waiver is ${describe(entry)}, expected an object`);
      continue;
    }
    if (typeof entry.id !== 'string' || !ADVISORY_ID.test(entry.id)) {
      problems.push(`${label} — advisory id ${JSON.stringify(entry.id)} is not a GHSA identifier`);
    }
    if (!isCalendarDate(entry.expires)) {
      problems.push(`${label} — expiry ${JSON.stringify(entry.expires)} is not a real YYYY-MM-DD date`);
    }
  }
  return problems;
}

export function parseAuditReport(stdout) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (err) {
    return { ok: false, kind: 'unparseable', detail: err.message };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, kind: 'unsupported-shape', detail: `expected an object, received ${describe(parsed)}` };
  }

  // npm reports failures as a valid JSON envelope, which would otherwise read as a
  // report containing no vulnerabilities.
  if ('error' in parsed) {
    const message = isPlainObject(parsed.error)
      ? (parsed.error.summary ?? parsed.error.detail ?? JSON.stringify(parsed.error))
      : String(parsed.error);
    return { ok: false, kind: 'error-envelope', detail: message };
  }

  if (!('vulnerabilities' in parsed)) {
    return { ok: false, kind: 'unsupported-shape', detail: 'report has no `vulnerabilities` key' };
  }
  if (!isPlainObject(parsed.vulnerabilities)) {
    return {
      ok: false,
      kind: 'unsupported-shape',
      detail: `\`vulnerabilities\` is ${describe(parsed.vulnerabilities)}, expected an object`,
    };
  }

  return { ok: true, vulnerabilities: parsed.vulnerabilities };
}

function advisoryIdOf(via) {
  const last = typeof via.url === 'string' ? via.url.split('/').filter(Boolean).pop() : undefined;
  return last !== undefined && ADVISORY_ID.test(last) ? last : null;
}

// `via` mixes root advisory objects with names of other entries in the same map, so a
// finding's roots are only known after walking the whole chain.
function resolveFindingRoots(vulnerabilities, startName) {
  const roots = new Map();
  const problems = [];
  const onPath = new Set();
  const settled = new Set();

  function walk(name) {
    if (onPath.has(name)) {
      problems.push(`cyclic \`via\` reference at "${name}"`);
      return;
    }
    if (settled.has(name)) return;

    const entry = vulnerabilities[name];
    if (entry === undefined) {
      problems.push(`"${name}" is referenced by \`via\` but absent from the report`);
      return;
    }
    if (!isPlainObject(entry)) {
      problems.push(`"${name}" is ${describe(entry)}, expected an object`);
      return;
    }
    if (!Array.isArray(entry.via) || entry.via.length === 0) {
      problems.push(`"${name}" has no usable \`via\` list`);
      return;
    }

    onPath.add(name);
    for (const via of entry.via) {
      if (typeof via === 'string') {
        walk(via);
      } else if (isPlainObject(via)) {
        const id = advisoryIdOf(via);
        if (id === null) {
          problems.push(`an advisory on "${name}" has no recognisable GHSA identifier`);
          continue;
        }
        if (typeof via.severity !== 'string' || !KNOWN_SEVERITIES.has(via.severity)) {
          problems.push(`advisory ${id} has unrecognised severity ${JSON.stringify(via.severity)}`);
          continue;
        }
        roots.set(id, {
          id,
          name: typeof via.name === 'string' ? via.name : name,
          title: typeof via.title === 'string' ? via.title : '(untitled)',
          severity: via.severity,
        });
      } else {
        problems.push(`"${name}" has an invalid \`via\` entry (${describe(via)})`);
      }
    }
    onPath.delete(name);
    settled.add(name);
  }

  walk(startName);
  return { roots, problems: [...new Set(problems)] };
}

export function evaluateAudit({ vulnerabilities, allowlist = ALLOWLIST, today }) {
  const empty = {
    ok: false,
    malformedWaivers: [],
    expired: [],
    invalid: [],
    unresolved: [],
    blocking: [],
    waived: [],
    stale: [],
    suppressed: 0,
  };

  const malformedWaivers = validateAllowlist(allowlist);
  if (malformedWaivers.length > 0) {
    return { ...empty, malformedWaivers };
  }

  const expired = allowlist.filter((entry) => entry.expires < today);
  if (expired.length > 0) {
    return { ...empty, expired };
  }

  const allowed = new Set(allowlist.map((entry) => entry.id));
  const invalid = [];
  const unresolved = [];
  const blocking = new Map();
  const waived = new Map();
  const seenRoots = new Set();
  let suppressed = 0;

  for (const [name, entry] of Object.entries(vulnerabilities)) {
    if (!isPlainObject(entry)) {
      invalid.push({ name, problem: `entry is ${describe(entry)}, expected an object` });
      continue;
    }
    if (typeof entry.severity !== 'string' || !KNOWN_SEVERITIES.has(entry.severity)) {
      invalid.push({
        name,
        problem: `unrecognised severity ${JSON.stringify(entry.severity)}`,
      });
      continue;
    }
    if (!GATED_SEVERITIES.has(entry.severity)) continue;

    const { roots, problems } = resolveFindingRoots(vulnerabilities, name);
    for (const id of roots.keys()) seenRoots.add(id);

    if (problems.length > 0) {
      unresolved.push({ name, problems });
      continue;
    }

    const gatedRoots = [...roots.values()].filter((root) => GATED_SEVERITIES.has(root.severity));
    if (gatedRoots.length === 0) {
      unresolved.push({ name, problems: ['no high or critical root advisory explains this finding'] });
      continue;
    }

    const unwaived = gatedRoots.filter((root) => !allowed.has(root.id));
    if (unwaived.length > 0) {
      for (const root of unwaived) blocking.set(root.id, root);
      continue;
    }

    for (const root of gatedRoots) waived.set(root.id, root);
    suppressed += 1;
  }

  return {
    ok: invalid.length === 0 && unresolved.length === 0 && blocking.size === 0,
    malformedWaivers: [],
    expired: [],
    invalid,
    unresolved,
    blocking: [...blocking.values()],
    waived: [...waived.values()],
    stale: allowlist.filter((entry) => !seenRoots.has(entry.id)),
    suppressed,
  };
}

const npmAudit = () =>
  execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

export function runAudit(exec = npmAudit) {
  try {
    return { ok: true, stdout: exec() };
  } catch (err) {
    // npm exits nonzero whenever findings exist; that run still produced a real report.
    if (typeof err.stdout === 'string' && err.stdout.length > 0) return { ok: true, stdout: err.stdout };
    return { ok: false, detail: err.code ? `${err.code}: ${err.message}` : err.message };
  }
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function main() {
  const today = new Date().toISOString().slice(0, 10);

  const audit = runAudit();
  if (!audit.ok) {
    fail(`\`npm audit --json\` could not be run: ${audit.detail}`);
  }

  const parsed = parseAuditReport(audit.stdout);
  if (!parsed.ok) {
    fail(`\`npm audit --json\` did not return a usable report (${parsed.kind}): ${parsed.detail}`);
  }

  const result = evaluateAudit({ vulnerabilities: parsed.vulnerabilities, today });

  for (const problem of result.malformedWaivers) {
    console.error(`  ${problem}`);
  }
  if (result.malformedWaivers.length > 0) {
    fail(
      `${result.malformedWaivers.length} malformed waiver(s) in ALLOWLIST. Every entry needs a ` +
        `GHSA identifier and a real YYYY-MM-DD expiry, or it cannot be time-boxed.`
    );
  }

  for (const entry of result.expired) {
    console.error(`  ${entry.id} — waiver expired ${entry.expires}`);
  }
  if (result.expired.length > 0) {
    fail(
      `${result.expired.length} audit waiver(s) expired. Re-evaluate: fix the advisory, or ` +
        `renew the entry in scripts/ci/audit-with-allowlist.mjs with fresh rationale.`
    );
  }

  for (const root of result.waived) {
    console.log(`• waived ${root.id} (${root.severity}) — ${root.name}: ${root.title}`);
  }
  for (const entry of result.stale) {
    console.log(`• stale waiver ${entry.id} — no longer reported, safe to delete`);
  }

  for (const finding of result.invalid) {
    console.error(`  ${finding.name} — ${finding.problem}`);
  }
  for (const finding of result.unresolved) {
    console.error(`  ${finding.name} — ${finding.problems.join('; ')}`);
  }
  for (const root of result.blocking) {
    console.error(`  ${root.id} (${root.severity}) — ${root.name}: ${root.title}`);
  }

  if (result.invalid.length > 0) {
    fail(
      `${result.invalid.length} entry(ies) in the audit report could not be interpreted. ` +
        `Run \`npm audit\` directly — do not trust this gate until resolved.`
    );
  }
  if (result.unresolved.length > 0) {
    fail(
      `${result.unresolved.length} high/critical finding(s) could not be traced to a root ` +
        `advisory. Run \`npm audit\` directly — do not trust this gate until resolved.`
    );
  }
  if (result.blocking.length > 0) {
    fail(
      `${result.blocking.length} un-waived high/critical advisory(ies). Fix them, or add a ` +
        `justified, dated entry to ALLOWLIST in scripts/ci/audit-with-allowlist.mjs.`
    );
  }

  console.log(`\n✔ No un-waived high/critical advisories (${result.waived.length} waived, ${result.suppressed} finding(s) suppressed).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

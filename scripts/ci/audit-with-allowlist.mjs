#!/usr/bin/env node
// Replaces `npm audit --audit-level=high`, which can only be satisfied by fixing an
// advisory or lowering the threshold for everything. Keeps the threshold and narrows
// the waiver to named advisories, so an unrelated high finding still fails the build.
//
// Every unrecognised condition blocks. A gate that cannot explain what it is looking at
// has no basis for passing.
//
// Two modes. Without --base-ref it evaluates the whole installed tree and blocks on every
// un-waived high/critical advisory; --report <path> additionally writes that result as JSON.
// With --base-ref <ref> it evaluates the tree at the merge base of that ref and --head-ref
// (default HEAD) and blocks only on advisories the change introduces. Exit 0 pass, 1 gate
// failure, 2 usage error.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const ALLOWLIST = [];

const GATED_SEVERITIES = new Set(['high', 'critical']);
// Ordering only. A higher rank at the head than at the merge base is an introduction,
// because the change moved the advisory into (or further into) the gated band.
export const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
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

// Classifies every gated finding in one report without consulting waivers. Both lanes walk
// the tree the same way; only the full-tree lane pairs the result with waiver validity.
export function scanAdvisories(vulnerabilities) {
  const invalid = [];
  const unresolved = [];
  const findings = [];
  const roots = new Map();
  const seenRoots = new Set();

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

    const { roots: found, problems } = resolveFindingRoots(vulnerabilities, name);
    for (const id of found.keys()) seenRoots.add(id);

    if (problems.length > 0) {
      unresolved.push({ name, problems });
      continue;
    }

    const gatedRoots = [...found.values()].filter((root) => GATED_SEVERITIES.has(root.severity));
    if (gatedRoots.length === 0) {
      unresolved.push({ name, problems: ['no high or critical root advisory explains this finding'] });
      continue;
    }

    findings.push({ name, gatedRoots });
    for (const root of gatedRoots) {
      // npm lists one advisory under every package it reaches; the delta compares its
      // worst reported rank so a re-rating cannot hide behind a lower duplicate.
      const known = roots.get(root.id);
      if (known === undefined || SEVERITY_RANK[root.severity] > SEVERITY_RANK[known.severity]) {
        roots.set(root.id, root);
      }
    }
  }

  return { invalid, unresolved, findings, roots, seenRoots };
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
  const { invalid, unresolved, findings, seenRoots } = scanAdvisories(vulnerabilities);
  const blocking = new Map();
  const waived = new Map();
  let suppressed = 0;

  for (const { gatedRoots } of findings) {
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

// One side of the comparison. Anything short of a usable report is a failure, never a
// baseline of zero findings — a merge base that read as empty would pass the whole head tree.
function evaluateSide(evaluation) {
  if (!isPlainObject(evaluation) || evaluation.ok !== true) {
    const kind = isPlainObject(evaluation) && typeof evaluation.kind === 'string' ? evaluation.kind : 'unknown';
    const detail =
      isPlainObject(evaluation) && evaluation.detail !== undefined
        ? String(evaluation.detail)
        : 'no report was produced';
    return { ok: false, failure: { kind, detail }, invalid: [], unresolved: [], roots: new Map() };
  }

  const { invalid, unresolved, roots } = scanAdvisories(evaluation.vulnerabilities);
  return {
    ok: invalid.length === 0 && unresolved.length === 0,
    failure: null,
    invalid,
    unresolved,
    roots,
  };
}

const publicSide = ({ ok, failure, invalid, unresolved }) => ({ ok, failure, invalid, unresolved });

// Waiver validity is consulted here and nowhere else in this lane: an expired or malformed
// waiver on an advisory the change did not introduce must not block an unrelated author.
export function evaluateDelta({ base, head, allowlist = ALLOWLIST, today }) {
  const baseSide = evaluateSide(base);
  const headSide = evaluateSide(head);

  const introduced = [];
  const inherited = [];

  if (baseSide.ok && headSide.ok) {
    for (const root of headSide.roots.values()) {
      const atBase = baseSide.roots.get(root.id);
      if (atBase === undefined) {
        introduced.push({ ...root, baseSeverity: null });
      } else if (SEVERITY_RANK[root.severity] > SEVERITY_RANK[atBase.severity]) {
        introduced.push({ ...root, baseSeverity: atBase.severity });
      } else {
        inherited.push({ ...root, baseSeverity: atBase.severity });
      }
    }
  }

  const blocking = [];
  const waived = [];
  const expired = [];
  const malformedWaivers = [];

  for (const root of introduced) {
    const waiver = allowlist.find((entry) => isPlainObject(entry) && entry.id === root.id);
    if (waiver === undefined) {
      blocking.push(root);
      continue;
    }

    const problems = validateAllowlist([waiver]);
    if (problems.length > 0) {
      malformedWaivers.push(...problems);
      blocking.push(root);
      continue;
    }
    if (waiver.expires < today) {
      expired.push(waiver);
      blocking.push(root);
      continue;
    }

    waived.push(root);
  }

  return {
    ok: baseSide.ok && headSide.ok && blocking.length === 0,
    base: publicSide(baseSide),
    head: publicSide(headSide),
    introduced,
    inherited,
    blocking,
    waived,
    expired,
    malformedWaivers: [...new Set(malformedWaivers)],
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

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

export function mergeBaseOf(baseRef, headRef, exec = git) {
  return exec(['merge-base', baseRef, headRef]).trim();
}

// `npm audit --package-lock-only` resolves the tree from the lockfile alone, so a commit
// that is not checked out can be audited without installing it.
function auditTreeAt(ref) {
  let dir;
  try {
    try {
      dir = mkdtempSync(join(tmpdir(), 'audit-tree-'));
      for (const file of ['package.json', 'package-lock.json']) {
        writeFileSync(join(dir, file), git(['show', `${ref}:${file}`]));
      }
    } catch (err) {
      return { ok: false, kind: 'scanner', detail: `could not read the manifest at ${ref}: ${err.message}` };
    }

    const audit = runAudit(() =>
      execFileSync('npm', ['audit', '--json', '--package-lock-only', '--prefix', dir], {
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      })
    );
    if (!audit.ok) return { ok: false, kind: 'scanner', detail: audit.detail };
    return parseAuditReport(audit.stdout);
  } finally {
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  }
}

export function parseArgs(argv) {
  const options = { baseRef: null, headRef: 'HEAD', report: null };

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!Object.hasOwn({ '--base-ref': 0, '--head-ref': 0, '--report': 0 }, flag)) {
      throw new Error(`unknown argument ${JSON.stringify(flag)}`);
    }
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${flag} requires a value`);
    }
    i += 1;
    if (flag === '--base-ref') options.baseRef = value;
    else if (flag === '--head-ref') options.headRef = value;
    else options.report = value;
  }

  if (options.report !== null && options.baseRef !== null) {
    throw new Error('--report describes a full-tree run and cannot be combined with --base-ref');
  }
  return options;
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function writeReport(path, payload) {
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`• report written to ${path}`);
}

function reportSideProblems(label, side) {
  if (side.failure !== null) {
    console.error(`  ${label} evaluation failed (${side.failure.kind}): ${side.failure.detail}`);
  }
  for (const finding of side.invalid) {
    console.error(`  ${label}: ${finding.name} — ${finding.problem}`);
  }
  for (const finding of side.unresolved) {
    console.error(`  ${label}: ${finding.name} — ${finding.problems.join('; ')}`);
  }
}

function runDeltaGate({ baseRef, headRef }, today) {
  let mergeBase;
  try {
    mergeBase = mergeBaseOf(baseRef, headRef);
  } catch (err) {
    fail(`could not resolve the merge base of ${baseRef} and ${headRef}: ${err.message}`);
  }
  if (!mergeBase) {
    fail(`${baseRef} and ${headRef} have no merge base, so there is no baseline to compare against.`);
  }

  const result = evaluateDelta({
    base: auditTreeAt(mergeBase),
    head: auditTreeAt(headRef),
    today,
  });

  console.log(`Comparing ${headRef} against merge base ${mergeBase} (${baseRef}).`);
  for (const root of result.inherited) {
    console.log(`• inherited ${root.id} (${root.severity}) — ${root.name}: ${root.title}`);
  }
  for (const root of result.waived) {
    console.log(`• waived ${root.id} (${root.severity}) — ${root.name}: ${root.title}`);
  }

  reportSideProblems('merge base', result.base);
  reportSideProblems('head', result.head);
  if (!result.base.ok || !result.head.ok) {
    fail(
      'the dependency tree could not be evaluated on both sides of the comparison. ' +
        'Run `npm audit` directly — do not trust this gate until resolved.'
    );
  }

  for (const problem of result.malformedWaivers) {
    console.error(`  ${problem}`);
  }
  for (const entry of result.expired) {
    console.error(`  ${entry.id} — waiver expired ${entry.expires}`);
  }
  for (const root of result.blocking) {
    const origin =
      root.baseSeverity === null
        ? 'absent at the merge base'
        : `re-rated up from ${root.baseSeverity} at the merge base`;
    console.error(
      `  ${root.id} (${root.severity}) — ${root.name}: ${root.title} — new relative to the merge base (${origin})`
    );
  }

  if (result.blocking.length > 0) {
    fail(
      `${result.blocking.length} high/critical advisory(ies) new relative to the merge base. ` +
        `This change introduced them: fix them, or add a justified, dated entry to ALLOWLIST ` +
        `in scripts/ci/audit-with-allowlist.mjs. Advisories already present at the merge base ` +
        `do not block and are not listed above.`
    );
  }

  console.log(
    `\n✔ No high/critical advisories introduced relative to merge base ${mergeBase} ` +
      `(${result.inherited.length} inherited, ${result.waived.length} waived).`
  );
}

function runFullGate({ report }, today) {
  const audit = runAudit();
  if (!audit.ok) {
    if (report !== null) writeReport(report, { mode: 'full-tree', ok: false, failure: { kind: 'scanner', detail: audit.detail } });
    fail(`\`npm audit --json\` could not be run: ${audit.detail}`);
  }

  const parsed = parseAuditReport(audit.stdout);
  if (!parsed.ok) {
    if (report !== null) writeReport(report, { mode: 'full-tree', ok: false, failure: { kind: parsed.kind, detail: parsed.detail } });
    fail(`\`npm audit --json\` did not return a usable report (${parsed.kind}): ${parsed.detail}`);
  }

  const result = evaluateAudit({ vulnerabilities: parsed.vulnerabilities, today });

  if (report !== null) {
    writeReport(report, {
      mode: 'full-tree',
      generatedAt: today,
      ok: result.ok,
      failure: null,
      blocking: result.blocking,
      waived: result.waived,
      stale: result.stale,
      expired: result.expired,
      malformedWaivers: result.malformedWaivers,
      invalid: result.invalid,
      unresolved: result.unresolved,
      suppressed: result.suppressed,
    });
  }

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

function main() {
  const today = new Date().toISOString().slice(0, 10);

  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`\n✖ ${err.message}`);
    console.error(
      'Usage: audit-with-allowlist.mjs [--base-ref <ref> [--head-ref <ref>]] [--report <path>]'
    );
    process.exit(2);
  }

  if (options.baseRef !== null) runDeltaGate(options, today);
  else runFullGate(options, today);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

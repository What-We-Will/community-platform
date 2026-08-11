#!/usr/bin/env node
// Turns a full-tree `audit-with-allowlist.mjs --report <path>` report into owned,
// deduplicated GitHub issues. One issue per advisory id, found via a stable marker in
// the issue body rather than free-text title matching, so renaming a title never breaks
// dedup. See docs/adr/0012-dependency-risk-control-lanes.md for the policy this encodes.
//
// This script never fails on findings — findings recorded as issues is a successful run.
// It fails only when it cannot record what it found: the report is missing/unusable, or
// a GitHub API call (create/comment/reopen/close/assign) errors.
import { readFileSync, existsSync } from 'node:fs';

const ADR_PATH = 'docs/adr/0012-dependency-risk-control-lanes.md';
// Single source of truth for the tracking label. Discovery (fetchExistingIssues) is
// entirely dependent on this label sticking — an issue that lost it is unreachable by
// the search that finds "existing tracked issues" and would look, from here, exactly
// like a finding nobody has filed yet. The defense is not wider discovery (a second
// full-repo search would only rediscover the same unreachable-by-definition issue); it
// is never letting create/update/reopen return without the label applied.
export const LABEL = 'dependency-monitoring';
const ADVISORY_ID = /GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/i;
const MARKER_PREFIX = '<!-- dependency-monitoring:';
// Single source of truth for the required assignee. planActions and the executor must
// both compare against this — a divergence between them is exactly how an issue silently
// stays unassigned (see ADR-0012's "not allowed to look green" invariant).
export const EXPECTED_ASSIGNEE = 'tonyrosario';

function isAssignedToOwner(assignees) {
  return (assignees ?? []).includes(EXPECTED_ASSIGNEE);
}

function isLabeled(labels) {
  return (labels ?? []).includes(LABEL);
}

export function markerFor(id) {
  return `${MARKER_PREFIX}id=${id} -->`;
}

export function severityMarkerFor(severity) {
  return `${MARKER_PREFIX}severity=${severity} -->`;
}

export function extractAdvisoryId(text) {
  const match = ADVISORY_ID.exec(text ?? '');
  return match ? match[0] : null;
}

// Waiver problems are reported as free-text strings by validateAllowlist(), not
// structured objects — see scripts/ci/audit-with-allowlist.mjs. The advisory id, when
// the entry had a well-formed one, is always the leading token before " — ".
export function extractAdvisoryIdFromWaiverMessage(message) {
  return extractAdvisoryId(message.split(' — ')[0]);
}

export function buildIssueTitle({ id, name }) {
  return `[${id}] ${name} — dependency advisory`;
}

export function buildIssueBody({ id, severity, name, title, today = '', note = '' }) {
  const dispositionWindow = severity === 'critical'
    ? 'before the next production deploy'
    : 'within two production deploys';

  const lines = [
    `**Advisory:** ${id}`,
    `**Severity:** ${severity}`,
    `**Package:** \`${name}\``,
    `**Title:** ${title}`,
    '',
    `A ${severity} finding must reach a disposition — fixed, or waived with rationale and ` +
      `expiry in \`scripts/ci/audit-with-allowlist.mjs\` — ${dispositionWindow}.`,
    '',
    `Filed by the scheduled dependency-monitoring workflow. Policy: [ADR-0012](../blob/main/${ADR_PATH}).`,
  ];
  if (note) lines.push('', note);
  if (today) lines.push('', `_Last seen: ${today}_`);
  lines.push('', markerFor(id), severityMarkerFor(severity));
  return lines.join('\n');
}

// Pure planning: given the audit report and the currently-tracked issues (any state,
// keyed by advisory id from their body marker), decide what to do. No network I/O here
// so this is fully unit-testable.
export function planActions({ report, existingIssues }) {
  const creates = [];
  const updates = [];
  const reopens = [];
  const closes = [];
  const warnings = [];

  const degraded = report.malformedWaivers.length > 0 || report.expired.length > 0;

  // Ownership enforcement never waits for a clean signal: any action that already
  // touches an issue (update, reopen, or create) also re-asserts EXPECTED_ASSIGNEE and
  // LABEL, so a note built here always says so when either has drifted. This is what
  // stops a single transient assignment/label failure from persisting past the run that
  // caused it — the next run that finds the same issue still open re-checks both, not
  // just the severity marker.
  function withRepairNote(existing, baseNote) {
    const reassign = !isAssignedToOwner(existing.assignees);
    const relabel = !isLabeled(existing.labels);
    if (!reassign && !relabel) return { note: baseNote, reassign, relabel };
    const parts = [baseNote].filter(Boolean);
    if (reassign) {
      const current = (existing.assignees ?? []).length > 0 ? existing.assignees.join(', ') : 'none';
      parts.push(`Assignee is not ${EXPECTED_ASSIGNEE} (current: ${current}); reassigning.`);
    }
    if (relabel) {
      const current = (existing.labels ?? []).length > 0 ? existing.labels.join(', ') : 'none';
      parts.push(`Missing label ${LABEL} (current: ${current}); reapplying.`);
    }
    return { note: parts.join(' '), reassign, relabel };
  }

  if (degraded) {
    for (const entry of report.expired) {
      const existing = existingIssues.get(entry.id);
      const baseNote = `Waiver expired ${entry.expires}; this advisory is no longer waived and needs a fresh disposition.`;
      if (existing) {
        const { note, reassign, relabel } = withRepairNote(existing, baseNote);
        if (existing.state === 'closed') reopens.push({ id: entry.id, issue: existing, note, reassign, relabel });
        else updates.push({ id: entry.id, issue: existing, note, reassign, relabel });
      } else {
        warnings.push(`expired waiver on ${entry.id}, but no tracked issue exists for it yet — will be filed once it reappears in a full scan`);
      }
    }
    for (const message of report.malformedWaivers) {
      const id = extractAdvisoryIdFromWaiverMessage(message);
      if (!id) {
        warnings.push(`malformed waiver entry could not be traced to an advisory id: ${message}`);
        continue;
      }
      const existing = existingIssues.get(id);
      const baseNote = `Waiver entry is malformed (${message}); this advisory cannot be time-boxed until it is fixed.`;
      if (existing) {
        const { note, reassign, relabel } = withRepairNote(existing, baseNote);
        if (existing.state === 'closed') reopens.push({ id, issue: existing, note, reassign, relabel });
        else updates.push({ id, issue: existing, note, reassign, relabel });
      } else {
        warnings.push(`malformed waiver on ${id}, but no tracked issue exists for it yet — will be filed once it reappears in a full scan`);
      }
    }
    // blocking[] is empty on a degraded report (evaluateAudit returns early), so it is
    // not a real "nothing is blocking" result — stale-closing is skipped this run rather
    // than closing issues based on an incomplete view.
    return { creates, updates, reopens, closes, warnings, degraded };
  }

  const currentIds = new Set();
  for (const finding of report.blocking) {
    currentIds.add(finding.id);
    const existing = existingIssues.get(finding.id);
    if (!existing) {
      creates.push({ id: finding.id, finding });
      continue;
    }
    if (existing.state === 'closed') {
      const { note, reassign, relabel } = withRepairNote(existing, 'Reappeared in the scheduled full-tree audit.');
      reopens.push({ id: finding.id, issue: existing, finding, note, reassign, relabel });
      continue;
    }
    const previousSeverity = parseSeverityMarker(existing.body);
    const severityChanged = previousSeverity !== finding.severity;
    const assigneeOk = isAssignedToOwner(existing.assignees);
    const labelOk = isLabeled(existing.labels);
    if (severityChanged || !assigneeOk || !labelOk) {
      const baseNote = severityChanged ? `Severity changed: ${previousSeverity ?? 'unknown'} → ${finding.severity}.` : '';
      const { note, reassign, relabel } = withRepairNote(existing, baseNote);
      updates.push({ id: finding.id, issue: existing, finding, note, reassign, relabel });
    }
    // Unchanged severity, correct assignee, and correct label, still open: nothing to
    // do — avoids a daily comment for every finding that has not moved or drifted.
  }

  for (const [id, issue] of existingIssues) {
    if (issue.state === 'open' && !currentIds.has(id)) {
      closes.push({ id, issue });
    }
  }

  return { creates, updates, reopens, closes, warnings, degraded };
}

export function parseSeverityMarker(body) {
  const match = /dependency-monitoring:severity=([a-z]+) -->/.exec(body ?? '');
  return match ? match[1] : null;
}

// --- GitHub I/O ---

function githubApiBase() {
  return process.env.GITHUB_API_URL || 'https://api.github.com';
}

async function githubRequest(path, init = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  const res = await fetch(`${githubApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '<no body>');
    throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status} ${res.statusText} — ${detail}`);
  }
  return res.status === 204 ? null : res.json();
}

async function fetchExistingIssues(repo) {
  const existing = new Map();
  let page = 1;
  for (;;) {
    const q = encodeURIComponent(`repo:${repo} label:${LABEL} is:issue`);
    const data = await githubRequest(`/search/issues?q=${q}&per_page=100&page=${page}`);
    for (const issue of data.items) {
      const id = extractAdvisoryId(issue.body) ?? extractAdvisoryId(issue.title);
      if (!id) continue;
      existing.set(id, {
        number: issue.number,
        state: issue.state,
        body: issue.body ?? '',
        title: issue.title,
        assignees: (issue.assignees ?? []).map((a) => a.login),
        // Cheap discovery widening: the search query already filters on label:LABEL,
        // but recording what GitHub actually returned (rather than assuming the filter
        // guarantees it) lets planActions catch a labeling problem on an issue the
        // search still surfaced, without a second full-repo call.
        labels: (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name)),
      });
    }
    if (data.items.length < 100) break;
    page += 1;
  }
  return existing;
}

export function assertAssigned(issue, id, action) {
  const assigned = (issue.assignees ?? []).some((a) => a.login === EXPECTED_ASSIGNEE);
  if (!assigned) {
    throw new Error(`${action} issue #${issue.number} for ${id} but assignee ${EXPECTED_ASSIGNEE} was not applied`);
  }
}

export function assertLabeled(issue, id, action) {
  const labeled = (issue.labels ?? []).some((l) => (typeof l === 'string' ? l : l.name) === LABEL);
  if (!labeled) {
    throw new Error(`${action} issue #${issue.number} for ${id} but label ${LABEL} was not applied`);
  }
}

async function createIssue(repo, { id, finding, today }) {
  const [owner, name] = repo.split('/');
  const body = buildIssueBody({ ...finding, today });
  const issue = await githubRequest(`/repos/${owner}/${name}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: buildIssueTitle(finding),
      body,
      labels: [LABEL],
      assignees: [EXPECTED_ASSIGNEE],
    }),
  });
  assertAssigned(issue, id, 'created');
  assertLabeled(issue, id, 'created');
  return issue.number;
}

// Every touch — update, reopen, or the reassign/relabel-only case where severity did not
// move — re-asserts both the assignee and the label. This is what closes the finding: a
// transient assignment or labeling failure on one run is repaired the next time this
// issue is touched, rather than silently surviving because planActions only re-checked
// severity. (A tracked issue that lost the label entirely is unreachable by the
// label-scoped search that builds `existingIssues` in the first place — the only defense
// against that case is never letting the label fail to stick here.)
async function commentAndMaybeReopen(repo, { id, issue, note, finding, reopen }) {
  const [owner, name] = repo.split('/');
  if (finding) {
    await githubRequest(`/repos/${owner}/${name}/issues/${issue.number}`, {
      method: 'PATCH',
      body: JSON.stringify({ body: buildIssueBody({ ...finding, note }) }),
    });
  }
  await githubRequest(`/repos/${owner}/${name}/issues/${issue.number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: note }),
  });
  const updated = await githubRequest(`/repos/${owner}/${name}/issues/${issue.number}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...(reopen ? { state: 'open' } : {}), assignees: [EXPECTED_ASSIGNEE], labels: [LABEL] }),
  });
  assertAssigned(updated, id, reopen ? 'reopened' : 'updated');
  assertLabeled(updated, id, reopen ? 'reopened' : 'updated');
}

async function closeIssue(repo, { issue }) {
  const [owner, name] = repo.split('/');
  await githubRequest(`/repos/${owner}/${name}/issues/${issue.number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: `No longer reported by the scheduled dependency audit as of ${new Date().toISOString().slice(0, 10)}.` }),
  });
  await githubRequest(`/repos/${owner}/${name}/issues/${issue.number}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
  });
}

async function main() {
  const reportPathIndex = process.argv.indexOf('--report');
  const reportPath = reportPathIndex >= 0 ? process.argv[reportPathIndex + 1] : null;
  if (!reportPath) {
    console.error('Usage: dependency-monitoring-issues.mjs --report <path>');
    process.exit(2);
  }

  if (!existsSync(reportPath)) {
    console.error(`✖ ${reportPath} does not exist — audit-with-allowlist.mjs did not produce a report, treating as a mechanical failure.`);
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch (err) {
    console.error(`✖ ${reportPath} is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  if (report.mode !== 'full-tree') {
    console.error(`✖ ${reportPath} is not a full-tree report (mode=${report.mode})`);
    process.exit(1);
  }

  if (report.failure) {
    console.error(`✖ audit scanner/parse failure (${report.failure.kind}): ${report.failure.detail} — cannot determine findings this run.`);
    process.exit(1);
  }

  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    console.error('✖ GITHUB_REPOSITORY is not set');
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  let existingIssues;
  try {
    existingIssues = await fetchExistingIssues(repo);
  } catch (err) {
    console.error(`✖ could not list existing dependency-monitoring issues: ${err.message}`);
    process.exit(1);
  }

  const plan = planActions({ report, existingIssues, today });

  let errored = false;

  for (const create of plan.creates) {
    try {
      const number = await createIssue(repo, { ...create, today });
      console.log(`• filed #${number} for ${create.id}`);
    } catch (err) {
      console.error(`✖ could not file an issue for ${create.id}: ${err.message}`);
      errored = true;
    }
  }

  for (const update of plan.updates) {
    try {
      await commentAndMaybeReopen(repo, { ...update, reopen: false });
      console.log(`• updated #${update.issue.number} for ${update.id}`);
    } catch (err) {
      console.error(`✖ could not update issue #${update.issue.number} for ${update.id}: ${err.message}`);
      errored = true;
    }
  }

  for (const reopen of plan.reopens) {
    try {
      await commentAndMaybeReopen(repo, { ...reopen, reopen: true });
      console.log(`• reopened #${reopen.issue.number} for ${reopen.id}`);
    } catch (err) {
      console.error(`✖ could not reopen issue #${reopen.issue.number} for ${reopen.id}: ${err.message}`);
      errored = true;
    }
  }

  for (const close of plan.closes) {
    try {
      await closeIssue(repo, close);
      console.log(`• closed #${close.issue.number} for ${close.id} (no longer reported)`);
    } catch (err) {
      console.error(`✖ could not close issue #${close.issue.number} for ${close.id}: ${err.message}`);
      errored = true;
    }
  }

  for (const warning of plan.warnings) {
    console.warn(`⚠ ${warning}`);
  }

  console.log(
    `\nSummary: ${plan.creates.length} filed, ${plan.updates.length} updated, ` +
      `${plan.reopens.length} reopened, ${plan.closes.length} closed` +
      (plan.degraded ? ' (degraded report: full blocking set unknown, stale-closing skipped)' : '') +
      '.'
  );

  if (errored) {
    console.error('\n✖ One or more GitHub API calls failed — this run cannot be trusted to have recorded every finding.');
    process.exit(1);
  }
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

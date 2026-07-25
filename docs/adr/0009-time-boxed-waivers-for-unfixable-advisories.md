# ADR-0009 — Time-boxed waivers for unfixable advisories

**Status:** Accepted 2026-07-25
**TL;DR:** The blocking `npm audit` step from ADR-0003 now fails on un-waived high/critical advisories rather than on any high/critical advisory; a waiver names one advisory, carries a written rationale and an expiry date, and fails the build once expired.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

ADR-0003 established `npm ci --ignore-scripts && npm audit --audit-level=high` as a blocking step in the `security-scan` job and records it as a required check on `main`. The step had exactly two outcomes: no high or critical advisory anywhere in the dependency tree, or no merges.

At the time of this decision, the tree contained `brace-expansion` 1.1.16, 2.1.2, and 5.0.7. GHSA-mh99-v99m-4gvg concerns denial of service through unbounded expansion. A forced `5.0.8` override was explored, but no reproducible trial record was retained; this ADR therefore makes no claim about its compatibility outcome. `eslint@10` was deliberately deferred as a breaking major upgrade, not trialled as a remediation, and this ADR makes no claim that it would resolve the advisory or preserve lint. The [ESLint v10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0) documents the breaking changes that require a planned migration. A compatible remediation is still required to remove the advisory from the audited tree.

The affected installed paths are rooted in top-level `devDependencies` — `eslint`, `eslint-config-next`, `@vitest/eslint-plugin`, and `shadcn`. That lowers the production concern, but does not prove that the package is unreachable in production or make attacker-controlled input in CI and development tooling harmless. The relevant use case is hostile glob input processed by lint tooling. Meanwhile the gate stayed red on `main`, blocking every merge including unrelated feature work.

This situation will recur, but a manual exception is not the general solution: a newly disclosed high advisory in another unchanged dependency would still block unrelated PRs until somebody makes a fresh risk decision. ADR-0003 left no way to express the present exception. This ADR therefore makes a bounded, transitional decision for this advisory while preserving the need for a target-state dependency-risk workflow.

## Decision

We will keep ADR-0003's blocking pre-merge audit and its high/critical threshold, and change what the step gates on: un-waived advisories rather than all advisories. This is a transitional exception control, not the target-state answer to dependency-risk ownership. `scripts/ci/audit-with-allowlist.mjs` replaces the bare `npm audit --audit-level=high` invocation in `preview.yml`.

A waiver names a single advisory identifier and carries a written rationale and an expiry date. Three properties make it an exception rather than an erosion:

**Waivers are scoped to an advisory, not a package or a severity.** A different advisory against the same package still blocks. Suppression is keyed to the root advisories in `npm audit --json`, so waiving a root waives the findings it explains and nothing else.

**Expiry is enforced, not documented.** A waiver is valid through its expiry date and fails the build from the following UTC date, naming itself, which forces a fresh decision — renew with current rationale, or fix. An exception cannot become permanent by neglect, which is the failure mode the existing `overrides` entries already exhibit: `sharp` and `postcss` are both recorded as temporary, and nothing surfaces when they become droppable. Waiver metadata is validated before any of it is trusted: an entry needs a well-formed advisory identifier and a real calendar date, because an unusable expiry never compares as past and would otherwise grant a silent permanent exemption.

**The gate fails closed on audit conditions relevant to its decision that it does not model.** An unrecognised report is not evidence of safety, so the build fails on output that cannot be parsed, on the valid JSON envelope npm emits to report its own failures, on a report missing its vulnerabilities map or carrying one of the wrong shape, and — distinctly — when the scanner could not be run at all. Within a report, each gated finding must trace through its own dependency chain to a root advisory; a chain that dead-ends, loops, or names something absent blocks, and such a finding is never counted among those the gate claims to have accounted for. Entries whose shape or severity are unrecognised block rather than being skipped, and severities are matched exactly rather than normalised, so a value the report never stated cannot decide the outcome.

An advisory that disappears from the report is announced as a stale waiver rather than failing, so an upstream fix never breaks the build.

GHSA-mh99-v99m-4gvg is waived until 2026-10-23. On any CI run where its high/critical root advisory no longer appears, the gate reports a stale waiver; that signal does not establish why the advisory disappeared. The expiry date is the backstop if the waiver has not been removed by then.

The Sponsoring Lead owns re-evaluation of this waiver. Renewal requires a reviewed PR containing a fresh rationale, expiry date, and current compatibility evidence; deletion is required when the advisory is no longer reported.

This revises one element of ADR-0003's Decision — the audit step — and leaves the rest of that ADR in force: gitleaks, the hidden-character scanner, the required-check configuration, and the entire workflow-hardening baseline are unchanged. ADR-0003 carries a reciprocal metadata link so readers of either record can find this boundary.

## Alternatives considered

**Lower the gate to `--audit-level=critical`.** A small threshold change, immediately unblocking. Rejected because it discards the high tier permanently and silently: every future high advisory, including ones with an easy fix and a real production path, would pass unnoticed. It trades a specific known exception for an open-ended unknown one.

**Run `npm audit --omit=dev`.** The simplest way to omit the present advisory from the audit. Rejected because development dependencies execute in CI and other contributor tooling; excluding them would suppress every future development-dependency advisory, rather than recording a bounded decision for this one.

**Pin `brace-expansion` via `overrides`.** The remediation pattern this project already uses for `undici`, `postcss`, and `sharp`. Not adopted: the previous exploration has no retained reproducible compatibility result, and a global API override is too broad to accept without a fresh, reviewed compatibility test and evidence that it resolves the complete audited finding.

**Update only the compatible 5.x paths.** Simpler and lower risk than a forced global override. Not adopted as a complete remediation because this decision did not establish that it removes the complete audited finding. Such partial reduction remains worth reconsidering when dependency constraints change.

**Upgrade to `eslint@10`.** Not adopted in this change. ESLint 10 is a breaking major release and is held for a planned human migration, including configuration and plugin compatibility review; it is not an emergency audit remediation. This ADR makes no claim that the upgrade would resolve the advisory or preserve lint.

**Wait for upstream and leave the gate red.** The most conservative option and briefly tenable, but it blocks all merges on a dependency we do not control. The cost is unbounded and falls entirely on unrelated work.

**Mark the step `continue-on-error: true`.** This is precisely the pre-ADR-0003 configuration that let vulnerable dependencies ship silently, and reintroducing it would undo that ADR's central improvement.

**Waive by package rather than by advisory.** Simpler to write and to read. Rejected because a package with one known-unfixable advisory is not thereby trustworthy for all future advisories; scoping to the identifier keeps the blast radius at one finding.

**Move full-tree auditing out of the required PR path and gate PRs on dependency deltas.** This avoids assigning newly disclosed, inherited vulnerabilities to unrelated PRs while retaining full-tree monitoring on the default branch. It is the target-state direction, but it needs a separate decision covering comparison baselines, scheduled monitoring, ownership, and release policy; this ADR does not silently substitute a waiver for that design.

## Consequences

**Enabled.** Merges proceed while this explicitly accepted advisory is outstanding, without lowering the high/critical threshold for every other advisory. The project gains a repeatable, auditable way to record "we know, here is why, here is when we look again" — previously expressible only as a threshold change or a red build.

**Constrained.** Adding a waiver is a deliberate act requiring a rationale and a date, reviewed like any other change. The gate's guarantee is now conditional: it reads "no un-waived high or critical advisories," and anyone relying on it must read the waiver list to know what that excludes.

**New work.** Every waiver creates a dated obligation to re-evaluate, owned by the Sponsoring Lead. When a waiver expires the build fails until someone decides; this is intended, and it means an expiry landing mid-sprint will block merges until handled. Waivers whose advisories are fixed upstream should be deleted during routine dependency bumps — the gate reports these as stale but will not force the cleanup. Held ESLint major upgrades are reviewed twice yearly, in January and July, rather than by recurring Dependabot PRs.

**Risks.** A waiver is a standing decision to accept a known vulnerability, and the reasoning that justified it can go stale before the expiry date if the dependency's role changes — a devDependency that becomes reachable in production would invalidate the rationale with nothing in CI detecting it. Waiver rationale is prose and is only as good as its author. The gate logic now lives in a repo-tracked script rather than inline in the workflow, so it is subject to the same review discipline as any other code in the repository.

**Contributor workflow change.** A failing audit step now points at `scripts/ci/audit-with-allowlist.mjs` and names the blocking advisory. Contributors must not add a waiver to unblock unrelated work without the rationale and expiry the format requires. A waiver with a mistyped identifier or expiry date fails the gate immediately rather than quietly granting a permanent exemption, so the format is enforced at the point of the mistake rather than discovered months later.

**Boundary.** This waiver resolves one inherited advisory; it does not stop a newly disclosed advisory in another unchanged dependency from blocking an unrelated PR. The target-state decision below is necessary to solve that broader workflow problem.

## Open questions

- **Target-state dependency-risk lanes.** This ADR is transitional. Before this waiver can be renewed beyond 2026-10-23, the Sponsoring Lead must bring a follow-up decision for a dependency-delta PR gate, scheduled or default-branch full-tree monitoring, ownership of inherited findings, and any release policy for unacceptable residual risk.
- **Nothing proactively announces the upstream fix a waiver waits for.** The gate reports a stale waiver once the advisory stops appearing, so the signal exists but only surfaces on the next CI run after someone happens to update the dependency. The Sponsoring Lead must review that signal during dependency-update work; automated prompting remains deferred.
- **Whether the same waiver mechanism should extend to the other two scans** in the `security-scan` job. gitleaks and the hidden-character scanner have their own suppression needs and no equivalent escape hatch; they are out of scope here.

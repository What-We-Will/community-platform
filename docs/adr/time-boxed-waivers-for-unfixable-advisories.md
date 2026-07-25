# Time-boxed waivers for unfixable advisories

**Status:** Draft 2026-07-25
**TL;DR:** The blocking `npm audit` step from ADR-0003 now fails on un-waived high/critical advisories rather than on any high/critical advisory; a waiver names one advisory, carries a written rationale and an expiry date, and fails the build once expired.
**Author:** @tonyrosario
**Sponsoring Lead:** @username

## Context

ADR-0003 established `npm ci --ignore-scripts && npm audit --audit-level=high` as a blocking step in the `security-scan` job, a required check on `main`. The step has exactly two outcomes: no high or critical advisory anywhere in the dependency tree, or no merges.

That binary held until GHSA-mh99-v99m-4gvg was published against `brace-expansion` (denial of service via unbounded expansion). The advisory has no available remediation. Its only patched release, `5.0.8`, changed the package's CommonJS export from a bare function to a namespace object; the `minimatch` 3.x and 9.x consumers in our tree call the module directly, so forcing `5.0.8` through `overrides` makes `eslint` fail outright with `TypeError: expand is not a function`. There is no patched 1.x or 2.x line to fall back to. The upgrade npm itself proposes, `eslint@10`, was trialled: six high findings survive it because the eslint plugins each carry their own `minimatch`, and `eslint-plugin-react` crashes under eslint 10. The `eslint` 9.x maintenance line still pins `minimatch ^3.1.2`. The fix must come from upstream, on a timeline we do not control.

The advisory reaches the tree only through `devDependencies` — `eslint`, `eslint-config-next`, `@vitest/eslint-plugin`, and `shadcn` — and is exploitable only by feeding hostile glob patterns to lint tooling. There is no production code path. Meanwhile the gate stayed red on `main`, blocking every merge including unrelated feature work.

This is the general case, not a one-off: a published advisory with no compatible fix, in a dependency that never reaches production, will recur. ADR-0003 left no way to express it. The available responses were all bad — lower the threshold and stop seeing every future high advisory, force an upgrade that breaks the toolchain, or stop merging indefinitely.

## Decision

We will keep ADR-0003's blocking pre-merge audit and its high/critical threshold, and change what the step gates on: un-waived advisories rather than all advisories. `scripts/ci/audit-with-allowlist.mjs` replaces the bare `npm audit --audit-level=high` invocation in `preview.yml`.

A waiver names a single advisory identifier and carries a written rationale and an expiry date. Three properties make it an exception rather than an erosion:

**Waivers are scoped to an advisory, not a package or a severity.** A different advisory against the same package still blocks. Suppression is keyed to the root advisories in `npm audit --json`, so waiving a root waives the findings it explains and nothing else.

**Expiry is enforced, not documented.** A waiver is valid through its expiry date and fails the build from the following UTC date, naming itself, which forces a fresh decision — renew with current rationale, or fix. An exception cannot become permanent by neglect, which is the failure mode the existing `overrides` entries already exhibit: `sharp` and `postcss` are both recorded as temporary, and nothing surfaces when they become droppable. Waiver metadata is validated before any of it is trusted: an entry needs a well-formed advisory identifier and a real calendar date, because an unusable expiry never compares as past and would otherwise grant a silent permanent exemption.

**The gate fails closed on anything it does not model.** An unrecognised report is not evidence of safety, so the build fails on output that cannot be parsed, on the valid JSON envelope npm emits to report its own failures, on a report missing its vulnerabilities map or carrying one of the wrong shape, and — distinctly — when the scanner could not be run at all. Within a report, each gated finding must trace through its own dependency chain to a root advisory; a chain that dead-ends, loops, or names something absent blocks, and such a finding is never counted among those the gate claims to have accounted for. Entries whose shape or severity are unrecognised block rather than being skipped, and severities are matched exactly rather than normalised, so a value the report never stated cannot decide the outcome.

An advisory that disappears from the report is announced as a stale waiver rather than failing, so an upstream fix never breaks the build.

GHSA-mh99-v99m-4gvg is waived until 2026-10-23. It lifts when the eslint plugin chain moves to a patched `minimatch`; that arrival is visible as a stale-waiver notice on the next CI run after the dependency update, and the expiry date is the backstop if it has not arrived by then.

This revises one element of ADR-0003's Decision — the audit step — and leaves the rest of that ADR in force: gitleaks, the hidden-character scanner, the required-check configuration, and the entire workflow-hardening baseline are unchanged.

## Alternatives considered

**Lower the gate to `--audit-level=critical`.** One character, immediately unblocking. Rejected because it discards the high tier permanently and silently: every future high advisory, including ones with an easy fix and a real production path, would pass unnoticed. It trades a specific known exception for an open-ended unknown one.

**Pin `brace-expansion` via `overrides`.** The remediation pattern this project already uses for `undici`, `postcss`, and `sharp`. Trialled and rejected on evidence — it clears all fifteen findings and breaks `eslint` completely, because the patched release is not API-compatible with the `minimatch` versions in the tree.

**Upgrade to `eslint@10`, as `npm audit fix --force` proposes.** Trialled and rejected: it neither clears the advisory nor preserves a working lint. It would also be a family-major upgrade, which our Dependabot configuration deliberately holds for scheduled human migration rather than automated bumps.

**Wait for upstream and leave the gate red.** The most conservative option and briefly tenable, but it blocks all merges on a dependency we do not control, for an advisory with no production reachability. The cost is unbounded and falls entirely on unrelated work.

**Mark the step `continue-on-error: true`.** This is precisely the pre-ADR-0003 configuration that let vulnerable dependencies ship silently, and reintroducing it would undo that ADR's central improvement.

**Waive by package rather than by advisory.** Simpler to write and to read. Rejected because a package with one known-unfixable advisory is not thereby trustworthy for all future advisories; scoping to the identifier keeps the blast radius at one finding.

## Consequences

**Enabled.** Merges proceed while an unfixable advisory is outstanding, without weakening the gate against anything else. The project gains a repeatable, auditable way to record "we know, here is why, here is when we look again" — previously expressible only as a threshold change or a red build.

**Constrained.** Adding a waiver is a deliberate act requiring a rationale and a date, reviewed like any other change. The gate's guarantee is now conditional: it reads "no un-waived high or critical advisories," and anyone relying on it must read the waiver list to know what that excludes.

**New work.** Every waiver creates a dated obligation to re-evaluate. When a waiver expires the build fails until someone decides; this is intended, and it means an expiry landing mid-sprint will block merges until handled. Waivers whose advisories are fixed upstream should be deleted during routine dependency bumps — the gate reports these as stale but will not force the cleanup.

**Risks.** A waiver is a standing decision to accept a known vulnerability, and the reasoning that justified it can go stale before the expiry date if the dependency's role changes — a devDependency that becomes reachable in production would invalidate the rationale with nothing in CI detecting it. Waiver rationale is prose and is only as good as its author. The gate logic now lives in a repo-tracked script rather than inline in the workflow, so it is subject to the same review discipline as any other code in the repository.

**Contributor workflow change.** A failing audit step now points at `scripts/ci/audit-with-allowlist.mjs` and names the blocking advisory. Contributors must not add a waiver to unblock unrelated work without the rationale and expiry the format requires. A waiver with a mistyped identifier or expiry date fails the gate immediately rather than quietly granting a permanent exemption, so the format is enforced at the point of the mistake rather than discovered months later.

## Open questions

- **The ADR status vocabulary has no way to express partial supersession.** This ADR revises one bullet of ADR-0003's Decision while leaving the rest in force, but the available statuses (`Superseded ... by`) apply to a whole file, and marking ADR-0003 superseded would wrongly retire the hardening baseline and the other two scans. ADR-0003 is therefore left `Accepted`. Whether the convention should gain a partial-supersession status, and how a future reader is expected to notice that one element of an `Accepted` ADR has been revised elsewhere, is unresolved.
- **Nothing proactively announces the upstream fix a waiver waits for.** The gate reports a stale waiver once the advisory stops appearing, so the signal exists but only surfaces on the next CI run after someone happens to update the dependency. Nobody is prompted to go looking. Tying the re-check to the existing Dependabot bump cadence has been suggested for the `overrides` entries and would apply here equally.
- **Whether the same waiver mechanism should extend to the other two scans** in the `security-scan` job. gitleaks and the hidden-character scanner have their own suppression needs and no equivalent escape hatch; they are out of scope here.

# ADR-0012 — Dependency-risk control lanes

**Status:** Accepted 2026-08-11
**TL;DR:** The blocking pre-merge audit changes scope from the whole dependency tree to the advisories a pull request introduces, and the full-tree audit moves to a scheduled run against `main` that files owned, tracked work plus a reporting step at production deploy.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

[ADR-0003](./0003-pre-merge-supply-chain-gate.md) made `npm audit` blocking in the `security-scan` job and a required check on `main`. [ADR-0009](./0009-time-boxed-waivers-for-unfixable-advisories.md) amended what that step gates on — un-waived advisories rather than all advisories — and was explicit that it was transitional. Its Boundary section states that a waiver "does not stop a newly disclosed advisory in another unchanged dependency from blocking an unrelated PR," and its Open questions require a follow-up decision covering PR gating, monitoring, ownership, and release policy before the current waiver can be renewed beyond 2026-10-23. This record is that decision.

The gate evaluates the full dependency tree on every pull request. Because the tree is shared, an advisory disclosed against a package nobody touched is charged to whichever pull requests happen to be open. A 90-day analysis of CI run history (2026-05-08 to 2026-08-06; 324 runs, 605 jobs, 78 failed jobs) measured the effect: the `Audit dependencies` step accounts for **32 of 78 job failures — 41%, the largest single failure class in the repository**. Those 32 failures fall on roughly ten distinct days, which is the signature of fan-out rather than of thirty-two independent problems. On 2026-08-05, eleven failures landed within eighteen minutes across nine unrelated Dependabot pull requests and two unrelated feature branches.

The blocking set also turns over quickly. Within one week the high-severity set moved from `brace-expansion`, `fast-uri`, `ip-address`, and `undici` to `js-yaml`, with no relationship between the packages involved and any pull request in flight. Every one of those advisories reached the tree through the development toolchain — `eslint`, `@eslint/eslintrc`, `shadcn`, `cosmiconfig` — and none of them ships in the production bundle, though they do execute in CI and on contributor machines, which is why ADR-0009 declined to exclude development dependencies wholesale.

Each of those failures was individually resolved. That is the cost, not the mitigation: roughly ten times a quarter, whoever had an open pull request stopped work on it to remediate a dependency they had not touched. A check that is red for reasons unrelated to the change under review teaches contributors to read red as noise, which erodes the value ADR-0003 was created to establish.

## Decision

We will separate dependency risk into three lanes with different triggers, different blocking behaviour, and different owners.

**PR lane — delta-scoped and blocking.** The `Audit dependencies` step evaluates the dependency tree twice: once at the merge base and once at the pull request head. It fails only on advisories the pull request introduces: an advisory whose identifier is absent from the merge-base evaluation, or one whose severity rank at head is higher than its rank at the merge base, so an upward re-rating counts as newly introduced. A downward re-rating is not an introduction and does not block. An advisory whose severity is missing or unrecognised in either evaluation fails closed. Advisories present at the merge base do not block, because the pull request did not cause them.

ADR-0009's fail-closed behaviour applies independently to both evaluations. An unparseable report, a missing or malformed vulnerabilities map, a finding whose dependency chain does not resolve to a root advisory, or a scanner that could not run at all fails the gate. A merge-base evaluation that fails for any of these reasons is never treated as an empty baseline.

Waiver validity is deliberately not on that list. Waivers are consulted at one point only: deciding whether an introduced advisory blocks. An expired or malformed waiver on an advisory already present at the merge base must not fail either evaluation — it is surfaced by the lane that owns the finding, below. The current evaluator fails the entire run on any invalid waiver before examining findings; the delta implementation must scope that check to introduced advisories, because carrying it over unchanged would let one expired waiver on an inherited finding re-block every open pull request — the exact failure this record removes.

**Monitoring lane — scheduled and non-blocking.** A scheduled workflow runs the full-tree audit against `main` and records un-waived high and critical findings as tracked GitHub issues, updating rather than duplicating an existing issue for the same advisory. Issues are assigned to this record's Sponsoring Lead. If filing or assignment fails, the scheduled workflow itself fails — a monitoring lane that cannot record its findings is not allowed to look green. The lane does not gate any merge. A red check nobody is blocked by is the noise this decision exists to remove; durable, assigned work is not.

A monitored finding is bounded by the release cadence rather than a calendar deadline. A critical finding must reach a disposition — fixed, or waived with rationale and expiry — before the next production deploy; a high finding, within two. The release lane's report is the enforcement point: deploying past an undispositioned finding is a visible, deliberate exception recorded in the deploy log, not a silently missed deadline. An expired waiver on a monitored finding reopens or updates its tracked issue and restarts this clock.

**Release lane — reporting at production deploy.** `production.yml` runs the full-tree audit and reports outstanding un-waived findings in the deploy log. It does not block the deploy. Production is `workflow_dispatch`-only at a release cadence of roughly ten days, so a blocking gate here would relocate discovery to the moment of release rather than remove it.

**Exceptions.** ADR-0009's waiver mechanism is retained unchanged in form — advisory-scoped, dated, rationale-bearing, expiry-enforced — but its role narrows. It now applies to a finding a pull request genuinely introduces and the project accepts, or to a monitored finding accepted rather than fixed. It is no longer the mechanism for keeping unrelated work moving, because unrelated work is no longer blocked. Expiry keeps its force through the lane that owns the finding: an expired waiver on an introduced advisory blocks the introducing pull request; an expired waiver on a monitored finding surfaces through the monitoring lane's tracked issue. Neither blocks unrelated work.

The job keeps its name. `security-scan` remains the required check on `main`, so the repository ruleset — a manual, out-of-band setting that ADR-0003 records as a standing fragility — does not change. gitleaks and the hidden-character scanner remain blocking and are untouched.

## Alternatives considered

**Keep the full-tree blocking gate.** The status quo, and the strongest guarantee available: nothing merges while any un-waived high or critical advisory exists anywhere. Rejected on measured cost. It produced 41% of all CI failures over 90 days while, in every observed instance, blocking pull requests that had not introduced the advisory. The guarantee is real but it is not purchased by the pull-request author, and charging it to them does not make it more likely to be paid.

**Run the audit only before production deploy.** Attractive because it stops interrupting day-to-day work outright. Rejected for three reasons. `production.yml` has no audit today, so this removes the only gate rather than relocating one. It eliminates the control on newly introduced risk entirely — a pull request that adds a vulnerable dependency would merge clean. And it concentrates discovery at a `workflow_dispatch` release with a human waiting, several merges deep, which is the worst available moment. ADR-0003 considered production-time audit as defence in depth and declined it; this record adopts it in that role only.

**Mark the step `continue-on-error: true`.** Rejected for the reason ADR-0009 gives: it is precisely the pre-ADR-0003 configuration that let vulnerable dependencies ship silently.

**Lower the threshold to `--audit-level=critical`, or run `npm audit --omit=dev`.** Both rejected, and ADR-0009's reasoning is adopted without modification. The first discards the high tier permanently and silently; the second suppresses every future development-dependency advisory to avoid the present ones, and development dependencies execute in CI and in contributor tooling.

**Skip the audit when the pull request does not modify `package-lock.json`.** A cheaper approximation of the same intent — one audit run instead of two, no merge-base checkout. Rejected because it infers the delta from the wrong signal. It cannot detect a severity re-rating on an unchanged package, it silently produces no result at all for the majority of pull requests rather than an affirmative pass, and a lockfile change that removes risk is treated identically to one that adds it. The two-evaluation comparison is estimated at roughly 45 seconds (to be confirmed when the implementation lands); the same analysis measured the full production build at 21 seconds, so the pipeline has the headroom.

**Rely on Dependabot security updates instead of a gate.** Dependabot opens pull requests for advisories it can fix, and [ADR-0010](./0010-dependabot-grouping-and-major-holds.md) governs how those are grouped. Rejected as a replacement because it is a remediation channel, not a control: it does not gate anything, it cannot act on advisories with no available fix, and it says nothing about risk a contributor introduces by hand.

**Adopt a third-party dependency scanner** such as Snyk or Socket, which offer reachability analysis that would distinguish an advisory in the production bundle from one in the lint toolchain. Not evaluated — this decision was scoped to the control model, not to tooling selection, and a serious comparison needs time this decision did not have. Worth revisiting, with the caveat that a delivery-path analysis in this repository identified externally-owned nodes with no fallback as the existing structural risk, and a scanner in the required-check path adds one.

**Package-scoped rather than advisory-scoped waivers.** Rejected; ADR-0009's reasoning stands. A package with one known-unfixable advisory is not thereby trustworthy for all future advisories.

## Consequences

**Enabled.** A pull request is accountable for the risk it introduces and nothing else. The most frequently red check in the repository regains a meaning worth reading: red means this change did something. The recurring interruption pattern — roughly ten times a quarter, an unrelated contributor absorbing a dependency problem — stops.

**Constrained.** The pre-merge guarantee weakens, and the new wording matters: the gate now certifies that a pull request introduces no new high or critical advisory, not that the tree is free of them. Anyone relying on the check must read it that way. Full-tree assurance still exists but is asynchronous, and its value depends entirely on someone acting on the monitoring lane's issues.

**New work.** A scheduled workflow, which is net-new — the repository currently has no scheduled workflow of any kind. An issue-filing path with deduplication that fails visibly when it cannot file or assign. Delta-comparison logic and tests in the audit script, including the merge-base checkout, its own fail-closed handling, and the scoping of waiver validation to introduced advisories. A disposition for the existing waiver before 2026-10-23: deleted, renewed with current evidence, or allowed to expire under this policy.

**Risks.** The clearest one: an advisory that predates every open branch is, by construction, never blocked by the PR lane, so an unactioned monitored finding can reach production. The monitoring lane's deploy-cadence disposition bound is the control preventing that, and a reporting checkpoint a human can deliberately step past is a weaker guarantee than a gate. This is a deliberate trade — a gate that is ignored is also not a control — but it is a real reduction in enforcement and should not be described otherwise. Second: the merge-base evaluation is new machinery in the security path, and a bug that wrongly reports the baseline as clean would block every pull request, while one that wrongly reports it as containing everything would pass everything. The fail-closed requirements above exist for this, and the script's existing test suite must cover both directions.

**Contributor workflow change.** A failing audit step now names an advisory the pull request introduced, and the remedy is within the author's control: change the dependency, or open a waiver with rationale and expiry. Contributors should no longer add a waiver to unblock unrelated work, because unrelated work will not be blocked.

## Open questions

- Whether the release lane should hard-block on an outstanding critical finding. This record makes it reporting-only; a stricter release policy is defensible and would need its own decision.
- Whether the monitoring lane should cover moderate severity, which the PR lane deliberately does not gate.
- Whether the merge base or the tip of `main` is the correct baseline in a repository where `main` moves during a long-lived review. This record specifies the merge base for reproducibility; a case exists for re-evaluating against the tip at merge time.

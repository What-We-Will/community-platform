# ADR-0015 — `verify` as a second required check on `main`

**Status:** Accepted 2026-11-11
**TL;DR:** Add the secret-free `verify` job to the `Protect main` ruleset as a required status check alongside `security-scan`, and keep `verify`'s install step faithful to the deploy by running `npm install --dry-run` after `npm ci`. This partially amends the required-check boundary of [ADR-0003](./0003-pre-merge-supply-chain-gate.md); the `security-scan` gate and the workflow-hardening baseline stay in force.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

[ADR-0003](./0003-pre-merge-supply-chain-gate.md) made `security-scan` the only required status check on `main`. At the time, `preview.yml` had a single job that linted, tested, built and deployed. PR #167 later split it into three jobs: `verify` (secret-free: migration checks, `npm ci --ignore-scripts`, lint, type check, unit tests, and a production build with placeholder env), `security-scan` (unchanged), and `preview-deploy` (needs deploy secrets, so it is skipped for fork and Dependabot PRs). Issue #165 recorded the admin follow-up to make `verify` the required check, and #211 recorded that Dependabot PRs merged with no build or test signal gating them. The ruleset change did not happen. ADR-0003 had named this exact risk: the required check is a manual setting that can drift from the workflow.

On 2026-11-09, Dependabot PR #448 bumped `@vitest/eslint-plugin` to 1.6.28, whose optional `typescript` peer dependency requires `>=6`. The repository pins `typescript` to `^5`. `verify` passed, because `npm ci` trusts the lockfile and by design does not fail on an unsatisfied optional peer (npm/cli#8726). The PR merged on `security-scan` plus one approval. Dependabot PRs skip `preview-deploy`, so #448 itself had no deploy step; the failure surfaced in the next preview deploy built on the merged `main` (same-repo PR #450, afterwards rebased onto the hotfix): `vercel build` runs `npm install`, which re-resolves peers and raised `ERESOLVE`. Production deploys from `main` run the same `vercel build`, so production was exposed. PR #451 pinned the plugin back to 1.6.27.

Two gaps were visible. First, `verify`'s result did not gate the merge, so even a red `verify` would not have stopped it. Second, `verify`'s install did not reproduce the deploy's install, so `verify` was green on a tree the deploy could not install.

## Decision

We will require both `verify` and `security-scan` as status checks in the `Protect main` ruleset. We add `verify`; we do not replace `security-scan`.

We will keep `verify`'s install step faithful to what the deploy does. After `npm ci --ignore-scripts`, `verify` runs `npm install --dry-run --ignore-scripts --no-audit --no-fund`. The dry run performs the same dependency resolution as the deploy's `npm install` and writes nothing, so a lockfile that `npm install` cannot resolve fails the PR, while lint, type check, tests and build continue to run against the clean `npm ci` tree.

**Amended boundary of ADR-0003.** Its statement that the `security-scan` job "is configured as a required check on `main` via the `Protect main` repository ruleset", and the consequence that the ruleset must stay name-synced with that job, now apply to two job names: `verify` and `security-scan`. Everything else in ADR-0003 is unchanged.

## Alternatives considered

**Replace `security-scan` with `verify`** (the original wording of #165). Rejected. Both jobs are secret-free and run on every PR, including forks and Dependabot, so requiring both costs nothing extra. Dropping `security-scan` would weaken the supply-chain gate ADR-0003 established and would need its own supersession.

**Make `preview-deploy` the required check.** Rejected. The job is skipped by a job-level condition for fork and Dependabot PRs, and GitHub reports a conditionally skipped job as a successful check. Requiring it would therefore let exactly those PRs merge with no deploy validation while appearing to gate them. It also needs deploy secrets that GitHub withholds from those PRs.

**Configure Vercel to run `npm ci` instead of `npm install`.** Rejected. It is easy to do (`installCommand` in `vercel.json`), but it makes the deploy as lenient as `verify` was and ships a lockfile with an unsatisfied peer into production. The gap should fail the PR, not be hidden at deploy time.

**Pin npm in CI to `packageManager`.** Rejected. The CI runner's Node 24.20.0 already bundles the pinned npm 11.19.0, and the difference that mattered is between the `ci` and `install` commands, not between npm versions. A local-versus-CI resolver discrepancy investigated during the incident turned out to be a developer-machine toolchain pin selecting an older npm, not a property of either CI or the registry package.

**Rely on the local validation runbook and helper script.** Insufficient on its own. Manual validation is what #448 bypassed, and a required check is the only control that applies regardless of who merges.

**Require branches to be up to date with `main`** (`strict_required_status_checks_policy`). Not decided here. See Open questions.

## Consequences

**Enabled.** Dependabot and fork PRs now need a green build and test run before merging. A dependency bump whose peers the deploy cannot resolve fails in `verify` with the same `ERESOLVE` the deploy would have produced. "Is it safe to merge" becomes "are both checks green" for the common patch and minor update.

**Constrained.** A red `verify` blocks every PR, including documentation-only changes, because `verify` runs on all pull requests. `verify` adds a registry round-trip of a few seconds for the dry run. The next Dependabot proposal of `@vitest/eslint-plugin` 1.6.28 will fail at the new step until the repository adopts TypeScript 6. That is the intended signal; a Dependabot ignore rule is available if the recurring red PR becomes noise.

**New manual work.** The ruleset now carries two required contexts, `verify` and `security-scan`. Renaming either job in `preview.yml` without updating the ruleset blocks every PR on a check that never reports. Confirm the live rule with:

```sh
gh api repos/What-We-Will/community-platform/rulesets/14568095 --jq '.rules[] | select(.type=="required_status_checks")'
```

**Follow-up work.** `scripts/validate-dep-pr.sh` reproduces `verify` locally but runs only `npm ci`, so it has the gap this ADR closes in CI; it should gain the same `npm install --dry-run` step in its own PR.

**Unchanged risk.** Repository admins bypass the whole ruleset, so both checks are advisory for admins. This was already true under ADR-0003 and is recorded here so nobody reads "required" as "unbypassable".

**Contributor workflow.** Nothing new to run. A developer's own `npm install` surfaces the same `ERESOLVE` that the new step reports.

## Open questions

- Whether to enable `strict_required_status_checks_policy` so branches must be current with `main` before merging. Today a PR can merge with checks that ran against an older `main`.
- The remaining items in #165 (fork-workflow approval setting, code-owner review) are separate admin decisions and are not covered by this record.
- Whether `production.yml` should also run the dry-run check before `vercel build` as defense in depth. It matters when `main` holds a tree that no `verify` run tested: an admin bypass, or two PRs that each passed `verify` against an older `main` and merged into a combination neither run saw. The second case needs no bypass and is realistic for a batch of dependency PRs, since the ruleset does not require branches to be current (previous question).

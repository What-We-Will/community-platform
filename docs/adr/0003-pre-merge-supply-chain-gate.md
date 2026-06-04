# ADR-0003 — Pre-merge supply-chain security gate

**Status:** Accepted 2026-06-04
**TL;DR:** Add a blocking pre-merge `security-scan` job (gitleaks, in-house hidden-character scanner, blocking `npm audit`) as a required check on `main`, and adopt a workflow-hardening baseline (SHA-pinned actions, step-level secrets, `npm ci --ignore-scripts`, pinned Vercel CLI) for both `preview.yml` and `production.yml`. The two are bundled because they share one threat model — the gate is undermined without the baseline.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

The project accepts contributions from outside collaborators, including AI-agent contributions covered by `AI_POLICY.md`. The policy governs how AI tooling may be used in contributions, but until now there was no enforcement chain in CI to back it. PR #132 — a fork-authored AI-agent contribution — surfaced that gap and motivated this work.

Pre-existing CI had a single security-related step: `npm audit --audit-level=high` with `continue-on-error: true`. That step never blocked a merge, so vulnerable transitive dependencies could ship through preview and into production unchallenged. There was no scan for invisible-character classes (Trojan Source bidi controls, zero-width Unicode, line/paragraph separators); reviewing PR #132 for those required a manual one-off.

Both workflow files (`preview.yml`, `production.yml`) used unpinned third-party actions (`@v4` / `@latest`) and the unpinned `vercel@latest` CLI, exposed `VERCEL_TOKEN` and `SUPABASE_ACCESS_TOKEN` at workflow- and job-level `env:` (broadening scope to every step including `npm` lifecycle hooks), and ran `npm ci` without `--ignore-scripts` while those secrets were in scope. Three passes of the `gha-security-reviewer` agent against `feat/ci-security-hardening` surfaced WARNING-tier findings across both files.

This ADR records the decision to close those gaps as a single coordinated change, motivated by one threat model: untrusted code reaching `main` (whether via a malicious dependency, a hidden-character payload in a diff, or a workflow misconfiguration that leaks credentials to that untrusted code).

## Decision

We will gate every PR on a blocking `security-scan` job, and we will adopt a workflow-hardening baseline that applies uniformly to `preview.yml` and `production.yml`. These two commitments are coupled deliberately: the scan job's guarantees rely on the hardened workflow surface around it, and the baseline without the scan would leave the AI-policy enforcement chain incomplete.

**Pre-merge security-scan job** (in `preview.yml`, triggered by `pull_request`, granted `contents: read` only):

- `gitleaks` binary v8.30.1, SHA256-verified at install time, scanning `BASE_SHA..HEAD`.
- `scripts/scan-hidden-chars.mjs` — in-house scanner covering 17 codepoints (bidirectional override controls, zero-width characters, line and paragraph separators), scoped to changed JS/TS files.
- `npm ci --ignore-scripts && npm audit --audit-level=high` — blocking, replacing the prior silent-pass step.

The job is configured as a required check on `main` via the `Protect main` repository ruleset (a manual settings change, not workflow-defined).

**Workflow-hardening baseline** (applied to both `preview.yml` and `production.yml`):

- SHA-pin every third-party action; no floating `@v4` or `@latest` tags.
- `npm ci --ignore-scripts` in every job.
- Secrets declared at **step-level** `env:` only — *never* at workflow or job level.
- Tokens passed via environment variables, not the `--token=` CLI flag.
- Vercel CLI pinned to an exact version (currently `vercel@54.2.0`).
- `pull_request` trigger preserved; `pull_request_target` explicitly prohibited.
- `permissions:` minimized at workflow level; any write permissions scoped to the specific job that needs them.
- `timeout-minutes` set on every job.

## Alternatives considered

**`gitleaks/gitleaks-action@v2` instead of the binary.** The official action requires a `GITLEAKS_LICENSE` for org repositories. The Apache-2.0 binary install gives identical detection without the licensing dependency. We documented the swap-back inline in `preview.yml` so a future maintainer can flip to the action in one step if a license is obtained.

**Python for the hidden-character scanner.** The original plan was a Python script. Rejected because the project has zero Python elsewhere and Node is already provisioned on every runner; introducing a Python toolchain to CI for a single script wasn't worth the surface area.

**Homoglyph detection in the same scanner.** Out of scope. False-positive rate on legitimate internationalized content is too high for a blocking CI gate. Manual review remains the backstop for that class of attack.

**Run `npm audit` at production-deploy time as well.** Deemed unnecessary as a blocking gate — production runs only after `main` merges, and the preview-time check already blocks the merge. Worth revisiting as defense-in-depth if a future incident shows a gap.

**CodeQL.** Valuable but distinct concern (static analysis of our source vs. supply-chain and credential surface). Tracked separately for a future workflow rather than bundled into this gate.

**`pull_request_target` trigger.** Would give fork PRs access to repository secrets — the exact footgun this ADR exists to close. Explicit reject.

**Split into two ADRs (gate composition vs. hardening baseline).** Rejected because the two share one threat model and one motivating incident. Splitting would fragment the rationale and make it harder for a future reader to understand why the gate's guarantees depend on the baseline.

## Consequences

**Enabled.** Every PR — including fork PRs and AI-agent contributions — is gated on three blocking checks before it can merge. `AI_POLICY.md` gains an enforcement chain it didn't have before. Future workflow contributions inherit the hardening baseline as precedent; a reviewer can point to this ADR rather than re-litigating each item.

**Constrained.** No `@latest` for the Vercel CLI or any third-party action. SHA pins and exact-version pins must be maintained deliberately; we trade dependency freshness for reproducibility and supply-chain assurance.

**New manual work.**

- The `Protect main` ruleset's required-status-checks rule for `security-scan` is a manual, out-of-band setting (admin-only, not workflow-defined). It must be kept in sync with the job name — renaming the `security-scan` job without updating the rule would leave every PR blocked on a check that never reports.
- SHA-pin maintenance falls on contributors. The gitleaks binary version and Vercel CLI version are free-form strings in `run:` blocks and are outside Dependabot's reach; they will drift unless someone re-pins them periodically. Action SHA pins likewise need periodic refresh.

**Contributor workflow change.** From this PR forward, a failing `security-scan` job blocks merge. Contributors will see new failure modes (secret detected by gitleaks, hidden character in a diff, high-severity advisory in a transitive dependency) that previously would have passed silently or been caught only by manual review.

## Open questions

- **GitHub Environments protection rule** on production deploys (manual approval gate). Deferred to a separate piece of work; orthogonal to the supply-chain threat model this ADR covers.
- **`SLACK_WEBHOOK_URL` rotation.** Pending the Slack workspace owner; tracked outside this ADR.
- **gitleaks license go/no-go.** Binary works today; the swap-back to `gitleaks/gitleaks-action@v2` is documented inline in `preview.yml` if a license is later obtained.
- **`npm audit` at production-deploy time** as defense-in-depth — see Alternatives.

# Runbook: Validating dependency updates (Dependabot PRs)

How to decide whether a Dependabot PR is safe to merge, what to check, and how to roll
back if a merged update breaks production. Written so anyone on the project can clear a
weekly batch quickly.

## TL;DR

1. Read the **triage comment** the bot posts on the PR (`.github/workflows/dependabot-triage.yml`)
   — it applies this same decision matrix automatically and labels the PR `ready to merge` or
   `status: needs-review`. It does not merge anything; a human still clicks merge.
2. If you want to double-check its reasoning: look at the **`verify`** check on the PR.
   Green = `npm ci` + lint + type-check + unit tests + a production build all passed
   against the new dependency. That is the underlying signal the bot's verdict is based on.
3. Ignore `preview-deploy` on Dependabot PRs — it is **skipped** (it needs deploy secrets
   that GitHub withholds from Dependabot). A skipped or absent preview is expected, not a
   failure.
4. Decide by bump type using the matrix below. Merge patch/minor with a green `verify`;
   give majors, github-actions bumps, and visual-surface bumps a closer look.
5. Know the rollback path *before* you merge anything that auto-deploys to production.

## Automated triage

One workflow (`dependabot-triage.yml`), running on every Dependabot PR (`pull_request`). GitHub
caps Dependabot-triggered `pull_request` runs to a read-only `GITHUB_TOKEN` regardless of the
declared `permissions:` block — a write here 403s ("Resource not accessible by integration") no
matter what the workflow YAML asks for. So the write doesn't use `GITHUB_TOKEN` at all: the job
mints a short-lived installation token from an org-owned GitHub App (`wwc-dependabot-triage`,
installed on this repo only, scoped to Issues + Pull requests read/write), capped again in the
minting step itself (`permission-issues: write`, `permission-pull-requests: write`) so the
ceiling is visible in the workflow diff, not just in the App's installation settings. See
`docs/adr/github-app-token-dependabot-writes.md` for the full investigation and rejected
alternatives (a repo-wide "send write tokens to fork PRs" setting, `pull_request_target` —
banned by ADR-0003 — and a personal access token).

`scripts/ci/classify-dependabot-pr.sh` reads `dependabot/fetch-metadata` output (bump type,
dependency type, package names) and mirrors the matrix below; the same job then posts the
verdict comment and swaps the `ready to merge` / `status: needs-review` label using the App
token. It re-runs and updates the comment on every push, so the label always reflects the
latest commit on the PR. A posting failure (rate limit, transient API hiccup, a renamed label)
logs a warning instead of failing the job — this stage doesn't validate the dependency update
itself, so its failure shouldn't red-X the PR the way a broken build should.

It does not distinguish security updates from version updates — reading Dependabot alerts needs
a `security_events` scope the App isn't granted (the default `GITHUB_TOKEN` can't read them
either), and a major bump is `needs-review` either way, so it wasn't worth widening the App's
permissions just to change the reason text. A Dependabot security-update PR still gets triaged
by bump type like any other.

What it does **not** do (yet): merge anything, or update a stale branch before merging.
Auto-merge is a deliberate later step — see the "Ready to merge" label as "safe per the
matrix," not "already merged."

github-actions bumps always come back `needs-review` regardless of bump size — they change
pinned workflow SHAs, which is a different risk category (CI trust, not just build
correctness) than an npm dependency bump.

## Reading the checks

After the preview pipeline split, `preview.yml` runs three jobs:

| Job | Needs secrets? | Runs on Dependabot? | What green means |
|-----|----------------|---------------------|------------------|
| `verify` | No | Yes | Installs, lints, type-checks, tests, **and builds** the app on the new deps |
| `security-scan` | No | Yes | Secret + hidden-char scan, `npm audit` |
| `preview-deploy` | Yes | **No (skipped)** | Live preview URL — only on same-repo, non-Dependabot PRs |

`verify` is the required check on `main`. If it is green, the app builds and tests pass
with the update. `preview-deploy` being skipped on a Dependabot PR is by design.

## Decision matrix

Grouping and cooldown are configured in `.github/dependabot.yml`. Cooldown is enforced by
Dependabot at PR-open time (patch 3 days / minor 7 / major 30, npm only), so any PR that
exists has already cleared its bake window — you do not need to check release age.

| Bump type | With a green `verify` | Extra check needed |
|-----------|-----------------------|--------------------|
| **Patch** (`x.y.Z`) | Safe to merge | None |
| **Minor** (`x.Y.z`) | Safe to merge | If it touches UI (Radix, Tailwind, component libs): a quick **visual smoke** — build locally and eyeball the affected components. `verify` cannot catch visual regressions. |
| **Major** (`X.y.z`) | Do **not** merge on green alone | Read the changelog for breaking changes; map each against how we actually use the dependency. For GitHub Actions majors, check the workflow files. Consider holding for a scheduled migration. Applies to dev-only deps too — a tooling major (e.g. eslint) can break lint/build rules just as easily as a runtime major. |
| **Dev-only, patch/minor** (e.g. test runner, types) | Safe to merge on green `verify` | None — not in the production bundle. For a test-runner bump, the test suite running green under the new version *is* the smoke test. Dev-only does **not** exempt a major bump from the Major row above. |

Family majors for core libraries (react, next, supabase, radix, tailwind, etc.) are held
in `ignore` in `dependabot.yml` and handled as deliberate migrations, not bot PRs.

## Validating locally

CI's `verify` job already runs on every PR, so a green check usually means no local work
is needed. When you want to reproduce it — a major bump, a visual smoke, or CI is
unavailable — use the helper:

```bash
scripts/validate-dep-pr.sh <pr-number>        # e.g. 207  (resolves the branch via gh)
scripts/validate-dep-pr.sh <branch-ref>       # e.g. dependabot/npm_and_yarn/next-...
```

It fetches the branch into a throwaway worktree, runs `npm ci` + lint + type-check + tests
+ a production build with placeholder non-secret env, reports pass/fail, and cleans up —
without touching your current branch. For a visual smoke, build in a persistent worktree
and `npm run start` to click through the affected screens.

## Rollback / revert

Merging to `main` triggers an automatic **production** deploy, so a bad merge is a live
incident. Two independent layers — stop the bleeding first, then fix the source.

| Step | Action | When | Speed |
|------|--------|------|-------|
| 1. Runtime | **Vercel instant rollback** — promote the previous production deployment (dashboard "Instant Rollback", or `vercel rollback <url>`). Undoes the user-facing breakage without touching git. | Production is broken now | Seconds |
| 2. Source | **`git revert -m 1 <merge-sha>`** — restores the old `package.json` + lockfile; the next deploy ships the known-good version. `-m 1` keeps the first parent (main). | Always, after step 1 | A deploy cycle |
| 3. Prevent recurrence | Re-pin the dependency and/or add a scoped `ignore` for the bad version in `.github/dependabot.yml`, so Dependabot does not re-open the same PR. | Version is known-bad, not just untested | — |

Order in an incident: **Vercel rollback → `git revert` → pin.** A pre-merge catch (a red
`verify`, or a failed local validation) means you never reach this table.

## Why `preview-deploy` can't run on Dependabot PRs

GitHub runs Dependabot-triggered workflows against a separate, empty secret store, so
`VERCEL_TOKEN` and the Supabase keys are blank and any deploy step fails at `vercel pull`.
The pipeline is split so the secret-free `verify` job carries the merge signal, and
`preview-deploy` is skipped for Dependabot (and for forks, which also can't reach secrets).
This is a platform constraint, not a misconfiguration.

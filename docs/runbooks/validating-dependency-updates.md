# Runbook: Validating dependency updates (Dependabot PRs)

How to decide whether a Dependabot PR is safe to merge, what to check, and how to roll
back if a merged update breaks production. Written so anyone on the project can clear a
weekly batch quickly.

## TL;DR

1. Read the **triage comment** the bot posts on the PR (`.github/workflows/dependabot-triage.yml`)
   — it applies this same decision matrix automatically and labels the PR `ready to merge` or
   `status: needs-review`. It does not merge anything; a human still clicks merge.
2. The label is **not** a CI verdict. It is computed from the bump's metadata alone, so a PR
   can be labelled `ready to merge` while its checks are red. Always read the checks too:
   **`verify`** green = the migration-collision check plus `npm ci --ignore-scripts`, lint,
   type-check, unit tests, and a production build all passed against the new dependency.
3. Ignore `preview-deploy` on Dependabot PRs — it is **skipped** (it needs deploy secrets
   that GitHub withholds from Dependabot). A skipped or absent preview is expected, not a
   failure.
4. Decide by bump type using the matrix below. Merge patch/minor only with green `verify`
   **and** `security-scan`; give majors, github-actions bumps, and visual-surface bumps a
   closer look.
5. Merging does not deploy — production ships on a manual dispatch. Know the rollback path
   before you dispatch that deploy, not before you merge.

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
token. It re-runs on every push and, when the posting step succeeds, updates the comment and
label for the latest commit on the PR. A posting failure (rate limit, transient API hiccup, a
renamed label) logs a warning instead of failing the job — this stage doesn't validate the
dependency update itself, so its failure shouldn't red-X the PR the way a broken build should.

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
| `verify` | No | Yes | Checks migration filename collisions; installs, lints, type-checks, tests, **and builds** the app on the new deps |
| `security-scan` | No | Yes | Secret + hidden-char scan, and an `npm audit` scoped to the advisories this PR introduces |
| `preview-deploy` | Yes | **No (skipped)** | Live preview URL — only on same-repo, non-Dependabot PRs |

`security-scan` is the required check on `main`. `verify` is the one that tells you the
update is sound — green means the app builds and tests pass with it — but it is not what
blocks the merge button. `preview-deploy` being skipped on a Dependabot PR is by design.

Green on `security-scan` does **not** mean the tree is free of high or critical advisories.
Per [ADR-0012](../adr/0012-dependency-risk-control-lanes.md) the gate is delta-scoped: it
blocks only on advisories the PR introduces relative to its merge base, and reports the rest
as `inherited`. Advisories already present on `main` are tracked by the scheduled monitoring
lane, not by this check.

## Decision matrix

Grouping and cooldown are configured in `.github/dependabot.yml`. Cooldown is enforced by
Dependabot at PR-open time (patch 3 days / minor 7 / major 30), but it covers npm
**version updates only**: security updates are never delayed by cooldown, and the
github-actions ecosystem has no cooldown configured. A routine npm version bump has
therefore cleared its bake window by the time the PR exists; a security-update PR can
open the same day its advisory ships — check release age on those yourself.

| Bump type | With green `verify` **and** `security-scan` | Extra check needed |
|-----------|-----------------------|--------------------|
| **Patch** (`x.y.Z`) | Safe to merge | None — unless it touches a UI-surface package. Those are `needs-review` at every bump size; see [Visual smoke for UI-surface bumps](#visual-smoke-for-ui-surface-bumps). |
| **Minor** (`x.Y.z`) | Safe to merge | Same UI-surface carve-out as patch. `verify` cannot catch a visual regression. |
| **Major** (`X.y.z`) | Do **not** merge on green alone | Read the changelog for breaking changes; map each against how we actually use the dependency. For GitHub Actions majors, check the workflow files. Consider holding for a scheduled migration. Applies to dev-only deps too — a tooling major (e.g. eslint) can break lint/build rules just as easily as a runtime major. |
| **Dev-only, patch/minor** (e.g. test runner, types) | Safe to merge | None — not in the production bundle. For a test-runner bump, the test suite running green under the new version *is* the smoke test. Dev-only does **not** exempt a major bump from the Major row above. |

Family majors for core libraries (react, next, supabase, radix, tailwind, etc.) are held
in `ignore` in `dependabot.yml` and handled as deliberate migrations, not bot PRs — with
one exception: the holds are scoped to `version-update:semver-major`, so Dependabot can
still open a **security** PR that crosses a held major, with no cooldown. Treat that as
the Major row with extra urgency, not as a misconfiguration. See
[ADR-0010](../adr/0010-dependabot-grouping-and-major-holds.md) for why those holds are
scoped the way they are. The Vitest family includes `@vitejs/plugin-react`, so review
their major-version compatibility together during the January and July migration review.

## Visual smoke for UI-surface bumps

UI-surface means `tailwindcss`, `tailwind-merge`, `tw-animate-css`, `@tailwindcss/*`,
`radix-ui`, or `@dnd-kit/*` — the authoritative list is `is_ui_surface()` in
`scripts/ci/classify-dependabot-pr.sh`. These come back `needs-review` at **any** bump
size, patch included: the failure mode is a utility whose compiled CSS rule changes while
its class name stays the same, and semver level does not bound that. A green `verify`
says nothing about it, because lint, type-check, and tests never observe real layout.

The two paths below are alternatives, not a sequence. Do either one. A human makes the
merge call either way — nothing here auto-merges.

**Path A — the screenshots CI already captured.** The triage workflow runs a secret-free
job on UI-surface PRs that builds the app, starts it, and captures the landing and login
pages at 1280px and 375px, plus any browser console errors, as a workflow artifact. Open
the run linked from the PR comment and download it. Unauthenticated pages only: with
placeholder Supabase credentials everything behind auth renders a redirect, so
screenshotting it would be misleading rather than useful.

**Path B — run it locally.** Slower, and the only way to reach the two auth-gated
surfaces — but only if you have a working local backend already. See
[`e2e/README.md`](../../e2e/README.md) for that setup; without it, Path B gives you
nothing Path A did not.

```bash
scripts/validate-dep-pr.sh --keep <pr-number>
cd <the worktree path it prints>
cp /path/to/your/.env.local .env.local
cp /path/to/your/.env.e2e .env.e2e     # omit this and the auth specs skip, reporting green
npm run test:e2e                       # Playwright starts its own dev server
npm run dev                            # then click through the surfaces below
```

Three things about that sequence are easy to get wrong:

- **`--keep` is load-bearing.** Without it the script removes its worktree before
  returning, so everything after would run against your own checkout — usually `main` —
  and quietly smoke-test the wrong code.
- **A worktree has no `.env.local` or `.env.e2e`.** Both are gitignored, so a fresh
  checkout never carries them. Missing them, the auth specs `test.skip` rather than fail
  — the run reports green while every auth-gated assertion was silently skipped — and the
  app itself redirects instead of rendering.
- **Use `npm run dev`, not `npm run start`.** The retained build was produced with
  placeholder credentials, and `NEXT_PUBLIC_*` values are inlined into the client bundle
  at build time, so the built app points at the placeholder Supabase project no matter
  what you put in `.env.local` afterwards. `dev` resolves the env at runtime. Run
  `test:e2e` before `dev`, or in a second terminal: both bind port 3000, and Playwright
  reuses an existing server there rather than starting its own.

Run the full `test:e2e` suite rather than `:smoke` — the auth-state specs in `e2e/auth/`
already exercise `/onboarding`, `/pending-approval`, and `/dashboard`, three structurally
different layouts, at no extra authoring cost.

Check three surfaces, chosen for component-type diversity rather than coverage. A
CSS-engine bump breaks structure — grid, flex, overflow, z-index, responsive prefixes —
not business logic:

- **Dashboard** — dense grid/card layout, the widest concentration of shadcn primitives on
  one screen.
- **A modal/dialog-heavy flow** (event RSVP, profile edit) — overlay, backdrop, and
  z-index utilities, the category most likely to break silently.
- **One page at 375px** — a responsive prefix that stops applying is the highest-risk
  failure for a `tailwindcss` bump specifically, and desktop-only checking misses it
  entirely.

Only the third is reachable on Path A, and only on the landing and login pages. The first
two need Path B with a local backend. If you have neither, say so on the PR rather than
approving on partial evidence — an unreviewed surface is a known gap, not a pass.

Fail the PR if any of the following is observed. This is a fixed list rather than a
judgment call, so the check cannot quietly shrink under time pressure — compare against
`main` in a second window where the criterion says "than before":

- An element visibly overlapping another where it did not before.
- Any unstyled/raw-HTML flash, or content that stays unstyled.
- An element clipped or cut off by its container that was not before.
- At 375px, a layout that does not change from its desktop arrangement at all.
- Any new browser console error or warning on load.
- `npm run test:e2e` reporting a failure.

On a fail, block the PR and record what was seen against which criterion. Do not diagnose
or fix the root cause inside the dependency PR.

## Editing the groups in `dependabot.yml`

Dependabot does not simply take the first group whose patterns match — it scores each
matching group and assigns the dependency to the most *specific* one. An exact name
scores highest, a wildcard scores low, and a group declaring no `patterns` at all
scores in between, above every wildcard. Two rules follow from that:

- **Leave `patterns: ["*"]` on the two catch-all groups.** It looks redundant next to
  `dependency-type`, but removing it makes them outrank every wildcard pattern in the
  file and silently swallow dependencies from named groups. That is exactly what
  happened in PR #265.
- **Add the literal name when you add a scoped dependency.** The glob will catch it
  either way now, so forgetting is not breakage — the literal is a deliberate second
  layer, and matching the existing style keeps the groups readable.
- **Limit routine-maintenance groups to minor and patch updates.** Packages paired for
  batching are not automatically version-locked. For example, `nodemailer` and
  `@types/nodemailer` update together routinely, but their majors remain independent.
  Omit `update-types` only for a version-locked family whose majors are covered by the
  scoped holds below the groups.

If a PR looks misgrouped — a package bundled into a catch-all when a named group
clearly covers it — this scoring is the first thing to check, not the pattern spelling.
The louder tell is a group that produces *nothing*: this bug is silent, so a broken
group reads correctly and simply never appears. List the groups that have actually
fired and diff that against the group names in the config:

```bash
gh pr list --state all --limit 200 --json headRefName \
  --jq '[.[]|select(.headRefName|startswith("dependabot/"))
        |.headRefName|split("/")[2]|sub("-[0-9a-f]+$";"")]|unique|sort'
```

Only the absence side means anything — ungrouped single-dependency PRs produce branch
names too. A configured group missing from the output has either been swallowed or has
genuinely had no eligible updates; check whether its members turn up in catch-all PRs
to tell those apart.

[ADR-0010](../adr/0010-dependabot-grouping-and-major-holds.md) has the scores, the
evidence, and the `dependabot-core` source it comes from.

## Validating locally

CI's `verify` job already runs on every PR, so a green check usually means no local work
is needed. When you want to reproduce its dependency install/test/build portion — a major
bump, a visual smoke, or CI is unavailable — use the helper:

```bash
scripts/validate-dep-pr.sh <pr-number>        # e.g. 207  (resolves the branch via gh)
scripts/validate-dep-pr.sh <branch-ref>       # e.g. dependabot/npm_and_yarn/next-...
```

It fetches the branch into a throwaway worktree, runs `npm ci --ignore-scripts` + lint +
type-check + tests + a production build with placeholder non-secret env, reports pass/fail,
and cleans up without touching your current branch. It does not run CI's migration-collision
check, so green here does not mean `verify` would be green. For a visual smoke, follow
[Visual smoke for UI-surface bumps](#visual-smoke-for-ui-surface-bumps) — it names the
surfaces to check and what counts as a failure, rather than leaving it to eyeballing.

## Rollback / revert

Merging to `main` does **not** deploy. Production ships only when someone dispatches the
Production Deploy workflow by hand, and `vercel.json` disables Vercel's git integration, so
a push cannot deploy either. A bad merge therefore sits on `main` until the next manual
deploy — that gap is the window to catch it. The deploy re-runs lint, type-check, and
tests before shipping, and prints a dependency risk report, but the report never gates
the deploy and only sees audit advisories — do not count on the dispatch step to stop a
functionally bad bump.

Once that deploy goes out, a bad merge is a live incident. Two independent layers — stop the
bleeding first, then fix the source.

| Step | Action | When | Speed |
|------|--------|------|-------|
| 1. Runtime | **Vercel instant rollback** — promote the previous production deployment (dashboard "Instant Rollback", or `vercel rollback <url>`). Undoes the user-facing breakage without touching git. | Production is broken now | Seconds |
| 2. Source | **Revert the dependency commit** — use `git revert -m 1 <merge-sha>` for a merge commit (`-m 1` keeps the first parent, `main`); use `git revert <commit-sha>` for a squash or rebase commit. This restores the old `package.json` + lockfile; the next deploy ships the known-good version. | Always, after step 1 | A deploy cycle |
| 3. Prevent recurrence | Re-pin the dependency and/or add a scoped `ignore` for the bad version in `.github/dependabot.yml`, so Dependabot does not re-open the same PR. | Version is known-bad, not just untested | — |

Order in an incident: **Vercel rollback → `git revert` → pin.** A pre-merge catch (a red
`verify` or `security-scan`, or a failed local validation) means you never reach this table.

## Why `preview-deploy` can't run on Dependabot PRs

GitHub runs Dependabot-triggered workflows against a separate, empty secret store, so
`VERCEL_TOKEN` and the Supabase keys are blank and any deploy step fails at `vercel pull`.
The pipeline is split so the secret-free jobs — `verify` and `security-scan`, the
required check — always run and carry the signals a merge decision needs, and
`preview-deploy` is skipped for Dependabot (and for forks, which also can't reach secrets).
This is a platform constraint, not a misconfiguration.

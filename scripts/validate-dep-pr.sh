#!/usr/bin/env bash
#
# validate-dep-pr.sh — reproduce the dependency portion of CI's `verify` job locally.
#
# Runs npm ci --ignore-scripts + lint + type-check + unit tests + a production build
# (with placeholder, non-secret env) against a PR's branch in a throwaway git worktree,
# then cleans up. Useful for a local sanity check, or for the cases that still want a
# human eye (major bumps, visual-surface changes) where you also want to boot the app
# afterwards.
#
# Not a complete stand-in for the check: `verify` also runs the migration-collision
# check, which this script omits. Green here does not mean `verify` would be green.
#
# Usage:
#   scripts/validate-dep-pr.sh [--keep] <pr-number|branch-ref>
#
# --keep retains the worktree instead of removing it on exit, so you can boot the
# app there for a visual smoke. Without it the worktree is gone by the time the
# script returns, and any follow-up command runs against your own checkout.
#
# Examples:
#   scripts/validate-dep-pr.sh 207                     # resolves the PR's head branch via gh
#   scripts/validate-dep-pr.sh dependabot/npm_and_yarn/next-62bc67f254
#   scripts/validate-dep-pr.sh --keep 207              # keep the worktree for a visual smoke
#
# Requires: git, node, npm. `gh` is only needed when you pass a PR number.
# PR-number mode assumes the branch lives on `origin` (true for Dependabot PRs, this
# script's target use case). For a fork-based PR, pass the fork's branch ref directly
# with a remote you've already fetched — `git fetch origin <ref>` will fail otherwise.
set -euo pipefail

node_major="$(node -e 'process.stdout.write(process.version.slice(1).split(".")[0])')"
if [ "$node_major" != "24" ]; then
  echo "warning: local Node is v${node_major}.x, CI's verify job runs 24.x — results may not match CI." >&2
fi

usage="usage: $0 [--keep] <pr-number|branch-ref>"

keep=0
arg=""
positional=0
for opt in "$@"; do
  case "$opt" in
    --keep) keep=1 ;;
    -*) echo "error: unknown option '$opt'" >&2; echo "$usage" >&2; exit 2 ;;
    *) arg="$opt"; positional=$((positional + 1)) ;;
  esac
done

if [ "$positional" -ne 1 ]; then
  echo "$usage" >&2
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

# Resolve a PR number to its head branch (needs gh); otherwise treat the arg as a ref.
if [[ "$arg" =~ ^[0-9]+$ ]]; then
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: '$arg' looks like a PR number but gh is not installed. Pass the branch ref instead." >&2
    exit 2
  fi
  ref="$(gh pr view "$arg" --json headRefName -q .headRefName)"
  echo "PR #$arg -> branch $ref"
else
  ref="$arg"
fi

echo "==> fetching origin/$ref"
git fetch --quiet origin "$ref"

# Isolated worktree so the caller's branch and working tree are never touched.
wt="$(mktemp -d "${TMPDIR:-/tmp}/validate-dep-pr.XXXXXX")"
# Retention is decided here rather than at the success path on purpose: a failed run
# is when you most want the tree to inspect.
cleanup() {
  if [ "$keep" -eq 1 ]; then
    echo
    echo "worktree retained at $wt"
    echo "  boot the app:  cd $wt && npm run start"
    echo "  remove it:     git worktree remove --force $wt"
    return
  fi
  git worktree remove --force "$wt" >/dev/null 2>&1 || true
  rm -rf "$wt"
}
trap cleanup EXIT

echo "==> checking out into $wt"
git worktree add --quiet --detach "$wt" "origin/$ref"
cd "$wt"

# Placeholder, non-secret env — mirrors the CI `verify` build. Dummy values only:
# a URL-shaped string plus non-empty keys so module-scope client construction and
# page-data collection don't error. Never put real secrets here.
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
export SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key

run() { echo; echo "==> $1"; shift; "$@"; }

run "npm ci"        npm ci --ignore-scripts
run "lint"          npm run lint
run "type check"    npx tsc --noEmit
run "unit tests"    npm test
run "production build" npm run build

echo
echo "✅ validate-dep-pr: all checks passed for $ref"
if [ "$keep" -eq 0 ]; then
  echo "   (worktree auto-removed; re-run with --keep to boot the app for a visual smoke)"
fi

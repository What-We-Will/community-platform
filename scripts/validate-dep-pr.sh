#!/usr/bin/env bash
#
# validate-dep-pr.sh — reproduce the CI `verify` job locally for a dependency PR.
#
# Runs npm ci + lint + type-check + unit tests + a production build (with placeholder,
# non-secret env) against a PR's branch in a throwaway git worktree, then cleans up.
# This is the same signal the CI `verify` job produces — useful for a local sanity
# check, or for the cases that still want a human eye (major bumps, visual-surface
# changes) where you also want to boot the app afterwards.
#
# Usage:
#   scripts/validate-dep-pr.sh <pr-number|branch-ref>
#
# Examples:
#   scripts/validate-dep-pr.sh 207                     # resolves the PR's head branch via gh
#   scripts/validate-dep-pr.sh dependabot/npm_and_yarn/next-62bc67f254
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

if [ $# -ne 1 ]; then
  echo "usage: $0 <pr-number|branch-ref>" >&2
  exit 2
fi
arg="$1"

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
cleanup() { git worktree remove --force "$wt" >/dev/null 2>&1 || true; rm -rf "$wt"; }
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
echo "   (worktree auto-removed; to boot the app for a visual smoke, re-run the steps"
echo "    manually in a persistent worktree and 'npm run start')"

#!/usr/bin/env bash
#
# classify-dependabot-pr.sh — decide "safe to merge" vs "needs review" for a
# Dependabot PR, mirroring docs/runbooks/validating-dependency-updates.md.
#
# Reads dependabot/fetch-metadata outputs from the environment, writes
# `verdict` (safe|needs-review) and `reason` to $GITHUB_OUTPUT.
#
# Required env: UPDATE_TYPE, DEPENDENCY_TYPE, DEPENDENCY_NAMES,
#               PACKAGE_ECOSYSTEM, ALERT_STATE, GHSA_ID, GITHUB_OUTPUT
set -euo pipefail

update_type="${UPDATE_TYPE:-}"
dependency_type="${DEPENDENCY_TYPE:-}"
dependency_names="${DEPENDENCY_NAMES:-}"
package_ecosystem="${PACKAGE_ECOSYSTEM:-}"
alert_state="${ALERT_STATE:-}"
ghsa_id="${GHSA_ID:-}"

is_security_update() {
  [ "$alert_state" = "OPEN" ] || [ -n "$ghsa_id" ]
}

# UI-surface packages: the runbook calls these out for a visual smoke test
# because a green `verify` can't catch visual regressions. Keep this list in
# sync with the tailwind/radix-ui/dnd-kit groups in .github/dependabot.yml.
is_ui_surface() {
  local IFS=','
  for raw in $dependency_names; do
    name="$(echo "$raw" | xargs)"
    case "$name" in
      tailwindcss | tailwind-merge | tw-animate-css | @tailwindcss/* | radix-ui | @dnd-kit/*)
        return 0
        ;;
    esac
  done
  return 1
}

verdict=""
reason=""

if [[ "$package_ecosystem" == *github*action* ]]; then
  # Workflow-pin bumps change what CI trusts and can run with. A green verify
  # only proves the pipeline still executes, not that the pin change is sound.
  verdict="needs-review"
  reason="github-actions bump — changes a pinned workflow SHA; review for security posture, not just build correctness"
elif [[ "$update_type" == *semver-major* ]]; then
  verdict="needs-review"
  if is_security_update; then
    reason="major bump (security advisory ${ghsa_id:-unknown}) — read the changelog for breaking changes; prioritize, this is a security fix"
  else
    reason="major bump — read the changelog for breaking changes before merging"
  fi
elif [[ "$update_type" == *semver-patch* ]]; then
  verdict="safe"
  reason="patch bump — safe to merge on a green verify check"
elif [[ "$update_type" == *semver-minor* ]]; then
  # UI-surface check comes first: rendered-output risk doesn't depend on
  # whether the package happens to be a devDependency (tailwindcss and
  # tw-animate-css are build-time devDependencies but still UI-surface).
  if is_ui_surface; then
    verdict="needs-review"
    reason="minor bump to a UI-surface package — do a quick visual smoke before merging"
  elif [[ "$dependency_type" == "direct:development" ]]; then
    verdict="safe"
    reason="minor bump, dev-only dependency — green tests are the smoke test"
  else
    verdict="safe"
    reason="minor bump — safe to merge on a green verify check"
  fi
else
  verdict="needs-review"
  reason="unrecognized update type '${update_type}' — defaulting to manual review"
fi

echo "verdict=$verdict" >>"$GITHUB_OUTPUT"
{
  echo "reason<<EOF_REASON"
  echo "$reason"
  echo "EOF_REASON"
} >>"$GITHUB_OUTPUT"

echo "Verdict: $verdict — $reason"

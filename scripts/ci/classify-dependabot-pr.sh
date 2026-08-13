#!/usr/bin/env bash
#
# classify-dependabot-pr.sh — decide "safe to merge" vs "needs review" for a
# Dependabot PR, mirroring docs/runbooks/validating-dependency-updates.md.
#
# Reads dependabot/fetch-metadata outputs from the environment, writes
# `verdict` (safe|needs-review) and `reason` to $GITHUB_OUTPUT.
#
# Required env: UPDATE_TYPE, DEPENDENCY_TYPE, DEPENDENCY_NAMES,
#               PACKAGE_ECOSYSTEM, GITHUB_OUTPUT
#
# No security-advisory awareness: `alert-lookup` needs a PAT/App token (the
# default GITHUB_TOKEN doesn't have Dependabot alerts access), which isn't
# worth standing up just to change reason text — major bumps are
# needs-review either way, security or not.
set -euo pipefail

update_type="${UPDATE_TYPE:-}"
dependency_type="${DEPENDENCY_TYPE:-}"
dependency_names="${DEPENDENCY_NAMES:-}"
package_ecosystem="${PACKAGE_ECOSYSTEM:-}"

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
  reason="major bump — read the changelog for breaking changes before merging"
elif is_ui_surface && [[ "$update_type" == *semver-patch* || "$update_type" == *semver-minor* ]]; then
  # Ordered ahead of the patch/minor and dependency-type branches on purpose: a
  # patch to the CSS engine can change a utility's compiled rule while its class
  # name stays the same, and tailwindcss is a devDependency but still UI-surface.
  case "$update_type" in
    *semver-patch*) bump_level="patch" ;;
    *) bump_level="minor" ;;
  esac
  verdict="needs-review"
  reason="${bump_level} bump to a UI-surface package — do a quick visual smoke before merging"
elif [[ "$update_type" == *semver-patch* ]]; then
  verdict="safe"
  reason="patch bump — safe to merge on green verify and security-scan checks"
elif [[ "$update_type" == *semver-minor* ]]; then
  if [[ "$dependency_type" == "direct:development" ]]; then
    verdict="safe"
    reason="minor bump, dev-only dependency — green tests are the smoke test"
  else
    verdict="safe"
    reason="minor bump — safe to merge on green verify and security-scan checks"
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

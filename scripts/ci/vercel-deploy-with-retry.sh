#!/usr/bin/env bash
# Runs `vercel deploy` with a bounded retry to ride out transient Vercel platform
# errors (e.g. a server-side 500 after the bundle has fully uploaded). Captures the
# deployment URL into $GITHUB_OUTPUT on success, and still exits non-zero after the
# attempts are exhausted so genuine failures are never masked.
#
# Usage: vercel-deploy-with-retry.sh <output_key> [vercel deploy args...]
#   <output_key>  written to $GITHUB_OUTPUT as "<output_key>=<url>" on success
#
# Examples:
#   bash scripts/ci/vercel-deploy-with-retry.sh preview_url --prebuilt
#   bash scripts/ci/vercel-deploy-with-retry.sh production_url --prebuilt --prod
#
# Tunables (env): DEPLOY_RETRY_ATTEMPTS (default 3), DEPLOY_RETRY_BASE_DELAY (default 5s).
set -euo pipefail

output_key="$1"
shift

attempts="${DEPLOY_RETRY_ATTEMPTS:-3}"
base_delay="${DEPLOY_RETRY_BASE_DELAY:-5}"

# Guard the tunables: a non-numeric or zero attempt count would make `seq 1 0`
# emit nothing, silently skipping every deploy and exiting 1 with no attempt made.
if ! [[ "$attempts" =~ ^[0-9]+$ ]] || [ "$attempts" -lt 1 ]; then
  echo "::error::DEPLOY_RETRY_ATTEMPTS must be a positive integer (got: ${attempts})" >&2
  exit 1
fi

for i in $(seq 1 "$attempts"); do
  # The deploy runs in the `if` condition, so errexit is suspended for it: a failed
  # attempt is handled by the loop instead of aborting the script. Command
  # substitution captures only stdout; CLI progress/errors flow to the log.
  if out="$(vercel deploy "$@")"; then
    # Take only the last stdout line and strip CR, then require it to be a URL
    # before writing to $GITHUB_OUTPUT. This prevents stray CLI output (multiple
    # lines, advisory text) from injecting extra `key=value` pairs into the
    # output file, which a downstream step could otherwise consume.
    url="$(printf '%s' "$out" | tail -n1 | tr -d '\r')"
    if [[ ! "$url" =~ ^https:// ]]; then
      echo "::error::Unexpected deploy output (no https URL on last line): ${out}" >&2
      exit 1
    fi
    echo "${output_key}=${url}" >> "$GITHUB_OUTPUT"
    echo "Deploy succeeded on attempt ${i}/${attempts}: ${url}"
    exit 0
  fi
  echo "::warning::vercel deploy attempt ${i}/${attempts} failed."
  # Incremental backoff; skip the wait after the final attempt.
  if [ "$i" -lt "$attempts" ]; then
    sleep "$((base_delay * i))"
  fi
done

echo "::error::vercel deploy failed after ${attempts} attempts." >&2
exit 1

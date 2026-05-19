#!/usr/bin/env bash
# Fails if the current branch adds a migration filename that already exists on origin/main.
# Designed to run in CI; safe to run locally.
set -euo pipefail

BASE_REF="${1:-origin/main}"

git fetch origin main >/dev/null 2>&1

ADDED=$(git diff --name-only --diff-filter=A "$BASE_REF...HEAD" -- 'supabase/migrations/*.sql')

if [ -z "$ADDED" ]; then
  echo "No new migration files. OK."
  exit 0
fi

COLLISIONS=()
while IFS= read -r f; do
  if git cat-file -e "$BASE_REF:$f" 2>/dev/null; then
    COLLISIONS+=("$f")
  fi
done <<< "$ADDED"

if [ "${#COLLISIONS[@]}" -gt 0 ]; then
  echo "ERROR: Migration filename collision detected against $BASE_REF:"
  for f in "${COLLISIONS[@]}"; do echo "  - $f"; done
  echo
  echo "Fix: rm the colliding file, run 'supabase migration new <slug>' to get a unique"
  echo "timestamped filename, and move your SQL body into the new file."
  exit 1
fi

echo "No migration filename collisions. OK."

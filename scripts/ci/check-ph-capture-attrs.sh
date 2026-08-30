#!/usr/bin/env bash
# data-ph-capture-attribute-* values bypass autocapture masking by design, so
# they must be static string literals. A JSX-bound expression ({...}) can leak
# member data into analytics payloads.
set -euo pipefail

matches=$(grep -rnE 'data-ph-capture-attribute-[a-zA-Z0-9_-]*=\{' \
  app components lib \
  --include='*.tsx' --include='*.ts' 2>/dev/null || true)

if [ -n "$matches" ]; then
  echo "Dynamic data-ph-capture-attribute-* bindings found — values must be static string literals:"
  echo "$matches"
  exit 1
fi

echo "OK: no dynamic data-ph-capture-attribute-* bindings."

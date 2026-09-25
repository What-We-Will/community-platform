#!/usr/bin/env bash
# data-ph-capture-attribute-* values bypass autocapture masking by design, so
# they must be static string literals. A JSX-bound expression ({...}) can leak
# member data into analytics payloads. Primary enforcement is the AST-based
# no-restricted-syntax rule in eslint.config.mjs; this grep is a redundant
# layer that runs before dependencies are installed. It cannot see multiline
# bindings or spread props — the ESLint rule covers those.
set -euo pipefail

matches=$(grep -rnE 'data-ph-capture-attribute-[a-zA-Z0-9_-]*[[:space:]]*=[[:space:]]*\{' \
  app components lib \
  --include='*.tsx' --include='*.ts' 2>/dev/null || true)

if [ -n "$matches" ]; then
  echo "Dynamic data-ph-capture-attribute-* bindings found — values must be static string literals:"
  echo "$matches"
  exit 1
fi

echo "OK: no dynamic data-ph-capture-attribute-* bindings."

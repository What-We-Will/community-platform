#!/usr/bin/env node
import { readFileSync, statSync } from 'node:fs';

const MAX_BYTES = 10 * 1024 * 1024;

const CHARS = new Map([
  [0x202A, ['bidi', 'LEFT-TO-RIGHT EMBEDDING']],
  [0x202B, ['bidi', 'RIGHT-TO-LEFT EMBEDDING']],
  [0x202C, ['bidi', 'POP DIRECTIONAL FORMATTING']],
  [0x202D, ['bidi', 'LEFT-TO-RIGHT OVERRIDE']],
  [0x202E, ['bidi', 'RIGHT-TO-LEFT OVERRIDE']],
  [0x2066, ['bidi', 'LEFT-TO-RIGHT ISOLATE']],
  [0x2067, ['bidi', 'RIGHT-TO-LEFT ISOLATE']],
  [0x2068, ['bidi', 'FIRST STRONG ISOLATE']],
  [0x2069, ['bidi', 'POP DIRECTIONAL ISOLATE']],
  [0x200B, ['zero-width', 'ZERO WIDTH SPACE']],
  [0x200C, ['zero-width', 'ZERO WIDTH NON-JOINER']],
  [0x200D, ['zero-width', 'ZERO WIDTH JOINER']],
  [0x2060, ['zero-width', 'WORD JOINER']],
  [0xFEFF, ['zero-width', 'ZERO WIDTH NO-BREAK SPACE']],
  [0x00AD, ['zero-width', 'SOFT HYPHEN']],
  [0x2028, ['separator', 'LINE SEPARATOR']],
  [0x2029, ['separator', 'PARAGRAPH SEPARATOR']],
]);

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scan-hidden-chars.mjs <file> [...]');
  process.exit(2);
}

let findings = 0;
let errors = 0;

for (const file of files) {
  let text;
  try {
    if (statSync(file).size > MAX_BYTES) {
      console.error(`${file}: skipped (exceeds ${MAX_BYTES} bytes)`);
      errors++;
      continue;
    }
    text = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`${file}: cannot read (${err.code ?? err.message})`);
    errors++;
    continue;
  }

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let col = 0;
    for (const ch of lines[i]) {
      col++;
      const cp = ch.codePointAt(0);
      const hit = CHARS.get(cp);
      if (!hit) continue;
      const [category, name] = hit;
      const hex = cp.toString(16).toUpperCase().padStart(4, '0');
      console.log(`${file}:${i + 1}:${col} U+${hex} [${category}] <${name}>`);
      findings++;
    }
  }
}

// Exit precedence: findings (1) > errors (2) > clean (0).
// Findings beat errors so a malicious file can't mask itself by also triggering a read failure.
if (findings > 0) process.exit(1);
if (errors > 0) process.exit(2);
console.log('CLEAN — no suspicious Unicode found');
process.exit(0);

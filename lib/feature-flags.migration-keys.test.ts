/**
 * @vitest-environment node
 *
 * A key present in code but absent from the seed migration resolves fail-closed
 * and silently — an unknown key never reaches the database, so `resolveFeature`
 * treats it as undefined and returns false with no thrown error. A key present
 * in a migration but absent from FLAG_KEYS is rejected by isFeatureFlagKey and
 * never read. Neither shows up as a test failure unless a test reads both
 * sources and compares them, which is what this file does.
 */
vi.mock("server-only", () => ({}));

import { readFileSync, readdirSync } from "fs";
import path from "path";
import { FLAG_KEYS } from "./feature-flags";

const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");

/**
 * The seed convention across every feature_flags migration is a fixed column
 * order — key, enabled, ... — so the key literal is the quoted string
 * immediately followed by a bare `true`/`false` literal. That pairing is
 * distinctive enough to isolate the key column without parsing full SQL.
 */
function extractSeededKeys(sql: string): string[] {
  const keyPattern = /'([A-Za-z][A-Za-z0-9]*)',\s*\n\s*(?:true|false),/g;
  const keys: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = keyPattern.exec(sql)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

function allSeededFlagKeys(): string[] {
  const files = readdirSync(MIGRATIONS_DIR).filter(
    (f) => f.includes("feature_flags") && f.endsWith(".sql")
  );
  const keys: string[] = [];
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    if (!sql.includes("insert into public.feature_flags")) continue;
    keys.push(...extractSeededKeys(sql));
  }
  return keys;
}

describe("feature_flags migration seed keys match FLAG_KEYS exactly", () => {
  it("found at least one migration that seeds flag rows", () => {
    expect(allSeededFlagKeys().length).toBeGreaterThan(0);
  });

  it("every key seeded by a migration is a member of FLAG_KEYS", () => {
    const seeded = allSeededFlagKeys();
    for (const key of seeded) {
      expect(FLAG_KEYS).toContain(key);
    }
  });

  it("every FLAG_KEYS entry is seeded by some migration, spelled exactly", () => {
    const seeded = new Set(allSeededFlagKeys());
    for (const key of FLAG_KEYS) {
      expect(seeded.has(key)).toBe(true);
    }
  });

  it("no key is seeded twice across all migrations", () => {
    const seeded = allSeededFlagKeys();
    expect(new Set(seeded).size).toBe(seeded.length);
  });
});

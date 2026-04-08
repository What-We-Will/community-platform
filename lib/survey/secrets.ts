import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface SurveySecrets {
  key: Buffer;
  salt: Buffer;
}

// Vault secret names — prefixed with "community_platform_" to namespace them
// within the Supabase project and prevent collision with other apps.
const VAULT_KEY_NAME = "community_platform_survey_encryption_key";
const VAULT_SALT_NAME = "community_platform_survey_domain_salt";

interface VaultRow {
  name: string;
  decrypted_secret: string;
}

// Structural type for the Supabase client's untyped .schema() path.
// The generated types don't cover vault.decrypted_secrets, so we define
// only the shape we actually call to avoid `as any`.
type VaultQueryable = {
  schema: (s: string) => {
    from: (table: string) => {
      select: (cols: string) => {
        in: (col: string, vals: string[]) => Promise<{
          data: VaultRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

// Promise cache — populated once per serverless instance on first use.
// Caching a Promise (not a resolved value) prevents duplicate Vault fetches
// under concurrent cold-start requests: all callers await the same Promise.
// On rejection, the cache is cleared so the next call retries (transient failures
// don't become permanent).
//
// Key rotation procedure:
//   1. Add the new secret to Vault under a new name (e.g. community_platform_survey_encryption_key_v2)
//   2. Update VAULT_KEY_NAME and keyVersion in this file
//   3. Deploy — new instances encrypt with the new key; old ciphertext still has key_version=1
//   4. Decrypt old rows using v1 key, re-encrypt with v2 key (one-time migration script)
//   5. Remove the old Vault secret
// Note: instances keep the old key cached until recycled. Trigger a redeploy
// immediately after rotating to minimize the window where old keys are in use.
let secretsPromise: Promise<SurveySecrets> | null = null;

/** Clears the secrets cache. Exported for use in tests only. */
export function clearSecretsCache(): void {
  secretsPromise = null;
}

export function loadSecrets(): Promise<SurveySecrets> {
  if (!secretsPromise) {
    secretsPromise = _loadSecrets().catch((err) => {
      secretsPromise = null; // allow retry on next call — transient failures don't stick
      throw err;
    });
  }
  return secretsPromise;
}

/**
 * Queries vault.decrypted_secrets for the survey secret names.
 * Extracted to isolate the `as any` cast and give the result explicit types.
 */
async function queryVaultSecrets(
  supabase: ReturnType<typeof createServiceClient>
): Promise<{ rows: VaultRow[]; error: { message: string } | null }> {
  const { data, error } = await (supabase as unknown as VaultQueryable)
    .schema("vault")
    .from("decrypted_secrets")
    .select("name, decrypted_secret")
    .in("name", [VAULT_KEY_NAME, VAULT_SALT_NAME]);

  if (error) return { rows: [], error };

  // Runtime shape guard — validates the response before trusting any values
  if (!Array.isArray(data)) {
    return { rows: [], error: { message: "Unexpected Vault response shape" } };
  }

  return { rows: data, error: null };
}

/**
 * Loads survey secrets from env vars (local dev / CI) or Supabase Vault (production).
 *
 * Env var path is disabled in production — Vault is the authoritative source there.
 * This prevents stale env vars from bypassing Vault after migration.
 *
 * In non-production, if neither env var is set, throws an explicit dev error
 * rather than silently falling through to Vault (which also won't be configured locally).
 */
async function _loadSecrets(): Promise<SurveySecrets> {
  // Env var path — local dev and CI only
  if (process.env.NODE_ENV !== "production") {
    const hasKey = "SURVEY_ENCRYPTION_KEY" in process.env;
    const hasSalt = "SURVEY_DOMAIN_SALT" in process.env;

    if (!hasKey && !hasSalt) {
      throw new Error(
        "[survey/secrets] SURVEY_ENCRYPTION_KEY and SURVEY_DOMAIN_SALT are not set. " +
        "Add them to .env.local for local development. " +
        "See plans/local/milestones/M9-anonymous-survey/M9-T01-vault-encryption-keys.md for setup instructions."
      );
    }

    const rawKey = process.env.SURVEY_ENCRYPTION_KEY;
    const rawSalt = process.env.SURVEY_DOMAIN_SALT;

    if (!rawKey) throw new Error("SURVEY_ENCRYPTION_KEY is not set");
    if (!rawSalt) throw new Error("SURVEY_DOMAIN_SALT is not set");

    const key = Buffer.from(rawKey, "hex");
    if (key.length !== 32) {
      throw new Error(
        "SURVEY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes for AES-256)"
      );
    }

    const salt = Buffer.from(rawSalt, "hex");
    if (salt.length !== 32) {
      throw new Error(
        "SURVEY_DOMAIN_SALT must be a 64-character hex string (32 bytes)"
      );
    }

    return { key, salt };
  }

  // Vault path — production only
  const supabase = createServiceClient();
  const { rows, error } = await queryVaultSecrets(supabase);

  if (error) {
    // Log details server-side only — don't surface SQL/schema internals upstream
    console.error(`[survey/secrets] Vault query failed: ${error.message}`);
    throw new Error("[survey/secrets] Failed to load secrets from Vault");
  }

  // Assert exactly 2 rows — guards against shadow insertions or collisions
  if (rows.length !== 2) {
    throw new Error(
      `[survey/secrets] Expected exactly 2 Vault secrets, got ${rows.length}`
    );
  }

  const keyRow = rows.find((r) => r.name === VAULT_KEY_NAME);
  const saltRow = rows.find((r) => r.name === VAULT_SALT_NAME);

  if (!keyRow?.decrypted_secret || !saltRow?.decrypted_secret) {
    throw new Error(
      "[survey/secrets] Missing Vault secrets: community_platform_survey_encryption_key and/or community_platform_survey_domain_salt"
    );
  }

  const key = Buffer.from(keyRow.decrypted_secret, "hex");
  if (key.length !== 32) {
    throw new Error(
      "[survey/secrets] survey_encryption_key in Vault must be a 64-character hex string (32 bytes)"
    );
  }

  const salt = Buffer.from(saltRow.decrypted_secret, "hex");
  if (salt.length !== 32) {
    throw new Error(
      "[survey/secrets] survey_domain_salt in Vault must be a 64-character hex string (32 bytes)"
    );
  }

  return { key, salt };
}

import { createServiceClient } from "@/lib/supabase/service";

export interface SurveySecrets {
  key: Buffer;
  salt: Buffer;
}

// Module-level cache — populated once per serverless instance on first use.
// Avoids a Vault round-trip on every submission.
let cachedSecrets: SurveySecrets | null = null;

/** Clears the secrets cache. Exported for use in tests only. */
export function clearSecretsCache(): void {
  cachedSecrets = null;
}

/**
 * Loads survey secrets from env vars (local dev / CI) or Supabase Vault (production).
 *
 * Env var logic:
 *   - If either SURVEY_ENCRYPTION_KEY or SURVEY_DOMAIN_SALT is present, both are required.
 *     This catches partial misconfiguration with a clear error.
 *   - If neither is present, secrets are fetched from Vault.
 */
export async function loadSecrets(): Promise<SurveySecrets> {
  if (cachedSecrets) return cachedSecrets;

  const hasKey = !!process.env.SURVEY_ENCRYPTION_KEY;
  const hasSalt = !!process.env.SURVEY_DOMAIN_SALT;

  if (hasKey || hasSalt) {
    // Env var path — require both
    if (!hasKey) throw new Error("SURVEY_ENCRYPTION_KEY is not set");
    if (!hasSalt) throw new Error("SURVEY_DOMAIN_SALT is not set");

    const key = Buffer.from(process.env.SURVEY_ENCRYPTION_KEY!, "hex");
    if (key.length !== 32) {
      throw new Error(
        "SURVEY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes for AES-256)"
      );
    }

    const salt = Buffer.from(process.env.SURVEY_DOMAIN_SALT!, "hex");
    cachedSecrets = { key, salt };
    return cachedSecrets;
  }

  // Production — fetch from Supabase Vault
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("vault.decrypted_secrets")
    .select("name, decrypted_secret")
    .in("name", ["survey_encryption_key", "survey_domain_salt"]);

  if (error) {
    throw new Error(`[survey/secrets] Failed to load secrets from Vault: ${error.message}`);
  }

  const keyRow = data?.find((r) => r.name === "survey_encryption_key");
  const saltRow = data?.find((r) => r.name === "survey_domain_salt");

  if (!keyRow?.decrypted_secret || !saltRow?.decrypted_secret) {
    throw new Error(
      "[survey/secrets] Missing Vault secrets: survey_encryption_key and/or survey_domain_salt"
    );
  }

  const key = Buffer.from(keyRow.decrypted_secret, "hex");
  const salt = Buffer.from(saltRow.decrypted_secret, "hex");

  if (key.length !== 32) {
    throw new Error(
      "[survey/secrets] survey_encryption_key in Vault must be a 64-character hex string (32 bytes)"
    );
  }

  cachedSecrets = { key, salt };
  return cachedSecrets;
}

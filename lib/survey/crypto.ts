import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

// AES-256-GCM auth tag length in bytes
const AUTH_TAG_BYTES = 16;
// IV length in bytes for GCM (96-bit recommended)
const IV_BYTES = 12;

function getEncryptionKey(keyVersion: number): Buffer {
  if (keyVersion === 1) {
    const raw = process.env.SURVEY_ENCRYPTION_KEY;
    if (!raw) {
      throw new Error("SURVEY_ENCRYPTION_KEY is not set");
    }
    const key = Buffer.from(raw, "hex");
    if (key.length !== 32) {
      throw new Error(
        "SURVEY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes for AES-256)"
      );
    }
    return key;
  }
  throw new Error(`Unsupported key version: ${keyVersion}`);
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * The auth tag is appended to the ciphertext and stored together.
 * Returns ciphertext (hex), iv (hex), and the key version used.
 */
export function encrypt(
  plaintext: string,
  keyVersion: number = 1
): { ciphertext: string; iv: string; keyVersion: number } {
  const key = getEncryptionKey(keyVersion);
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Append auth tag to ciphertext so both are stored in one column
  const combined = Buffer.concat([encrypted, authTag]);

  return {
    ciphertext: combined.toString("hex"),
    iv: iv.toString("hex"),
    keyVersion,
  };
}

/**
 * Decrypts a ciphertext string produced by encrypt().
 * Dispatches on keyVersion to select the correct key — supports key rotation.
 * Throws on failure — callers must handle errors explicitly.
 */
export function decrypt(
  ciphertext: string,
  iv: string,
  keyVersion: number
): string {
  try {
    const key = getEncryptionKey(keyVersion);
    const ivBuffer = Buffer.from(iv, "hex");
    const combined = Buffer.from(ciphertext, "hex");

    const authTag = combined.subarray(combined.length - AUTH_TAG_BYTES);
    const encrypted = combined.subarray(0, combined.length - AUTH_TAG_BYTES);

    const decipher = createDecipheriv("aes-256-gcm", key, ivBuffer);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    // Log error type only — never log ciphertext, plaintext, or key material
    const name = err instanceof Error ? err.constructor.name : "UnknownError";
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[survey/crypto] decrypt failed (v${keyVersion}): ${name}: ${message}`);
    throw err;
  }
}

/**
 * Hashes an email domain with HMAC-SHA256 for deterministic cohort matching
 * ("3 submissions from the same company"). Uses a secret salt as the HMAC key
 * so domain hashes are unlinkable without the key.
 *
 * Accepted tradeoff: a shared key means a compromised SURVEY_DOMAIN_SALT
 * exposes all domain hashes to offline dictionary attack. This is acceptable
 * because the domain set is small and the grouping use case requires
 * deterministic output — per-row salting would defeat cohort matching.
 */
export function hashDomain(domain: string): string {
  const saltHex = process.env.SURVEY_DOMAIN_SALT;
  if (!saltHex) {
    throw new Error("SURVEY_DOMAIN_SALT is not set");
  }
  const key = Buffer.from(saltHex, "hex");

  return createHmac("sha256", key).update(domain).digest("hex");
}

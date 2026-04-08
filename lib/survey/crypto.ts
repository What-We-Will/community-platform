import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

// AES-256-GCM auth tag length in bytes
const AUTH_TAG_BYTES = 16;
// IV length in bytes for GCM (96-bit recommended)
const IV_BYTES = 12;

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * The auth tag is appended to the ciphertext and stored together.
 * Returns ciphertext (hex), iv (hex), and the key version used.
 *
 * Key rotation: keyVersion is stored alongside the ciphertext in survey_sensitive
 * (key_version column). When rotating, the caller passes the new key and increments
 * keyVersion. Decryption resolves version → key via loadSecrets() — extend that
 * function to return a version map when rotation is needed.
 */
export function encrypt(
  plaintext: string,
  key: Buffer,
  keyVersion: number = 1
): { ciphertext: string; iv: string; keyVersion: number } {
  if (key.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (AES-256)");
  }

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
 * Throws a generic DecryptionError on failure — raw OpenSSL errors are
 * stripped to prevent chosen-ciphertext oracle leakage via error messages.
 * GCM auth tag verification rejects tampered ciphertext or IV.
 */
export function decrypt(
  ciphertext: string,
  iv: string,
  key: Buffer
): string {
  if (key.length !== 32) {
    throw new Error("Decryption key must be 32 bytes (AES-256)");
  }

  try {
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
    // Log error type only — never log ciphertext, plaintext, key material,
    // or raw OpenSSL messages (chosen-ciphertext oracle risk)
    const name = err instanceof Error ? err.constructor.name : "UnknownError";
    console.error(`[survey/crypto] decrypt failed: ${name}`);
    throw new Error("Decryption failed");
  }
}

/**
 * Hashes an email domain with HMAC-SHA256 for deterministic cohort matching
 * ("3 submissions from the same company"). Uses a secret salt as the HMAC key
 * so domain hashes are unlinkable without the salt.
 *
 * Accepted tradeoff: a shared salt means a compromised SURVEY_DOMAIN_SALT
 * exposes all domain hashes to offline dictionary attack. This is acceptable
 * because the domain set is small and the grouping use case requires
 * deterministic output — per-row salting would defeat cohort matching.
 */
export function hashDomain(domain: string, salt: Buffer): string {
  return createHmac("sha256", salt).update(domain).digest("hex");
}

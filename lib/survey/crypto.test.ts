import { encrypt, decrypt, hashDomain } from "./crypto";

// AES-256-GCM key: 32 random bytes as 64-char hex
const TEST_KEY = Buffer.from("a".repeat(64), "hex");
const TEST_SALT = Buffer.from("b".repeat(64), "hex");

// ── encrypt / decrypt round-trip ──────────────────────────────────────────────

describe("encrypt → decrypt round-trip", () => {
  it("should recover the original plaintext when given a simple email string", () => {
    const plaintext = "user@example.com";
    const { ciphertext, iv, keyVersion } = encrypt(plaintext, TEST_KEY);
    expect(decrypt(ciphertext, iv, TEST_KEY)).toBe(plaintext);
    expect(keyVersion).toBe(1);
  });

  it("should recover the original plaintext when given a phone number", () => {
    const plaintext = "+1 (555) 000-1234";
    const { ciphertext, iv } = encrypt(plaintext, TEST_KEY);
    expect(decrypt(ciphertext, iv, TEST_KEY)).toBe(plaintext);
  });

  it("should recover the original plaintext when given a unicode string", () => {
    const plaintext = "señor@example.com";
    const { ciphertext, iv } = encrypt(plaintext, TEST_KEY);
    expect(decrypt(ciphertext, iv, TEST_KEY)).toBe(plaintext);
  });

  it("should produce a different ciphertext on each call for the same input", () => {
    const plaintext = "user@example.com";
    const first = encrypt(plaintext, TEST_KEY);
    const second = encrypt(plaintext, TEST_KEY);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.iv).not.toBe(second.iv);
  });

  it("should default to key version 1", () => {
    const { keyVersion } = encrypt("test", TEST_KEY);
    expect(keyVersion).toBe(1);
  });
});

// ── tamper detection (GCM auth tag) ──────────────────────────────────────────

describe("tamper detection", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should throw a generic error when the ciphertext has been modified", () => {
    const { ciphertext, iv } = encrypt("user@example.com", TEST_KEY);
    const tampered = ciphertext.slice(0, -2) + "ff";
    expect(() => decrypt(tampered, iv, TEST_KEY)).toThrow("Decryption failed");
  });

  it("should throw a generic error when the IV has been modified", () => {
    const { ciphertext, iv } = encrypt("user@example.com", TEST_KEY);
    const tamperedIv = iv.slice(0, -2) + "ff";
    expect(() => decrypt(ciphertext, tamperedIv, TEST_KEY)).toThrow("Decryption failed");
  });
});

// ── key validation ────────────────────────────────────────────────────────────

describe("key validation", () => {
  it("should throw when the encryption key is not 32 bytes", () => {
    const shortKey = Buffer.from("deadbeef", "hex");
    expect(() => encrypt("test", shortKey)).toThrow("Encryption key must be 32 bytes");
  });

  it("should throw when the decryption key is not 32 bytes", () => {
    const { ciphertext, iv } = encrypt("test", TEST_KEY);
    const shortKey = Buffer.from("deadbeef", "hex");
    expect(() => decrypt(ciphertext, iv, shortKey)).toThrow("Decryption key must be 32 bytes");
  });
});

// ── hashDomain ────────────────────────────────────────────────────────────────

describe("hashDomain", () => {
  it("should return a 64-character hex string", () => {
    expect(hashDomain("example.com", TEST_SALT)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should return the same hash for the same domain", () => {
    expect(hashDomain("example.com", TEST_SALT)).toBe(hashDomain("example.com", TEST_SALT));
  });

  it("should return different hashes for different domains", () => {
    expect(hashDomain("example.com", TEST_SALT)).not.toBe(hashDomain("other.com", TEST_SALT));
  });
});

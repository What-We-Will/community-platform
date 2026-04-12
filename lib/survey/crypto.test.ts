import { encrypt, decrypt, hashDomain } from "./crypto";

// AES-256-GCM key: 32 random bytes as a 64-char hex string
const TEST_KEY = "a".repeat(64);
const TEST_SALT = "b".repeat(64);

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.SURVEY_ENCRYPTION_KEY;
  delete process.env.SURVEY_DOMAIN_SALT;
  process.env.SURVEY_ENCRYPTION_KEY = TEST_KEY;
  process.env.SURVEY_DOMAIN_SALT = TEST_SALT;
});

describe("encrypt → decrypt round-trip", () => {
  it("should recover the original plaintext when given a simple email string", () => {
    const plaintext = "user@example.com";
    const { ciphertext, iv, keyVersion } = encrypt(plaintext);
    expect(decrypt(ciphertext, iv, keyVersion)).toBe(plaintext);
  });

  it("should recover the original plaintext when given a phone number", () => {
    const plaintext = "+1 (555) 000-1234";
    const { ciphertext, iv, keyVersion } = encrypt(plaintext);
    expect(decrypt(ciphertext, iv, keyVersion)).toBe(plaintext);
  });

  it("should recover the original plaintext when given a unicode string", () => {
    const plaintext = "señor@example.com";
    const { ciphertext, iv, keyVersion } = encrypt(plaintext);
    expect(decrypt(ciphertext, iv, keyVersion)).toBe(plaintext);
  });

  it("should produce a different ciphertext on each call for the same input", () => {
    const plaintext = "user@example.com";
    const first = encrypt(plaintext);
    const second = encrypt(plaintext);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.iv).not.toBe(second.iv);
  });

  it("should default to key version 1", () => {
    const { keyVersion } = encrypt("test");
    expect(keyVersion).toBe(1);
  });
});

describe("AAD (additional authenticated data)", () => {
  it("should decrypt successfully with matching AAD context", () => {
    const plaintext = "user@example.com";
    const aad = "contact:severance-negotiation-2026";
    const { ciphertext, iv, keyVersion } = encrypt(plaintext, 1, aad);
    expect(decrypt(ciphertext, iv, keyVersion, aad)).toBe(plaintext);
  });

  it("should throw when AAD context does not match", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const plaintext = "user@example.com";
    const aad = "contact:severance-negotiation-2026";
    const { ciphertext, iv, keyVersion } = encrypt(plaintext, 1, aad);
    expect(() => decrypt(ciphertext, iv, keyVersion, "wrong:context")).toThrow();
    jest.restoreAllMocks();
  });

  it("should throw when AAD was used for encrypt but omitted for decrypt", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const plaintext = "user@example.com";
    const aad = "contact:severance-negotiation-2026";
    const { ciphertext, iv, keyVersion } = encrypt(plaintext, 1, aad);
    expect(() => decrypt(ciphertext, iv, keyVersion)).toThrow();
    jest.restoreAllMocks();
  });
});

describe("tamper detection", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should throw when the ciphertext has been modified", () => {
    const { ciphertext, iv, keyVersion } = encrypt("user@example.com");
    const tampered = ciphertext.slice(0, -2) + "ff";
    expect(() => decrypt(tampered, iv, keyVersion)).toThrow();
  });

  it("should throw when the IV has been modified", () => {
    const { ciphertext, iv, keyVersion } = encrypt("user@example.com");
    const tamperedIv = iv.slice(0, -2) + "ff";
    expect(() => decrypt(ciphertext, tamperedIv, keyVersion)).toThrow();
  });
});

describe("key misconfiguration", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should throw when SURVEY_ENCRYPTION_KEY is not set", () => {
    delete process.env.SURVEY_ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("SURVEY_ENCRYPTION_KEY is required and not set");
  });

  it("should throw when SURVEY_ENCRYPTION_KEY is not 32 bytes", () => {
    process.env.SURVEY_ENCRYPTION_KEY = "deadbeef";
    expect(() => encrypt("test")).toThrow("must be a 64-character hex string");
  });

  it("should throw when an unsupported key version is requested", () => {
    expect(() => decrypt("abc", "abc", 99)).toThrow("Unsupported key version: 99");
  });
});

describe("hashDomain", () => {
  it("should return a 64-character hex string", () => {
    expect(hashDomain("example.com")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should return the same hash for the same domain", () => {
    expect(hashDomain("example.com")).toBe(hashDomain("example.com"));
  });

  it("should return different hashes for different domains", () => {
    expect(hashDomain("example.com")).not.toBe(hashDomain("other.com"));
  });

  it("should throw when SURVEY_DOMAIN_SALT is not set", () => {
    delete process.env.SURVEY_DOMAIN_SALT;
    expect(() => hashDomain("example.com")).toThrow("SURVEY_DOMAIN_SALT is not set");
  });
});

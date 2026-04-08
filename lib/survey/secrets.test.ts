import { loadSecrets, clearSecretsCache } from "./secrets";

// Mock the service client so tests never hit Supabase
jest.mock("@/lib/supabase/service", () => ({
  createServiceClient: jest.fn(),
}));
import { createServiceClient } from "@/lib/supabase/service";
const mockCreateServiceClient = createServiceClient as jest.Mock;

const TEST_KEY = "a".repeat(64);
const TEST_SALT = "b".repeat(64);
const SHORT_HEX = "deadbeef";

const VAULT_KEY_NAME = "community_platform_survey_encryption_key";
const VAULT_SALT_NAME = "community_platform_survey_domain_salt";

beforeEach(() => {
  jest.clearAllMocks();
  clearSecretsCache();
  delete process.env.SURVEY_ENCRYPTION_KEY;
  delete process.env.SURVEY_DOMAIN_SALT;
});

// ── env var path (non-production) ─────────────────────────────────────────────

describe("env var loading", () => {
  it("should return key and salt buffers when both env vars are set", async () => {
    process.env.SURVEY_ENCRYPTION_KEY = TEST_KEY;
    process.env.SURVEY_DOMAIN_SALT = TEST_SALT;

    const secrets = await loadSecrets();

    expect(secrets.key).toBeInstanceOf(Buffer);
    expect(secrets.key.length).toBe(32);
    expect(secrets.salt).toBeInstanceOf(Buffer);
    expect(secrets.salt.length).toBe(32);
  });

  it("should return the same object on subsequent calls", async () => {
    process.env.SURVEY_ENCRYPTION_KEY = TEST_KEY;
    process.env.SURVEY_DOMAIN_SALT = TEST_SALT;

    const first = await loadSecrets();
    const second = await loadSecrets();

    expect(first).toBe(second);
  });

  it("should throw a dev-friendly error when neither env var is set", async () => {
    await expect(loadSecrets()).rejects.toThrow(
      "SURVEY_ENCRYPTION_KEY and SURVEY_DOMAIN_SALT are not set"
    );
  });

  it("should throw when SURVEY_ENCRYPTION_KEY is not set", async () => {
    process.env.SURVEY_DOMAIN_SALT = TEST_SALT;
    await expect(loadSecrets()).rejects.toThrow("SURVEY_ENCRYPTION_KEY is not set");
  });

  it("should throw when SURVEY_DOMAIN_SALT is not set", async () => {
    process.env.SURVEY_ENCRYPTION_KEY = TEST_KEY;
    await expect(loadSecrets()).rejects.toThrow("SURVEY_DOMAIN_SALT is not set");
  });

  it("should throw when SURVEY_ENCRYPTION_KEY is not 32 bytes", async () => {
    process.env.SURVEY_ENCRYPTION_KEY = SHORT_HEX;
    process.env.SURVEY_DOMAIN_SALT = TEST_SALT;
    await expect(loadSecrets()).rejects.toThrow("must be a 64-character hex string");
  });

  it("should throw when SURVEY_DOMAIN_SALT is not 32 bytes", async () => {
    process.env.SURVEY_ENCRYPTION_KEY = TEST_KEY;
    process.env.SURVEY_DOMAIN_SALT = SHORT_HEX;
    await expect(loadSecrets()).rejects.toThrow("SURVEY_DOMAIN_SALT must be a 64-character hex string");
  });
});

// ── Vault path (production) ───────────────────────────────────────────────────

function buildVaultClient(overrides?: {
  data?: unknown;
  error?: { message: string } | null;
}) {
  const { data = null, error = null } = overrides ?? {};
  return {
    schema: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ data, error }),
        }),
      }),
    }),
  };
}

describe("Vault path", () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it("should return key and salt from Vault in production", async () => {
    const mockClient = buildVaultClient({
      data: [
        { name: VAULT_KEY_NAME, decrypted_secret: TEST_KEY },
        { name: VAULT_SALT_NAME, decrypted_secret: TEST_SALT },
      ],
    });
    mockCreateServiceClient.mockReturnValue(mockClient);

    const secrets = await loadSecrets();

    expect(secrets.key.length).toBe(32);
    expect(secrets.salt.length).toBe(32);
    expect(mockClient.schema).toHaveBeenCalledWith("vault");
  });

  it("should use the Vault path in production even when env vars are set", async () => {
    process.env.SURVEY_ENCRYPTION_KEY = TEST_KEY;
    process.env.SURVEY_DOMAIN_SALT = TEST_SALT;

    const mockClient = buildVaultClient({
      data: [
        { name: VAULT_KEY_NAME, decrypted_secret: TEST_KEY },
        { name: VAULT_SALT_NAME, decrypted_secret: TEST_SALT },
      ],
    });
    mockCreateServiceClient.mockReturnValue(mockClient);

    await loadSecrets();

    expect(mockClient.schema).toHaveBeenCalledWith("vault");
  });

  it("should clear the cache and allow retry after a transient Vault failure", async () => {
    mockCreateServiceClient.mockReturnValueOnce(
      buildVaultClient({ error: { message: "transient error" } })
    );
    await expect(loadSecrets()).rejects.toThrow("Failed to load secrets from Vault");

    // Second call should retry — not return the cached rejection
    mockCreateServiceClient.mockReturnValueOnce(
      buildVaultClient({
        data: [
          { name: VAULT_KEY_NAME, decrypted_secret: TEST_KEY },
          { name: VAULT_SALT_NAME, decrypted_secret: TEST_SALT },
        ],
      })
    );
    const secrets = await loadSecrets();
    expect(secrets.key.length).toBe(32);
  });

  it("should throw a generic error when the Vault query fails", async () => {
    mockCreateServiceClient.mockReturnValue(
      buildVaultClient({ error: { message: "relation does not exist" } })
    );

    await expect(loadSecrets()).rejects.toThrow("Failed to load secrets from Vault");
  });

  it("should throw when the Vault returns an unexpected number of rows", async () => {
    mockCreateServiceClient.mockReturnValue(buildVaultClient({ data: [] }));

    await expect(loadSecrets()).rejects.toThrow("Expected exactly 2 Vault secrets");
  });

  it("should throw when Vault secret names do not match expected names", async () => {
    mockCreateServiceClient.mockReturnValue(
      buildVaultClient({
        data: [
          { name: "wrong_key_name", decrypted_secret: TEST_KEY },
          { name: VAULT_SALT_NAME, decrypted_secret: TEST_SALT },
        ],
      })
    );

    await expect(loadSecrets()).rejects.toThrow("Missing Vault secrets");
  });

  it("should throw when survey_encryption_key from Vault is not 32 bytes", async () => {
    mockCreateServiceClient.mockReturnValue(
      buildVaultClient({
        data: [
          { name: VAULT_KEY_NAME, decrypted_secret: SHORT_HEX },
          { name: VAULT_SALT_NAME, decrypted_secret: TEST_SALT },
        ],
      })
    );

    await expect(loadSecrets()).rejects.toThrow("must be a 64-character hex string");
  });

  it("should throw when survey_domain_salt from Vault is not 32 bytes", async () => {
    mockCreateServiceClient.mockReturnValue(
      buildVaultClient({
        data: [
          { name: VAULT_KEY_NAME, decrypted_secret: TEST_KEY },
          { name: VAULT_SALT_NAME, decrypted_secret: SHORT_HEX },
        ],
      })
    );

    await expect(loadSecrets()).rejects.toThrow("must be a 64-character hex string");
  });
});

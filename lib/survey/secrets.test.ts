import { loadSecrets, clearSecretsCache } from "./secrets";

const TEST_KEY = "a".repeat(64);
const TEST_SALT = "b".repeat(64);

beforeEach(() => {
  jest.clearAllMocks();
  clearSecretsCache();
  delete process.env.SURVEY_ENCRYPTION_KEY;
  delete process.env.SURVEY_DOMAIN_SALT;
});

describe("env var loading", () => {
  it("should return key and salt buffers when both env vars are set", async () => {
    process.env.SURVEY_ENCRYPTION_KEY = TEST_KEY;
    process.env.SURVEY_DOMAIN_SALT = TEST_SALT;

    const secrets = await loadSecrets();

    expect(secrets.key).toBeInstanceOf(Buffer);
    expect(secrets.key.length).toBe(32);
    expect(secrets.salt).toBeInstanceOf(Buffer);
  });

  it("should return cached secrets on subsequent calls", async () => {
    process.env.SURVEY_ENCRYPTION_KEY = TEST_KEY;
    process.env.SURVEY_DOMAIN_SALT = TEST_SALT;

    const first = await loadSecrets();
    const second = await loadSecrets();

    expect(first).toBe(second);
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
    process.env.SURVEY_ENCRYPTION_KEY = "deadbeef";
    process.env.SURVEY_DOMAIN_SALT = TEST_SALT;
    await expect(loadSecrets()).rejects.toThrow("must be a 64-character hex string");
  });
});

/**
 * @jest-environment node
 *
 * Phase 3 — sensitive data path for severance-negotiation-2026.
 * Tests that collective_negotiation validates correctly and routes
 * to survey_sensitive, and that impact_story is encrypted in p_answers.
 */

jest.mock("@/lib/supabase/service", () => ({
  createServiceClient: jest.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";
import { submitSurvey } from "@/lib/actions/survey";

const TEST_KEY = "a".repeat(64);
const TEST_SALT = "b".repeat(64);
const TURNSTILE_TOKEN = "test-token";

function makeMockSupabase(rpcError: { message: string } | null = null) {
  const rpc = jest.fn().mockResolvedValue({ error: rpcError });
  (createServiceClient as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { status: "active" }, error: null }),
    }),
    rpc,
  });
  return rpc;
}

function mockTurnstile(cdata: string) {
  jest.spyOn(global, "fetch").mockResolvedValueOnce({
    json: async () => ({ success: true, action: "survey-submit", cdata }),
  } as Response);
}

const originalEnv = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    SURVEY_ENCRYPTION_KEY: TEST_KEY,
    SURVEY_DOMAIN_SALT: TEST_SALT,
    TURNSTILE_SECRET_KEY: "test-turnstile-secret",
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
  };
});
afterEach(() => {
  jest.restoreAllMocks();
  process.env = originalEnv;
});

describe("submitSurvey — collective_negotiation option validation", () => {
  it("should return a validation error when willingness value is not a valid collective_negotiation option", async () => {
    // Arrange — "disagree" is not in yes/no/maybe options
    mockTurnstile("severance-negotiation-2026");
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: {},
      willingness: "disagree",
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: false, error: "Invalid submission. Please check your answers." });
  });
});

describe("submitSurvey — collective_negotiation routes to survey_sensitive", () => {
  it("should pass the collective_negotiation answer as p_willingness to the RPC", async () => {
    // Arrange — valid willingness value; expect it to reach the RPC as p_willingness
    mockTurnstile("severance-negotiation-2026");
    const rpc = makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: {},
      willingness: "yes",
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "submit_survey",
      expect.objectContaining({
        p_willingness: "yes",
        p_employment_status: "anonymous",
      })
    );
  });
});

describe("submitSurvey — impact_story encryption", () => {
  it("should store impact_story as an encrypted iv:ciphertext string in p_answers", async () => {
    // Arrange — impact_story is encrypted: true; plain text must not reach the DB
    mockTurnstile("severance-negotiation-2026");
    const rpc = makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: { impact_story: "My layoff story." },
      willingness: "yes",
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: true });
    const rpcArgs = rpc.mock.calls[0][1];
    const storedValue = rpcArgs.p_answers.impact_story;
    expect(typeof storedValue).toBe("string");
    // Encrypted values are stored as "iv_hex:ciphertext_hex" — two colon-separated hex segments
    expect(storedValue).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });
});

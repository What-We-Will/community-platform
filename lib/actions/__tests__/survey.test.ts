/**
 * @jest-environment node
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

describe("submitSurvey — config lookup by surveyId", () => {
  it("should return a validation error when the surveyId is not in the config map", async () => {
    // Arrange
    mockTurnstile("unknown-survey-2099");
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "unknown-survey-2099",
      answers: {},
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: false, error: "Invalid submission. Please check your answers." });
  });
});

describe("submitSurvey — Turnstile cdata binds to the submitted surveyId", () => {
  it("should reject a token issued for survey A when submitted to survey B (cross-survey replay)", async () => {
    // Arrange — token was issued for layoff-survey but caller submits to severance-negotiation
    mockTurnstile("layoff-survey-2026");
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: {},
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: false, error: "Verification failed. Please try again." });
  });
});

describe("submitSurvey — scale question type validation", () => {
  it("should return a validation error when a scale answer exceeds the question maximum", async () => {
    // Arrange — satisfaction max is 5; "6" must be rejected
    mockTurnstile("severance-negotiation-2026");
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: { satisfaction: "6" },
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: false, error: "Invalid submission. Please check your answers." });
  });

  it("should return a validation error when a scale answer is not a number", async () => {
    // Arrange
    mockTurnstile("severance-negotiation-2026");
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: { satisfaction: "great" },
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: false, error: "Invalid submission. Please check your answers." });
  });
});

describe("submitSurvey — single-page surveys use 'anonymous' as respondent type", () => {
  it("should call the RPC with p_respondent_type 'anonymous' when no respondentType is provided", async () => {
    // Arrange
    mockTurnstile("severance-negotiation-2026");
    const rpc = makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: {},
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "submit_survey",
      expect.objectContaining({ p_respondent_type: "anonymous" })
    );
  });
});

describe("submitSurvey — conditional survey_sensitive insert", () => {
  it("should call the RPC with p_willingness null when the survey has no sensitive question", async () => {
    // Arrange — severance-negotiation-2026 in Phase 1 has no sensitive question yet
    mockTurnstile("severance-negotiation-2026");
    const rpc = makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: {},
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "submit_survey",
      expect.objectContaining({ p_willingness: null })
    );
  });
});

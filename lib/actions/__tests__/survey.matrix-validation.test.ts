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

function makeMockSupabase() {
  const rpc = jest.fn().mockResolvedValue({ error: null });
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

function mockTurnstile() {
  jest.spyOn(global, "fetch").mockResolvedValueOnce({
    json: async () => ({ success: true, action: "survey-submit", cdata: "severance-negotiation-2026" }),
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

describe("submitSurvey — matrix-radio partial fill acceptance", () => {
  it("should accept a submission where only some rows of a non-required matrix are answered", async () => {
    // Arrange — clauses_assessment is non-required; answering 1 of 3 rows is valid
    mockTurnstile();
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: { clauses_assessment: { non_disparaging: "negotiate" } },
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("should accept a submission where a non-required matrix has no answers at all", async () => {
    // Arrange — empty object is a valid partial fill for non-required
    mockTurnstile();
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: { clauses_assessment: {} },
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: true });
  });
});

describe("submitSurvey — matrix-radio key validation", () => {
  it("should return a validation error when a matrix answer uses an unknown row key", async () => {
    // Arrange — "unknown_clause" is not a valid row in clauses_assessment
    mockTurnstile();
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: { clauses_assessment: { unknown_clause: "negotiate" } },
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: false, error: "Invalid submission. Please check your answers." });
  });

  it("should return a validation error when a matrix answer uses an unknown column value", async () => {
    // Arrange — "strongly_disagree" is not a valid column in clauses_assessment
    mockTurnstile();
    makeMockSupabase();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: { clauses_assessment: { non_disparaging: "strongly_disagree" } },
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: false, error: "Invalid submission. Please check your answers." });
  });
});

describe("submitSurvey — matrix-radio JSONB storage", () => {
  it("should pass the matrix answer to the RPC as a nested object, not a stringified value", async () => {
    // Arrange
    mockTurnstile();
    const rpc = makeMockSupabase();
    const matrixAnswer = { non_disparaging: "negotiate", non_compete: "not_acceptable" };

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (submitSurvey as any)({
      surveyId: "severance-negotiation-2026",
      answers: { clauses_assessment: matrixAnswer },
      turnstileToken: TURNSTILE_TOKEN,
    });

    // Assert
    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "submit_survey",
      expect.objectContaining({
        p_answers: expect.objectContaining({ clauses_assessment: matrixAnswer }),
      })
    );
  });
});

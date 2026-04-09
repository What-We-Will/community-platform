"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { encrypt, hashDomain } from "@/lib/survey/crypto";
import { surveyConfigs } from "@/lib/survey/config";
import type { SurveyActionResult, SurveyAnswers, SurveySection } from "@/lib/survey/types";

// Validate required env vars on first cold start (prod only).
// Fails fast with a clear error in Vercel logs rather than silently
// losing user submissions when a var is missing.
if (process.env.NODE_ENV === "production") {
  const required = [
    "SURVEY_ENCRYPTION_KEY",
    "SURVEY_DOMAIN_SALT",
    "TURNSTILE_SECRET_KEY",
  ] as const;
  for (const name of required) {
    if (!process.env[name]) {
      throw new Error(`[survey/actions] Missing required env var: ${name}`);
    }
  }
}

function logSubmission(
  surveyId: string,
  status: "ok" | "rejected" | "error",
  reason?: string,
) {
  const entry = {
    event: "survey_submission",
    surveyId,
    status,
    ...(reason && { reason }),
    ts: new Date().toISOString(),
  };
  if (status === "ok") {
    console.log(JSON.stringify(entry));
  } else {
    console.error(JSON.stringify(entry));
  }
}

const GENERIC_ERROR: SurveyActionResult = {
  ok: false,
  error: "Submission failed. Please try again.",
};

const SURVEY_CLOSED_ERROR: SurveyActionResult = {
  ok: false,
  error: "This survey is not currently accepting responses.",
};

const VERIFICATION_ERROR: SurveyActionResult = {
  ok: false,
  error: "Verification failed. Please try again.",
};

const VALIDATION_ERROR: SurveyActionResult = {
  ok: false,
  error: "Invalid submission. Please check your answers.",
};

function validationError(surveyId: string, detail: string): SurveyActionResult {
  logSubmission(surveyId, "rejected", `validation:${detail}`);
  return VALIDATION_ERROR;
}

async function verifyCaptcha(
  token: string,
  surveyId: string,
  expectedAction: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[survey/actions] TURNSTILE_SECRET_KEY is not set");
    return false;
  }
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }
    );
    const result = (await res.json()) as {
      success: boolean;
      action?: string;
      cdata?: string;
      hostname?: string;
    };
    if (!result.success) return false;
    // Hard-assert action and cdata — reject if missing or mismatched.
    // Test/dummy Turnstile keys may not return these fields; set
    // TURNSTILE_SKIP_ACTION_CHECK=1 in dev/test environments only.
    if (!process.env.TURNSTILE_SKIP_ACTION_CHECK) {
      if (result.action !== expectedAction) {
        console.error(
          `[survey/actions] Turnstile action mismatch: expected=${expectedAction} got=${result.action}`
        );
        return false;
      }
      if (result.cdata !== surveyId) {
        console.error(
          `[survey/actions] Turnstile cdata mismatch: expected=${surveyId} got=${result.cdata}`
        );
        return false;
      }
    }
    // Hostname pinning: reject tokens issued for other domains.
    // Set TURNSTILE_ALLOWED_HOSTNAME per environment (e.g. "www.whatwewill.org").
    const allowedHostname = process.env.TURNSTILE_ALLOWED_HOSTNAME;
    if (allowedHostname && result.hostname !== allowedHostname) {
      console.error(
        `[survey/actions] Turnstile hostname mismatch: expected=${allowedHostname} got=${result.hostname}`
      );
      return false;
    }
    return true;
  } catch (err) {
    const name = err instanceof Error ? err.constructor.name : "UnknownError";
    console.error(`[survey/actions] Turnstile request failed: ${name}`);
    return false;
  }
}

const CONTACT_TYPES = ["email", "phone", "signal", "other"] as const;
type ContactType = (typeof CONTACT_TYPES)[number];

/**
 * Submits the complete survey in a single Turnstile-gated action.
 * Inserts into two separate tables (survey_responses + survey_sensitive)
 * with no FK linking them — preserving respondent anonymity at the data layer.
 */
export async function submitSurvey(data: {
  surveyId: string;
  respondentType?: string;
  answers: SurveyAnswers;
  willingness?: string;
  contact?: string;
  contactType?: string;
  turnstileToken: string;
  sessionToken?: string;
}): Promise<SurveyActionResult> {
  try {
    // Look up survey config — reject unknown survey IDs
    const surveyConfig = surveyConfigs[data.surveyId];
    if (!surveyConfig) {
      logSubmission(data.surveyId, "rejected", "unknown_survey_id");
      return VALIDATION_ERROR;
    }

    // Verify Turnstile — single-use token, one check for entire submission
    const captchaOk = await verifyCaptcha(data.turnstileToken, data.surveyId, "survey-submit");
    if (!captchaOk) {
      logSubmission(data.surveyId, "rejected", "turnstile_failed");
      return VERIFICATION_ERROR;
    }

    // Check survey status — fail closed: no row or non-active = reject
    const supabase = createServiceClient();
    const { data: meta, error: metaError } = await supabase
      .from("survey_meta")
      .select("status")
      .eq("survey_id", data.surveyId)
      .single();

    if (metaError || !meta || meta.status !== "active") {
      logSubmission(data.surveyId, "rejected", `survey_not_active:${meta?.status ?? "no_row"}`);
      return SURVEY_CLOSED_ERROR;
    }

    // ── Respondent type handling ────────────────────────────────────────────
    let respondentType: string;
    let applicableQuestions: typeof surveyConfig.questions;

    if (data.respondentType !== undefined) {
      // Multi-page: validate respondentType against config
      const respondentTypeConfig = surveyConfig.respondentTypes?.find(
        (rt) => rt.value === data.respondentType
      );
      if (!respondentTypeConfig) return validationError(data.surveyId, "invalid_respondent_type");

      const respondentSection: SurveySection = respondentTypeConfig.section;
      respondentType = data.respondentType;

      applicableQuestions = surveyConfig.questions.filter(
        (q) =>
          q.storageTarget === "responses" &&
          q.id !== "respondent_type" &&
          (q.section === respondentSection || q.section === "everyone")
      );
    } else {
      // Single-page: no section filtering, respondentType is "anonymous"
      respondentType = "anonymous";

      applicableQuestions = surveyConfig.questions.filter(
        (q) => q.storageTarget === "responses"
      );
    }

    // ── Validate & build survey_responses ──────────────────────────────────

    // Reject oversized answer payloads
    if (Object.keys(data.answers).length > applicableQuestions.length) {
      return validationError(data.surveyId, "oversized_payload");
    }

    // Reject any answer keys not in the applicable set
    const allowedKeys = new Set(applicableQuestions.map((q) => q.id));
    for (const key of Object.keys(data.answers)) {
      if (!allowedKeys.has(key)) {
        return validationError(data.surveyId, `unknown_key:${key}`);
      }
    }

    // Defense-in-depth: reconstruct answers using only allowed keys.
    // The raw submitted object must never reach the DB insert directly.
    const sanitizedAnswers: SurveyAnswers = {};
    for (const key of allowedKeys) {
      if (key in data.answers) {
        sanitizedAnswers[key] = data.answers[key];
      }
    }

    // Validate required fields
    const requiredErrors: Record<string, string> = {};
    for (const q of applicableQuestions) {
      if (!q.required) continue;
      const val = sanitizedAnswers[q.id];
      const missing =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (missing) {
        requiredErrors[q.id] = "This field is required.";
      }
    }
    if (Object.keys(requiredErrors).length > 0) {
      logSubmission(data.surveyId, "rejected", `required_fields:${Object.keys(requiredErrors).join(",")}`);
      return {
        ok: false,
        error: "Please complete the required fields.",
        fieldErrors: requiredErrors,
      };
    }

    // Validate enum values for single-select and multi-select; range for scale
    for (const q of applicableQuestions) {
      const val = sanitizedAnswers[q.id];
      if (val === undefined || val === "" || val === null) continue;

      if (q.type === "single-select" && q.options) {
        if (typeof val !== "string" || !q.options.includes(val)) {
          return VALIDATION_ERROR;
        }
      }

      if (q.type === "multi-select" && q.options) {
        const arr = Array.isArray(val) ? val : [val];
        if (!arr.every((v) => typeof v === "string" && q.options!.includes(v as string))) {
          return VALIDATION_ERROR;
        }
      }

      if (q.type === "dropdown" && q.options) {
        if (typeof val !== "string" || !q.options.includes(val)) {
          return VALIDATION_ERROR;
        }
      }

      if (q.type === "numeric" && q.min != null && q.max != null) {
        if (typeof val !== "string") return VALIDATION_ERROR;
        const num = parseInt(val, 10);
        if (isNaN(num) || num < q.min || num > q.max) {
          return {
            ok: false,
            error: "Invalid submission. Please check your answers.",
            fieldErrors: { [q.id]: `Please enter a number between ${q.min} and ${q.max}.` },
          };
        }
      }

      if (q.type === "scale" && q.min != null && q.max != null) {
        if (typeof val !== "string") return VALIDATION_ERROR;
        const num = parseInt(val, 10);
        if (isNaN(num) || num < q.min || num > q.max) {
          return VALIDATION_ERROR;
        }
      }

      if (q.type === "matrix-radio" && q.rows && q.columns) {
        if (typeof val !== "object" || Array.isArray(val) || val === null) {
          return VALIDATION_ERROR;
        }
        const obj = val as Record<string, string>;
        const validRows = new Set(q.rows.map((r) => r.key));
        const validCols = new Set(q.columns.map((c) => c.key));

        // Validate answered rows: each key must be a valid row, each value a valid column
        for (const [rowKey, rowVal] of Object.entries(obj)) {
          if (!validRows.has(rowKey) || !validCols.has(rowVal)) return VALIDATION_ERROR;
        }

        // Only enforce all-rows-present when question is required
        if (q.required) {
          for (const row of q.rows) {
            if (!(row.key in obj)) return VALIDATION_ERROR;
          }
        }
      }

    }

    // Validate text length — explicit maxLength or 500-char default for short-answer
    const SHORT_ANSWER_MAX = 500;
    for (const q of applicableQuestions) {
      const val = sanitizedAnswers[q.id];
      if (typeof val !== "string") continue;
      const limit = q.maxLength ?? (q.type === "short-answer" ? SHORT_ANSWER_MAX : 0);
      if (limit > 0 && val.length > limit) {
        return VALIDATION_ERROR;
      }
    }

    // Build JSONB answers — encrypt designated fields
    // Encrypted values stored as "iv_hex:ciphertext_hex" (single string, no JSON wrapper)
    const jsonbAnswers: Record<string, string | string[] | Record<string, string>> = {};
    for (const q of applicableQuestions) {
      const val = sanitizedAnswers[q.id];
      if (val === undefined || val === null || val === "") continue;

      if (q.encrypted && typeof val === "string" && val.length > 0) {
        const aadContext = `${q.id}:${data.surveyId}`;
        const { ciphertext, iv } = encrypt(val, 1, aadContext);
        jsonbAnswers[q.id] = `${iv}:${ciphertext}`;
      } else {
        jsonbAnswers[q.id] = val;
      }
    }

    // ── Validate & build survey_sensitive ──────────────────────────────────

    // Find the sensitive single-select question (willingness equivalent)
    const sensitiveQuestion = surveyConfig.questions.find(
      (q) => q.storageTarget === "sensitive" && q.type === "single-select"
    );

    let willingnessValue: string | null = null;

    if (sensitiveQuestion) {
      // Survey has a sensitive question — validate willingness if provided
      if (!sensitiveQuestion.options?.length) {
        console.error("[survey/actions] sensitive question missing options in config");
        return GENERIC_ERROR;
      }
      if (sensitiveQuestion.required && !data.willingness) {
        return {
          ok: false,
          error: "Please complete the required fields.",
          fieldErrors: { [sensitiveQuestion.id]: "This field is required." },
        };
      }
      if (data.willingness && !sensitiveQuestion.options.includes(data.willingness)) {
        return VALIDATION_ERROR;
      }
      willingnessValue = data.willingness ?? null;
    }
    // If no sensitive question: willingnessValue stays null → RPC skips survey_sensitive insert

    // Validate contactType if contact is provided
    const contactRaw = data.contact?.trim() ?? "";
    let contactType: ContactType | null = null;

    if (contactRaw.length > 0) {
      if (
        !data.contactType ||
        !CONTACT_TYPES.includes(data.contactType as ContactType)
      ) {
        return VALIDATION_ERROR;
      }
      contactType = data.contactType as ContactType;
    }

    // Encrypt contact if provided
    let encryptedContact: string | null = null;
    let contactIv: string | null = null;
    let domainHash: string | null = null;
    const keyVersion = 1;

    if (contactRaw.length > 0 && contactType) {
      const contactAad = `contact:${data.surveyId}`;
      const { ciphertext, iv } = encrypt(contactRaw, keyVersion, contactAad);
      encryptedContact = ciphertext;
      contactIv = iv;

      // Hash domain for email contacts (cohort matching)
      if (contactType === "email") {
        const atIdx = contactRaw.lastIndexOf("@");
        if (atIdx !== -1) {
          const domain = contactRaw.slice(atIdx + 1).toLowerCase();
          domainHash = hashDomain(domain);
        }
      }
    }

    // Employment status: "anonymous" for single-page, respondentType for multi-page
    const employmentStatus =
      data.respondentType !== undefined ? data.respondentType : "anonymous";

    // ── Atomic insert via RPC — both rows succeed or neither does ────────
    const { error: rpcError } = await supabase.rpc("submit_survey", {
      p_survey_id: data.surveyId,
      p_respondent_type: respondentType,
      p_answers: jsonbAnswers,
      p_employment_status: employmentStatus,
      p_willingness: willingnessValue,
      p_encrypted_contact: encryptedContact,
      p_contact_iv: contactIv,
      p_contact_type: contactType,
      p_domain_hash: domainHash,
      p_key_version: keyVersion,
      p_session_token: data.sessionToken ?? null,
    });

    if (rpcError) {
      // Postgres 23505 = unique_violation → duplicate session_token
      if (rpcError.code === "23505") {
        logSubmission(data.surveyId, "rejected", "duplicate_submission");
        return {
          ok: false,
          error: "You have already submitted this survey.",
        };
      }
      logSubmission(data.surveyId, "error", `rpc_failed:${rpcError.message}`);
      return GENERIC_ERROR;
    }

    logSubmission(data.surveyId, "ok");
    return { ok: true };
  } catch (err) {
    const name = err instanceof Error ? err.constructor.name : "UnknownError";
    const message = err instanceof Error ? err.message : String(err);
    logSubmission(data.surveyId, "error", `unexpected:${name}:${message}`);
    return GENERIC_ERROR;
  }
}

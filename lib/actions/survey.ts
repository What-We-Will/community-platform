"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { encrypt, hashDomain } from "@/lib/survey/crypto";
import config from "@/lib/survey/config";
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

async function verifyCaptcha(token: string): Promise<boolean> {
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
    const result = (await res.json()) as { success: boolean };
    return result.success === true;
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
  respondentType: string;
  answers: SurveyAnswers;
  willingness: string;
  contact?: string;
  contactType?: string;
  turnstileToken: string;
}): Promise<SurveyActionResult> {
  try {
    // Verify Turnstile — single-use token, one check for entire submission
    const captchaOk = await verifyCaptcha(data.turnstileToken);
    if (!captchaOk) return VERIFICATION_ERROR;

    // Check survey status — fail closed: no row or non-active = reject
    const supabase = createServiceClient();
    const { data: meta, error: metaError } = await supabase
      .from("survey_meta")
      .select("status")
      .eq("survey_id", config.surveyId)
      .single();

    if (metaError || !meta || meta.status !== "active") {
      console.error(
        `[survey/actions] submitSurvey: survey not active — status=${meta?.status ?? "no row"} error=${metaError?.message ?? "none"}`
      );
      return SURVEY_CLOSED_ERROR;
    }

    // Reject oversized answer payloads
    if (Object.keys(data.answers).length > config.questions.length) {
      return VALIDATION_ERROR;
    }

    // Validate respondentType against config
    const respondentTypeConfig = config.respondentTypes.find(
      (rt) => rt.value === data.respondentType
    );
    if (!respondentTypeConfig) return VALIDATION_ERROR;

    const respondentSection: SurveySection = respondentTypeConfig.section;

    // ── Validate & build survey_responses ──────────────────────────────────

    // Questions applicable to this respondent in survey_responses
    // Excludes 'respondent_type' (stored as a column, not in JSONB answers)
    const applicableQuestions = config.questions.filter(
      (q) =>
        q.storageTarget === "responses" &&
        q.id !== "respondent_type" &&
        (q.section === respondentSection || q.section === "everyone")
    );

    // Reject any answer keys not in the applicable set
    const allowedKeys = new Set(applicableQuestions.map((q) => q.id));
    for (const key of Object.keys(data.answers)) {
      if (!allowedKeys.has(key)) {
        return VALIDATION_ERROR;
      }
    }

    // Validate required fields
    for (const q of applicableQuestions) {
      if (!q.required) continue;
      const val = data.answers[q.id];
      const missing =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (missing) return VALIDATION_ERROR;
    }

    // Validate enum values for single-select and multi-select
    for (const q of applicableQuestions) {
      const val = data.answers[q.id];
      if (val === undefined || val === "" || val === null) continue;

      if (q.type === "single-select" && q.options) {
        if (typeof val !== "string" || !q.options.includes(val)) {
          return VALIDATION_ERROR;
        }
      }

      if (q.type === "multi-select" && q.options) {
        const arr = Array.isArray(val) ? val : [val];
        if (!arr.every((v) => typeof v === "string" && q.options!.includes(v))) {
          return VALIDATION_ERROR;
        }
      }
    }

    // Validate free-text length
    for (const q of applicableQuestions) {
      if (!q.maxLength) continue;
      const val = data.answers[q.id];
      if (typeof val === "string" && val.length > q.maxLength) {
        return VALIDATION_ERROR;
      }
    }

    // Build JSONB answers — encrypt designated fields
    // Encrypted values stored as "iv_hex:ciphertext_hex" (single string, no JSON wrapper)
    const jsonbAnswers: Record<string, string | string[]> = {};
    for (const q of applicableQuestions) {
      const val = data.answers[q.id];
      if (val === undefined || val === null || val === "") continue;

      if (q.encrypted && typeof val === "string" && val.length > 0) {
        const { ciphertext, iv } = encrypt(val);
        jsonbAnswers[q.id] = `${iv}:${ciphertext}`;
      } else {
        jsonbAnswers[q.id] = val;
      }
    }

    // ── Validate & build survey_sensitive ──────────────────────────────────

    // Validate willingness against config options
    const willingnessQuestion = config.questions.find((q) => q.id === "willingness");
    if (!willingnessQuestion?.options?.length) {
      console.error("[survey/actions] willingness question missing from config or has no options");
      return GENERIC_ERROR;
    }
    if (!willingnessQuestion.options.includes(data.willingness)) {
      return VALIDATION_ERROR;
    }

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
      const { ciphertext, iv } = encrypt(contactRaw, keyVersion);
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

    // ── Insert both rows ──────────────────────────────────────────────────
    // Two separate inserts, no FK — anonymity preserved at the data layer.

    // Insert into survey_responses
    const { error: responseError } = await supabase
      .from("survey_responses")
      .insert({
        survey_id: config.surveyId,
        respondent_type: data.respondentType,
        answers: jsonbAnswers,
      });

    if (responseError) {
      console.error(
        `[survey/actions] survey_responses insert failed: ${responseError.constructor?.name ?? "SupabaseError"}: ${responseError.message}`
      );
      return GENERIC_ERROR;
    }

    // Insert into survey_sensitive
    const { error: sensitiveError } = await supabase
      .from("survey_sensitive")
      .insert({
        survey_id: config.surveyId,
        employment_status: data.respondentType,
        willingness: data.willingness,
        encrypted_contact: encryptedContact,
        contact_iv: contactIv,
        contact_type: contactType,
        domain_hash: domainHash,
        key_version: keyVersion,
      });

    if (sensitiveError) {
      console.error(
        `[survey/actions] survey_sensitive insert failed: ${sensitiveError.constructor?.name ?? "SupabaseError"}: ${sensitiveError.message}`
      );
      return GENERIC_ERROR;
    }

    return { ok: true };
  } catch (err) {
    const name = err instanceof Error ? err.constructor.name : "UnknownError";
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[survey/actions] submitSurvey unexpected error: ${name}: ${message}`);
    return GENERIC_ERROR;
  }
}

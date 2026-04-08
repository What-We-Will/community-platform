"use client";

import { useState, useEffect, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SurveySection } from "./survey-section";
import { SurveyExplainer } from "./survey-explainer";
import { SurveyTrustSection } from "./survey-trust-section";
import { submitSurvey } from "@/lib/actions/survey";
import config from "@/lib/survey/config";
import type { SurveyAnswers, SurveyStep, SurveySection as SurveySectionType } from "@/lib/survey/types";

const STORAGE_KEY = `survey_submitted_${config.surveyId}`;

const CONTACT_TYPE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "signal", label: "Signal" },
  { value: "other", label: "Other" },
] as const;

type ContactTypeValue = "email" | "phone" | "signal" | "other";

// Questions by section bucket
function getQuestionsForStep(step: SurveyStep, respondentSection: SurveySectionType | null) {
  if (step === "s1") {
    return config.questions.filter((q) => q.section === "everyone");
  }
  if ((step === "s2" || step === "s3") && respondentSection) {
    return config.questions.filter(
      (q) =>
        q.section === respondentSection &&
        q.storageTarget === "responses"
    );
  }
  if (step === "s4") {
    return config.questions.filter((q) => q.section === "closing");
  }
  return [];
}

function validateQuestions(
  questions: ReturnType<typeof getQuestionsForStep>,
  answers: SurveyAnswers
): Record<string, string> {
  const errs: Record<string, string> = {};

  for (const q of questions) {
    const val = answers[q.id];
    const isEmpty =
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0);

    if (q.required && isEmpty) {
      errs[q.id] = "This field is required.";
      continue;
    }
    if (isEmpty) continue;

    if (q.type === "single-select" && q.options) {
      if (typeof val !== "string" || !q.options.includes(val)) {
        errs[q.id] = "Please select a valid option.";
      }
    }

    if (q.type === "multi-select" && q.options) {
      const arr = Array.isArray(val) ? val : [val];
      if (!arr.every((v) => typeof v === "string" && q.options!.includes(v))) {
        errs[q.id] = "One or more selected values are invalid.";
      }
    }

    if (q.maxLength && typeof val === "string" && val.length > q.maxLength) {
      errs[q.id] = `Response must be ${q.maxLength.toLocaleString()} characters or fewer.`;
    }
  }

  return errs;
}

export function SurveyForm() {
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [step, setStep] = useState<SurveyStep>("preamble");
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactType, setContactType] = useState<ContactTypeValue | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(undefined);

  // UX-only guard — prevents accidental resubmission, not adversarial bypass.
  // Server-side dedup is intentionally absent to preserve respondent anonymity.
  // Skipped in dev so developers can resubmit without clearing localStorage.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" && localStorage.getItem(STORAGE_KEY)) {
      setAlreadySubmitted(true);
    }
  }, []);

  const respondentTypeValue =
    typeof answers.respondent_type === "string" ? answers.respondent_type : "";
  const respondentSection =
    config.respondentTypes.find((rt) => rt.value === respondentTypeValue)?.section ?? null;

  function handleChange(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function handleNext() {
    const questions = getQuestionsForStep(step, respondentSection);
    const errs = validateQuestions(questions, answers);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    if (step === "s1") {
      if (respondentSection === "laid_off") setStep("s2");
      else if (respondentSection === "current_employee") setStep("s3");
    } else if (step === "s2" || step === "s3") {
      setStep("s4");
    }
  }

  function handleBack() {
    setErrors({});
    if (step === "s2" || step === "s3") setStep("s1");
    else if (step === "s4") setStep(respondentSection === "laid_off" ? "s2" : "s3");
    else if (step === "s1") setStep("preamble");
  }

  async function handleSubmit() {
    // Validate s4 questions
    const s4Questions = getQuestionsForStep("s4", null);
    const errs = validateQuestions(s4Questions, answers);

    // Validate contactType if contact is provided
    const contact = typeof answers.contact === "string" ? answers.contact.trim() : "";
    if (contact && !contactType) {
      errs.contactType = "Please select your preferred contact method.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!turnstileToken) {
      setSubmitError("Please wait for the security check to complete.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build responses answers — exclude sensitive fields
      const responsesAnswers: SurveyAnswers = {};
      for (const [k, v] of Object.entries(answers)) {
        if (k === "respondent_type" || k === "willingness" || k === "contact") continue;
        responsesAnswers[k] = v;
      }

      const willingness = typeof answers.willingness === "string" ? answers.willingness : "";
      const result = await submitSurvey({
        respondentType: respondentTypeValue,
        answers: responsesAnswers,
        willingness,
        contact: contact || undefined,
        contactType: contact && contactType ? contactType : undefined,
        turnstileToken,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      // Success — flag in localStorage and advance
      localStorage.setItem(STORAGE_KEY, "1");
      setStep("submitted");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Already submitted ──────────────────────────────────────────────────────
  if (alreadySubmitted) {
    return (
      <div className="rounded-lg border bg-muted/40 p-8 text-center">
        <p className="text-lg font-semibold">You&apos;ve already submitted a response.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you — we&apos;ll be in touch with next steps.
        </p>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === "submitted") {
    return (
      <div className="rounded-lg border bg-muted/40 p-8 text-center">
        <p className="text-2xl font-bold">Thank you.</p>
        <p className="mt-2 text-muted-foreground">
          Your response has been recorded. We&apos;ll be in touch with next steps.
        </p>
        <p className="mt-4 text-xs text-muted-foreground/70">
          No identifying information was stored alongside your survey answers.
        </p>
      </div>
    );
  }

  // ── Progress indicator (s1–s4) ─────────────────────────────────────────────
  const STEPS: SurveyStep[] = ["s1", "s2", "s3", "s4"];
  const currentStepIndex = STEPS.indexOf(step);
  const visibleSteps = respondentSection === "laid_off" ? ["s1", "s2", "s4"] : ["s1", "s3", "s4"];
  const progressTotal = visibleSteps.length;
  const progressCurrent = visibleSteps.indexOf(step) + 1;

  // ── Preamble ───────────────────────────────────────────────────────────────
  if (step === "preamble") {
    return (
      <div className="space-y-6">
        <SurveyExplainer
          companyName={config.companyName}
          description={config.description}
        />
        <SurveyTrustSection />
        <Button className="w-full sm:w-auto" onClick={() => setStep("s1")}>
          Begin Survey
        </Button>
      </div>
    );
  }

  // ── Section steps ──────────────────────────────────────────────────────────
  const currentQuestions = getQuestionsForStep(step, respondentSection);
  const contact = typeof answers.contact === "string" ? answers.contact.trim() : "";

  return (
    <div className="space-y-8">
      {/* Progress */}
      {currentStepIndex >= 0 && (
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {Array.from({ length: progressTotal }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i < progressCurrent
                    ? "bg-primary"
                    : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            Step {progressCurrent} of {progressTotal}
          </span>
        </div>
      )}

      {/* Questions */}
      <SurveySection
        questions={currentQuestions}
        answers={answers}
        errors={errors}
        companyName={config.companyName}
        respondentTypes={config.respondentTypes}
        onChange={handleChange}
      />

      {/* Contact type selector — shown in s4 when contact has a value */}
      {step === "s4" && contact.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            What type of contact did you provide?
            <span className="ml-0.5 text-destructive">*</span>
          </Label>
          <RadioGroup
            value={contactType}
            onValueChange={(v) => {
              setContactType(v as ContactTypeValue);
              if (errors.contactType) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.contactType;
                  return next;
                });
              }
            }}
            name="contactType"
            className="flex flex-wrap gap-4"
          >
            {CONTACT_TYPE_OPTIONS.map((opt) => (
              <RadioGroupItem key={opt.value} value={opt.value}>
                {opt.label}
              </RadioGroupItem>
            ))}
          </RadioGroup>
          {errors.contactType && (
            <p className="text-sm text-destructive" role="alert">
              {errors.contactType}
            </p>
          )}
        </div>
      )}

      {/* Turnstile — shown on final step */}
      {step === "s4" && (
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            options={{ action: "survey-submit", cData: config.surveyId }}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />
        ) : (
          <p className="text-sm text-destructive" role="alert">
            [Config] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set — submission is disabled.
          </p>
        )
      )}

      {/* Server error */}
      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting}
        >
          Back
        </Button>

        {step !== "s4" ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !turnstileToken}
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SurveySection } from "./survey-section";
import { SurveyExplainer } from "./survey-explainer";
import { SurveyTrustSection } from "./survey-trust-section";
import { submitSurvey } from "@/lib/actions/survey";
import type { SurveyConfig, SurveyAnswers } from "@/lib/survey/types";

interface SurveyFormSingleProps {
  config: SurveyConfig;
}

export function SurveyFormSingle({ config }: SurveyFormSingleProps) {
  const STORAGE_KEY = `survey_submitted_${config.surveyId}`;

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactOptIn, setContactOptIn] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(undefined);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" && localStorage.getItem(STORAGE_KEY)) {
      setAlreadySubmitted(true);
    }
  }, [STORAGE_KEY]);

  function handleChange(id: string, value: string | string[] | Record<string, string>) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  async function handleSubmit() {
    if (!turnstileToken) {
      setSubmitError("Please wait for the security check to complete.");
      return;
    }

    // Client-side required field validation
    const fieldErrors: Record<string, string> = {};
    for (const q of config.questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      const missing =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (missing) {
        fieldErrors[q.id] = "This field is required.";
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setSubmitError("Please complete the required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Find the sensitive single-select question (willingness equivalent)
      const sensitiveQ = config.questions.find(
        (q) => q.storageTarget === "sensitive" && q.type === "single-select"
      );
      const willingness = sensitiveQ
        ? (typeof answers[sensitiveQ.id] === "string" ? (answers[sensitiveQ.id] as string) : undefined)
        : undefined;

      // Extract contact value — only if user opted in
      const contact = contactOptIn ? contactEmail.trim() : "";

      // Build responses-only answers (exclude sensitive questions)
      const sensitiveIds = new Set(
        config.questions.filter((q) => q.storageTarget === "sensitive").map((q) => q.id)
      );
      const responsesAnswers: SurveyAnswers = {};
      for (const [k, v] of Object.entries(answers)) {
        if (!sensitiveIds.has(k)) responsesAnswers[k] = v;
      }

      const result = await submitSurvey({
        surveyId: config.surveyId,
        answers: responsesAnswers,
        willingness,
        contact: contact || undefined,
        contactType: contact ? "email" : undefined,
        turnstileToken,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      localStorage.setItem(STORAGE_KEY, "1");
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

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

  if (submitted) {
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

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="space-y-8">
      <SurveyExplainer
        title={config.title}
        companyName={config.companyName}
        description={config.description}
      />
      <SurveyTrustSection />

      <SurveySection
        questions={config.questions.filter((q) => q.id !== "contact" && q.id !== "impact_story")}
        answers={answers}
        errors={errors}
        companyName={config.companyName}
        onChange={handleChange}
      />

      {/* Contact opt-in: checkbox + conditional email field */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Checkbox
            id="contact-opt-in"
            checked={contactOptIn}
            onCheckedChange={(checked) => {
              const isChecked = checked === true;
              setContactOptIn(isChecked);
              if (!isChecked) {
                setContactEmail("");
              }
            }}
            className="mt-0.5"
          />
          <Label
            htmlFor="contact-opt-in"
            className="cursor-pointer text-sm font-medium leading-snug"
          >
            Can we reach out to you about our plans and progress?
          </Label>
        </div>
        {contactOptIn && (
          <Input
            id="contact-email"
            type="email"
            placeholder="Your email address"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            maxLength={100}
            className="max-w-sm"
          />
        )}
      </div>

      <SurveySection
        questions={config.questions.filter((q) => q.id === "impact_story")}
        answers={answers}
        errors={errors}
        companyName={config.companyName}
        onChange={handleChange}
      />

      {siteKey ? (
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          options={{ action: "survey-submit", cData: config.surveyId }}
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
        />
      ) : (
        <p className="text-sm text-destructive">
          Security check unavailable. Please contact the site administrator.
        </p>
      )}

      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      <Button
        className="w-full sm:w-auto"
        onClick={handleSubmit}
        disabled={isSubmitting || !turnstileToken}
      >
        {isSubmitting ? "Submitting…" : "Submit"}
      </Button>
    </div>
  );
}

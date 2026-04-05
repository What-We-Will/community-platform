"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { submitOracleLayoffSurvey } from "@/lib/actions/oracle-layoff-survey";
import {
  ORACLE_LAYOFF_Q1_OPTIONS,
  ORACLE_LAYOFF_Q5_OPTIONS,
  ORACLE_LAYOFF_Q8_OPTIONS,
  type OracleLayoffSurveyPayload,
} from "@/lib/surveys/oracle-layoff";
import { cn } from "@/lib/utils";

function toggleQ8Selection(
  prev: Set<string>,
  label: string,
  checked: boolean
): Set<string> {
  const next = new Set(prev);
  if (label === "None of the above") {
    return checked ? new Set(["None of the above"]) : new Set();
  }
  if (checked) {
    next.delete("None of the above");
    next.add(label);
  } else {
    next.delete(label);
  }
  return next;
}

export function OracleLayoffSurveyForm() {
  const [q1, setQ1] = useState<string>("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [q4, setQ4] = useState("");
  const [q5, setQ5] = useState<string>("");
  const [q8, setQ8] = useState<Set<string>>(() => new Set());
  const [q8Other, setQ8Other] = useState("");
  const [q9, setQ9] = useState("");
  const [q10, setQ10] = useState("");

  const [errors, setErrors] = useState<{
    q1?: boolean;
    q2?: boolean;
    q3?: boolean;
    q4?: boolean;
    q5?: boolean;
    q8?: boolean;
    q8Other?: boolean;
  }>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const next: typeof errors = {};
    const q1Idx = Number.parseInt(q1, 10);
    if (
      q1 === "" ||
      !Number.isFinite(q1Idx) ||
      q1Idx < 0 ||
      q1Idx >= ORACLE_LAYOFF_Q1_OPTIONS.length
    ) {
      next.q1 = true;
    }
    if (!q2.trim()) next.q2 = true;
    if (!q3.trim()) next.q3 = true;
    if (!q4.trim()) next.q4 = true;
    const q5Idx = Number.parseInt(q5, 10);
    if (
      q5 === "" ||
      !Number.isFinite(q5Idx) ||
      q5Idx < 0 ||
      q5Idx >= ORACLE_LAYOFF_Q5_OPTIONS.length
    ) {
      next.q5 = true;
    }
    if (q8.size === 0) next.q8 = true;
    if (q8.has("Other (please specify)") && !q8Other.trim()) {
      next.q8Other = true;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted || submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const q1Idx = Number.parseInt(q1, 10);
    const q5Idx = Number.parseInt(q5, 10);
    const payload: OracleLayoffSurveyPayload = {
      q1_status: ORACLE_LAYOFF_Q1_OPTIONS[q1Idx],
      q2_last_day: q2.trim(),
      q3_team: q3.trim(),
      q4_pillar: q4.trim(),
      q5_colleagues_laid_off: ORACLE_LAYOFF_Q5_OPTIONS[q5Idx],
      q8_issues: Array.from(q8),
      q8_other_specify: q8Other.trim(),
      q9_grievances: q9,
      q10_additional: q10,
    };

    try {
      const result = await submitOracleLayoffSurvey(payload);

      if (result.ok) {
        setSubmitted(true);
        return;
      }

      if (result.error === "rate_limited") {
        setSubmitError(
          "Too many submissions from this connection. Please try again later."
        );
        return;
      }

      if (result.error === "validation_failed") {
        setSubmitError("Please check your entries and try again.");
        return;
      }

      if (result.error === "server_misconfigured") {
        setSubmitError(
          "This form is temporarily unavailable. Please try again later."
        );
        return;
      }

      setSubmitError(
        "We could not save your responses. Please try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-xl border border-border bg-muted/40 px-4 py-4 text-sm text-foreground sm:px-5 sm:py-5"
      >
        Thank you — your responses have been submitted.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 sm:p-8"
      noValidate
    >
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          1. Which of the following best describes your current status at
          Oracle? (Choose one){" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </legend>
        <RadioGroup
          value={q1}
          onValueChange={setQ1}
          className="flex flex-col gap-3"
          aria-invalid={errors.q1 ?? undefined}
          aria-describedby={errors.q1 ? "err-q1" : undefined}
        >
          {ORACLE_LAYOFF_Q1_OPTIONS.map((opt, i) => (
            <RadioGroupItem
              key={opt}
              value={String(i)}
              className="items-start [&_label]:leading-snug"
            >
              {opt}
            </RadioGroupItem>
          ))}
        </RadioGroup>
        {errors.q1 ? (
          <p id="err-q1" className="text-xs text-destructive" role="alert">
            Please select an option.
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="q2" className="text-muted-foreground">
          2. When was your last day at Oracle, or what is your expected last
          day? (Short answer){" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Input
          id="q2"
          name="q2_last_day"
          value={q2}
          onChange={(e) => setQ2(e.target.value)}
          aria-invalid={errors.q2 ?? undefined}
          aria-describedby={errors.q2 ? "err-q2" : undefined}
          className={cn(errors.q2 && "border-destructive")}
        />
        {errors.q2 ? (
          <p id="err-q2" className="text-xs text-destructive" role="alert">
            Please answer this question.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="q3" className="text-muted-foreground">
          3. Which team/org were you part of at Oracle? (Short answer){" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Input
          id="q3"
          name="q3_team"
          value={q3}
          onChange={(e) => setQ3(e.target.value)}
          aria-invalid={errors.q3 ?? undefined}
          aria-describedby={errors.q3 ? "err-q3" : undefined}
          className={cn(errors.q3 && "border-destructive")}
        />
        {errors.q3 ? (
          <p id="err-q3" className="text-xs text-destructive" role="alert">
            Please answer this question.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="q4" className="text-muted-foreground">
          4. Which larger organization/pillar was your team part of at Oracle?
          (Short answer){" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Input
          id="q4"
          name="q4_pillar"
          value={q4}
          onChange={(e) => setQ4(e.target.value)}
          aria-invalid={errors.q4 ?? undefined}
          aria-describedby={errors.q4 ? "err-q4" : undefined}
          className={cn(errors.q4 && "border-destructive")}
        />
        {errors.q4 ? (
          <p id="err-q4" className="text-xs text-destructive" role="alert">
            Please answer this question.
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          5. Do you personally know colleagues from your team or adjacent teams
          who were also laid off? (Choose one){" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </legend>
        <RadioGroup
          value={q5}
          onValueChange={setQ5}
          className="flex flex-row flex-wrap gap-6"
          aria-invalid={errors.q5 ?? undefined}
          aria-describedby={errors.q5 ? "err-q5" : undefined}
        >
          {ORACLE_LAYOFF_Q5_OPTIONS.map((opt, i) => (
            <RadioGroupItem key={opt} value={String(i)}>
              {opt}
            </RadioGroupItem>
          ))}
        </RadioGroup>
        {errors.q5 ? (
          <p id="err-q5" className="text-xs text-destructive" role="alert">
            Please select an option.
          </p>
        ) : null}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          8. Which of the following issues apply to your layoff situation?
          (Select all that apply){" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </legend>
        <div
          className="flex flex-col gap-3"
          aria-invalid={errors.q8 ?? undefined}
          aria-describedby={errors.q8 ? "err-q8" : undefined}
        >
          {ORACLE_LAYOFF_Q8_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-start gap-3 text-sm leading-snug"
            >
              <Checkbox
                checked={q8.has(opt)}
                onCheckedChange={(checked) =>
                  setQ8((prev) =>
                    toggleQ8Selection(prev, opt, checked === true)
                  )
                }
                className="mt-0.5"
                aria-labelledby={`q8-label-${opt}`}
              />
              <span id={`q8-label-${opt}`}>{opt}</span>
            </label>
          ))}
        </div>
        {errors.q8 ? (
          <p id="err-q8" className="text-xs text-destructive" role="alert">
            Select at least one option.
          </p>
        ) : null}

        {q8.has("Other (please specify)") ? (
          <div className="space-y-2 pt-1">
            <Label htmlFor="q8-other" className="text-muted-foreground">
              Please specify (Other){" "}
              <span className="text-destructive" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="q8-other"
              name="q8_other"
              value={q8Other}
              onChange={(e) => setQ8Other(e.target.value)}
              aria-invalid={errors.q8Other ?? undefined}
              aria-describedby={errors.q8Other ? "err-q8-other" : undefined}
              className={cn(errors.q8Other && "border-destructive")}
            />
            {errors.q8Other ? (
              <p
                id="err-q8-other"
                className="text-xs text-destructive"
                role="alert"
              >
                Please add a short description for &quot;Other&quot;.
              </p>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="q9" className="text-muted-foreground">
          9. Do you have any other grievances or issues that you&apos;d like to
          share about your layoff? Was there anything that felt unfair? (Free
          response)
        </Label>
        <Textarea
          id="q9"
          name="q9_grievances"
          rows={5}
          className="min-h-[100px]"
          value={q9}
          onChange={(e) => setQ9(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="q10" className="text-muted-foreground">
          10. Please share anything else you&apos;d like about your layoff
          experience: what happened, how it was handled, and what feels
          unresolved. (Free response)
        </Label>
        <Textarea
          id="q10"
          name="q10_additional"
          rows={5}
          className="min-h-[100px]"
          value={q10}
          onChange={(e) => setQ10(e.target.value)}
        />
      </div>

      {submitError ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-primary-orange text-white hover:bg-primary-orange-hover"
      >
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}

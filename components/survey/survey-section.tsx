"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { SurveyQuestion, SurveyAnswers, RespondentType } from "@/lib/survey/types";

// Display labels for option values — kept here as a UI concern separate from stored values
const OPTION_LABELS: Record<string, string> = {
  // grievance issues
  severance_incorrect: "Severance amount was incorrect or disputed",
  fmla_disability_leave: "FMLA / disability leave affected",
  h1b_visa: "H-1B visa / immigration impact",
  owbpa: "OWBPA rights not explained (for workers 40+)",
  warn_act: "WARN Act notice not provided",
  rsu_vesting_90_days: "RSUs vesting within 90 days",
  docusign_confusing: "DocuSign agreement was confusing or rushed",
  laptop_lockout_missed_comms: "Laptop lockout or missed communications",
  none: "None of the above",
  other: "Other",
  // job security
  very_worried: "Very worried",
  somewhat_worried: "Somewhat worried",
  not_very_worried: "Not very worried",
  not_at_all_worried: "Not at all worried",
  // willingness
  very_interested: "Very interested — I want to be involved",
  somewhat_interested: "Somewhat interested — tell me more",
  not_sure: "Not sure yet",
  not_interested: "Not interested at this time",
};

function resolveOptionLabel(value: string, respondentTypes?: RespondentType[]): string {
  if (respondentTypes) {
    const rt = respondentTypes.find((r) => r.value === value);
    if (rt) return rt.label;
  }
  return (
    OPTION_LABELS[value] ??
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

interface SurveySectionProps {
  questions: SurveyQuestion[];
  answers: SurveyAnswers;
  errors: Record<string, string>;
  companyName: string;
  respondentTypes?: RespondentType[];
  onChange: (id: string, value: string | string[] | Record<string, string>) => void;
}

export function SurveySection({
  questions,
  answers,
  errors,
  companyName,
  respondentTypes,
  onChange,
}: SurveySectionProps) {
  return (
    <div className="space-y-8">
      {questions.map((q) => {
        // Conditional display — hide unless dependency is satisfied
        if (q.conditional) {
          const depVal = answers[q.conditional.dependsOn];
          if (depVal !== q.conditional.value) return null;
        }

        const label = q.label.replace("{companyName}", companyName);
        const value = answers[q.id];
        const error = errors[q.id];
        const charCount = typeof value === "string" ? value.length : 0;

        return (
          <div key={q.id} className="space-y-2">
            <Label
              htmlFor={q.id}
              className={cn(
                "text-sm font-medium leading-snug",
                q.required &&
                  "after:ml-0.5 after:text-destructive after:content-['*']"
              )}
            >
              {label}
            </Label>

            {q.type === "short-answer" && (
              <Input
                id={q.id}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(q.id, e.target.value)}
                aria-invalid={!!error}
                className={cn(error && "border-destructive")}
              />
            )}

            {q.type === "free-text" && (
              <div className="space-y-1">
                <Textarea
                  id={q.id}
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) => onChange(q.id, e.target.value)}
                  maxLength={q.maxLength}
                  rows={5}
                  aria-invalid={!!error}
                  className={cn("resize-y", error && "border-destructive")}
                />
                {q.maxLength && (
                  <p className="text-right text-xs text-muted-foreground">
                    {charCount}/{q.maxLength}
                  </p>
                )}
              </div>
            )}

            {q.type === "single-select" && q.options && (
              <RadioGroup
                value={typeof value === "string" ? value : ""}
                onValueChange={(v) => onChange(q.id, v)}
                name={q.id}
                className={cn(
                  "space-y-1",
                  error && "rounded-md border border-destructive p-3"
                )}
              >
                {q.options.map((opt) => (
                  <RadioGroupItem key={opt} value={opt}>
                    {resolveOptionLabel(opt, respondentTypes)}
                  </RadioGroupItem>
                ))}
              </RadioGroup>
            )}

            {q.type === "scale" && q.min != null && q.max != null && (
              <div className="space-y-2">
                <RadioGroup
                  value={typeof value === "string" ? value : ""}
                  onValueChange={(v) => onChange(q.id, v)}
                  name={q.id}
                  className={cn(
                    "flex flex-row gap-4",
                    error && "rounded-md border border-destructive p-3"
                  )}
                >
                  {Array.from({ length: q.max - q.min + 1 }, (_, i) => String(q.min! + i)).map((opt) => (
                    <RadioGroupItem key={opt} value={opt}>
                      {opt}
                    </RadioGroupItem>
                  ))}
                </RadioGroup>
                {(q.minLabel || q.maxLabel) && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{q.minLabel}</span>
                    <span>{q.maxLabel}</span>
                  </div>
                )}
              </div>
            )}

            {q.type === "matrix-radio" && q.rows && q.columns && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="w-2/5 pb-2 text-left font-normal text-muted-foreground" />
                      {q.columns.map((col) => (
                        <th
                          key={col.key}
                          className="min-w-[4rem] px-2 pb-2 text-center font-normal text-muted-foreground"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {q.rows.map((row, rowIdx) => {
                      const rowLabel = row.label.replace("{companyName}", companyName);
                      const currentVal =
                        (answers[q.id] as Record<string, string> | undefined) ?? {};
                      return (
                        <tr
                          key={row.key}
                          className={cn("border-t", rowIdx % 2 === 0 && "bg-muted/20")}
                        >
                          <td className="py-3 pr-4 align-top leading-snug">{rowLabel}</td>
                          {q.columns!.map((col) => (
                            <td key={col.key} className="px-2 py-3 text-center align-middle">
                              <input
                                type="radio"
                                name={`${q.id}-${row.key}`}
                                value={col.key}
                                checked={currentVal[row.key] === col.key}
                                onChange={() =>
                                  onChange(q.id, { ...currentVal, [row.key]: col.key })
                                }
                                aria-label={`${rowLabel} — ${col.label}`}
                                className="h-4 w-4 accent-primary"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {q.type === "multi-select" && q.options && (
              <div
                role="group"
                aria-labelledby={q.id}
                className={cn(
                  "space-y-2",
                  error && "rounded-md border border-destructive p-3"
                )}
              >
                {q.options.map((opt) => {
                  const checked = Array.isArray(value) && value.includes(opt);
                  return (
                    <div key={opt} className="flex items-start gap-2">
                      <Checkbox
                        id={`${q.id}-${opt}`}
                        checked={checked}
                        onCheckedChange={(c) => {
                          const prev = Array.isArray(value) ? value : [];
                          const next = c
                            ? [...prev, opt]
                            : prev.filter((v) => v !== opt);
                          onChange(q.id, next);
                        }}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`${q.id}-${opt}`}
                        className="cursor-pointer text-sm font-normal leading-snug"
                      >
                        {resolveOptionLabel(opt)}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

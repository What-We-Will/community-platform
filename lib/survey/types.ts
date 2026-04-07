export interface SurveyConfig {
  surveyId: string;
  companyName: string;
  title: string;
  description: string;
  respondentTypes: RespondentType[];
  questions: SurveyQuestion[];
}

export interface RespondentType {
  value: string;
  label: string;
  section: SurveySection;
}

export type SurveySection = "everyone" | "laid_off" | "current_employee" | "closing";

export type QuestionType = "single-select" | "multi-select" | "short-answer" | "free-text";

export type StorageTarget = "responses" | "sensitive";

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  section: SurveySection;
  label: string;
  required: boolean;
  storageTarget: StorageTarget;
  encrypted: boolean;
  maxLength?: number;
  conditional?: {
    dependsOn: string;
    value: string;
  };
  options?: string[];
}

export type SurveyStep = "preamble" | "s1" | "s2" | "s3" | "s4" | "submitted";

export type SurveyAnswers = Record<string, string | string[]>;

export interface SurveyFormState {
  step: SurveyStep;
  answers: SurveyAnswers;
}

export type SurveyActionResult = { ok: true } | { ok: false; error: string };

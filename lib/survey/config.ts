import type { SurveyConfig } from "./types";

const companyName = process.env.NEXT_PUBLIC_SURVEY_COMPANY_NAME ?? "";

const layoffSurvey: SurveyConfig = {
  surveyId: "layoff-survey-2026",
  companyName,
  title: "Worker Experience Survey",
  description:
    "Help us understand what workers are going through and connect those who want to take collective action. Your answers are private — we do not collect your name, IP address, or any identifying information unless you choose to share contact details.",
  layout: "multi-page",

  respondentTypes: [
    {
      value: "laid_off_fte",
      label: "FTE recently laid off / notified",
      section: "laid_off",
    },
    {
      value: "laid_off_contractor",
      label: "Contractor/vendor recently laid off / notified",
      section: "laid_off",
    },
    {
      value: "current_fte",
      label: "Currently employed FTE",
      section: "current_employee",
    },
    {
      value: "current_contractor",
      label: "Currently employed contractor/vendor",
      section: "current_employee",
    },
  ],

  questions: [
    // ── Section 1: Everyone ─────────────────────────────────────────────────
    {
      id: "respondent_type",
      type: "single-select",
      section: "everyone",
      label: "What is your current status?",
      required: true,
      storageTarget: "responses",
      encrypted: false,
      options: [
        "laid_off_fte",
        "laid_off_contractor",
        "current_fte",
        "current_contractor",
      ],
    },

    // ── Section 2: Laid-off workers ─────────────────────────────────────────
    {
      id: "last_day",
      type: "short-answer",
      section: "laid_off",
      label: "What was (or is expected to be) your last day?",
      required: true,
      storageTarget: "responses",
      encrypted: false,
    },
    {
      id: "laid_off_team",
      type: "short-answer",
      section: "laid_off",
      label: "Which team did you support? Please be specific.",
      required: true,
      storageTarget: "responses",
      encrypted: true,
    },
    {
      id: "laid_off_org_pillar",
      type: "short-answer",
      section: "laid_off",
      label: "Which larger org or pillar did your team fall under?",
      required: false,
      storageTarget: "responses",
      encrypted: false,
    },
    {
      id: "most_affected_orgs",
      type: "short-answer",
      section: "laid_off",
      label: "Which orgs or pillars do you think were most affected by the layoffs?",
      required: false,
      storageTarget: "responses",
      encrypted: false,
    },
    {
      id: "grievance_issues",
      type: "multi-select",
      section: "laid_off",
      label: "Which of the following issues apply to your situation? (Select all that apply)",
      required: false,
      storageTarget: "responses",
      encrypted: false,
      options: [
        "severance_incorrect",
        "fmla_disability_leave",
        "h1b_visa",
        "owbpa",
        "warn_act",
        "rsu_vesting_90_days",
        "docusign_confusing",
        "laptop_lockout_missed_comms",
        "none",
        "other",
      ],
    },
    {
      id: "grievance_story",
      type: "free-text",
      section: "laid_off",
      label:
        "Tell us about your layoff experience — what happened, how it was handled, any unresolved issues, anything that felt unfair.",
      required: false,
      storageTarget: "responses",
      encrypted: true,
      maxLength: 10000,
    },
    {
      id: "support_questions",
      type: "free-text",
      section: "laid_off",
      label: "What questions do you still have? What support would be most useful to you?",
      required: false,
      storageTarget: "responses",
      encrypted: true,
      maxLength: 10000,
    },

    // ── Section 3: Currently employed workers ───────────────────────────────
    {
      id: "current_team",
      type: "short-answer",
      section: "current_employee",
      label: "Which team do you support at {companyName}? Please be specific.",
      required: true,
      storageTarget: "responses",
      encrypted: true,
    },
    {
      id: "current_org_pillar",
      type: "short-answer",
      section: "current_employee",
      label: "Which larger org or pillar does your team fall under?",
      required: false,
      storageTarget: "responses",
      encrypted: false,
    },
    {
      id: "layoff_concerns",
      type: "free-text",
      section: "current_employee",
      label:
        "Is there anything about how {companyName} handled the layoffs that concerns you?",
      required: false,
      storageTarget: "responses",
      encrypted: true,
      maxLength: 10000,
    },
    {
      id: "job_security",
      type: "single-select",
      section: "current_employee",
      label: "How worried are you about your own job security at {companyName}?",
      required: true,
      storageTarget: "responses",
      encrypted: false,
      options: [
        "very_worried",
        "somewhat_worried",
        "not_very_worried",
        "not_at_all_worried",
      ],
    },
    {
      id: "current_story",
      type: "free-text",
      section: "current_employee",
      label: "Anything else you'd like to share about your experience during this time?",
      required: false,
      storageTarget: "responses",
      encrypted: true,
      maxLength: 10000,
    },

    // ── Section 4: Everyone (closing) ───────────────────────────────────────
    {
      id: "willingness",
      type: "single-select",
      section: "closing",
      label: "How interested are you in collective action with other workers?",
      required: true,
      storageTarget: "sensitive",
      encrypted: false,
      options: [
        "very_interested",
        "somewhat_interested",
        "not_sure",
        "not_interested",
      ],
    },
    {
      id: "contact",
      type: "short-answer",
      section: "closing",
      label:
        "If you'd like us to reach out directly, share your preferred contact (email, phone, or Signal). This is optional and stored separately from your survey answers.",
      required: false,
      storageTarget: "sensitive",
      encrypted: true,
    },
  ],
};

const severanceNegotiationSurvey: SurveyConfig = {
  surveyId: "severance-negotiation-2026",
  companyName,
  title: "Severance Negotiation Survey",
  description:
    "Help us understand your experience with the proposed severance package. Your answers are private and anonymous.",
  layout: "single-page",

  questions: [
    {
      id: "satisfaction",
      type: "scale",
      section: "main",
      label:
        "How satisfied are you with the proposed severance, as outlined in the Severance FAQ?",
      required: false,
      storageTarget: "responses",
      encrypted: false,
      min: 1,
      max: 5,
      minLabel: "Very unhappy",
      maxLabel: "Very happy",
    },
  ],
};

export const surveyConfigs: Record<string, SurveyConfig> = {
  "layoff-survey-2026": layoffSurvey,
  "severance-negotiation-2026": severanceNegotiationSurvey,
};

export const DEFAULT_SURVEY_ID = "severance-negotiation-2026";

export default surveyConfigs[DEFAULT_SURVEY_ID];

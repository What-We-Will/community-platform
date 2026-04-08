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
    {
      id: "clauses_assessment",
      type: "matrix-radio",
      section: "main",
      label: "How do you feel about the following clauses in the severance agreement?",
      required: false,
      storageTarget: "responses",
      encrypted: false,
      rows: [
        { key: "non_disparaging", label: "Non-disparaging clause (one-way)" },
        { key: "non_compete", label: "Non-competitive clause" },
        { key: "severance_reduction", label: "Reduction of severance payment if new employment secured before end of severance term" },
      ],
      columns: [
        { key: "acceptable", label: "Acceptable as is" },
        { key: "negotiate", label: "A point for negotiations" },
        { key: "not_acceptable", label: "Not acceptable" },
      ],
    },
    {
      id: "improvement_priorities",
      type: "matrix-radio",
      section: "main",
      label: "How important are the following improvements to you? (1 = not important, 5 = very important)",
      required: false,
      storageTarget: "responses",
      encrypted: false,
      rows: [
        { key: "more_weeks", label: "More severance weeks, comparable to Google (16 wks base + 2/yr) and Meta (16 wks + 2/yr, no cap)." },
        { key: "total_service_years", label: "Severance calculation based on total service years, not most recent rehire date." },
        { key: "rsu_vesting", label: "Accelerated RSU vesting." },
        { key: "termination_date_extension", label: "Extension of termination date to capture upcoming vest dates." },
        { key: "401k_hold", label: "Reduce the 401k hold from 1 month to max 2 weeks." },
        { key: "healthcare_coverage", label: "Extended healthcare coverage — 6 months minimum (matching Google/Meta precedent)." },
        { key: "cobra_subsidy", label: "Subsidized COBRA." },
        { key: "minimum_notice", label: "Minimum 4 weeks notice of final employment date. (Many remote workers received only 9 days.)" },
        { key: "warn_act", label: "WARN Act coverage for remote workers based on state of worksite or home office ({companyName}'s interpretation is contested by caselaw.)" },
        { key: "immigration_support", label: "Immigration legal support, following Google's precedent." },
        { key: "severance_paperwork", label: "Severance paperwork delivered before the final day." },
      ],
      columns: [
        { key: "1", label: "1" },
        { key: "2", label: "2" },
        { key: "3", label: "3" },
        { key: "4", label: "4" },
        { key: "5", label: "5" },
      ],
    },
  ],
};

export const surveyConfigs: Record<string, SurveyConfig> = {
  "layoff-survey-2026": layoffSurvey,
  "severance-negotiation-2026": severanceNegotiationSurvey,
};

export const DEFAULT_SURVEY_ID = "severance-negotiation-2026";

export default surveyConfigs[DEFAULT_SURVEY_ID];

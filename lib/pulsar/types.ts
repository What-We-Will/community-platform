export type PreferredWorkType = "remote" | "hybrid" | "onsite";

export type WhatWeWillProfileRequest = {
  personId: string;
  linkedinUrl?: string;
  resumeText?: string;
  resumeUrl?: string;
  skills: string[];
  experienceSummary?: string;
  interestedIndustries: string[];
  interestedRoleTitles: string[];
  preferredWorkTypes: PreferredWorkType[];
  preferredLocations: string[];
};

export type WhatWeWillMatch = {
  score: number;
  label: "Strong match" | "Good match" | "Stretch";
  roleTitle: string;
  company: string;
  location: string;
  source: "greenhouse" | "lever";
  reasons: string[];
  concern?: string;
  applyUrl: string;
};

export type WhatWeWillMatchResponse = {
  requestId: string;
  candidateSummary: string;
  matches: WhatWeWillMatch[];
};

export type WhatWeWillBriefRequest = WhatWeWillProfileRequest & {
  tone?: "supportive" | "direct" | "coach";
  maxWords?: number;
  includeIllustrativeLinks?: boolean;
};

export type WhatWeWillBriefResponse = {
  requestId: string;
  markdown: string;
  model: string;
  generatedAt: string;
};


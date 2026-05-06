import type {
  WhatWeWillBriefRequest,
  WhatWeWillProfileRequest,
} from "./types";

/** Profile columns used for Pulsar match + career brief. */
export type ProfileRowForPulsar = {
  id: string;
  headline: string | null;
  bio: string | null;
  skills: string[] | null;
  linkedin_url: string | null;
  location: string | null;
};

export function buildWhatWeWillProfilePayload(
  profile: ProfileRowForPulsar
): WhatWeWillProfileRequest {
  const inferredRoleTitles = profile.headline
    ? profile.headline
        .split(/[|,/]/g)
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return {
    personId: profile.id,
    linkedinUrl: profile.linkedin_url ?? undefined,
    resumeText: undefined,
    skills: profile.skills ?? [],
    experienceSummary: profile.bio ?? undefined,
    interestedIndustries: [],
    interestedRoleTitles: inferredRoleTitles,
    preferredWorkTypes: ["remote", "hybrid"],
    preferredLocations: profile.location ? [profile.location] : [],
  };
}

/** Options passed to Pulsar `/brief` from My Tools. */
export const DEFAULT_CAREER_BRIEF_OPTIONS = {
  tone: "supportive" as const,
  maxWords: 700,
  includeIllustrativeLinks: true,
};

export function buildWhatWeWillBriefRequest(
  profile: ProfileRowForPulsar
): WhatWeWillBriefRequest {
  return {
    ...buildWhatWeWillProfilePayload(profile),
    ...DEFAULT_CAREER_BRIEF_OPTIONS,
  };
}

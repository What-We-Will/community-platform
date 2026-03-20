import { jobApplicationInsertFromPulsarMatch } from "./tracker-from-match";
import type { WhatWeWillMatch } from "./types";

const sampleMatch: WhatWeWillMatch = {
  score: 82,
  label: "Strong match",
  roleTitle: "Staff Engineer",
  company: "Acme",
  location: "Remote",
  source: "greenhouse",
  reasons: ["Skills align"],
  applyUrl: "https://jobs.example.com/1",
};

describe("jobApplicationInsertFromPulsarMatch", () => {
  it("builds tracker insert fields for a Pulsar match", () => {
    const row = jobApplicationInsertFromPulsarMatch(sampleMatch);
    expect(row).toEqual({
      company: "Acme",
      position: "Staff Engineer",
      status: "wishlist",
      notes: "From Pulsar match (Strong match, score 82).",
      url: "https://jobs.example.com/1",
      is_shared: false,
    });
  });

  it("uses null url when applyUrl empty", () => {
    const row = jobApplicationInsertFromPulsarMatch({
      ...sampleMatch,
      applyUrl: "",
    });
    expect(row.url).toBeNull();
  });
});

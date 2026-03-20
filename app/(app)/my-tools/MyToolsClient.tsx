"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateCareerBrief, refreshLiveMatches, saveMatchToTracker } from "./actions";
import { WhatWeWillMatch } from "@/lib/pulsar/types";

type MatchRun = {
  request_id: string;
  candidate_summary: string;
  created_at: string;
  matches: WhatWeWillMatch[];
};

type CareerBrief = {
  request_id: string;
  markdown: string;
  model: string;
  generated_at: string;
  created_at: string;
};

export default function MyToolsClient({
  latestMatchRun,
  latestBrief,
}: {
  latestMatchRun: MatchRun | null;
  latestBrief: CareerBrief | null;
}) {
  const router = useRouter();
  const [pendingMatch, startMatch] = useTransition();
  const [pendingBrief, startBrief] = useTransition();
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  function onRefreshMatches() {
    setError(null);
    startMatch(async () => {
      const result = await refreshLiveMatches();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onGenerateBrief() {
    setError(null);
    startBrief(async () => {
      const result = await generateCareerBrief();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function onSaveToTracker(match: WhatWeWillMatch) {
    setError(null);
    const key = `${match.company}-${match.roleTitle}-${match.applyUrl}`;
    setSavingIds((prev) => ({ ...prev, [key]: true }));
    const result = await saveMatchToTracker(match);
    setSavingIds((prev) => ({ ...prev, [key]: false }));
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalized job matching and career briefing powered by Pulsar.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live job matches (ATS)</CardTitle>
          <Button onClick={onRefreshMatches} disabled={pendingMatch}>
            {pendingMatch ? "Refreshing..." : "Refresh matches"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!latestMatchRun ? (
            <p className="text-sm text-muted-foreground">
              No match run yet. Click “Refresh matches” to fetch current postings.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Last run: {new Date(latestMatchRun.created_at).toLocaleString()}
              </p>
              <p className="text-sm">{latestMatchRun.candidate_summary}</p>
              {latestMatchRun.matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No matches found in current ATS results.
                </p>
              ) : (
                <div className="space-y-3">
                  {latestMatchRun.matches.map((match, idx) => {
                    const saveKey = `${match.company}-${match.roleTitle}-${match.applyUrl}`;
                    return (
                      <div key={`${latestMatchRun.request_id}-${idx}-${saveKey}`} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{match.roleTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {match.company} · {match.location} · {match.label} ({match.score})
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {match.applyUrl ? (
                              <a
                                className="text-sm underline"
                                href={match.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apply link
                              </a>
                            ) : null}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={savingIds[saveKey]}
                              onClick={() => onSaveToTracker(match)}
                            >
                              {savingIds[saveKey] ? "Saving..." : "Add to tracker"}
                            </Button>
                          </div>
                        </div>
                        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {match.reasons.map((reason, reasonIdx) => (
                            <li key={reasonIdx}>{reason}</li>
                          ))}
                        </ul>
                        {match.concern ? (
                          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                            Concern: {match.concern}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Career brief (broader direction)</CardTitle>
          <Button onClick={onGenerateBrief} disabled={pendingBrief}>
            {pendingBrief ? "Generating..." : "Generate brief"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!latestBrief ? (
            <p className="text-sm text-muted-foreground">
              No career brief generated yet.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Generated: {new Date(latestBrief.created_at).toLocaleString()} · model:{" "}
                {latestBrief.model}
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {latestBrief.markdown}
                </ReactMarkdown>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


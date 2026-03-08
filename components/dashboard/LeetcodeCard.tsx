import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code2, ExternalLink, AlertCircle } from "lucide-react";

interface DailyProblem {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
  topicTags: { name: string }[];
}

async function fetchDailyProblem(): Promise<DailyProblem | null> {
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query questionOfToday {
          activeDailyCodingChallengeQuestion {
            link
            question {
              title
              difficulty
              topicTags { name }
            }
          }
        }`,
      }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const q = json?.data?.activeDailyCodingChallengeQuestion;
    if (!q) return null;
    return {
      title: q.question.title,
      difficulty: q.question.difficulty,
      link: `https://leetcode.com${q.link}`,
      topicTags: q.question.topicTags,
    };
  } catch {
    return null;
  }
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard:   "bg-red-100 text-red-700 border-red-200",
};

export async function LeetcodeCard() {
  const problem = await fetchDailyProblem();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="size-4 text-muted-foreground" />
          LeetCode — Problem of the Day
        </CardTitle>
      </CardHeader>
      <CardContent>
        {problem ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-sm leading-snug">{problem.title}</p>
              <span
                className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[problem.difficulty] ?? ""}`}
              >
                {problem.difficulty}
              </span>
            </div>
            {problem.topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {problem.topicTags.slice(0, 5).map((tag) => (
                  <Badge key={tag.name} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
            <Button asChild size="sm" className="w-full gap-1.5 mt-1">
              <a href={problem.link} target="_blank" rel="noopener noreferrer">
                Solve Today&apos;s Problem
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <AlertCircle className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Could not load today&apos;s problem.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

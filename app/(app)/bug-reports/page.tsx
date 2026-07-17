import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/time";
import type { BugReportWithReporter } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bug Reports" };

// Derives a path from a report's page_url for grouping/prioritization.
// Falls back to the raw page_url (or "unknown") if it isn't a valid URL.
function pathFor(pageUrl: string | null): string {
  if (!pageUrl) return "unknown";
  try {
    return new URL(pageUrl).pathname;
  } catch {
    return pageUrl;
  }
}

export default async function BugReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    redirect("/dashboard");
  }

  const { data: reportsData, error } = await supabase
    .from("bug_reports")
    .select("*, reporter:reporter_id(display_name)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[bug-reports page] fetch error:", error.message);
  }

  const reports = (reportsData ?? []) as BugReportWithReporter[];

  // Leading-indicator signal: how many reports on this page share the same
  // page path, so a spike on one path stands out for prioritization.
  const pathCounts = new Map<string, number>();
  for (const report of reports) {
    const path = pathFor(report.page_url);
    pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Bug className="size-6 text-primary-orange" />
        <h1 className="text-2xl font-bold tracking-tight">Bug Reports</h1>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bug reports yet.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const path = pathFor(report.page_url);
            const count = pathCounts.get(path) ?? 1;
            // PostgREST returns to-one embeds as an array in this project
            // (see app/(app)/projects/page.tsx) — normalize before reading.
            const reporterRaw = report.reporter as
              | { display_name: string | null }
              | { display_name: string | null }[]
              | null;
            const reporterProfile = Array.isArray(reporterRaw)
              ? (reporterRaw[0] ?? null)
              : reporterRaw;
            const reporterName = reporterProfile?.display_name ?? report.reporter_email;

            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {count} report{count === 1 ? "" : "s"} from {path}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(report.created_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="whitespace-pre-wrap text-sm">{report.description}</p>
                  {report.steps && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Steps to reproduce
                      </p>
                      <p className="whitespace-pre-wrap text-sm">{report.steps}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Reported by {reporterName ?? "Unknown"}
                    {!report.reporter_id && " (anonymous)"}
                  </p>
                  {report.user_agent && (
                    <p
                      className="truncate text-xs text-muted-foreground/70"
                      title={report.user_agent}
                    >
                      {report.user_agent}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HeartHandshake, CalendarDays, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpRow {
  id: string;
  user_id: string;
  title: string;
  company: string;
  position: string;
  interview_date: string;
  message: string | null;
  created_at: string;
  requester: { id: string; display_name: string; avatar_url: string | null } | null;
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function InterviewHelpCard({ currentUserId }: { currentUserId: string }) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: raw } = await supabase
    .from("interview_help_requests")
    .select("id, user_id, title, company, position, interview_date, message, created_at, requester:user_id(id, display_name, avatar_url)")
    .eq("is_open", true)
    .neq("user_id", currentUserId)
    .gte("interview_date", today)
    .order("interview_date", { ascending: true })
    .limit(6);

  const requests: HelpRow[] = (raw ?? []).map((r) => ({
    ...r,
    requester: Array.isArray(r.requester) ? (r.requester[0] ?? null) : r.requester,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartHandshake className="size-4 text-violet-600" />
          Help Requests
          {requests.length > 0 && (
            <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
              {requests.length}
            </span>
          )}
        </CardTitle>
        <Link href="/tracker" className="text-xs text-primary hover:underline">
          Go to Tracker
        </Link>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <HeartHandshake className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No open help requests right now.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Members can ask for interview help from their tracker.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {requests.map((req) => (
              <li key={req.id} className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug truncate">
                      {req.requester?.display_name ?? "A member"} needs help
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {req.title} · {req.company}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <CalendarDays className="size-3 shrink-0" />
                      {formatDate(req.interview_date)}
                    </p>
                  </div>
                  {req.requester && (
                    <Button asChild size="sm" variant="outline" className="h-7 shrink-0 gap-1 text-xs border-violet-200 text-violet-700 hover:bg-violet-100">
                      <Link href={`/messages?new=${req.requester.id}`}>
                        <MessageCircle className="size-3" />
                        Message
                      </Link>
                    </Button>
                  )}
                </div>
                {req.message && (
                  <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

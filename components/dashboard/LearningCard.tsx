import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { BookOpen, GraduationCap, PlaySquare, BookMarked, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  course:   GraduationCap,
  video:    PlaySquare,
  tutorial: BookMarked,
};

const STATUS_META = {
  want_to_take: { label: "Want to Take",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  in_progress:  { label: "In Progress",   color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  completed:    { label: "Completed",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

export async function LearningCard({ userId }: Props) {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("personal_learning_items")
    .select("id, status, resource:resource_id(id, title, type, url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (raw ?? []).map((r) => ({
    id: r.id,
    status: r.status as "want_to_take" | "in_progress" | "completed",
    resource: Array.isArray(r.resource) ? (r.resource[0] ?? null) : r.resource as { id: string; title: string; type: string; url: string } | null,
  })).filter((r) => r.resource !== null);

  const inProgress  = items.filter((i) => i.status === "in_progress");
  const wantToTake  = items.filter((i) => i.status === "want_to_take");
  const completed   = items.filter((i) => i.status === "completed");
  const total = items.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4" />
          My Learning Tracker
          {total > 0 && (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {total}
            </span>
          )}
        </CardTitle>
        <Link href="/learning/tracker" className="text-xs text-primary hover:underline">
          Open tracker
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <BookOpen className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nothing tracked yet.</p>
            <Link href="/learning" className="mt-1 text-xs text-primary hover:underline">
              Browse learning resources →
            </Link>
          </div>
        ) : (
          <>
            {/* Summary stat pills */}
            <div className="grid grid-cols-3 gap-1.5">
              {(["in_progress", "want_to_take", "completed"] as const).map((s) => {
                const meta = STATUS_META[s];
                const count = s === "in_progress" ? inProgress.length : s === "want_to_take" ? wantToTake.length : completed.length;
                return (
                  <div key={s} className={cn("rounded-lg border px-2 py-1.5 text-center", meta.bg)}>
                    <p className={cn("text-base font-bold leading-none", meta.color)}>{count}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{meta.label}</p>
                  </div>
                );
              })}
            </div>

            {/* In-progress items */}
            {inProgress.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">In Progress</p>
                <ul className="space-y-1.5">
                  {inProgress.slice(0, 3).map((item) => {
                    const Icon = TYPE_ICON[item.resource!.type] ?? BookOpen;
                    return (
                      <li key={item.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
                        <Icon className="size-3.5 shrink-0 text-amber-600" />
                        <a
                          href={item.resource!.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium truncate hover:text-primary transition-colors min-w-0"
                        >
                          {item.resource!.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Up next (want to take) */}
            {wantToTake.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">Up Next</p>
                <ul className="space-y-1.5">
                  {wantToTake.slice(0, 2).map((item) => {
                    const Icon = TYPE_ICON[item.resource!.type] ?? BookOpen;
                    return (
                      <li key={item.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
                        <Icon className="size-3.5 shrink-0 text-blue-500" />
                        <a
                          href={item.resource!.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm truncate hover:text-primary transition-colors min-w-0 text-muted-foreground"
                        >
                          {item.resource!.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Completed summary */}
            {completed.length > 0 && inProgress.length === 0 && wantToTake.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">
                  You&apos;ve completed {completed.length} resource{completed.length !== 1 ? "s" : ""}!
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {total > 0 && (
        <CardFooter className="pt-0">
          <Link href="/learning/tracker" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View learning tracker <ArrowUpRight className="size-3.5" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

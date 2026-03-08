import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Briefcase, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  wishlist:         { label: "Wishlist",        color: "text-red-700",    bg: "bg-red-100" },
  applied:          { label: "Applied",         color: "text-orange-700", bg: "bg-orange-100" },
  phone_screen:     { label: "Phone Screen",    color: "text-yellow-700", bg: "bg-yellow-100" },
  first_interview:  { label: "Interviewing",    color: "text-green-700",  bg: "bg-green-100" },
  second_interview: { label: "Interviewing",    color: "text-green-700",  bg: "bg-green-100" },
  third_interview:  { label: "Interviewing",    color: "text-green-700",  bg: "bg-green-100" },
  interview:        { label: "Interviewing",    color: "text-green-700",  bg: "bg-green-100" },
  offer:            { label: "Offer",           color: "text-violet-700", bg: "bg-violet-100" },
  rejected:         { label: "Rejected",        color: "text-gray-500",   bg: "bg-gray-100" },
  withdrawn:        { label: "Withdrawn",       color: "text-gray-500",   bg: "bg-gray-100" },
};

const SUMMARY_BUCKETS = [
  { key: "wishlist",    label: "Wishlist",    statuses: ["wishlist"],                                                                    color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  { key: "applied",     label: "Applied",     statuses: ["applied", "phone_screen"],                                                    color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  { key: "interviews",  label: "Interviews",  statuses: ["first_interview", "second_interview", "third_interview", "interview"],        color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  { key: "offers",      label: "Offers",      statuses: ["offer"],                                                                      color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
];

export async function JobTrackerCard({ userId }: Props) {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("job_applications")
    .select("id, company, position, status, applied_date")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const apps = raw ?? [];

  const bucketCounts: Record<string, number> = {};
  for (const bucket of SUMMARY_BUCKETS) {
    bucketCounts[bucket.key] = apps.filter((a) => bucket.statuses.includes(a.status)).length;
  }
  const total = apps.length;
  const recent = apps.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="size-4" />
          Job Tracker
          {total > 0 && (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {total}
            </span>
          )}
        </CardTitle>
        <Link href="/tracker" className="text-xs text-primary hover:underline">
          Open tracker
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Briefcase className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No applications yet.</p>
            <Link href="/tracker" className="mt-1 text-xs text-primary hover:underline">
              Start tracking →
            </Link>
          </div>
        ) : (
          <>
            {/* Bucket summary */}
            <div className="grid grid-cols-4 gap-1.5">
              {SUMMARY_BUCKETS.map((b) => (
                <div key={b.key} className={cn("rounded-lg border px-2 py-1.5 text-center", b.bg)}>
                  <p className={cn("text-base font-bold leading-none", b.color)}>{bucketCounts[b.key]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{b.label}</p>
                </div>
              ))}
            </div>

            {/* Recent applications */}
            <ul className="space-y-1.5">
              {recent.map((app) => {
                const meta = STATUS_META[app.status];
                return (
                  <li key={app.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug truncate">{app.position}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.company}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", meta?.color, meta?.bg)}>
                      {meta?.label ?? app.status}
                    </span>
                  </li>
                );
              })}
            </ul>
            {total > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{total - 5} more
              </p>
            )}
          </>
        )}
      </CardContent>

      {total > 0 && (
        <CardFooter className="pt-0">
          <Link href="/tracker" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all applications <ArrowUpRight className="size-3.5" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

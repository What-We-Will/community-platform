import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Briefcase, MapPin, ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/time";
import { PostJobForm } from "./PostJobForm";
import { DeleteJobButton } from "./DeleteJobButton";
import type { Profile } from "@/lib/types";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time:  "Full-time",
  part_time:  "Part-time",
  contract:   "Contract",
  internship: "Internship",
  volunteer:  "Volunteer",
};

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time:  "bg-green-100 text-green-700 border-green-200",
  part_time:  "bg-blue-100 text-blue-700 border-blue-200",
  contract:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  internship: "bg-purple-100 text-purple-700 border-purple-200",
  volunteer:  "bg-orange-100 text-orange-700 border-orange-200",
};

export default async function JobBoardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("job_postings")
    .select("*, poster:posted_by(id, display_name)")
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isPlatformAdmin = profile?.role === "admin";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Community-posted job opportunities — share what you find.
          </p>
        </div>
        <PostJobForm />
      </div>

      {/* Listings */}
      {!jobs || jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Briefcase className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No jobs posted yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Be the first to share an opportunity with the community.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const poster = job.poster as Pick<Profile, "id" | "display_name"> | null;
            const canDelete = isPlatformAdmin || job.posted_by === user.id;

            return (
              <Card key={job.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Title + badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold">{job.title}</h3>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${JOB_TYPE_COLORS[job.job_type] ?? ""}`}>
                          {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                        </span>
                      </div>

                      {/* Company + location */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{job.company}</span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {job.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {formatRelativeTime(job.created_at)}
                        </span>
                      </div>

                      {/* Description */}
                      {job.description && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {job.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="mt-3 flex items-center gap-3">
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            View Posting
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        {poster && (
                          <span className="text-xs text-muted-foreground">
                            Posted by {poster.display_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {canDelete && <DeleteJobButton id={job.id} />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

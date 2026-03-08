"use client";

import { useState } from "react";
import {
  MapPin,
  Clock,
  ExternalLink,
  Briefcase,
  Handshake,
  Network,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { PostJobForm } from "./PostJobForm";
import { DeleteJobButton } from "./DeleteJobButton";
import { WishlistButton } from "./WishlistButton";
import { MessagePosterButton } from "./MessagePosterButton";
import { JobComments, type Comment } from "./JobComments";
import { JobRoleFilter } from "./JobRoleFilter";
import { JOB_ROLE_MAP, type JobRole } from "./job-roles";

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

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string | null;
  job_type: string;
  roles: string[];
  description: string | null;
  url: string | null;
  offers_referral: boolean;
  is_community_network: boolean;
  posted_by: string | null;
  created_at: string;
  poster: { id: string; display_name: string } | null;
}

interface Props {
  jobs: JobPosting[];
  currentUserId: string;
  isPlatformAdmin: boolean;
  wishlistedIds: string[];
  commentsByJob: Record<string, Comment[]>;
  activeRoleFilter: string | null;
}

export function JobBoardClient({
  jobs,
  currentUserId,
  isPlatformAdmin,
  wishlistedIds,
  commentsByJob,
  activeRoleFilter,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id ?? null);
  const selectedJob = jobs.find((j) => j.id === selectedId) ?? null;
  const wishlistedSet = new Set(wishlistedIds);

  return (
    // Escape parent padding and fill full viewport height
    <div className="-m-4 lg:-m-6 flex flex-col h-[calc(100dvh-56px)] lg:h-[100dvh]">

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 border-b bg-background px-4 py-3 lg:px-6">
        <div>
          <h1 className="text-xl font-bold">Job Board</h1>
          <p className="text-xs text-muted-foreground">
            Community-posted opportunities — add to your wishlist and share notes.
          </p>
        </div>
        <PostJobForm />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left panel: scrollable job list ── */}
        <div className="flex w-80 shrink-0 flex-col border-r lg:w-96">
          {/* Filter */}
          <div className="shrink-0 overflow-x-auto border-b px-3 py-2.5">
            <JobRoleFilter activeRole={activeRoleFilter} />
          </div>

          {/* Job cards */}
          <div className="flex-1 overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 px-4 text-center">
                <Briefcase className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {activeRoleFilter
                    ? `No ${JOB_ROLE_MAP[activeRoleFilter as JobRole] ?? activeRoleFilter} jobs yet.`
                    : "No jobs posted yet."}
                </p>
              </div>
            ) : (
              jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedId(job.id)}
                  className={cn(
                    "w-full border-b px-4 py-3 text-left transition-colors hover:bg-accent/60",
                    selectedId === job.id
                      ? "bg-accent border-l-2 border-l-primary"
                      : "border-l-2 border-l-transparent"
                  )}
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-sm font-semibold leading-snug">{job.title}</span>
                    <ChevronRight className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                  </div>

                  {/* Company + location */}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>

                  {/* Badges row */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${JOB_TYPE_COLORS[job.job_type] ?? ""}`}>
                      {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                    </span>
                    {job.is_community_network && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200">
                        <Network className="size-2.5" /> Community
                      </span>
                    )}
                    {job.offers_referral && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                        <Handshake className="size-2.5" /> Referral
                      </span>
                    )}
                    {job.roles.slice(0, 2).map((r) => (
                      <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border">
                        {JOB_ROLE_MAP[r as JobRole] ?? r}
                      </span>
                    ))}
                    {job.roles.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border">
                        +{job.roles.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Time */}
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="size-3" />
                    {formatRelativeTime(job.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex flex-1 flex-col min-w-0">
          {!selectedJob ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Briefcase className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Select a job from the list to view the posting.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* ── Title + badges ── */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold leading-snug">{selectedJob.title}</h2>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${JOB_TYPE_COLORS[selectedJob.job_type] ?? ""}`}>
                      {JOB_TYPE_LABELS[selectedJob.job_type] ?? selectedJob.job_type}
                    </span>
                    {selectedJob.is_community_network && (
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200">
                        <Network className="size-3" /> Community Network
                      </span>
                    )}
                    {selectedJob.offers_referral && (
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                        <Handshake className="size-3" /> Referral Available
                      </span>
                    )}
                  </div>

                  {/* Company + location + time */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{selectedJob.company}</span>
                    {selectedJob.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" /> {selectedJob.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {formatRelativeTime(selectedJob.created_at)}
                    </span>
                    {selectedJob.poster && (
                      <span className="text-xs">Posted by {selectedJob.poster.display_name}</span>
                    )}
                  </div>
                </div>

                {(isPlatformAdmin || selectedJob.posted_by === currentUserId) && (
                  <DeleteJobButton id={selectedJob.id} />
                )}
              </div>

              {/* ── Role tags ── */}
              {selectedJob.roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.roles.map((r) => (
                    <span key={r} className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border">
                      {JOB_ROLE_MAP[r as JobRole] ?? r}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Description ── */}
              {selectedJob.description && (
                <div className="rounded-xl border bg-muted/30 px-4 py-4 max-h-[55vh] overflow-y-auto">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* ── CTA: view full posting ── */}
              {selectedJob.url && (
                <a
                  href={selectedJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full rounded-xl border-2 border-primary/20 bg-primary/5 px-5 py-4 hover:bg-primary/10 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-primary">View Full Job Posting</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{selectedJob.url}</p>
                  </div>
                  <ExternalLink className="size-5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </a>
              )}

              {/* ── Action buttons ── */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <WishlistButton
                  jobPostingId={selectedJob.id}
                  company={selectedJob.company}
                  position={selectedJob.title}
                  url={selectedJob.url}
                  initialWishlisted={wishlistedSet.has(selectedJob.id)}
                />
                {selectedJob.offers_referral && selectedJob.posted_by !== currentUserId && selectedJob.poster && (
                  <MessagePosterButton
                    posterId={selectedJob.posted_by!}
                    posterName={selectedJob.poster.display_name}
                  />
                )}
              </div>

              {/* ── Community notes ── */}
              <div className="border-t pt-4">
                <JobComments
                  jobPostingId={selectedJob.id}
                  comments={commentsByJob[selectedJob.id] ?? []}
                  currentUserId={currentUserId}
                  isPlatformAdmin={isPlatformAdmin}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

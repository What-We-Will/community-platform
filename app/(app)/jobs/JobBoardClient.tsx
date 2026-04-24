"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  ExternalLink,
  Briefcase,
  Handshake,
  Network,
  ChevronRight,
  MessageSquare,
  GripVertical,
  GripHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { PostJobForm } from "./PostJobForm";
import { DeleteJobButton } from "./DeleteJobButton";
import { EditJobForm } from "./EditJobForm";
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
  activeReferralFilter: boolean;
  activeCommunityFilter: boolean;
  activeNotesFilter: boolean;
}

// ── Resize hook ──────────────────────────────────────────────────────────────

function useHorizontalResize(initial: number, min: number, max: number) {
  const [size, setSize] = useState(initial);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startSize = size;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      setSize(Math.max(min, Math.min(max, startSize + ev.clientX - startX)));
    }
    function onUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [size, min, max]);

  return [size, startResize] as const;
}

function useVerticalResize(initialFraction: number) {
  const [fraction, setFraction] = useState(initialFraction);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startFraction = fraction;
    const totalH = containerRef.current?.offsetHeight ?? 600;

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      const delta = ev.clientY - startY;
      setFraction(Math.max(0.2, Math.min(0.8, startFraction + delta / totalH)));
    }
    function onUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [fraction]);

  return [fraction, startResize, containerRef] as const;
}

// ── Component ────────────────────────────────────────────────────────────────

export function JobBoardClient({
  jobs,
  currentUserId,
  isPlatformAdmin,
  wishlistedIds,
  commentsByJob,
  activeRoleFilter,
  activeReferralFilter,
  activeCommunityFilter,
  activeNotesFilter,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id ?? null);
  const selectedJob = jobs.find((j) => j.id === selectedId) ?? null;
  const wishlistedSet = new Set(wishlistedIds);

  // Supabase can return a joined row as an array or object depending on the
  // relationship cardinality — normalise to a plain object or null.
  const selectedPoster = selectedJob
    ? (Array.isArray(selectedJob.poster)
        ? (selectedJob.poster[0] ?? null)
        : selectedJob.poster)
    : null;

  // Left panel width (px): default 340, min 200, max 560
  const [leftWidth, startHResize] = useHorizontalResize(340, 200, 560);

  // Right panel top/bottom split: default 67% details / 33% notes
  const [topFraction, startVResize, rightPanelRef] = useVerticalResize(0.67);

  return (
    <div className="-m-4 lg:-m-6 flex flex-col h-[calc(100dvh-56px)] lg:h-[100dvh]">

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 border-b bg-background px-4 py-3 lg:px-6">
        <div>
          <h1 className="text-xl font-bold">Community Job Board</h1>
          <p className="text-xs text-muted-foreground">
            Add a job to your Job Tracker wishlist and share Community Notes.
          </p>
        </div>
        <PostJobForm />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left panel ── */}
        <div
          className="flex shrink-0 flex-col border-r overflow-hidden"
          style={{ width: leftWidth }}
        >
          {/* Filter */}
          <div className="shrink-0 border-b px-3 py-2.5">
            <JobRoleFilter
              activeRole={activeRoleFilter}
              activeReferral={activeReferralFilter}
              activeCommunity={activeCommunityFilter}
              activeNotes={activeNotesFilter}
            />
          </div>

          {/* Job list */}
          <div className="flex-1 overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 px-4 text-center">
                <Briefcase className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {activeRoleFilter || activeReferralFilter || activeCommunityFilter || activeNotesFilter
                    ? "No jobs match the current filters."
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
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-sm font-semibold leading-snug">{job.title}</span>
                    <ChevronRight className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {job.company}{job.location ? ` · ${job.location}` : ""}
                  </p>
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
                    {(commentsByJob[job.id] ?? []).some((c) => !c.source_job_id) && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
                        <MessageSquare className="size-2.5" /> Notes
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
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="size-3" />
                    {formatRelativeTime(job.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Horizontal resize handle ── */}
        <div
          onMouseDown={startHResize}
          className="group relative w-1.5 shrink-0 cursor-col-resize bg-border hover:bg-primary/40 transition-colors flex items-center justify-center"
          title="Drag to resize"
        >
          <GripVertical className="size-3.5 text-muted-foreground/50 group-hover:text-primary/70 pointer-events-none" />
        </div>

        {/* ── Right panel ── */}
        <div ref={rightPanelRef} className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
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
            <>
              {/* ── TOP: job details ── */}
              <div
                className="overflow-y-auto px-6 py-5 space-y-4 shrink-0"
                style={{ height: `${topFraction * 100}%` }}
              >
                {/* Title + badges */}
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
                      {selectedPoster && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">Posted by</span>
                          <Link
                            href={`/members/${selectedPoster.id}`}
                            className="font-medium text-foreground hover:underline underline-offset-2"
                          >
                            {selectedPoster.display_name}
                          </Link>
                          {selectedJob.offers_referral && selectedJob.posted_by !== currentUserId && (
                            <MessagePosterButton
                              posterId={selectedJob.posted_by!}
                              posterName={selectedPoster.display_name}
                              compact
                            />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {(isPlatformAdmin || selectedJob.posted_by === currentUserId) && (
                    <div className="flex items-center gap-1 shrink-0">
                      <EditJobForm key={selectedJob.id} job={selectedJob} />
                      <DeleteJobButton id={selectedJob.id} />
                    </div>
                  )}
                </div>

                {/* Role tags */}
                {selectedJob.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.roles.map((r) => (
                      <span key={r} className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border">
                        {JOB_ROLE_MAP[r as JobRole] ?? r}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {selectedJob.description && (
                  <div className="rounded-xl border bg-muted/30 px-4 py-3 max-h-[22vh] overflow-y-auto">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                      {selectedJob.description}
                    </p>
                  </div>
                )}

                {/* CTA */}
                {selectedJob.url && (
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full rounded-xl border-2 border-primary/20 bg-primary/5 px-5 py-3 hover:bg-primary/10 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-primary">View Full Job Posting</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{selectedJob.url}</p>
                    </div>
                    <ExternalLink className="size-5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                  </a>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <WishlistButton
                    key={selectedJob.id}
                    jobPostingId={selectedJob.id}
                    company={selectedJob.company}
                    position={selectedJob.title}
                    url={selectedJob.url}
                    initialWishlisted={wishlistedSet.has(selectedJob.id)}
                  />
                  {selectedJob.offers_referral && selectedJob.posted_by && selectedJob.posted_by !== currentUserId && (
                    <MessagePosterButton
                      posterId={selectedJob.posted_by}
                      posterName={selectedPoster?.display_name ?? "the poster"}
                    />
                  )}
                </div>
              </div>

              {/* ── Vertical resize handle ── */}
              <div
                onMouseDown={startVResize}
                className="group relative h-1.5 shrink-0 cursor-row-resize bg-border hover:bg-primary/40 transition-colors flex items-center justify-center"
                title="Drag to resize"
              >
                <GripHorizontal className="size-3.5 text-muted-foreground/50 group-hover:text-primary/70 pointer-events-none" />
              </div>

              {/* ── BOTTOM: community notes ── */}
              <div className="flex flex-1 flex-col min-h-0 overflow-hidden px-6 pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">
                    Community Notes
                    {(commentsByJob[selectedJob.id] ?? []).length > 0 && (
                      <span className="ml-1.5 text-muted-foreground font-normal">
                        ({(commentsByJob[selectedJob.id] ?? []).length})
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <JobComments
                    jobPostingId={selectedJob.id}
                    comments={commentsByJob[selectedJob.id] ?? []}
                    currentUserId={currentUserId}
                    isPlatformAdmin={isPlatformAdmin}
                    alwaysOpen
                    onSelectJob={setSelectedId}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

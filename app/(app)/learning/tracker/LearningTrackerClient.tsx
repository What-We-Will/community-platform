"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, PlaySquare, BookOpen, ListTodo,
  ExternalLink, Loader2, X, ChevronLeft, ChevronRight, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateTrackerStatus, removeFromTracker, type TrackerStatus,
} from "../learning-tracker-actions";
import type { TrackerItem } from "../page";

// ── Constants ─────────────────────────────────────────────────────────────────

const TRACKER_STATUSES: {
  value: TrackerStatus;
  label: string;
  color: string;
  bg: string;
  colBg: string;
}[] = [
  { value: "want_to_take", label: "Want to Take",  color: "text-blue-700",    bg: "bg-blue-100 border-blue-200",    colBg: "bg-blue-50/60" },
  { value: "in_progress",  label: "In Progress",   color: "text-amber-700",   bg: "bg-amber-100 border-amber-200",  colBg: "bg-amber-50/60" },
  { value: "completed",    label: "Completed",     color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200", colBg: "bg-emerald-50/60" },
];

const STATUS_IDX: Record<TrackerStatus, number> = {
  want_to_take: 0,
  in_progress: 1,
  completed: 2,
};

// ── Kanban Card ───────────────────────────────────────────────────────────────

function TrackerKanbanCard({ item }: { item: TrackerItem }) {
  const router = useRouter();
  const [movingTo, setMovingTo] = useState<TrackerStatus | null>(null);
  const [removing, setRemoving] = useState(false);

  const idx = STATUS_IDX[item.status];
  const prevStatus = idx > 0 ? TRACKER_STATUSES[idx - 1].value : null;
  const nextStatus = idx < 2 ? TRACKER_STATUSES[idx + 1].value : null;

  const typeIcon =
    item.resource?.type === "video" ? <PlaySquare className="size-3 shrink-0" /> :
    item.resource?.type === "course" ? <GraduationCap className="size-3 shrink-0" /> :
    <BookOpen className="size-3 shrink-0" />;

  async function handleMove(status: TrackerStatus) {
    setMovingTo(status);
    await updateTrackerStatus(item.id, status);
    setMovingTo(null);
    router.refresh();
  }

  async function handleRemove() {
    setRemoving(true);
    await removeFromTracker(item.id);
    setRemoving(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
            {typeIcon}
            <span className="capitalize">{item.resource?.type ?? "resource"}</span>
          </div>
          {item.resource ? (
            <a
              href={item.resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors leading-snug"
            >
              {item.resource.title}
              <ExternalLink className="size-3 opacity-50 shrink-0" />
            </a>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground italic">Resource removed</p>
          )}
          {item.resource?.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {item.resource.description}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          title="Remove from tracker"
        >
          {removing ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
        </button>
      </div>

      {/* Column move controls */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          {prevStatus && (
            <button
              onClick={() => handleMove(prevStatus)}
              disabled={!!movingTo}
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {movingTo === prevStatus
                ? <Loader2 className="size-3 animate-spin" />
                : <ChevronLeft className="size-3" />}
              {TRACKER_STATUSES[STATUS_IDX[prevStatus]].label}
            </button>
          )}
        </div>
        <div>
          {nextStatus && (
            <button
              onClick={() => handleMove(nextStatus)}
              disabled={!!movingTo}
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {TRACKER_STATUSES[STATUS_IDX[nextStatus]].label}
              {movingTo === nextStatus
                ? <Loader2 className="size-3 animate-spin" />
                : <ChevronRight className="size-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Client ───────────────────────────────────────────────────────────────

export function LearningTrackerClient({ trackerItems }: { trackerItems: TrackerItem[] }) {
  return (
    <>
      {trackerItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <ListTodo className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Your tracker is empty</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Browse Courses, Videos, or Tutorials in{" "}
            <a href="/learning" className="text-primary hover:underline">Group Learning</a>{" "}
            and click <strong>Add to My Tracker</strong> to get started.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TRACKER_STATUSES.map((col) => {
            const colItems = trackerItems.filter((t) => t.status === col.value);
            return (
              <div
                key={col.value}
                className={cn("flex flex-col gap-2 w-72 shrink-0 rounded-xl p-3", col.colBg)}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={cn("text-sm font-bold", col.color)}>{col.label}</span>
                  <span className="text-[10px] text-muted-foreground font-medium bg-white/70 rounded-full px-1.5 py-0.5">
                    {colItems.length}
                  </span>
                </div>
                <div className={cn("h-0.5 w-full rounded-full mb-1", col.bg.split(" ")[0])} />

                {colItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    Nothing here yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {colItems.map((item) => (
                      <TrackerKanbanCard key={item.id} item={item} />
                    ))}
                  </div>
                )}

                {col.value === "completed" && colItems.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <Check className="size-3" /> {colItems.length} completed!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

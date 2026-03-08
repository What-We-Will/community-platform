"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutList, Kanban, CalendarDays, ExternalLink, Trash2, Pencil, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteApplication, type ApplicationStatus, type Interview } from "./actions";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { CalendarView } from "./CalendarView";
import { STATUSES, STATUS_MAP } from "./constants";

export interface Application {
  id: string;
  company: string;
  position: string;
  applied_date: string | null;
  status: ApplicationStatus;
  notes: string | null;
  community_notes: string | null;
  status_dates: Record<string, string>;
  url: string | null;
  is_shared: boolean;
  job_posting_id: string | null;
  created_at: string;
  user_id: string;
  poster?: { id: string; display_name: string } | null;
}

interface Props {
  applications: Application[];
  interviews: Interview[];
  currentUserId: string;
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", s?.bg)}>
      {s?.label ?? status}
    </span>
  );
}

function ApplicationCard({
  app,
  currentUserId,
  compact = false,
  onOpen,
}: {
  app: Application;
  currentUserId: string;
  compact?: boolean;
  onOpen: (app: Application) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const isOwn = app.user_id === currentUserId;

  async function handleDelete() {
    setDeleting(true);
    await deleteApplication(app.id);
    setDeleting(false);
    router.refresh();
  }

  return (
    <div
      onClick={() => onOpen(app)}
      className="rounded-lg border bg-card p-3 space-y-2 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">{app.position}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{app.company}</p>
        </div>
        {!compact && isOwn && (
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <ApplicationForm
              mode="edit"
              initialValues={{ ...app, applied_date: app.applied_date ?? "", notes: app.notes ?? "", community_notes: app.community_notes ?? "", url: app.url ?? "", is_shared: app.is_shared }}
              trigger={
                <Button variant="ghost" size="icon" className="size-7">
                  <Pencil className="size-3.5" />
                </Button>
              }
            />
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </Button>
          </div>
        )}
      </div>

      {!compact && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={app.status} />
            {app.applied_date && (
              <span className="text-[11px] text-muted-foreground">
                Applied {new Date(app.applied_date).toLocaleDateString()}
              </span>
            )}
            {app.is_shared && (
              <span className="text-[11px] flex items-center gap-0.5 text-muted-foreground">
                <Users className="size-3" /> Shared
              </span>
            )}
          </div>
          {app.notes && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{app.notes}</p>
          )}
          {app.url && (
            <a href={app.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View posting <ExternalLink className="size-3" />
            </a>
          )}
          {!isOwn && app.poster && (
            <p className="text-[11px] text-muted-foreground">
              <Link href={`/members/${app.poster.id}`} className="hover:underline">{app.poster.display_name}</Link>
            </p>
          )}
        </>
      )}

      {compact && (
        <>
          {/* Applied date */}
          {app.applied_date && (
            <p className="text-[11px] text-muted-foreground">
              Applied {new Date(app.applied_date).toLocaleDateString()}
            </p>
          )}

          {/* Notes preview */}
          {app.notes && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{app.notes}</p>
          )}

          {/* Footer: shared badge + actions */}
          <div className="flex items-center justify-between gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5">
              {app.is_shared && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Users className="size-3" /> Shared
                </span>
              )}
              {app.url && (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-2.5" /> Posting
                </a>
              )}
            </div>
            {isOwn && (
              <div className="flex gap-0.5">
                <ApplicationForm
                  mode="edit"
                  initialValues={{ ...app, applied_date: app.applied_date ?? "", notes: app.notes ?? "", community_notes: app.community_notes ?? "", url: app.url ?? "", is_shared: app.is_shared }}
                  trigger={
                    <Button variant="ghost" size="icon" className="size-6">
                      <Pencil className="size-3" />
                    </Button>
                  }
                />
                <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function TrackerClient({ applications, interviews, currentUserId }: Props) {
  const [view, setView] = useState<"list" | "kanban" | "calendar">("kanban");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const myApps = applications.filter((a) => a.user_id === currentUserId);
  const myInterviews = interviews.filter((iv) => iv.user_id === currentUserId);

  return (
    <>
    {selectedApp && (
      <ApplicationDetailModal
        app={selectedApp}
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        currentUserId={currentUserId}
        interviews={myInterviews.filter((iv) => iv.application_id === selectedApp.id)}
      />
    )}
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-lg border p-0.5 gap-0.5">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => setView("list")}
          >
            <LayoutList className="size-3.5" />
            List
          </Button>
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => setView("kanban")}
          >
            <Kanban className="size-3.5" />
            Board
          </Button>
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="size-3.5" />
            Calendar
          </Button>
        </div>
        <ApplicationForm />
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="space-y-4">
          {myApps.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-6 text-center">
              No applications yet. Add one to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {myApps.map((app) => (
                <ApplicationCard key={app.id} app={app} currentUserId={currentUserId} onOpen={setSelectedApp} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── KANBAN VIEW ───────────────────────────────────────────── */}
      {view === "kanban" && (
        <div className="space-y-8">
          {/* My Board */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              My Applications
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {STATUSES.map((col) => {
                // 'rejected' column also captures legacy 'withdrawn' entries
                const colApps = myApps.filter((a) =>
                  col.value === "rejected"
                    ? a.status === "rejected" || a.status === "withdrawn"
                    : a.status === col.value
                );
                return (
                  <div key={col.value} className={cn("flex flex-col gap-2 w-64 shrink-0 rounded-xl p-3", col.columnBg)}>
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn("text-sm font-bold", col.color)}>{col.label}</span>
                      <span className="text-[10px] text-muted-foreground font-medium bg-white/70 rounded-full px-1.5 py-0.5">
                        {colApps.length}
                      </span>
                    </div>
                    <div className={cn("h-0.5 w-full rounded-full", col.bg.split(" ")[0])} />
                    <div className="space-y-2 min-h-[60px]">
                      {colApps.map((app) => (
                        <ApplicationCard key={app.id} app={app} currentUserId={currentUserId} compact onOpen={setSelectedApp} />
                      ))}
                    </div>
                    <ApplicationForm
                      defaultStatus={col.value as ApplicationStatus}
                      trigger={
                        <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground border border-dashed bg-white/50 hover:bg-white/80 mt-1">
                          + Add
                        </Button>
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {/* ── CALENDAR VIEW ─────────────────────────────────────────── */}
      {view === "calendar" && (
        <CalendarView
          applications={myApps}
          interviews={myInterviews}
          onOpenApp={setSelectedApp}
        />
      )}
    </div>
    </>
  );
}

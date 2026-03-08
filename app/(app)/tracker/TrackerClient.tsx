"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutList, Kanban, ExternalLink, Trash2, Pencil, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteApplication, type ApplicationStatus } from "./actions";
import { ApplicationForm } from "./ApplicationForm";
import { STATUSES, STATUS_MAP } from "./constants";

export interface Application {
  id: string;
  company: string;
  position: string;
  applied_date: string | null;
  status: ApplicationStatus;
  notes: string | null;
  url: string | null;
  is_shared: boolean;
  created_at: string;
  user_id: string;
  poster?: { id: string; display_name: string } | null;
}

interface Props {
  applications: Application[];
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
}: {
  app: Application;
  currentUserId: string;
  compact?: boolean;
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
    <div className={cn(
      "rounded-lg border bg-card p-3 space-y-2 hover:border-primary/30 transition-colors",
      compact && "p-2.5 space-y-1.5"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{app.position}</p>
          <p className="text-xs text-muted-foreground truncate">{app.company}</p>
        </div>
        {!compact && isOwn && (
          <div className="flex gap-1 shrink-0">
            <ApplicationForm
              mode="edit"
              initialValues={{ ...app, applied_date: app.applied_date ?? "", notes: app.notes ?? "", url: app.url ?? "", is_shared: app.is_shared }}
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
        <div className="flex items-center justify-between gap-2">
          {app.applied_date && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(app.applied_date).toLocaleDateString()}
            </span>
          )}
          {isOwn && (
            <div className="flex gap-0.5">
              <ApplicationForm
                mode="edit"
                initialValues={{ ...app, applied_date: app.applied_date ?? "", notes: app.notes ?? "", url: app.url ?? "", is_shared: app.is_shared }}
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
      )}
    </div>
  );
}

export function TrackerClient({ applications, currentUserId }: Props) {
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const myApps = applications.filter((a) => a.user_id === currentUserId);
  const sharedApps = applications.filter((a) => a.user_id !== currentUserId && a.is_shared);

  return (
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
        </div>
        <ApplicationForm />
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="space-y-8">
          {/* My Applications */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              My Applications ({myApps.length})
            </h2>
            {myApps.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-6 text-center">
                No applications yet. Add one to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {myApps.map((app) => (
                  <ApplicationCard key={app.id} app={app} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </section>

          {/* Shared by community */}
          {sharedApps.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Shared by Community ({sharedApps.length})
              </h2>
              <div className="space-y-2">
                {sharedApps.map((app) => (
                  <ApplicationCard key={app.id} app={app} currentUserId={currentUserId} />
                ))}
              </div>
            </section>
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
                  <div key={col.value} className={cn("flex flex-col gap-2 w-52 shrink-0 rounded-xl p-3", col.columnBg)}>
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn("text-xs font-semibold", col.color)}>{col.label}</span>
                      <span className="text-[10px] text-muted-foreground font-medium bg-white/70 rounded-full px-1.5 py-0.5">
                        {colApps.length}
                      </span>
                    </div>
                    <div className={cn("h-0.5 w-full rounded-full", col.bg.split(" ")[0])} />
                    <div className="space-y-2 min-h-[60px]">
                      {colApps.map((app) => (
                        <ApplicationCard key={app.id} app={app} currentUserId={currentUserId} compact />
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

          {/* Shared by community */}
          {sharedApps.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Shared by Community
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {STATUSES.map((col) => {
                  const colApps = sharedApps.filter((a) =>
                    col.value === "rejected"
                      ? a.status === "rejected" || a.status === "withdrawn"
                      : a.status === col.value
                  );
                  if (colApps.length === 0) return null;
                  return (
                    <div key={col.value} className={cn("flex flex-col gap-2 w-52 shrink-0 rounded-xl p-3", col.columnBg)}>
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("text-xs font-semibold", col.color)}>{col.label}</span>
                        <span className="text-[10px] text-muted-foreground font-medium bg-white/70 rounded-full px-1.5 py-0.5">
                          {colApps.length}
                        </span>
                      </div>
                      <div className={cn("h-0.5 w-full rounded-full", col.bg.split(" ")[0])} />
                      <div className="space-y-2">
                        {colApps.map((app) => (
                          <ApplicationCard key={app.id} app={app} currentUserId={currentUserId} compact />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

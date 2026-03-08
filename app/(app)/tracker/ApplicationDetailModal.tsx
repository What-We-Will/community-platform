"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink, Pencil, Trash2, Loader2, Check, X, Lock, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateApplication, updateStatusDate, deleteApplication, syncCommunityNote, type ApplicationStatus } from "./actions";
import { STATUSES, STATUS_MAP } from "./constants";
import type { Application } from "./TrackerClient";

interface Props {
  app: Application;
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function InlineEdit({
  value,
  onSave,
  multiline = false,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(value);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(draft);
    setSaved(draft);
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(saved); setEditing(true); }}
        className={cn(
          "w-full text-left text-sm rounded-lg px-3 py-2 border border-transparent hover:border-border hover:bg-muted/40 transition-colors group whitespace-pre-wrap",
          !saved && "text-muted-foreground italic"
        )}
      >
        {saved || placeholder || "Click to add…"}
        <Pencil className="inline-block size-3 ml-1.5 opacity-0 group-hover:opacity-50 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {multiline ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="min-h-[90px] text-sm"
          autoFocus
        />
      ) : (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="text-sm"
          autoFocus
        />
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving} className="h-7 gap-1">
          {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 gap-1">
          <X className="size-3" /> Cancel
        </Button>
      </div>
    </div>
  );
}

export function ApplicationDetailModal({ app, open, onClose, currentUserId }: Props) {
  const router = useRouter();
  const isOwn = app.user_id === currentUserId;
  const [deleting, setDeleting] = useState(false);
  const [statusDates, setStatusDates] = useState<Record<string, string>>(
    (app.status_dates ?? {}) as Record<string, string>
  );
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(app.status);
  const [savingStatus, setSavingStatus] = useState(false);

  async function handleStatusChange(newStatus: ApplicationStatus) {
    setSavingStatus(true);
    await updateApplication(app.id, { status: newStatus });
    // Auto-record today if not already set
    if (!statusDates[newStatus]) {
      const today = new Date().toISOString().split("T")[0];
      setStatusDates((prev) => ({ ...prev, [newStatus]: today }));
    }
    setCurrentStatus(newStatus);
    setSavingStatus(false);
    router.refresh();
  }

  async function handleDateChange(status: ApplicationStatus, date: string) {
    await updateStatusDate(app.id, status, date);
    setStatusDates((prev) =>
      date ? { ...prev, [status]: date } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== status))
    );
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteApplication(app.id);
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold leading-snug">{app.position}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{app.company}</p>
            </div>
            {isOwn && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* URL */}
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              View Job Posting <ExternalLink className="size-3.5" />
            </a>
          )}

          {/* Status selector */}
          {isOwn && (
            <div className="flex items-center gap-3">
              <Label className="shrink-0 text-sm">Status</Label>
              <Select
                value={currentStatus}
                onValueChange={(v) => handleStatusChange(v as ApplicationStatus)}
                disabled={savingStatus}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {savingStatus && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </div>
          )}

          {/* Status timeline with dates */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Stage Timeline</h3>
            <div className="space-y-1.5">
              {STATUSES.map((s, i) => {
                const isCurrent = currentStatus === s.value ||
                  (s.value === "rejected" && (currentStatus === "rejected" || currentStatus === "withdrawn"));
                const hasDate = !!statusDates[s.value];
                const isReached = hasDate || isCurrent;

                return (
                  <div
                    key={s.value}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                      isCurrent ? s.columnBg : "bg-muted/30",
                      !isReached && "opacity-50"
                    )}
                  >
                    {/* Step number */}
                    <div className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      isCurrent ? `${s.bg} ${s.color}` : "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>

                    {/* Label */}
                    <span className={cn("text-sm font-medium w-36 shrink-0", isCurrent ? s.color : "text-muted-foreground")}>
                      {s.label}
                    </span>

                    {/* Date */}
                    {isOwn ? (
                      <input
                        type="date"
                        value={statusDates[s.value] ?? ""}
                        onChange={(e) => handleDateChange(s.value as ApplicationStatus, e.target.value)}
                        className={cn(
                          "text-xs rounded border px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary",
                          !hasDate && "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {hasDate ? formatDate(statusDates[s.value]) : "—"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personal Notes — always private */}
          <div className="space-y-2 rounded-xl border p-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Lock className="size-3.5 text-muted-foreground" />
              Personal Notes
            </div>
            <p className="text-[11px] text-muted-foreground">Only visible to you</p>
            {isOwn ? (
              <InlineEdit
                value={app.notes ?? ""}
                placeholder="Interview tips, contacts, key info…"
                multiline
                onSave={async (v) => {
                  await updateApplication(app.id, { notes: v });
                  router.refresh();
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">Private</p>
            )}
          </div>

          {/* Community Notes — only available when linked to a job posting */}
          {isOwn && app.job_posting_id && (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Users className="size-3.5 text-primary" />
                Community Notes
              </div>
              <p className="text-[11px] text-muted-foreground">
                Saved here and posted on the job board listing for others to see.
              </p>
              <InlineEdit
                value={app.community_notes ?? ""}
                placeholder="Tips for others applying here — interview process, salary info, contacts…"
                multiline
                onSave={async (v) => {
                  await updateApplication(app.id, { community_notes: v });
                  await syncCommunityNote(app.job_posting_id!, v);
                  router.refresh();
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

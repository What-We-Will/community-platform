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
  CalendarDays, Plus, Clock, HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateApplication, updateStatusDate, deleteApplication, syncCommunityNote, addInterview, deleteInterview, requestHelp, cancelHelp, type ApplicationStatus, type Interview, type HelpRequest } from "./actions";
import { STATUSES, STATUS_MAP } from "./constants";
import type { Application } from "./TrackerClient";

interface Props {
  app: Application;
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  interviews: Interview[];
  helpRequests: HelpRequest[];
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmt12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
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

export function ApplicationDetailModal({ app, open, onClose, currentUserId, interviews, helpRequests }: Props) {
  const router = useRouter();
  const isOwn = app.user_id === currentUserId;
  const [deleting, setDeleting] = useState(false);
  const [statusDates, setStatusDates] = useState<Record<string, string>>(
    (app.status_dates ?? {}) as Record<string, string>
  );
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(app.status);
  const [savingStatus, setSavingStatus] = useState(false);

  // Interview scheduling state
  const [addingInterview, setAddingInterview] = useState(false);
  const [ivTitle, setIvTitle] = useState("");
  const [ivDate, setIvDate] = useState("");
  const [ivTime, setIvTime] = useState("");
  const [ivNotes, setIvNotes] = useState("");
  const [savingInterview, setSavingInterview] = useState(false);
  const [deletingInterviewId, setDeletingInterviewId] = useState<string | null>(null);

  // Help request state
  const [localHelp, setLocalHelp] = useState<HelpRequest[]>(helpRequests);
  const [askingHelpFor, setAskingHelpFor] = useState<string | null>(null); // iv.id or stage key
  const [helpMessage, setHelpMessage] = useState("");
  const [savingHelp, setSavingHelp] = useState(false);
  const [cancelingHelpId, setCancelingHelpId] = useState<string | null>(null);

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

  async function handleAddInterview(e: React.FormEvent) {
    e.preventDefault();
    setSavingInterview(true);
    await addInterview(app.id, ivTitle, ivDate, ivTime, ivNotes);
    setSavingInterview(false);
    setIvTitle(""); setIvDate(""); setIvTime(""); setIvNotes("");
    setAddingInterview(false);
    router.refresh();
  }

  async function handleDeleteInterview(id: string) {
    setDeletingInterviewId(id);
    await deleteInterview(id);
    setDeletingInterviewId(null);
    router.refresh();
  }

  async function handleRequestHelp(
    key: string, // interview id or stage statusKey
    title: string,
    interviewDate: string,
    stageKey: string | null,
    interviewId: string | null,
  ) {
    setSavingHelp(true);
    const res = await requestHelp(
      app.id,
      title,
      app.company,
      app.position,
      interviewDate,
      stageKey,
      interviewId,
      helpMessage,
    );
    setSavingHelp(false);
    if (!res.error) {
      // Optimistic: add a placeholder so UI updates immediately
      setLocalHelp((prev) => [
        ...prev,
        {
          id: `optimistic-${key}`,
          user_id: currentUserId,
          application_id: app.id,
          title,
          company: app.company,
          position: app.position,
          interview_date: interviewDate,
          stage_key: stageKey,
          interview_id: interviewId,
          message: helpMessage.trim() || null,
          is_open: true,
          created_at: new Date().toISOString(),
        },
      ]);
      setAskingHelpFor(null);
      setHelpMessage("");
      router.refresh();
    }
  }

  async function handleCancelHelp(helpId: string) {
    setCancelingHelpId(helpId);
    await cancelHelp(helpId);
    setLocalHelp((prev) => prev.filter((h) => h.id !== helpId));
    setCancelingHelpId(null);
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

          {/* Interviews */}
          {isOwn && (
            <div className="space-y-3 rounded-xl border p-4">
              {(() => {
                const todayStr = new Date().toISOString().split("T")[0];

                // Manually scheduled interviews
                const sortedIvs = [...interviews].sort(
                  (a, b) =>
                    a.interview_date.localeCompare(b.interview_date) ||
                    (a.interview_time ?? "").localeCompare(b.interview_time ?? "")
                );
                const upcomingIvs = sortedIvs.filter((iv) => iv.interview_date >= todayStr);
                const pastIvs = sortedIvs.filter((iv) => iv.interview_date < todayStr);

                // Auto-detected upcoming dates from the Stage Timeline
                // (any status_date set to today or future that isn't already covered by a
                //  manual interview on the same date with the same label)
                const autoDetected = Object.entries(app.status_dates ?? {})
                  .filter(([, date]) => date && date >= todayStr)
                  .map(([statusKey, date]) => {
                    const info = STATUS_MAP[statusKey];
                    return info ? { statusKey, date, label: info.label } : null;
                  })
                  .filter((s): s is { statusKey: string; date: string; label: string } => s !== null)
                  .sort((a, b) => a.date.localeCompare(b.date));

                // Merge upcoming manual + auto-detected, sorted by date
                type UpcomingItem =
                  | { kind: "interview"; iv: (typeof interviews)[number] }
                  | { kind: "stage"; statusKey: string; date: string; label: string };

                const upcomingAll: UpcomingItem[] = [
                  ...upcomingIvs.map((iv) => ({ kind: "interview" as const, iv })),
                  ...autoDetected.map((s) => ({ kind: "stage" as const, ...s })),
                ].sort((a, b) => {
                  const da = a.kind === "interview" ? a.iv.interview_date : a.date;
                  const db = b.kind === "interview" ? b.iv.interview_date : b.date;
                  return da.localeCompare(db);
                });

                const totalUpcoming = upcomingAll.length;

                return (
                  <>
                    {/* Section header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <CalendarDays className="size-3.5 text-muted-foreground" />
                        Interviews
                        {totalUpcoming > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {totalUpcoming} upcoming
                          </span>
                        )}
                      </div>
                      {!addingInterview && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => setAddingInterview(true)}
                        >
                          <Plus className="size-3.5" /> Schedule
                        </Button>
                      )}
                    </div>

                    {interviews.length === 0 && autoDetected.length === 0 && !addingInterview && (
                      <p className="text-xs text-muted-foreground italic">
                        No interviews scheduled. Click Schedule to add one.
                      </p>
                    )}

                    {/* Upcoming (manual + auto-detected from timeline) */}
                    {upcomingAll.length > 0 && (
                      <div className="space-y-1.5">
                        {pastIvs.length > 0 && (
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Upcoming</p>
                        )}
                        {upcomingAll.map((item) => {
                          if (item.kind === "interview") {
                            const iv = item.iv;
                            const isToday = iv.interview_date === todayStr;
                            const existingHelp = localHelp.find((h) => h.interview_id === iv.id);
                            const isAskingThis = askingHelpFor === iv.id;
                            return (
                              <div key={iv.id} className="space-y-1.5">
                                <div
                                  className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 ${
                                    isToday ? "bg-emerald-50 border border-emerald-200" : "bg-muted/40"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-sm font-medium leading-snug">{iv.title}</p>
                                      {isToday && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Today</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                      <CalendarDays className="size-3 shrink-0" />
                                      {formatDate(iv.interview_date)}
                                      {iv.interview_time && <><Clock className="size-3 shrink-0 ml-1" />{fmt12h(iv.interview_time)}</>}
                                    </p>
                                    {iv.notes && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{iv.notes}</p>}
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    {existingHelp ? (
                                      <div className="flex flex-col items-end gap-1">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                          <HeartHandshake className="size-3" /> Help Requested
                                        </span>
                                        <button
                                          type="button"
                                          className="text-[10px] text-muted-foreground hover:text-destructive underline underline-offset-2"
                                          onClick={() => handleCancelHelp(existingHelp.id)}
                                          disabled={cancelingHelpId === existingHelp.id}
                                        >
                                          {cancelingHelpId === existingHelp.id ? "Canceling…" : "Cancel"}
                                        </button>
                                      </div>
                                    ) : !isAskingThis && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                        onClick={() => { setAskingHelpFor(iv.id); setHelpMessage(""); }}
                                      >
                                        <HeartHandshake className="size-3.5" /> Ask for Help
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost" size="icon"
                                      className="size-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeleteInterview(iv.id)}
                                      disabled={deletingInterviewId === iv.id}
                                    >
                                      {deletingInterviewId === iv.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                                    </Button>
                                  </div>
                                </div>
                                {/* Inline help request form */}
                                {isAskingThis && (
                                  <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 space-y-2">
                                    <p className="text-xs font-medium text-violet-800">Ask the community for help with this interview</p>
                                    <textarea
                                      className="w-full rounded-md border border-violet-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none"
                                      rows={2}
                                      placeholder="Optional message — e.g. looking for a mock interview partner or tips on the process…"
                                      value={helpMessage}
                                      onChange={(e) => setHelpMessage(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm" className="h-6 text-[11px] bg-violet-600 hover:bg-violet-700 text-white"
                                        onClick={() => handleRequestHelp(iv.id, iv.title, iv.interview_date, null, iv.id)}
                                        disabled={savingHelp}
                                      >
                                        {savingHelp ? <Loader2 className="size-3 animate-spin mr-1" /> : <HeartHandshake className="size-3 mr-1" />}
                                        Post to Community
                                      </Button>
                                      <Button
                                        type="button" variant="ghost" size="sm" className="h-6 text-[11px]"
                                        onClick={() => { setAskingHelpFor(null); setHelpMessage(""); }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // Auto-detected stage entry
                          const stageInfo = STATUS_MAP[item.statusKey];
                          const isToday = item.date === todayStr;
                          const existingHelp = localHelp.find((h) => h.stage_key === item.statusKey);
                          const isAskingThis = askingHelpFor === `stage-${item.statusKey}`;
                          return (
                            <div key={`stage-${item.statusKey}`} className="space-y-1.5">
                              <div
                                className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 border border-dashed ${
                                  isToday ? "bg-emerald-50 border-emerald-200" : "bg-muted/20"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-sm font-medium leading-snug">{item.label}</p>
                                    {isToday && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Today</span>
                                    )}
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${stageInfo?.bg ?? "bg-muted"}`}>
                                      From timeline
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <CalendarDays className="size-3 shrink-0" />
                                    {formatDate(item.date)}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  {existingHelp ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                        <HeartHandshake className="size-3" /> Help Requested
                                      </span>
                                      <button
                                        type="button"
                                        className="text-[10px] text-muted-foreground hover:text-destructive underline underline-offset-2"
                                        onClick={() => handleCancelHelp(existingHelp.id)}
                                        disabled={cancelingHelpId === existingHelp.id}
                                      >
                                        {cancelingHelpId === existingHelp.id ? "Canceling…" : "Cancel"}
                                      </button>
                                    </div>
                                  ) : !isAskingThis && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                      onClick={() => { setAskingHelpFor(`stage-${item.statusKey}`); setHelpMessage(""); }}
                                    >
                                      <HeartHandshake className="size-3.5" /> Ask for Help
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {/* Inline help request form */}
                              {isAskingThis && (
                                <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 space-y-2">
                                  <p className="text-xs font-medium text-violet-800">Ask the community for help with this stage</p>
                                  <textarea
                                    className="w-full rounded-md border border-violet-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none"
                                    rows={2}
                                    placeholder="Optional message — e.g. looking for a mock interview partner or tips on the process…"
                                    value={helpMessage}
                                    onChange={(e) => setHelpMessage(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm" className="h-6 text-[11px] bg-violet-600 hover:bg-violet-700 text-white"
                                      onClick={() => handleRequestHelp(`stage-${item.statusKey}`, item.label, item.date, item.statusKey, null)}
                                      disabled={savingHelp}
                                    >
                                      {savingHelp ? <Loader2 className="size-3 animate-spin mr-1" /> : <HeartHandshake className="size-3 mr-1" />}
                                      Post to Community
                                    </Button>
                                    <Button
                                      type="button" variant="ghost" size="sm" className="h-6 text-[11px]"
                                      onClick={() => { setAskingHelpFor(null); setHelpMessage(""); }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Past manually scheduled interviews */}
                    {pastIvs.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Past</p>
                        {pastIvs.map((iv) => {
                          const isToday = iv.interview_date === todayStr;
                          return (
                            <div key={iv.id} className="flex items-start justify-between gap-2 rounded-lg px-3 py-2.5 bg-muted/20">
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-snug text-muted-foreground">{iv.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <CalendarDays className="size-3 shrink-0" />
                                  {formatDate(iv.interview_date)}
                                  {iv.interview_time && <><Clock className="size-3 shrink-0 ml-1" />{fmt12h(iv.interview_time)}</>}
                                </p>
                                {iv.notes && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{iv.notes}</p>}
                              </div>
                              <Button
                                variant="ghost" size="icon"
                                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteInterview(iv.id)}
                                disabled={deletingInterviewId === iv.id}
                              >
                                {deletingInterviewId === iv.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Add interview form */}
              {addingInterview && (
                <form onSubmit={handleAddInterview} className="space-y-2.5 rounded-lg border bg-muted/20 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Interview title</Label>
                      <Input
                        placeholder="e.g. Technical Screen"
                        value={ivTitle}
                        onChange={(e) => setIvTitle(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={ivDate}
                        onChange={(e) => setIvDate(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Time <span className="text-muted-foreground">(optional)</span></Label>
                      <Input
                        type="time"
                        value={ivTime}
                        onChange={(e) => setIvTime(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes <span className="text-muted-foreground">(optional)</span></Label>
                      <Input
                        placeholder="Interviewer name, format…"
                        value={ivNotes}
                        onChange={(e) => setIvNotes(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="h-7 text-xs" disabled={savingInterview}>
                      {savingInterview && <Loader2 className="size-3 animate-spin mr-1" />}
                      Add Interview
                    </Button>
                    <Button
                      type="button" variant="ghost" size="sm" className="h-7 text-xs"
                      onClick={() => { setAddingInterview(false); setIvTitle(""); setIvDate(""); setIvTime(""); setIvNotes(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

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
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                <Users className="size-3.5 text-emerald-600" />
                Community Notes
              </div>
              <p className="text-[11px] text-emerald-700/70">
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

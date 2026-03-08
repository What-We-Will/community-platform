"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star, ChevronDown, ChevronRight, Trash2, Plus, ExternalLink,
  Loader2, GraduationCap, PlaySquare, BookOpen, Route, BookMarked,
  ListTodo, Users2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import {
  createPath, deletePath, toggleStarPath,
  addPathItem, deletePathItem,
  addResource, deleteResource,
} from "./learning-actions";
import {
  addToTracker, updateTrackerStatus, removeFromTracker,
  createStudyGroup, joinStudyGroup, leaveStudyGroup, deleteStudyGroup,
  type TrackerStatus,
} from "./learning-tracker-actions";
import type { LearningPath, LearningPathItem, LearningResource, ResourceType } from "./types";
import type { StudyGroupRow } from "./page";
import type { TrackerItem } from "./page";

// ── Constants ─────────────────────────────────────────────────────────────────

const TRACKER_STATUSES: { value: TrackerStatus; label: string; color: string; bg: string; colBg: string }[] = [
  { value: "want_to_take", label: "Want to Take",  color: "text-blue-700",  bg: "bg-blue-100 border-blue-200",  colBg: "bg-blue-50/60" },
  { value: "in_progress",  label: "In Progress",   color: "text-amber-700", bg: "bg-amber-100 border-amber-200", colBg: "bg-amber-50/60" },
  { value: "completed",    label: "Completed",     color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200", colBg: "bg-emerald-50/60" },
];

// ── YouTube helper ────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Resource Tracker Footer ───────────────────────────────────────────────────
// Shared footer for every resource card: tracker status + study groups

interface ResourceTrackerFooterProps {
  resourceId: string;
  trackerItem: { id: string; status: TrackerStatus } | null;
  studyGroups: StudyGroupRow[];
  currentUserId: string;
  isPlatformAdmin: boolean;
}

function ResourceTrackerFooter({
  resourceId,
  trackerItem,
  studyGroups,
  currentUserId,
  isPlatformAdmin,
}: ResourceTrackerFooterProps) {
  const router = useRouter();

  // Tracker
  const [addingToTracker, setAddingToTracker] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [removingFromTracker, setRemovingFromTracker] = useState(false);

  // Study groups
  const [showGroups, setShowGroups] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  async function handleAddToTracker() {
    setAddingToTracker(true);
    await addToTracker(resourceId, "want_to_take");
    setAddingToTracker(false);
    router.refresh();
  }

  async function handleStatusChange(newStatus: TrackerStatus) {
    if (!trackerItem) return;
    setUpdatingStatus(true);
    await updateTrackerStatus(trackerItem.id, newStatus);
    setUpdatingStatus(false);
    router.refresh();
  }

  async function handleRemove() {
    if (!trackerItem) return;
    setRemovingFromTracker(true);
    await removeFromTracker(trackerItem.id);
    setRemovingFromTracker(false);
    router.refresh();
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setSavingGroup(true);
    await createStudyGroup(resourceId, groupName, groupDesc);
    setSavingGroup(false);
    setGroupName(""); setGroupDesc("");
    setCreatingGroup(false);
    router.refresh();
  }

  async function handleJoin(groupId: string) {
    setJoiningId(groupId);
    await joinStudyGroup(groupId);
    setJoiningId(null);
    router.refresh();
  }

  async function handleLeave(groupId: string) {
    setLeavingId(groupId);
    await leaveStudyGroup(groupId);
    setLeavingId(null);
    router.refresh();
  }

  async function handleDeleteGroup(groupId: string) {
    setDeletingGroupId(groupId);
    await deleteStudyGroup(groupId);
    setDeletingGroupId(null);
    router.refresh();
  }

  const statusInfo = trackerItem ? TRACKER_STATUSES[STATUS_IDX[trackerItem.status]] : null;
  const totalStudying = studyGroups.reduce((s, g) => s + g.member_count, 0);
  const myGroups = studyGroups.filter((g) => g.is_member);

  return (
    <div className="border-t mt-3 pt-3 space-y-2.5">
      {/* Tracker row */}
      <div className="flex items-center justify-between gap-2">
        {trackerItem ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={trackerItem.status}
              onChange={(e) => handleStatusChange(e.target.value as TrackerStatus)}
              disabled={updatingStatus}
              className={cn(
                "text-[11px] font-medium rounded-full px-2 py-0.5 border cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-primary",
                statusInfo?.bg, statusInfo?.color,
              )}
            >
              {TRACKER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {updatingStatus && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
            <button
              onClick={handleRemove}
              disabled={removingFromTracker}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
            >
              {removingFromTracker ? "Removing…" : "Remove"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToTracker}
            disabled={addingToTracker}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {addingToTracker
              ? <Loader2 className="size-3 animate-spin" />
              : <Plus className="size-3" />}
            {addingToTracker ? "Adding…" : "Add to My Tracker"}
          </button>
        )}

        {/* Study group summary */}
        <button
          onClick={() => setShowGroups((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Users2 className="size-3" />
          {totalStudying > 0 ? `${totalStudying} studying` : "Study Groups"}
          {myGroups.length > 0 && (
            <span className="ml-0.5 rounded-full bg-primary/10 text-primary px-1 text-[10px] font-medium">
              {myGroups.length} joined
            </span>
          )}
          <ChevronDown className={cn("size-3 transition-transform", showGroups && "rotate-180")} />
        </button>
      </div>

      {/* Study groups panel */}
      {showGroups && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
          {studyGroups.length === 0 && !creatingGroup && (
            <p className="text-xs text-muted-foreground italic">No study groups yet.</p>
          )}

          {studyGroups.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{g.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {g.member_count} member{g.member_count !== 1 ? "s" : ""}
                  {g.creator && ` · by ${g.creator.display_name}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {g.is_member ? (
                  <button
                    onClick={() => handleLeave(g.id)}
                    disabled={leavingId === g.id}
                    className="text-[10px] text-muted-foreground hover:text-destructive underline underline-offset-2"
                  >
                    {leavingId === g.id ? "Leaving…" : "Leave"}
                  </button>
                ) : (
                  <Button
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => handleJoin(g.id)}
                    disabled={joiningId === g.id}
                  >
                    {joiningId === g.id ? <Loader2 className="size-3 animate-spin" /> : "Join"}
                  </Button>
                )}
                {(isPlatformAdmin || g.created_by === currentUserId) && (
                  <button
                    onClick={() => handleDeleteGroup(g.id)}
                    disabled={deletingGroupId === g.id}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {deletingGroupId === g.id
                      ? <Loader2 className="size-3 animate-spin" />
                      : <X className="size-3" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {creatingGroup ? (
            <form onSubmit={handleCreateGroup} className="space-y-2 rounded-md border bg-card p-2.5">
              <Input
                placeholder="Group name (e.g. Weekend study group)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="h-7 text-xs"
                required
              />
              <Input
                placeholder="Description (optional)"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="h-7 text-xs"
              />
              <div className="flex gap-1.5">
                <Button type="submit" size="sm" className="h-6 text-[11px]" disabled={savingGroup}>
                  {savingGroup && <Loader2 className="size-3 animate-spin mr-1" />}
                  Create &amp; Join
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" className="h-6 text-[11px]"
                  onClick={() => { setCreatingGroup(false); setGroupName(""); setGroupDesc(""); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setCreatingGroup(true)}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="size-3" /> Create Study Group
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Resource Dialog ───────────────────────────────────────────────────────

interface AddResourceDialogProps {
  type: ResourceType;
  label: string;
  urlPlaceholder: string;
}

function AddResourceDialog({ type, label, urlPlaceholder }: AddResourceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await addResource(type, title, url, desc);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setTitle(""); setUrl(""); setDesc("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="size-4" /> Add {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add {label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder={`e.g. ${type === "course" ? "CS50x – Introduction to Computer Science" : type === "video" ? "Clean Code – Uncle Bob" : "A Tour of Go"}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>URL</Label>
            <Input
              type="url"
              placeholder={urlPlaceholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              placeholder="Brief summary of what this covers…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="min-h-[72px]"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-1" />}
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Paths Tab ─────────────────────────────────────────────────────────────────

interface PathsTabProps {
  paths: LearningPath[];
  itemsByPath: Record<string, LearningPathItem[]>;
  currentUserId: string;
  isPlatformAdmin: boolean;
}

function PathsTab({ paths, itemsByPath, currentUserId, isPlatformAdmin }: PathsTabProps) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addItemPathId, setAddItemPathId] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [submittingItem, setSubmittingItem] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [starringId, setStarringId] = useState<string | null>(null);

  const [addPathOpen, setAddPathOpen] = useState(false);
  const [pathTitle, setPathTitle] = useState("");
  const [pathDesc, setPathDesc] = useState("");
  const [submittingPath, setSubmittingPath] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function handleCreatePath(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPath(true);
    setPathError(null);
    const res = await createPath(pathTitle, pathDesc);
    setSubmittingPath(false);
    if (res.error) { setPathError(res.error); return; }
    setPathTitle(""); setPathDesc("");
    setAddPathOpen(false);
    router.refresh();
  }

  async function handleDeletePath(id: string) {
    setDeletingId(id);
    await deletePath(id);
    setDeletingId(null);
    router.refresh();
  }

  async function handleToggleStar(id: string, current: boolean) {
    setStarringId(id);
    await toggleStarPath(id, current);
    setStarringId(null);
    router.refresh();
  }

  async function handleAddItem(e: React.FormEvent, pathId: string) {
    e.preventDefault();
    setSubmittingItem(true);
    const res = await addPathItem(pathId, itemTitle, itemUrl, itemDesc);
    setSubmittingItem(false);
    if (!res.error) {
      setItemTitle(""); setItemUrl(""); setItemDesc("");
      setAddItemPathId(null);
      router.refresh();
    }
  }

  async function handleDeleteItem(itemId: string, pathId: string) {
    setDeletingId(itemId);
    await deletePathItem(itemId, pathId);
    setDeletingId(null);
    router.refresh();
  }

  const starredPaths = paths.filter((p) => p.is_starred);
  const communityPaths = paths.filter((p) => !p.is_starred);

  function renderPath(path: LearningPath) {
    const isExpanded = expandedIds.has(path.id);
    const items = itemsByPath[path.id] ?? [];
    const canManage = isPlatformAdmin || path.created_by === currentUserId;

    return (
      <div
        key={path.id}
        className={`rounded-xl border bg-card transition-shadow hover:shadow-sm ${
          path.is_starred ? "border-amber-200 bg-gradient-to-br from-amber-50/60 to-white" : ""
        }`}
      >
        <div className="flex items-start gap-2 p-4">
          <button
            onClick={() => toggle(path.id)}
            className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRightIcon className="size-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => toggle(path.id)}
                className="font-semibold text-sm text-foreground hover:text-primary transition-colors text-left"
              >
                {path.title}
              </button>
              {path.is_starred && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  <Star className="size-2.5 fill-amber-500 text-amber-500" /> Featured
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {items.length} resource{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            {path.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{path.description}</p>
            )}
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              by {path.creator?.display_name ?? "Member"} · {formatRelativeTime(path.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isPlatformAdmin && (
              <Button
                variant="ghost" size="icon"
                className={`size-7 ${path.is_starred ? "text-amber-500 hover:text-amber-700" : "text-muted-foreground hover:text-amber-500"}`}
                onClick={() => handleToggleStar(path.id, path.is_starred)}
                disabled={starringId === path.id}
                title={path.is_starred ? "Remove feature" : "Feature path"}
              >
                {starringId === path.id
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Star className={`size-3.5 ${path.is_starred ? "fill-amber-500" : ""}`} />}
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost" size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeletePath(path.id)}
                disabled={deletingId === path.id}
              >
                {deletingId === path.id
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Trash2 className="size-3.5" />}
              </Button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t px-4 pb-4">
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-3">No resources added yet.</p>
            )}
            {items.length > 0 && (
              <ol className="space-y-2 pt-3">
                {items.map((item, idx) => (
                  <li key={item.id} className="flex items-start gap-3 group">
                    <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 pt-0.5 text-right">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {item.title}
                        <ExternalLink className="size-3 opacity-50 shrink-0" />
                      </a>
                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost" size="icon"
                        className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0 transition-opacity"
                        onClick={() => handleDeleteItem(item.id, path.id)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id
                          ? <Loader2 className="size-3 animate-spin" />
                          : <Trash2 className="size-3" />}
                      </Button>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {canManage && (
              addItemPathId === path.id ? (
                <form
                  onSubmit={(e) => handleAddItem(e, path.id)}
                  className="mt-3 space-y-2 rounded-lg bg-muted/40 border p-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Resource title"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                    <Input
                      placeholder="https://…"
                      value={itemUrl}
                      onChange={(e) => setItemUrl(e.target.value)}
                      className="text-xs h-8"
                      type="url"
                      required
                    />
                  </div>
                  <Input
                    placeholder="Short description (optional)"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="text-xs h-8"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="h-7 text-xs" disabled={submittingItem}>
                      {submittingItem && <Loader2 className="size-3 animate-spin mr-1" />}
                      Add resource
                    </Button>
                    <Button
                      type="button" variant="ghost" size="sm" className="h-7 text-xs"
                      onClick={() => { setAddItemPathId(null); setItemTitle(""); setItemUrl(""); setItemDesc(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddItemPathId(path.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="size-3.5" /> Add resource to path
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {paths.length} path{paths.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={addPathOpen} onOpenChange={setAddPathOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> New Path
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Learning Path</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePath} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Python for Data Engineering"
                  value={pathTitle}
                  onChange={(e) => setPathTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea
                  placeholder="What will learners get from this path?"
                  value={pathDesc}
                  onChange={(e) => setPathDesc(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              {pathError && <p className="text-sm text-destructive">{pathError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddPathOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submittingPath}>
                  {submittingPath && <Loader2 className="size-4 animate-spin mr-1" />}
                  Create Path
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {paths.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Route className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No paths yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Create the first curated learning path to guide others through a topic.
          </p>
        </div>
      )}

      {starredPaths.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Featured</h2>
          <div className="space-y-2">{starredPaths.map(renderPath)}</div>
        </section>
      )}

      {communityPaths.length > 0 && (
        <section className="space-y-3">
          {starredPaths.length > 0 && (
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Community Paths</h2>
          )}
          <div className="space-y-2">{communityPaths.map(renderPath)}</div>
        </section>
      )}
    </div>
  );
}

// ── Resource Card ─────────────────────────────────────────────────────────────

interface ResourceCardProps {
  resource: LearningResource;
  currentUserId: string;
  isPlatformAdmin: boolean;
  onDelete: (id: string) => void;
  deleting: boolean;
  trackerItem: { id: string; status: TrackerStatus } | null;
  studyGroups: StudyGroupRow[];
}

function ResourceCard({ resource, currentUserId, isPlatformAdmin, onDelete, deleting, trackerItem, studyGroups }: ResourceCardProps) {
  const canDelete = isPlatformAdmin || resource.added_by === currentUserId;
  return (
    <div className="group relative flex flex-col gap-1.5 rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug"
        >
          {resource.title}
          <ExternalLink className="size-3 shrink-0 opacity-50" />
        </a>
        {canDelete && (
          <Button
            variant="ghost" size="icon"
            className="size-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            onClick={() => onDelete(resource.id)}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </Button>
        )}
      </div>
      {resource.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{resource.description}</p>
      )}
      <p className="text-[11px] text-muted-foreground/60 truncate mt-auto">{resource.url}</p>
      {resource.adder && (
        <p className="text-[11px] text-muted-foreground">
          Added by {resource.adder.display_name} · {formatRelativeTime(resource.created_at)}
        </p>
      )}
      <ResourceTrackerFooter
        resourceId={resource.id}
        trackerItem={trackerItem}
        studyGroups={studyGroups}
        currentUserId={currentUserId}
        isPlatformAdmin={isPlatformAdmin}
      />
    </div>
  );
}

// ── Tab props ─────────────────────────────────────────────────────────────────

interface ResourceTabProps {
  resources: LearningResource[];
  currentUserId: string;
  isPlatformAdmin: boolean;
  trackerByResource: Record<string, { id: string; status: TrackerStatus }>;
  studyGroupsByResource: Record<string, StudyGroupRow[]>;
}

// ── Courses Tab ───────────────────────────────────────────────────────────────

function CoursesTab({ resources, currentUserId, isPlatformAdmin, trackerByResource, studyGroupsByResource }: ResourceTabProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteResource(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{resources.length} course{resources.length !== 1 ? "s" : ""}</p>
        <AddResourceDialog type="course" label="Course" urlPlaceholder="https://www.coursera.org/…" />
      </div>

      {resources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <GraduationCap className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No courses yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Share a MOOC or online course you found valuable.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <ResourceCard
            key={r.id}
            resource={r}
            currentUserId={currentUserId}
            isPlatformAdmin={isPlatformAdmin}
            onDelete={handleDelete}
            deleting={deletingId === r.id}
            trackerItem={trackerByResource[r.id] ?? null}
            studyGroups={studyGroupsByResource[r.id] ?? []}
          />
        ))}
      </div>
    </div>
  );
}

// ── Videos Tab ────────────────────────────────────────────────────────────────

function VideosTab({ resources, currentUserId, isPlatformAdmin, trackerByResource, studyGroupsByResource }: ResourceTabProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteResource(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{resources.length} video{resources.length !== 1 ? "s" : ""}</p>
        <AddResourceDialog type="video" label="Video" urlPlaceholder="https://www.youtube.com/watch?v=…" />
      </div>

      {resources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <PlaySquare className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No videos yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Share a helpful YouTube video with the community.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => {
          const ytId = extractYouTubeId(r.url);
          const canDelete = isPlatformAdmin || r.added_by === currentUserId;
          return (
            <div key={r.id} className="group flex flex-col gap-2 rounded-xl border bg-card p-3 hover:border-primary/30 transition-colors hover:shadow-sm">
              {ytId ? (
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={r.title}
                  />
                </div>
              ) : (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-32 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors text-xs gap-1"
                >
                  <ExternalLink className="size-4" /> Open video
                </a>
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground leading-snug truncate">{r.title}</p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{r.description}</p>
                  )}
                  {r.adder && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Added by {r.adder.display_name} · {formatRelativeTime(r.created_at)}
                    </p>
                  )}
                </div>
                {canDelete && (
                  <Button
                    variant="ghost" size="icon"
                    className="size-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                  >
                    {deletingId === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </Button>
                )}
              </div>
              <ResourceTrackerFooter
                resourceId={r.id}
                trackerItem={trackerByResource[r.id] ?? null}
                studyGroups={studyGroupsByResource[r.id] ?? []}
                currentUserId={currentUserId}
                isPlatformAdmin={isPlatformAdmin}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tutorials & Texts Tab ─────────────────────────────────────────────────────

function TutorialsTab({ resources, currentUserId, isPlatformAdmin, trackerByResource, studyGroupsByResource }: ResourceTabProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteResource(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{resources.length} tutorial{resources.length !== 1 ? "s" : ""}</p>
        <AddResourceDialog type="tutorial" label="Tutorial" urlPlaceholder="https://docs.python.org/…" />
      </div>

      {resources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <BookOpen className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No tutorials yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Share a written tutorial, guide, or article you found useful.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <ResourceCard
            key={r.id}
            resource={r}
            currentUserId={currentUserId}
            isPlatformAdmin={isPlatformAdmin}
            onDelete={handleDelete}
            deleting={deletingId === r.id}
            trackerItem={trackerByResource[r.id] ?? null}
            studyGroups={studyGroupsByResource[r.id] ?? []}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

interface Props {
  paths: LearningPath[];
  itemsByPath: Record<string, LearningPathItem[]>;
  resources: LearningResource[];
  currentUserId: string;
  isPlatformAdmin: boolean;
  trackerByResource: Record<string, { id: string; status: TrackerStatus }>;
  studyGroupsByResource: Record<string, StudyGroupRow[]>;
}

export function LearningClient({
  paths, itemsByPath, resources, currentUserId, isPlatformAdmin,
  trackerByResource, studyGroupsByResource,
}: Props) {
  const courses   = resources.filter((r) => r.type === "course");
  const videos    = resources.filter((r) => r.type === "video");
  const tutorials = resources.filter((r) => r.type === "tutorial");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookMarked className="size-6 text-primary" />
          Group Learning
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Curated paths, courses, videos, and tutorials shared by the community.
        </p>
      </div>

      <Tabs defaultValue="paths">
        <TabsList className="mb-4">
          <TabsTrigger value="paths" className="gap-1.5">
            <Route className="size-3.5" /> Paths
            {paths.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {paths.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-1.5">
            <GraduationCap className="size-3.5" /> Courses
            {courses.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {courses.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5">
            <PlaySquare className="size-3.5" /> Videos
            {videos.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {videos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="gap-1.5">
            <BookOpen className="size-3.5" /> Tutorials &amp; Texts
            {tutorials.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {tutorials.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paths">
          <PathsTab paths={paths} itemsByPath={itemsByPath} currentUserId={currentUserId} isPlatformAdmin={isPlatformAdmin} />
        </TabsContent>

        <TabsContent value="courses">
          <CoursesTab
            resources={courses}
            currentUserId={currentUserId}
            isPlatformAdmin={isPlatformAdmin}
            trackerByResource={trackerByResource}
            studyGroupsByResource={studyGroupsByResource}
          />
        </TabsContent>

        <TabsContent value="videos">
          <VideosTab
            resources={videos}
            currentUserId={currentUserId}
            isPlatformAdmin={isPlatformAdmin}
            trackerByResource={trackerByResource}
            studyGroupsByResource={studyGroupsByResource}
          />
        </TabsContent>

        <TabsContent value="tutorials">
          <TutorialsTab
            resources={tutorials}
            currentUserId={currentUserId}
            isPlatformAdmin={isPlatformAdmin}
            trackerByResource={trackerByResource}
            studyGroupsByResource={studyGroupsByResource}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

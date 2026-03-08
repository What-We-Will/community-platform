"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GraduationCap, PlaySquare, BookOpen, ListTodo,
  ExternalLink, Loader2, X, Check, GripVertical,
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
  dropBg: string;
}[] = [
  {
    value: "want_to_take",
    label: "Want to Take",
    color: "text-blue-700",
    bg: "bg-blue-100 border-blue-200",
    colBg: "bg-blue-50/60",
    dropBg: "bg-blue-100/80 border-blue-300",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "text-amber-700",
    bg: "bg-amber-100 border-amber-200",
    colBg: "bg-amber-50/60",
    dropBg: "bg-amber-100/80 border-amber-300",
  },
  {
    value: "completed",
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-100 border-emerald-200",
    colBg: "bg-emerald-50/60",
    dropBg: "bg-emerald-100/80 border-emerald-300",
  },
];

// ── Card content (shared between draggable and overlay) ───────────────────────

function CardContent({ item, onRemove, removing }: {
  item: TrackerItem;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const typeIcon =
    item.resource?.type === "video"   ? <PlaySquare className="size-3 shrink-0" /> :
    item.resource?.type === "course"  ? <GraduationCap className="size-3 shrink-0" /> :
    <BookOpen className="size-3 shrink-0" />;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
            {typeIcon}
            <span className="capitalize">{item.resource?.type ?? "resource"}</span>
          </div>
          {item.resource ? (
            <a
              href={item.resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
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
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={removing}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
            title="Remove from tracker"
          >
            {removing
              ? <Loader2 className="size-3.5 animate-spin" />
              : <X className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Draggable card ────────────────────────────────────────────────────────────

function DraggableCard({ item }: { item: TrackerItem }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { status: item.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  async function handleRemove() {
    setRemoving(true);
    await removeFromTracker(item.id);
    setRemoving(false);
    router.refresh();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow",
        isDragging && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors touch-none"
          tabIndex={-1}
          aria-label="Drag to move"
        >
          <GripVertical className="size-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <CardContent item={item} onRemove={handleRemove} removing={removing} />
        </div>
      </div>
    </div>
  );
}

// ── Drag overlay (ghost card while dragging) ──────────────────────────────────

function OverlayCard({ item }: { item: TrackerItem }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-xl ring-2 ring-primary/40 rotate-1 scale-105 cursor-grabbing">
      <div className="flex items-start gap-2">
        <GripVertical className="size-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
        <div className="flex-1 min-w-0">
          <CardContent item={item} />
        </div>
      </div>
    </div>
  );
}

// ── Drop column ───────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  items,
  isOver,
}: {
  col: typeof TRACKER_STATUSES[number];
  items: TrackerItem[];
  isOver: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 w-72 shrink-0 rounded-xl p-3 border-2 border-transparent transition-colors",
        isOver ? col.dropBg : col.colBg,
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className={cn("text-sm font-bold", col.color)}>{col.label}</span>
        <span className="text-[10px] text-muted-foreground font-medium bg-white/70 rounded-full px-1.5 py-0.5">
          {items.length}
        </span>
      </div>
      <div className={cn("h-0.5 w-full rounded-full mb-1", col.bg.split(" ")[0])} />

      {/* Cards */}
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.length === 0 ? (
          <div className={cn(
            "rounded-lg border-2 border-dashed py-10 text-center text-xs text-muted-foreground transition-colors",
            isOver ? "border-current opacity-60" : "border-muted-foreground/20",
          )}>
            {isOver ? "Drop here" : "Nothing here yet"}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <DraggableCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </SortableContext>

      {/* Completed footer */}
      {col.value === "completed" && items.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
          <Check className="size-3" /> {items.length} completed!
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function LearningTrackerClient({ trackerItems }: { trackerItems: TrackerItem[] }) {
  const router = useRouter();

  // Optimistic local state so the board updates instantly on drop
  const [items, setItems] = useState<TrackerItem[]>(trackerItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TrackerStatus | null>(null);

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  // Sync when server re-renders push fresh props
  const [lastServerItems, setLastServerItems] = useState(trackerItems);
  if (trackerItems !== lastServerItems) {
    setLastServerItems(trackerItems);
    setItems(trackerItems);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const columnOf = useCallback(
    (id: string): TrackerStatus | null => {
      // Could be a card id or a column id
      const asStatus = TRACKER_STATUSES.find((c) => c.value === id);
      if (asStatus) return asStatus.value;
      return items.find((i) => i.id === id)?.status ?? null;
    },
    [items],
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) { setOverColumn(null); return; }
    const destCol = columnOf(over.id as string);
    setOverColumn(destCol);

    const srcCol = columnOf(active.id as string);
    if (!destCol || srcCol === destCol) return;

    // Move card to destination column optimistically
    setItems((prev) =>
      prev.map((item) =>
        item.id === active.id ? { ...item, status: destCol } : item,
      ),
    );
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;

    const destCol = columnOf(over.id as string);
    if (!destCol) return;

    const item = items.find((i) => i.id === active.id);
    if (!item) return;

    // The optimistic update already happened in handleDragOver.
    // Persist if the column changed.
    const originalItem = trackerItems.find((i) => i.id === active.id);
    if (originalItem && originalItem.status !== destCol) {
      await updateTrackerStatus(item.id, destCol);
      router.refresh();
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverColumn(null);
    setItems(trackerItems); // revert optimistic changes
  }

  if (trackerItems.length === 0) {
    return (
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
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TRACKER_STATUSES.map((col) => (
          <KanbanColumn
            key={col.value}
            col={col}
            items={items.filter((t) => t.status === col.value)}
            isOver={overColumn === col.value && activeItem?.status !== col.value}
          />
        ))}
      </div>

      {/* Ghost card shown while dragging */}
      <DragOverlay dropAnimation={{
        duration: 180,
        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
      }}>
        {activeItem ? <OverlayCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

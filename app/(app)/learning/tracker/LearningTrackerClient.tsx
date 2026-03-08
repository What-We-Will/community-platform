"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
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
  accentBg: string;    // header badge color
  colBg: string;       // idle column background
  overBg: string;      // column background while a card is hovering over it
  borderOver: string;  // column border while hovered
}[] = [
  {
    value: "want_to_take",
    label: "Want to Take",
    color: "text-blue-700",
    accentBg: "bg-blue-100",
    colBg: "bg-blue-50/60",
    overBg: "bg-blue-100/70",
    borderOver: "border-blue-300",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "text-amber-700",
    accentBg: "bg-amber-100",
    colBg: "bg-amber-50/60",
    overBg: "bg-amber-100/70",
    borderOver: "border-amber-300",
  },
  {
    value: "completed",
    label: "Completed",
    color: "text-emerald-700",
    accentBg: "bg-emerald-100",
    colBg: "bg-emerald-50/60",
    overBg: "bg-emerald-100/70",
    borderOver: "border-emerald-300",
  },
];

const COLUMN_IDS = new Set<string>(TRACKER_STATUSES.map((c) => c.value));

function destColumnOf(overId: string, items: TrackerItem[]): TrackerStatus | null {
  if (COLUMN_IDS.has(overId)) return overId as TrackerStatus;
  const found = items.find((i) => i.id === overId);
  return found?.status ?? null;
}

// ── Shared card body ──────────────────────────────────────────────────────────

function CardBody({
  item,
  onRemove,
  removing,
}: {
  item: TrackerItem;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const typeIcon =
    item.resource?.type === "video"  ? <PlaySquare className="size-3 shrink-0" /> :
    item.resource?.type === "course" ? <GraduationCap className="size-3 shrink-0" /> :
    <BookOpen className="size-3 shrink-0" />;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
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
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={removing}
            className="shrink-0 mt-0.5 text-muted-foreground hover:text-destructive transition-colors"
            title="Remove from tracker"
          >
            {removing
              ? <Loader2 className="size-3.5 animate-spin" />
              : <X className="size-3.5" />}
          </button>
        )}
      </div>
    </>
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
  } = useSortable({ id: item.id });

  async function handleRemove() {
    setRemoving(true);
    await removeFromTracker(item.id);
    setRemoving(false);
    router.refresh();
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className="rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow select-none"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
          tabIndex={-1}
        >
          <GripVertical className="size-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <CardBody item={item} onRemove={handleRemove} removing={removing} />
        </div>
      </div>
    </div>
  );
}

// ── Overlay card shown while dragging ─────────────────────────────────────────

function OverlayCard({ item }: { item: TrackerItem }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-2xl ring-2 ring-primary/40 rotate-1 scale-[1.03] cursor-grabbing">
      <div className="flex items-start gap-2">
        <GripVertical className="size-3.5 mt-0.5 shrink-0 text-muted-foreground/40" />
        <div className="flex-1 min-w-0">
          <CardBody item={item} />
        </div>
      </div>
    </div>
  );
}

// ── Droppable column ──────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  items,
}: {
  col: typeof TRACKER_STATUSES[number];
  items: TrackerItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.value });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 w-72 shrink-0 rounded-xl p-3 min-h-64 border-2 transition-all duration-150",
        isOver
          ? cn(col.overBg, col.borderOver)
          : cn(col.colBg, "border-transparent"),
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className={cn("text-sm font-bold", col.color)}>{col.label}</span>
        <span className={cn("text-[10px] font-medium rounded-full px-1.5 py-0.5", col.color, col.accentBg)}>
          {items.length}
        </span>
      </div>
      <div className={cn("h-0.5 w-full rounded-full mb-1", col.accentBg)} />

      {/* Cards inside a SortableContext for within-column ordering */}
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.length === 0 ? (
          <div
            className={cn(
              "flex-1 rounded-lg border-2 border-dashed py-10 text-center text-xs transition-colors",
              isOver
                ? cn("border-current opacity-70", col.color)
                : "border-muted-foreground/20 text-muted-foreground",
            )}
          >
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

  // Optimistic state: updated immediately on drag, synced to server on drop
  const [items, setItems] = useState<TrackerItem[]>(trackerItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Keep in sync when the server pushes new props (after revalidation)
  const [prevServerItems, setPrevServerItems] = useState(trackerItems);
  if (trackerItems !== prevServerItems) {
    setPrevServerItems(trackerItems);
    setItems(trackerItems);
  }

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,  { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;

    const destCol = destColumnOf(over.id as string, items);
    if (!destCol) return;

    const activeItem = items.find((i) => i.id === active.id);
    if (!activeItem || activeItem.status === destCol) return;

    // Optimistically move the card to the destination column
    setItems((prev) =>
      prev.map((i) => i.id === active.id ? { ...i, status: destCol } : i),
    );
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) {
      setItems(trackerItems); // nothing dropped — revert
      return;
    }

    const destCol = destColumnOf(over.id as string, items);
    if (!destCol) {
      setItems(trackerItems);
      return;
    }

    // Compare against original server state to know if we need to persist
    const original = trackerItems.find((i) => i.id === active.id);
    if (original && original.status !== destCol) {
      await updateTrackerStatus(active.id as string, destCol);
      router.refresh();
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setItems(trackerItems); // revert optimistic change
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

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

  // ── Board ───────────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 160,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeItem ? <OverlayCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

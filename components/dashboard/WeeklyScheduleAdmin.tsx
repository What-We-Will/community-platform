"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import {
  createScheduleRow,
  updateScheduleRow,
  deleteScheduleRow,
} from "@/app/(app)/dashboard/schedule-actions";
import {
  SCHEDULE_CATEGORIES,
  type ScheduleCategory,
  type ScheduleRow,
} from "@/lib/utils/weekly-schedule";

interface Props {
  rows: ScheduleRow[];
  activeCategory: ScheduleCategory;
  onAddingChange?: (adding: boolean) => void;
}

type RowForm = {
  name: string;
  days: string;
  time: string;
  zoom_url: string;
  category: ScheduleCategory;
};

function emptyForm(category: ScheduleCategory): RowForm {
  return { name: "", days: "", time: "", zoom_url: "", category };
}

export function WeeklyScheduleAdmin({
  rows: initialRows,
  activeCategory,
  onAddingChange,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ScheduleRow[]>(initialRows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<RowForm>(() => emptyForm(activeCategory));
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<RowForm>(() => emptyForm(activeCategory));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleRows = useMemo(
    () =>
      rows
        .filter((row) => row.category === activeCategory)
        .sort((a, b) => a.position - b.position),
    [rows, activeCategory]
  );

  useEffect(() => {
    setAdding(false);
    setEditingId(null);
    setNewRow(emptyForm(activeCategory));
    setEditRow(emptyForm(activeCategory));
  }, [activeCategory]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    onAddingChange?.(adding);
  }, [adding, onAddingChange]);

  async function handleSaveEdit(id: string) {
    if (!editRow.name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await updateScheduleRow(id, {
      name: editRow.name,
      days: editRow.days,
      time: editRow.time,
      zoom_url: editRow.zoom_url,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...editRow,
              zoom_url: editRow.zoom_url.trim() || null,
            }
          : r
      )
    );
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    const res = await deleteScheduleRow(id);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  async function handleAdd() {
    if (!newRow.name.trim()) return;
    setBusy(true);
    setError(null);
    const categoryRows = rows.filter((r) => r.category === newRow.category);
    const maxPos =
      categoryRows.length > 0
        ? Math.max(...categoryRows.map((r) => r.position)) + 1
        : 0;
    const res = await createScheduleRow({ ...newRow, position: maxPos });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        ...newRow,
        zoom_url: newRow.zoom_url.trim() || null,
        position: maxPos,
      },
    ]);
    setNewRow(emptyForm(activeCategory));
    setAdding(false);
    router.refresh();
  }

  function CategorySelect({
    value,
    onChange,
  }: {
    value: ScheduleCategory;
    onChange: (value: ScheduleCategory) => void;
  }) {
    return (
      <Select value={value} onValueChange={(v) => onChange(v as ScheduleCategory)}>
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCHEDULE_CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value} className="text-xs">
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  function CategorySpacer() {
    if (!adding) return null;
    return <td className="px-4 py-2" aria-hidden />;
  }

  const rowColSpan = adding ? 6 : 5;

  return (
    <tbody>
      {error && (
        <tr>
          <td colSpan={rowColSpan} className="px-4 py-2">
            <p className="text-xs text-destructive">{error}</p>
          </td>
        </tr>
      )}

      {visibleRows.length === 0 && !adding && (
        <tr>
          <td colSpan={rowColSpan} className="px-4 py-6 text-center text-sm text-muted-foreground">
            No meetings in this category yet.
          </td>
        </tr>
      )}

      {visibleRows.map((row) =>
        editingId === row.id ? (
          <tr key={row.id} className="border-b bg-muted/30">
            <td className="px-4 py-2">
              <Input
                value={editRow.name}
                onChange={(e) => setEditRow((r) => ({ ...r, name: e.target.value }))}
                className="h-7 text-sm"
                placeholder="Name"
                autoFocus
              />
            </td>
            <CategorySpacer />
            <td className="px-4 py-2">
              <Input
                value={editRow.days}
                onChange={(e) => setEditRow((r) => ({ ...r, days: e.target.value }))}
                className="h-7 text-sm"
                placeholder="Days"
              />
            </td>
            <td className="px-4 py-2">
              <Input
                value={editRow.time}
                onChange={(e) => setEditRow((r) => ({ ...r, time: e.target.value }))}
                className="h-7 text-sm"
                placeholder="Time"
              />
            </td>
            <td className="px-4 py-2">
              <Input
                value={editRow.zoom_url}
                onChange={(e) =>
                  setEditRow((r) => ({ ...r, zoom_url: e.target.value }))
                }
                className="h-7 text-sm"
                placeholder="https://zoom.us/j/..."
              />
            </td>
            <td className="px-2 py-2">
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => handleSaveEdit(row.id)}
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5 text-green-600" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setEditingId(null)}
                  disabled={busy}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </td>
          </tr>
        ) : (
          <tr key={row.id} className="group border-b hover:bg-muted/20">
            <td className="px-4 py-2.5 text-sm font-medium">{row.name}</td>
            <CategorySpacer />
            <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.days}</td>
            <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.time}</td>
            <td className="px-4 py-2.5 text-sm">
              {row.zoom_url ? (
                <a
                  href={row.zoom_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Video className="size-3.5" />
                  Join
                </a>
              ) : (
                <span className="text-muted-foreground/40">—</span>
              )}
            </td>
            <td className="px-2 py-2">
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => {
                    setEditingId(row.id);
                    setEditRow({
                      name: row.name,
                      days: row.days,
                      time: row.time,
                      zoom_url: row.zoom_url ?? "",
                      category: row.category,
                    });
                  }}
                  disabled={busy}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(row.id)}
                  disabled={busy}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </td>
          </tr>
        )
      )}

      {adding ? (
        <tr className="border-b bg-muted/20">
          <td className="px-4 py-2">
            <Input
              value={newRow.name}
              onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))}
              className="h-7 text-sm"
              placeholder="Name"
              autoFocus
            />
          </td>
          <td className="px-4 py-2">
            <CategorySelect
              value={newRow.category}
              onChange={(category) => setNewRow((r) => ({ ...r, category }))}
            />
          </td>
          <td className="px-4 py-2">
            <Input
              value={newRow.days}
              onChange={(e) => setNewRow((r) => ({ ...r, days: e.target.value }))}
              className="h-7 text-sm"
              placeholder="Days"
            />
          </td>
          <td className="px-4 py-2">
            <Input
              value={newRow.time}
              onChange={(e) => setNewRow((r) => ({ ...r, time: e.target.value }))}
              className="h-7 text-sm"
              placeholder="Time"
            />
          </td>
          <td className="px-4 py-2">
            <Input
              value={newRow.zoom_url}
              onChange={(e) => setNewRow((r) => ({ ...r, zoom_url: e.target.value }))}
              className="h-7 text-sm"
              placeholder="https://zoom.us/j/..."
            />
          </td>
          <td className="px-2 py-2">
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={handleAdd}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5 text-green-600" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => {
                  setAdding(false);
                  setNewRow(emptyForm(activeCategory));
                }}
                disabled={busy}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </td>
        </tr>
      ) : (
        <tr>
          <td colSpan={rowColSpan} className="px-4 py-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setAdding(true)}
            >
              <Plus className="size-3.5" />
              Add row
            </Button>
          </td>
        </tr>
      )}
    </tbody>
  );
}

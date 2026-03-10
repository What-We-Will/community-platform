"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  createScheduleRow,
  updateScheduleRow,
  deleteScheduleRow,
} from "@/app/(app)/dashboard/schedule-actions";

interface ScheduleRow {
  id: string;
  name: string;
  days: string;
  time: string;
  zoom_url: string | null;
  position: number;
}

interface Props {
  rows: ScheduleRow[];
}

const EMPTY = { name: "", days: "", time: "", zoom_url: "" };

export function WeeklyScheduleAdmin({ rows: initialRows }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ScheduleRow[]>(initialRows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveEdit(id: string) {
    if (!editRow.name.trim()) return;
    setBusy(true); setError(null);
    const res = await updateScheduleRow(id, editRow);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, ...editRow, zoom_url: editRow.zoom_url.trim() || null }
          : r
      )
    );
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusy(true); setError(null);
    const res = await deleteScheduleRow(id);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setRows((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  async function handleAdd() {
    if (!newRow.name.trim()) return;
    setBusy(true); setError(null);
    const maxPos = rows.length > 0 ? Math.max(...rows.map((r) => r.position)) + 1 : 0;
    const res = await createScheduleRow({ ...newRow, position: maxPos });
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    // Optimistically append; router.refresh() will replace with server-assigned id
    setRows((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        ...newRow,
        zoom_url: newRow.zoom_url.trim() || null,
        position: maxPos,
      },
    ]);
    setNewRow(EMPTY);
    setAdding(false);
    router.refresh();
  }

  return (
    <tbody>
      {rows.map((row) => (
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
                onChange={(e) => setEditRow((r) => ({ ...r, zoom_url: e.target.value }))}
                className="h-7 text-sm"
                placeholder="https://zoom.us/j/..."
              />
            </td>
            <td className="px-2 py-2">
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="size-7" onClick={() => handleSaveEdit(row.id)} disabled={busy}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-green-600" />}
                </Button>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingId(null)} disabled={busy}>
                  <X className="size-3.5" />
                </Button>
              </div>
            </td>
          </tr>
        ) : (
          <tr key={row.id} className="border-b group hover:bg-muted/20">
            <td className="px-4 py-2.5 text-sm font-medium">{row.name}</td>
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
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => {
                    setEditingId(row.id);
                    setEditRow({ name: row.name, days: row.days, time: row.time, zoom_url: row.zoom_url ?? "" });
                  }}
                  disabled={busy}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={() => handleDelete(row.id)} disabled={busy}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </td>
          </tr>
        )
      ))}

      {/* Add row */}
      {adding ? (
        <tr className="border-b bg-muted/20">
          <td className="px-4 py-2">
            <Input value={newRow.name} onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))} className="h-7 text-sm" placeholder="Name" autoFocus />
          </td>
          <td className="px-4 py-2">
            <Input value={newRow.days} onChange={(e) => setNewRow((r) => ({ ...r, days: e.target.value }))} className="h-7 text-sm" placeholder="Days" />
          </td>
          <td className="px-4 py-2">
            <Input value={newRow.time} onChange={(e) => setNewRow((r) => ({ ...r, time: e.target.value }))} className="h-7 text-sm" placeholder="Time" />
          </td>
          <td className="px-4 py-2">
            <Input value={newRow.zoom_url} onChange={(e) => setNewRow((r) => ({ ...r, zoom_url: e.target.value }))} className="h-7 text-sm" placeholder="https://zoom.us/j/..." />
          </td>
          <td className="px-2 py-2">
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="size-7" onClick={handleAdd} disabled={busy}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-green-600" />}
              </Button>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => { setAdding(false); setNewRow(EMPTY); }} disabled={busy}>
                <X className="size-3.5" />
              </Button>
            </div>
          </td>
        </tr>
      ) : (
        <tr>
          <td colSpan={5} className="px-4 py-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-7" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" />
              Add row
            </Button>
            {error && <span className="text-xs text-destructive ml-2">{error}</span>}
          </td>
        </tr>
      )}
    </tbody>
  );
}

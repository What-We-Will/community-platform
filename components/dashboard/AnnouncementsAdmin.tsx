"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/app/(app)/dashboard/announcements-actions";
import { useRouter } from "next/navigation";

interface Announcement {
  id: string;
  content: string;
}

interface Props {
  announcements: Announcement[];
}

export function AnnouncementsAdmin({ announcements }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveEdit(id: string) {
    if (!editText.trim()) return;
    setBusy(true);
    setError(null);
    const res = await updateAnnouncement(id, editText);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    const res = await deleteAnnouncement(id);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  }

  async function handleAdd() {
    if (!newText.trim()) return;
    setBusy(true);
    setError(null);
    const res = await createAnnouncement(newText);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setNewText("");
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="border-t border-border">
      {/* Edit existing */}
      {announcements.map((a) => (
        <div key={a.id} className="flex items-start gap-2 px-4 py-2 border-b border-dashed border-border/60 bg-muted/30">
          {editingId === a.id ? (
            <>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="text-sm flex-1 min-h-[60px]"
                autoFocus
              />
              <div className="flex flex-col gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="size-7" onClick={() => handleSaveEdit(a.id)} disabled={busy}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-green-600" />}
                </Button>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingId(null)} disabled={busy}>
                  <X className="size-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground flex-1 py-1">{a.content}</p>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="size-7" onClick={() => { setEditingId(a.id); setEditText(a.content); }} disabled={busy}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)} disabled={busy}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add new */}
      <div className="px-4 py-2 bg-muted/20">
        {adding ? (
          <div className="flex items-start gap-2">
            <Textarea
              placeholder="New announcement…"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="text-sm flex-1 min-h-[60px]"
              autoFocus
            />
            <div className="flex flex-col gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="size-7" onClick={handleAdd} disabled={busy}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-green-600" />}
              </Button>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => { setAdding(false); setNewText(""); }} disabled={busy}>
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-7" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" />
            Add announcement
          </Button>
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    </div>
  );
}

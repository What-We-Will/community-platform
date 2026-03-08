"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline underline-offset-2">{children}</a>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside">{children}</ol>,
        code: ({ children }) => (
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function AnnouncementsAdmin({ announcements }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editPreview, setEditPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newPreview, setNewPreview] = useState(false);
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
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Markdown supported</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 px-1.5 gap-1 text-xs"
                  onClick={() => setEditPreview((v) => !v)}
                >
                  <Eye className="size-3" />
                  {editPreview ? "Edit" : "Preview"}
                </Button>
              </div>
              {editPreview ? (
                <div className="text-sm leading-relaxed min-h-[60px] px-3 py-2 rounded-md border bg-muted/30">
                  <MarkdownPreview content={editText} />
                </div>
              ) : (
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-sm min-h-[60px]"
                  autoFocus
                />
              )}
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => handleSaveEdit(a.id)} disabled={busy}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-green-600" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => { setEditingId(null); setEditPreview(false); }} disabled={busy}>
                  <X className="size-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground flex-1 py-1 whitespace-pre-wrap">{a.content}</p>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="size-7" onClick={() => { setEditingId(a.id); setEditText(a.content); setEditPreview(false); }} disabled={busy}>
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
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Markdown supported</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 px-1.5 gap-1 text-xs"
                onClick={() => setNewPreview((v) => !v)}
              >
                <Eye className="size-3" />
                {newPreview ? "Edit" : "Preview"}
              </Button>
            </div>
            {newPreview ? (
              <div className="text-sm leading-relaxed min-h-[60px] px-3 py-2 rounded-md border bg-muted/30">
                {newText.trim() ? <MarkdownPreview content={newText} /> : <span className="text-muted-foreground italic">Nothing to preview yet…</span>}
              </div>
            ) : (
              <Textarea
                placeholder="New announcement… (Markdown supported)"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="text-sm min-h-[60px]"
                autoFocus
              />
            )}
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleAdd} disabled={busy}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-green-600" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => { setAdding(false); setNewText(""); setNewPreview(false); }} disabled={busy}>
                <X className="size-3.5" />
                Cancel
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

"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2, Eye, ChevronDown, ChevronUp } from "lucide-react";
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

const MARKDOWN_TIPS = [
  { syntax: "**bold**",        result: "bold" },
  { syntax: "*italic*",        result: "italic" },
  { syntax: "[text](url)",     result: "link" },
  { syntax: "# Heading",       result: "heading" },
  { syntax: "- item",          result: "bullet list" },
  { syntax: "1. item",         result: "numbered list" },
  { syntax: "> quote",         result: "blockquote" },
  { syntax: "`code`",          result: "inline code" },
  { syntax: "---",             result: "divider" },
];

function MarkdownTips() {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-xs text-muted-foreground">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        Markdown supported
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>
      {open && (
        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-md border bg-muted/40 px-3 py-2">
          {MARKDOWN_TIPS.map(({ syntax, result }) => (
            <div key={syntax} className="flex items-baseline gap-2 min-w-0">
              <code className="font-mono text-[11px] text-foreground/80 shrink-0">{syntax}</code>
              <span className="text-muted-foreground truncate">→ {result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

interface EditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  preview: boolean;
  onTogglePreview: () => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}

function AnnouncementEditor({
  value, onChange, placeholder, autoFocus,
  preview, onTogglePreview, onSave, onCancel, busy,
}: EditorProps) {
  return (
    <div className="flex-1 flex flex-col gap-1.5">
      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-2">
        <MarkdownTips />
        <Button
          size="sm"
          variant="ghost"
          className="h-5 px-1.5 gap-1 text-xs shrink-0"
          onClick={onTogglePreview}
          type="button"
        >
          <Eye className="size-3" />
          {preview ? "Edit" : "Preview"}
        </Button>
      </div>

      {/* Edit / preview pane */}
      {preview ? (
        <div className="text-sm leading-relaxed min-h-[80px] px-3 py-2 rounded-md border bg-muted/30">
          {value.trim()
            ? <MarkdownPreview content={value} />
            : <span className="text-muted-foreground italic">Nothing to preview yet…</span>
          }
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm min-h-[80px] resize-y"
          autoFocus={autoFocus}
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onSave} disabled={busy} type="button">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-green-600" />}
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onCancel} disabled={busy} type="button">
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>
    </div>
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
            <AnnouncementEditor
              value={editText}
              onChange={setEditText}
              autoFocus
              preview={editPreview}
              onTogglePreview={() => setEditPreview((v) => !v)}
              onSave={() => handleSaveEdit(a.id)}
              onCancel={() => { setEditingId(null); setEditPreview(false); }}
              busy={busy}
            />
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
          <AnnouncementEditor
            value={newText}
            onChange={setNewText}
            placeholder="Write an announcement…"
            autoFocus
            preview={newPreview}
            onTogglePreview={() => setNewPreview((v) => !v)}
            onSave={handleAdd}
            onCancel={() => { setAdding(false); setNewText(""); setNewPreview(false); }}
            busy={busy}
          />
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

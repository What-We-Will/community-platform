"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { MessageSquare, ChevronDown, ChevronUp, Trash2, Loader2, Send } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/time";
import { addJobComment, deleteJobComment } from "./community-actions";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: { id: string; display_name: string; avatar_url: string | null } | null;
}

interface Props {
  jobPostingId: string;
  comments: Comment[];
  currentUserId: string;
  isPlatformAdmin: boolean;
  alwaysOpen?: boolean;
}

export function JobComments({ jobPostingId, comments, currentUserId, isPlatformAdmin, alwaysOpen = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(alwaysOpen);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await addJobComment(jobPostingId, text);
    setSubmitting(false);
    if (res.error) { setError(res.error); return; }
    setText("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteJobComment(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className={alwaysOpen ? "" : "mt-3 border-t pt-3"}>
      {!alwaysOpen && (
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen((o) => !o)}
        >
          <MessageSquare className="size-3.5" />
          <span>Community Notes ({comments.length})</span>
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          {/* Existing comments */}
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No notes yet. Be the first to share your experience.
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <UserAvatar
                avatarUrl={c.author?.avatar_url ?? null}
                displayName={c.author?.display_name ?? "?"}
                size="xs"
              />
              <div className="flex-1 min-w-0 rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium">{c.author?.display_name ?? "Member"}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(c.created_at)}
                    </span>
                    {(c.user_id === currentUserId || isPlatformAdmin) && (
                      <Button
                        variant="ghost" size="icon"
                        className="size-5 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                      >
                        {deletingId === c.id
                          ? <Loader2 className="size-3 animate-spin" />
                          : <Trash2 className="size-3" />}
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}

          {/* Add note form */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-start">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience with this role or company…"
              className="text-xs min-h-[60px] flex-1"
            />
            <Button type="submit" size="icon" className="size-9 shrink-0" disabled={submitting || !text.trim()}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

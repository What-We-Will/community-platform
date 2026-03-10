"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createLink, type LinkCategory } from "./actions";

const CATEGORIES: { value: LinkCategory; label: string }[] = [
  { value: "organization",     label: "Organization" },
  { value: "community",        label: "Community / Networking" },
  { value: "job_board_general", label: "Job Board — General" },
  { value: "job_board_remote",  label: "Job Board — Remote" },
  { value: "job_board_civic",   label: "Job Board — Civic Tech" },
  { value: "learning",         label: "Learning Material" },
  { value: "tool",             label: "Tool / App" },
  { value: "article",          label: "Article / Blog Post" },
  { value: "other",            label: "Other" },
];

export function PostLinkForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<LinkCategory>("other");

  function reset() {
    setTitle(""); setUrl(""); setDescription(""); setCategory("other"); setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setLoading(true);
    setError(null);
    const res = await createLink({ title, url, description, category });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Share a Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share a Resource Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="link-title">Title *</Label>
            <Input
              id="link-title"
              placeholder="e.g. AFL-CIO Resource Library"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-url">URL *</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as LinkCategory)}>
              <SelectTrigger id="link-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="link-desc"
              placeholder="A short note about why this is useful…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !url.trim()}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Share
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

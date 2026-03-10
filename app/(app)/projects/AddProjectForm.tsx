"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Github, Check, Star, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchGitHubMeta, createProject, type GitHubMeta } from "./actions";

export const PROJECT_ROLES: { value: string; label: string }[] = [
  { value: "engineer",  label: "Engineer"  },
  { value: "designer",  label: "Designer"  },
  { value: "pm",        label: "PM"        },
  { value: "data",      label: "Data"      },
  { value: "devops",    label: "DevOps"    },
  { value: "security",  label: "Security"  },
  { value: "sme",       label: "SME"       },
];

export function AddProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Step 1: GitHub URL entry
  const [githubUrl, setGithubUrl] = useState("");
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [meta, setMeta] = useState<GitHubMeta | null>(null);

  // Step 2: Additional fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rolesSelected, setRolesSelected] = useState<Set<string>>(new Set());
  const [offersMentorship, setOffersMentorship] = useState(false);
  const [seeksMentorship, setSeeksMentorship] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resetForm() {
    setGithubUrl("");
    setFetchingMeta(false);
    setFetchError(null);
    setMeta(null);
    setTitle("");
    setDescription("");
    setRolesSelected(new Set());
    setOffersMentorship(false);
    setSeeksMentorship(false);
    setSubmitError(null);
  }

  async function handleFetchMeta() {
    setFetchError(null);
    setFetchingMeta(true);
    const res = await fetchGitHubMeta(githubUrl);
    setFetchingMeta(false);
    if (res.error) { setFetchError(res.error); return; }
    setMeta(res.data!);
    setTitle(res.data!.title);
    setDescription(res.data!.description ?? "");
  }

  function toggleRole(value: string) {
    setRolesSelected((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meta) return;
    setSubmitError(null);
    setSubmitting(true);
    const res = await createProject({
      github_url: githubUrl.trim(),
      title: title.trim(),
      description: description.trim() || null,
      image_url: meta.image_url,
      language: meta.language,
      stars: meta.stars,
      roles_seeking: [...rolesSelected],
      offers_mentorship: offersMentorship,
      seeks_mentorship: seeksMentorship,
    });
    setSubmitting(false);
    if (res.error) { setSubmitError(res.error); return; }
    setOpen(false);
    resetForm();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Add Project
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Open Source Project</DialogTitle>
        </DialogHeader>

        {/* Step 1 — GitHub URL */}
        {!meta ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="github-url">GitHub Repository URL</Label>
              <div className="flex gap-2">
                <Input
                  id="github-url"
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFetchMeta(); } }}
                  disabled={fetchingMeta}
                />
                <Button
                  type="button"
                  onClick={handleFetchMeta}
                  disabled={!githubUrl.trim() || fetchingMeta}
                  className="shrink-0"
                >
                  {fetchingMeta ? <Loader2 className="size-4 animate-spin" /> : <Github className="size-4" />}
                </Button>
              </div>
              {fetchError && (
                <p className="text-sm text-destructive">{fetchError}</p>
              )}
            </div>
          </div>
        ) : (
          /* Step 2 — Fill in details */
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Preview card */}
            <div className="rounded-lg border overflow-hidden">
              <div className="relative aspect-[2/1] bg-muted">
                <Image
                  src={meta.image_url}
                  alt={title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="px-3 py-2 flex items-center gap-2 bg-card text-xs text-muted-foreground">
                <Github className="size-3.5 shrink-0" />
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-foreground">
                  {githubUrl}
                </a>
                {meta.stars > 0 && (
                  <span className="ml-auto flex items-center gap-1 shrink-0">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {meta.stars.toLocaleString()}
                  </span>
                )}
                {meta.language && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Code className="size-3" /> {meta.language}
                  </span>
                )}
              </div>
            </div>

            {/* Change URL */}
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              onClick={() => { setMeta(null); setFetchError(null); }}
            >
              ← Use a different URL
            </button>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="proj-title">Project name</Label>
              <Input
                id="proj-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this project do? What problem does it solve?"
                className="min-h-[80px]"
              />
            </div>

            {/* Roles seeking */}
            <div className="space-y-2">
              <Label>Roles seeking</Label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_ROLES.map((r) => {
                  const selected = rolesSelected.has(r.value);
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => toggleRole(r.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      )}
                    >
                      {selected && <Check className="size-3" />}
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mentorship */}
            <div className="space-y-2">
              <Label>Mentorship</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={offersMentorship}
                    onChange={(e) => setOffersMentorship(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm">I can provide mentorship</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={seeksMentorship}
                    onChange={(e) => setSeeksMentorship(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm">I am seeking mentorship</span>
                </label>
              </div>
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !title.trim()}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                Add Project
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

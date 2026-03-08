import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExternalLink, Link2 } from "lucide-react";
import { PostLinkForm } from "./PostLinkForm";
import { DeleteLinkButton } from "./DeleteLinkButton";
import type { Profile } from "@/lib/types";

type LinkCategory = "organization" | "learning" | "tool" | "article" | "other";

const CATEGORY_META: Record<
  LinkCategory,
  { label: string; color: string; bg: string }
> = {
  organization: { label: "Organization",      color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  learning:     { label: "Learning Material",  color: "text-green-700",  bg: "bg-green-100 border-green-200" },
  tool:         { label: "Tool / App",         color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
  article:      { label: "Article / Blog",     color: "text-amber-700",  bg: "bg-amber-100 border-amber-200" },
  other:        { label: "Other",              color: "text-slate-600",  bg: "bg-slate-100 border-slate-200" },
};

const CATEGORY_ORDER: LinkCategory[] = [
  "organization",
  "learning",
  "tool",
  "article",
  "other",
];

export default async function CommunityLinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: links }, { data: profile }] = await Promise.all([
    supabase
      .from("community_links")
      .select("id, title, url, description, category, posted_by, created_at, poster:posted_by(id, display_name)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const isPlatformAdmin = profile?.role === "admin";

  // Group links by category
  const grouped = new Map<LinkCategory, typeof links>(
    CATEGORY_ORDER.map((c) => [c, []])
  );
  for (const link of links ?? []) {
    const cat = (link.category as LinkCategory) ?? "other";
    grouped.get(cat)?.push(link);
  }

  const totalCount = links?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community Links</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shared resources — organizations, learning materials, tools, and more.
          </p>
        </div>
        <PostLinkForm />
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Link2 className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No links shared yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Be the first to share a useful resource with the community.
          </p>
        </div>
      )}

      {/* Grouped sections */}
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat) ?? [];
        if (items.length === 0) return null;
        const meta = CATEGORY_META[cat];

        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {meta.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((link) => {
                const posterRaw = Array.isArray(link.poster) ? (link.poster[0] ?? null) : link.poster;
                const poster = posterRaw as Pick<Profile, "id" | "display_name"> | null;
                const canDelete = isPlatformAdmin || link.posted_by === user.id;

                return (
                  <div
                    key={link.id}
                    className="group relative flex flex-col gap-1.5 rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors"
                  >
                    {/* Top row: title + delete */}
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug"
                      >
                        {link.title}
                        <ExternalLink className="size-3 shrink-0 opacity-60" />
                      </a>
                      {canDelete && <DeleteLinkButton id={link.id} />}
                    </div>

                    {/* Category badge */}
                    <span className={`self-start text-[11px] font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>

                    {/* Description */}
                    {link.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {link.description}
                      </p>
                    )}

                    {/* URL preview */}
                    <p className="text-[11px] text-muted-foreground/70 truncate mt-auto pt-1">
                      {link.url}
                    </p>

                    {/* Posted by */}
                    {poster && (
                      <p className="text-[11px] text-muted-foreground">
                        Shared by {poster.display_name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

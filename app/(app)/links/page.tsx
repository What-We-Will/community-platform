import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExternalLink, Link2 } from "lucide-react";
import { PostLinkForm } from "./PostLinkForm";
import { DeleteLinkButton } from "./DeleteLinkButton";
import type { Profile } from "@/lib/types";

type LinkCategory =
  | "organization"
  | "learning"
  | "tool"
  | "article"
  | "other"
  | "job_board_general"
  | "job_board_remote"
  | "job_board_civic"
  | "community";

const CATEGORY_META: Record<
  LinkCategory,
  { label: string; color: string; bg: string }
> = {
  organization:     { label: "Organization",            color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  community:        { label: "Community / Networking",  color: "text-indigo-700", bg: "bg-indigo-100 border-indigo-200" },
  job_board_general:{ label: "General",                 color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
  job_board_remote: { label: "Remote-Focused",          color: "text-cyan-700",   bg: "bg-cyan-100 border-cyan-200" },
  job_board_civic:  { label: "Civic Tech Jobs",          color: "text-emerald-700",bg: "bg-emerald-100 border-emerald-200" },
  learning:         { label: "Learning Material",       color: "text-green-700",  bg: "bg-green-100 border-green-200" },
  tool:             { label: "Tool / App",              color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
  article:          { label: "Article / Blog",          color: "text-amber-700",  bg: "bg-amber-100 border-amber-200" },
  other:            { label: "Other",                   color: "text-slate-600",  bg: "bg-slate-100 border-slate-200" },
};

// Top-level sections — each can have one or more categories underneath it
const SECTIONS: {
  heading: string;
  categories: LinkCategory[];
}[] = [
  {
    heading: "Communities & Networking",
    categories: ["community"],
  },
  {
    heading: "Job Search Platforms",
    categories: ["job_board_remote", "job_board_civic", "job_board_general"],
  },
  {
    heading: "Organizations",
    categories: ["organization"],
  },
  {
    heading: "Learning Materials",
    categories: ["learning"],
  },
  {
    heading: "Tools & Apps",
    categories: ["tool"],
  },
  {
    heading: "Articles & Blogs",
    categories: ["article"],
  },
  {
    heading: "Other",
    categories: ["other"],
  },
];

export default async function CommunityLinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: links }, { data: profile }] = await Promise.all([
    supabase
      .from("community_links")
      .select("id, title, url, description, category, posted_by, created_at, poster:posted_by(id, display_name)")
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const isPlatformAdmin = profile?.role === "admin";

  // Group by category
  const grouped = new Map<LinkCategory, typeof links>();
  for (const link of links ?? []) {
    const cat = (link.category as LinkCategory) ?? "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(link);
  }

  const totalCount = links?.length ?? 0;

  function LinkCard({ link, cat }: { link: NonNullable<typeof links>[number]; cat: LinkCategory }) {
    const posterRaw = Array.isArray(link.poster) ? (link.poster[0] ?? null) : link.poster;
    const poster = posterRaw as Pick<Profile, "id" | "display_name"> | null;
    const canDelete = isPlatformAdmin || link.posted_by === user!.id;
    const meta = CATEGORY_META[cat];

    return (
      <div className="group relative flex flex-col gap-1.5 rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors">
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

        <span className={`self-start text-[11px] font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>

        {link.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {link.description}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground/70 truncate mt-auto pt-1">
          {link.url}
        </p>

        {poster && (
          <p className="text-[11px] text-muted-foreground">
            Shared by {poster.display_name}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resource Hub</h1>
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

      {/* Sections */}
      {SECTIONS.map((section) => {
        // Collect all items across this section's categories (in order)
        const sectionItems = section.categories.flatMap((cat) =>
          (grouped.get(cat) ?? []).map((link) => ({ link, cat }))
        );
        if (sectionItems.length === 0) return null;

        // If the section has multiple categories, show sub-section headers
        const hasSubSections = section.categories.length > 1;

        return (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
              {section.heading}
            </h2>

            {hasSubSections ? (
              // Render each category as a sub-section
              section.categories.map((cat) => {
                const items = grouped.get(cat) ?? [];
                if (items.length === 0) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat} className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground pl-0.5">
                      {meta.label}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {items.map((link) => (
                        <LinkCard key={link.id} link={link} cat={cat} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sectionItems.map(({ link, cat }) => (
                  <LinkCard key={link.id} link={link} cat={cat} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

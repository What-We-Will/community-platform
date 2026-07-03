"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteLinkButton } from "./DeleteLinkButton";
import { CATEGORY_META, SECTIONS } from "./constants";
import type { LinkCategory } from "./actions";
import type { Profile } from "@/lib/types";

export interface CommunityLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: LinkCategory;
  posted_by: string;
  created_at: string;
  poster: Pick<Profile, "id" | "display_name"> | null;
}

interface ResourceHubClientProps {
  links: CommunityLink[];
  currentUserId: string;
  isPlatformAdmin: boolean;
}

function LinkCard({
  link,
  cat,
  canDelete,
}: {
  link: CommunityLink;
  cat: LinkCategory;
  canDelete: boolean;
}) {
  const meta = CATEGORY_META[cat];

  return (
    <div className="group relative flex flex-col gap-1.5 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary"
        >
          {link.title}
          <ExternalLink className="size-3 shrink-0 opacity-60" />
        </a>
        {canDelete && <DeleteLinkButton id={link.id} />}
      </div>

      <span
        className={`self-start rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.color}`}
      >
        {meta.label}
      </span>

      {link.description && (
        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {link.description}
        </p>
      )}

      <p className="mt-auto truncate pt-1 text-[11px] text-muted-foreground/70">
        {link.url}
      </p>

      {link.poster && (
        <p className="text-[11px] text-muted-foreground">
          Shared by {link.poster.display_name}
        </p>
      )}
    </div>
  );
}

function SectionContent({
  sectionId,
  grouped,
  currentUserId,
  isPlatformAdmin,
}: {
  sectionId: string;
  grouped: Map<LinkCategory, CommunityLink[]>;
  currentUserId: string;
  isPlatformAdmin: boolean;
}) {
  const section = SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;

  const sectionItems = section.categories.flatMap((cat) =>
    (grouped.get(cat) ?? []).map((link) => ({ link, cat }))
  );
  const hasSubSections = section.categories.length > 1;

  if (sectionItems.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No resources in this section yet.
      </p>
    );
  }

  if (hasSubSections) {
    return (
      <div className="space-y-6">
        {section.categories.map((cat) => {
          const items = grouped.get(cat) ?? [];
          if (items.length === 0) return null;
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} className="space-y-2">
              <h3 className="pl-0.5 text-xs font-semibold text-muted-foreground">
                {meta.label}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    cat={cat}
                    canDelete={
                      isPlatformAdmin || link.posted_by === currentUserId
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sectionItems.map(({ link, cat }) => (
        <LinkCard
          key={link.id}
          link={link}
          cat={cat}
          canDelete={isPlatformAdmin || link.posted_by === currentUserId}
        />
      ))}
    </div>
  );
}

export function ResourceHubClient({
  links,
  currentUserId,
  isPlatformAdmin,
}: ResourceHubClientProps) {
  const grouped = new Map<LinkCategory, CommunityLink[]>();
  for (const link of links) {
    const cat = link.category ?? "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(link);
  }

  const defaultTab =
    SECTIONS.find((section) =>
      section.categories.some((cat) => (grouped.get(cat)?.length ?? 0) > 0)
    )?.id ?? SECTIONS[0].id;

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Link2 className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">No links shared yet</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Be the first to share a useful resource with the community.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={defaultTab}>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList
          variant="line"
          className="h-auto min-w-full w-max flex-wrap justify-start gap-x-1 gap-y-1"
        >
          {SECTIONS.map((section) => {
            const count = section.categories.reduce(
              (sum, cat) => sum + (grouped.get(cat)?.length ?? 0),
              0
            );
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="px-2.5 py-1.5 text-xs sm:text-sm"
              >
                {section.tabLabel}
                {count > 0 && (
                  <span className="text-muted-foreground">({count})</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {SECTIONS.map((section) => (
        <TabsContent key={section.id} value={section.id} className="mt-6">
          <h2 className="sr-only">{section.heading}</h2>
          <SectionContent
            sectionId={section.id}
            grouped={grouped}
            currentUserId={currentUserId}
            isPlatformAdmin={isPlatformAdmin}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

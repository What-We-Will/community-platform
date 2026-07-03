import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ResourceHubClient,
  type CommunityLink,
} from "./ResourceHubClient";
import { PostLinkForm } from "./PostLinkForm";
import type { LinkCategory } from "./actions";
import type { Profile } from "@/lib/types";

export default async function CommunityLinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: links }, { data: profile }] = await Promise.all([
    supabase
      .from("community_links")
      .select(
        "id, title, url, description, category, posted_by, created_at, poster:posted_by(id, display_name)"
      )
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const isPlatformAdmin = profile?.role === "admin";

  const normalizedLinks: CommunityLink[] = (links ?? []).map((link) => {
    const posterRaw = Array.isArray(link.poster)
      ? (link.poster[0] ?? null)
      : link.poster;
    return {
      id: link.id,
      title: link.title,
      url: link.url,
      description: link.description,
      category: (link.category as LinkCategory) ?? "other",
      posted_by: link.posted_by,
      created_at: link.created_at,
      poster: posterRaw as Pick<Profile, "id" | "display_name"> | null,
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resource Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared resources — organizations, learning materials, tools, and more.
          </p>
        </div>
        <PostLinkForm />
      </div>
      <ResourceHubClient
        links={normalizedLinks}
        currentUserId={user.id}
        isPlatformAdmin={isPlatformAdmin}
      />
    </div>
  );
}

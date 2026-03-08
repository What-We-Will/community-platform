import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JobBoardClient, type JobPosting } from "./JobBoardClient";
import type { Comment } from "./JobComments";

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleFilter } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let jobQuery = supabase
    .from("job_postings")
    .select("id, title, company, location, job_type, roles, description, url, offers_referral, is_community_network, posted_by, created_at, poster:posted_by(id, display_name)")
    .order("created_at", { ascending: false });

  if (roleFilter) {
    jobQuery = jobQuery.contains("roles", [roleFilter]);
  }

  const [
    { data: jobs },
    { data: profile },
    { data: myWishlisted },
    { data: allComments },
  ] = await Promise.all([
    jobQuery,
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("job_applications")
      .select("job_posting_id")
      .eq("user_id", user.id)
      .eq("status", "wishlist")
      .not("job_posting_id", "is", null),
    supabase
      .from("job_posting_comments")
      .select("id, job_posting_id, content, created_at, user_id, author:user_id(id, display_name, avatar_url)")
      .order("created_at", { ascending: true }),
  ]);

  const isPlatformAdmin = profile?.role === "admin";
  const wishlistedIds = (myWishlisted ?? []).map((w) => w.job_posting_id as string);

  // Group comments by job posting id (plain object for serialization)
  const commentsByJob: Record<string, Comment[]> = {};
  for (const c of allComments ?? []) {
    if (!commentsByJob[c.job_posting_id]) commentsByJob[c.job_posting_id] = [];
    commentsByJob[c.job_posting_id].push({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id,
      author: (Array.isArray(c.author) ? c.author[0] : c.author) as Comment["author"],
    });
  }

  return (
    <Suspense>
      <JobBoardClient
        jobs={(jobs ?? []) as JobPosting[]}
        currentUserId={user.id}
        isPlatformAdmin={isPlatformAdmin}
        wishlistedIds={wishlistedIds}
        commentsByJob={commentsByJob}
        activeRoleFilter={roleFilter ?? null}
      />
    </Suspense>
  );
}

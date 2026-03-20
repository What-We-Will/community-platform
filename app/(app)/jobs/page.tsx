import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeJobBoardTier } from "@/lib/jobs/job-board-tier";
import { JobBoardClient, type JobPosting } from "./JobBoardClient";
import type { Comment } from "./JobComments";

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; referral?: string; community?: string; notes?: string }>;
}) {
  const { role: roleFilter, referral, community, notes } = await searchParams;
  const referralFilter = referral === "true";
  const communityFilter = community === "true";
  const notesFilter = notes === "true";

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
  if (referralFilter) {
    jobQuery = jobQuery.eq("offers_referral", true);
  }
  if (communityFilter) {
    jobQuery = jobQuery.eq("is_community_network", true);
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

  const normalizedJobs: JobPosting[] = (jobs ?? []).map((j) => ({
    ...j,
    poster: Array.isArray(j.poster) ? (j.poster[0] ?? null) : j.poster,
  }));

  // Index jobs by id and by company (case-insensitive) for cross-company note lookup
  const jobById = new Map(normalizedJobs.map((j) => [j.id, j]));
  const companyToJobIds = new Map<string, string[]>();
  for (const job of normalizedJobs) {
    const key = job.company.toLowerCase().trim();
    const existing = companyToJobIds.get(key) ?? [];
    existing.push(job.id);
    companyToJobIds.set(key, existing);
  }

  // Build raw direct comments keyed by their source job_posting_id
  const rawCommentsByJob = new Map<string, Comment[]>();
  for (const c of allComments ?? []) {
    if (!rawCommentsByJob.has(c.job_posting_id)) rawCommentsByJob.set(c.job_posting_id, []);
    rawCommentsByJob.get(c.job_posting_id)!.push({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id,
      author: (Array.isArray(c.author) ? c.author[0] : c.author) as Comment["author"],
    });
  }

  // Apply notes filter: keep only jobs that have at least one direct community note
  const filteredJobs = notesFilter
    ? normalizedJobs.filter((j) => (rawCommentsByJob.get(j.id)?.length ?? 0) > 0)
    : normalizedJobs;

  // For each job, combine direct notes + cross-company notes from sibling postings
  const commentsByJob: Record<string, Comment[]> = {};
  for (const job of filteredJobs) {
    const key = job.company.toLowerCase().trim();
    const siblingIds = (companyToJobIds.get(key) ?? []).filter((id) => id !== job.id);

    const direct = rawCommentsByJob.get(job.id) ?? [];
    const crossCompany: Comment[] = siblingIds.flatMap((sibId) =>
      (rawCommentsByJob.get(sibId) ?? []).map((c) => ({
        ...c,
        source_job_id: sibId,
        source_job_title: jobById.get(sibId)?.title ?? "Another position",
      }))
    );

    // Merge and sort newest first
    const merged = [...direct, ...crossCompany].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    commentsByJob[job.id] = merged;
  }

  // Sort by priority tier, then most-recent within each tier:
  //   0 — has referral               (by job created_at desc)
  //   1 — has direct community notes (by most recent direct note desc)
  //   2 — is community network       (by job created_at desc)
  //   3 — everything else            (by job created_at desc)
  const jobTier = (job: JobPosting): number =>
    computeJobBoardTier({
      offers_referral: job.offers_referral,
      is_community_network: job.is_community_network,
      directCommentCount: rawCommentsByJob.get(job.id)?.length ?? 0,
    });

  filteredJobs.sort((a, b) => {
    const ta = jobTier(a);
    const tb = jobTier(b);
    if (ta !== tb) return ta - tb;

    // Tier 1: sort by most recent direct note (DB query is ascending, so last = newest)
    if (ta === 1) {
      const aNote = rawCommentsByJob.get(a.id)?.at(-1)?.created_at ?? "";
      const bNote = rawCommentsByJob.get(b.id)?.at(-1)?.created_at ?? "";
      return new Date(bNote).getTime() - new Date(aNote).getTime();
    }

    // All other tiers: sort by job posted date desc
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Suspense>
      <JobBoardClient
        jobs={filteredJobs}
        currentUserId={user.id}
        isPlatformAdmin={isPlatformAdmin}
        wishlistedIds={wishlistedIds}
        commentsByJob={commentsByJob}
        activeRoleFilter={roleFilter ?? null}
        activeReferralFilter={referralFilter}
        activeCommunityFilter={communityFilter}
        activeNotesFilter={notesFilter}
      />
    </Suspense>
  );
}

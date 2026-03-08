import { Suspense } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MemberCard from "@/components/members/MemberCard";
import MemberFilters from "@/components/members/MemberFilters";
import { getOnlineStatus } from "@/lib/utils/status";
import type { Profile } from "@/lib/types";

type MembersPageProps = {
  searchParams: Promise<{ q?: string; skill?: string; referrals?: string }>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  const skill = params.skill?.trim();
  const referralsOnly = params.referrals === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // Build query for profiles
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("is_onboarded", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) {
    query = query.textSearch("fts", q, { type: "websearch" });
  }
  if (skill) {
    query = query.contains("skills", [skill]);
  }
  if (referralsOnly) {
    query = query.eq("open_to_referrals", true);
  }

  const { data: profiles, error } = await query;

  // Fetch all skills for filter dropdown
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("skills")
    .eq("is_onboarded", true);

  const allSkills = Array.from(
    new Set(
      (allProfiles ?? [])
        .flatMap((p) => p.skills ?? [])
        .filter(Boolean)
        .sort()
    )
  ) as string[];

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive">
          Failed to load members. Please try again later.
        </p>
      </div>
    );
  }

  const hasFilters = !!(q || skill || referralsOnly);
  const isEmpty = !profiles || profiles.length === 0;
  const isFilteredEmpty = hasFilters && isEmpty;

  // Sort: online first, then away, then offline (same order as getOnlineStatus)
  const statusOrder = { online: 0, away: 1, offline: 2 };
  const sortedProfiles = (profiles ?? []).slice().sort((a, b) => {
    const aStatus = getOnlineStatus(a.last_seen_at ?? null);
    const bStatus = getOnlineStatus(b.last_seen_at ?? null);
    return statusOrder[aStatus] - statusOrder[bStatus];
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="mt-1 text-muted-foreground">
          Discover and connect with community members
        </p>
      </div>

      <Suspense fallback={<div className="h-20 animate-pulse rounded-md bg-muted" />}>
        <MemberFilters allSkills={allSkills} />
      </Suspense>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Users className="size-12 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">
            {isFilteredEmpty ? "No members found" : "No members yet"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {isFilteredEmpty
              ? "Try adjusting your search or filters."
              : "Be the first to complete your profile!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedProfiles.map((profile) => (
            <MemberCard
              key={profile.id}
              profile={profile as Profile}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

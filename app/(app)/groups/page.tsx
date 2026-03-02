import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { UsersRound } from "lucide-react";
import type { GroupWithDetails, Profile } from "@/lib/types";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Fetch all public groups sorted by member count ────────────────────────
  const { data: allGroups } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (!allGroups || allGroups.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Find your community within the community
            </p>
          </div>
          <CreateGroupDialog />
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <UsersRound className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No groups yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Be the first to create a group and bring people together around a shared interest.
          </p>
        </div>
      </div>
    );
  }

  // ── Fetch all group members to determine counts, membership, recent members ─
  const groupIds = allGroups.map((g) => g.id);

  const { data: allMembers } = await supabase
    .from("group_members")
    .select("group_id, user_id, role")
    .in("group_id", groupIds);

  // Collect all unique member user_ids for profile fetch
  const allUserIds = [...new Set((allMembers ?? []).map((m) => m.user_id))];
  const { data: profiles } = allUserIds.length
    ? await supabase.from("profiles").select("*").in("id", allUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  // Build per-group metadata
  const membersByGroup = new Map<
    string,
    Array<{ user_id: string; role: string }>
  >();
  for (const m of allMembers ?? []) {
    const arr = membersByGroup.get(m.group_id) ?? [];
    arr.push(m);
    membersByGroup.set(m.group_id, arr);
  }

  // Enrich groups
  const enriched: GroupWithDetails[] = allGroups.map((g) => {
    const members = membersByGroup.get(g.id) ?? [];
    const myMembership = members.find((m) => m.user_id === user.id);
    const recentMembers = members
      .slice(0, 5)
      .map((m) => profileMap.get(m.user_id))
      .filter(Boolean) as Profile[];

    return {
      ...g,
      memberCount: members.length,
      isMember: !!myMembership,
      currentUserRole: (myMembership?.role as GroupWithDetails["currentUserRole"]) ?? null,
      recentMembers,
    };
  });

  // Sort by member count descending
  enriched.sort((a, b) => b.memberCount - a.memberCount);

  const myGroups = enriched.filter((g) => g.isMember);
  const discoverGroups = enriched.filter((g) => !g.isMember);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find your community within the community
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {/* My Groups */}
      <section>
        <h2 className="text-base font-semibold mb-4">My Groups</h2>
        {myGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-6 text-center">
            You haven&apos;t joined any groups yet. Browse below to find one!
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
            {myGroups.map((group) => (
              <div key={group.id} className="w-72 shrink-0 md:w-auto">
                <GroupCard group={group} compact />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Discover Groups */}
      {discoverGroups.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-4">Discover Groups</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoverGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {discoverGroups.length === 0 && myGroups.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          You&apos;re a member of all available groups!
        </p>
      )}
    </div>
  );
}

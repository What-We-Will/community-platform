import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupHubClient } from "./GroupHubClient";
import { PrivateGroupGate } from "./PrivateGroupGate";
import { fetchUpcomingEvents } from "@/lib/events";
import type { Profile, GroupMember, GroupJoinRequest, GroupJoinRequestWithProfile, GroupNote } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export default async function GroupHubPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the group
  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !group) notFound();

  // Fetch all group members + their roles
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, user_id, role, joined_at")
    .eq("group_id", group.id);

  const memberUserIds = (memberships ?? []).map((m) => m.user_id);
  const myMembership = (memberships ?? []).find((m) => m.user_id === user.id);
  const currentUserRole = (myMembership?.role as GroupMember["role"]) ?? null;
  const isMember = !!myMembership;

  // Private group gate for non-members
  if (group.is_private && !isMember) {
    // Check if the user already has a pending/rejected request
    const { data: existingRequest } = await supabase
      .from("group_join_requests")
      .select("*")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    return (
      <PrivateGroupGate
        group={group}
        existingRequest={existingRequest as GroupJoinRequest | null}
      />
    );
  }

  // Fetch member profiles
  const { data: profiles } = memberUserIds.length
    ? await supabase.from("profiles").select("*").in("id", memberUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  const membersWithRole = (memberships ?? [])
    .map((m) => {
      const profile = profileMap.get(m.user_id);
      if (!profile) return null;
      return { ...profile, role: m.role as GroupMember["role"] };
    })
    .filter(Boolean) as Array<Profile & { role: GroupMember["role"] }>;

  // Fetch pending join requests (admins only)
  let pendingRequests: GroupJoinRequestWithProfile[] = [];
  if (currentUserRole === "admin") {
    const { data: requests } = await supabase
      .from("group_join_requests")
      .select("*")
      .eq("group_id", group.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (requests && requests.length > 0) {
      const requesterIds = requests.map((r) => r.user_id);
      const { data: requesterProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", requesterIds);

      const requesterMap = new Map(
        (requesterProfiles ?? []).map((p) => [p.id, p as Profile])
      );

      pendingRequests = requests
        .map((r) => {
          const profile = requesterMap.get(r.user_id);
          if (!profile) return null;
          return { ...r, status: r.status as GroupJoinRequest["status"], profile };
        })
        .filter(Boolean) as GroupJoinRequestWithProfile[];
    }
  }

  // Current user's profile (include role for platform admin features)
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, timezone")
    .eq("id", user.id)
    .single();

  const conversationId = group.conversation_id as string | null;

  const { data: rawMessages } = conversationId
    ? await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, content, message_type, metadata, edited_at, created_at"
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const messages = (rawMessages ?? []).reverse().map((msg) => ({
    ...msg,
    message_type: msg.message_type as "text" | "file" | "system" | "video_invite",
    metadata: (msg.metadata ?? {}) as Record<string, unknown>,
    sender: msg.sender_id ? (profileMap.get(msg.sender_id) ?? null) : null,
  }));

  if (conversationId && isMember) {
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
  }

  const currentUser = {
    id: user.id,
    display_name: currentUserProfile?.display_name ?? "You",
    avatar_url: currentUserProfile?.avatar_url ?? null,
  };

  // Fetch group notes (only for members)
  let notes: GroupNote[] = [];
  if (isMember) {
    const { data: rawNotes } = await supabase
      .from("group_notes")
      .select("id, group_id, created_by, title, content, updated_at, created_at, author:created_by(id, display_name)")
      .eq("group_id", group.id)
      .order("updated_at", { ascending: false });

    notes = (rawNotes ?? []).map((n) => ({
      ...n,
      author: (Array.isArray(n.author) ? (n.author[0] ?? null) : n.author) as GroupNote["author"],
    }));
  }

  let upcomingEvents: Awaited<ReturnType<typeof fetchUpcomingEvents>> = [];
  const eventRsvpCounts: Record<string, { going: number; maybe: number; declined: number }> = {};
  const eventUserRsvp: Record<string, { status: string }> = {};
  try {
    upcomingEvents = await fetchUpcomingEvents({ groupId: group.id });
    if (upcomingEvents.length > 0) {
      const eventIds = upcomingEvents.map((e) => (e as { id: string }).id);
      const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("event_id, user_id, status")
        .in("event_id", eventIds);
      for (const eid of eventIds) {
        eventRsvpCounts[eid] = { going: 0, maybe: 0, declined: 0 };
      }
      for (const r of rsvps ?? []) {
        const row = r as { event_id: string; user_id: string; status: string };
        if (eventRsvpCounts[row.event_id]) {
          eventRsvpCounts[row.event_id][row.status as "going" | "maybe" | "declined"]++;
          if (row.user_id === user.id) {
            eventUserRsvp[row.event_id] = { status: row.status };
          }
        }
      }
    }
  } catch {
    // leave upcomingEvents empty
  }

  const isPlatformAdmin = currentUserProfile?.role === "admin";

  return (
    <GroupHubClient
      group={group}
      currentUser={currentUser}
      currentUserRole={currentUserRole}
      isMember={isMember}
      isPlatformAdmin={isPlatformAdmin}
      members={membersWithRole}
      initialMessages={messages}
      pendingRequests={pendingRequests}
      upcomingEvents={upcomingEvents}
      eventRsvpCounts={eventRsvpCounts}
      eventUserRsvp={eventUserRsvp}
      initialNotes={notes}
      viewerTimezone={currentUserProfile?.timezone ?? "America/Chicago"}
    />
  );
}

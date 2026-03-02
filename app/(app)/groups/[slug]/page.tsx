import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupHubClient } from "./GroupHubClient";
import type { Profile, GroupMember } from "@/lib/types";

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

  // Private group: non-members can't see content
  if (group.is_private && !isMember) {
    return (
      <div className="mx-auto max-w-lg mt-20 text-center space-y-4 px-4">
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-semibold">{group.name}</h1>
        <p className="text-muted-foreground text-sm">
          This is a private group. Contact an admin to request an invitation.
        </p>
      </div>
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

  // Current user's profile
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Fetch messages for the group conversation
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

  // Mark as read
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

  return (
    <GroupHubClient
      group={group}
      currentUser={currentUser}
      currentUserRole={currentUserRole}
      isMember={isMember}
      members={membersWithRole}
      initialMessages={messages}
    />
  );
}

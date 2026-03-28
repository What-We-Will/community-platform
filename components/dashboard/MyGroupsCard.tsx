import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAvatarColor } from "@/lib/utils/avatar";
import { UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyGroupsCardProps {
  userId: string;
}

export async function MyGroupsCard({ userId }: MyGroupsCardProps) {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("group_members")
    .select("group_id, role, groups(id, name, slug, conversation_id)")
    .eq("user_id", userId)
    .limit(5);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersRound className="size-4" />
            My Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load groups.
          </p>
        </CardContent>
      </Card>
    );
  }

  const memberships = rows ?? [];
  const groupIds = memberships
    .map((r) => (r as { group_id: string }).group_id)
    .filter(Boolean);

  let memberCounts: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: counts } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);
    for (const c of counts ?? []) {
      const gid = (c as { group_id: string }).group_id;
      memberCounts[gid] = (memberCounts[gid] ?? 0) + 1;
    }
  }

  // Unread counts per group conversation
  const conversationIds = memberships
    .map((row) => {
      const r = row as unknown as { groups: { conversation_id: string | null } | null };
      return r.groups?.conversation_id ?? null;
    })
    .filter((id): id is string => Boolean(id));

  let unreadByConvId: Record<string, number> = {};
  if (conversationIds.length > 0) {
    const { data: unreads } = await supabase.rpc("get_unread_counts", {
      p_user_id: userId,
      p_conversation_ids: conversationIds,
    });
    for (const row of unreads ?? []) {
      unreadByConvId[row.conversation_id] = Number(row.unread_count);
    }
  }

  const groups = memberships
    .map((row) => {
      const r = row as unknown as {
        group_id: string;
        role: string;
        groups: { id: string; name: string; slug: string; conversation_id: string | null } | null;
      };
      const g = r.groups;
      if (!g) return null;
      const conversationId = g.conversation_id;
      return {
        group_id: r.group_id,
        role: r.role,
        group: { id: g.id, name: g.name, slug: g.slug },
        memberCount: memberCounts[g.id] ?? 0,
        unreadCount: conversationId ? unreadByConvId[conversationId] ?? 0 : 0,
      };
    })
    .filter(Boolean) as {
    group_id: string;
    role: string;
    group: { id: string; name: string; slug: string };
    memberCount: number;
    unreadCount: number;
  }[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UsersRound className="size-4" />
          My Groups
        </CardTitle>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Join a group to collaborate with others.{" "}
            <Link href="/groups" className="text-primary hover:underline">
              Browse groups
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {groups.map((row) => {
              const g = row.group;
              return (
                <li key={g.id}>
                  <Link
                    href={`/groups/${g.slug}`}
                    className="flex items-center justify-between gap-2 rounded-lg p-2 -mx-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "size-4 shrink-0 rounded-full ring-2 ring-background",
                          getAvatarColor(g.name)
                        )}
                        aria-hidden
                      />
                      <span className="text-sm font-medium truncate">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {row.unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] h-5 min-w-5 px-1 flex items-center justify-center"
                        >
                          {row.unreadCount > 99 ? "99+" : row.unreadCount}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {row.memberCount} member{row.memberCount !== 1 ? "s" : ""}
                      </span>
                      {(row.role === "admin" || row.role === "moderator") && (
                        <Badge variant="secondary" className="text-[10px]">
                          {row.role}
                        </Badge>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {groups.length > 0 && (
        <CardFooter className="pt-0">
          <Link href="/groups" className="text-sm text-primary hover:underline">
            Browse groups →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

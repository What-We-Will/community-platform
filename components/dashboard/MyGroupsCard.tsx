import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersRound } from "lucide-react";

interface MyGroupsCardProps {
  userId: string;
}

export async function MyGroupsCard({ userId }: MyGroupsCardProps) {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("group_members")
    .select("group_id, role, groups(id, name, slug)")
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

  const groups = memberships
    .map((row) => {
      const r = row as unknown as {
        group_id: string;
        role: string;
        groups: { id: string; name: string; slug: string } | null;
      };
      const g = r.groups;
      if (!g) return null;
      return {
        group_id: r.group_id,
        role: r.role,
        group: g,
        memberCount: memberCounts[g.id] ?? 0,
      };
    })
    .filter(Boolean) as {
    group_id: string;
    role: string;
    group: { id: string; name: string; slug: string };
    memberCount: number;
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
                    <span className="text-sm font-medium truncate">{g.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {row.memberCount} member{row.memberCount !== 1 ? "s" : ""}
                    </span>
                    {(row.role === "admin" || row.role === "moderator") && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {row.role}
                      </Badge>
                    )}
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

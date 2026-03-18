import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Sparkles } from "lucide-react";

export async function NewMembersCard() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, created_at, avatar_url, display_name, headline")
    .eq("is_onboarded", true)
    .eq("approval_status", "approved")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            New Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load new members.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          New Members
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 overflow-y-auto">
        {(profiles ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Invite friends to grow the community!
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {(profiles ?? []).map((member) => (
              <Link
                key={member.id}
                href={`/members/${member.id}`}
                className="flex items-center gap-3 py-2 rounded-lg px-1 hover:bg-accent/50 transition-colors"
              >
                <UserAvatar
                  avatarUrl={member.avatar_url}
                  displayName={member.display_name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{member.display_name}</p>
                  {member.headline && (
                    <p className="text-xs text-muted-foreground truncate">{member.headline}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

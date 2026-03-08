import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Sparkles } from "lucide-react";
import type { Profile } from "@/lib/types";

const THIRTY_DAYS_AGO = new Date();
THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

export async function NewMembersCard() {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_onboarded", true)
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

  const recent = (profiles ?? []).filter(
    (p) => new Date(p.created_at) >= THIRTY_DAYS_AGO
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          New Members
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 overflow-y-auto">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Invite friends to grow the community!
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {recent.map((member) => (
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

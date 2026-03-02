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
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Invite friends to grow the community!
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1">
            {recent.map((member) => (
              <Link
                key={member.id}
                href={`/members/${member.id}`}
                className="flex flex-shrink-0 flex-col items-center gap-1.5 min-w-[72px] rounded-lg p-1 hover:bg-accent/50 transition-colors"
              >
                <UserAvatar
                  avatarUrl={member.avatar_url}
                  displayName={member.display_name}
                  size="sm"
                />
                <span className="text-xs font-medium truncate w-full text-center max-w-[72px]">
                  {member.display_name}
                </span>
                {member.headline && (
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center max-w-[72px]">
                    {member.headline}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Users, Lock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { Badge } from "@/components/ui/badge";
import type { Group, Profile } from "@/lib/types";

interface GroupHeaderProps {
  group: Group;
  memberCount: number;
  currentUserRole: "member" | "admin" | "moderator" | null;
  recentMembers: Profile[];
}

export function GroupHeader({
  group,
  memberCount,
  currentUserRole,
  recentMembers,
}: GroupHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-xl",
            getAvatarColor(group.name)
          )}
        >
          {getInitials(group.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            {group.is_private && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="size-3" />
                Private
              </Badge>
            )}
            {currentUserRole === "admin" && (
              <Badge variant="outline" className="gap-1">
                <Settings className="size-3" />
                Admin
              </Badge>
            )}
            {currentUserRole === "moderator" && (
              <Badge variant="outline">Moderator</Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>

          {group.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {group.description}
            </p>
          )}
        </div>
      </div>

      {/* Avatar stack */}
      {recentMembers.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {recentMembers.slice(0, 6).map((member) => (
              <div
                key={member.id}
                title={member.display_name}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-white text-xs font-semibold ring-2 ring-background",
                  getAvatarColor(member.display_name)
                )}
              >
                {getInitials(member.display_name)}
              </div>
            ))}
          </div>
          {memberCount > 6 && (
            <span className="text-xs text-muted-foreground">
              +{memberCount - 6} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

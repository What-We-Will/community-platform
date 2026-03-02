import Link from "next/link";
import { Users, Lock, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GroupWithDetails } from "@/lib/types";

interface GroupCardProps {
  group: GroupWithDetails;
  compact?: boolean;
}

export function GroupCard({ group, compact = false }: GroupCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-white font-semibold text-sm",
            getAvatarColor(group.name)
          )}
        >
          {getInitials(group.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">{group.name}</p>
            {group.is_private && <Lock className="size-3 text-muted-foreground shrink-0" />}
            {group.archived && <Archive className="size-3 text-muted-foreground shrink-0" aria-label="Archived" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/groups/${group.slug}`}>Open</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border bg-card p-5 gap-4 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-base",
            getAvatarColor(group.name)
          )}
        >
          {getInitials(group.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-sm leading-tight">{group.name}</h3>
            {group.is_private && (
              <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0 h-4">
                <Lock className="size-2.5" />
                Private
              </Badge>
            )}
            {group.archived && (
              <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 h-4">
                <Archive className="size-2.5" />
                Archived
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <Users className="size-3" />
            <span>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {group.description}
        </p>
      )}

      {/* Avatar stack */}
      {group.recentMembers.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {group.recentMembers.slice(0, 5).map((member) => (
              <div
                key={member.id}
                title={member.display_name}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-white text-[10px] font-semibold ring-2 ring-background",
                  getAvatarColor(member.display_name)
                )}
              >
                {getInitials(member.display_name)}
              </div>
            ))}
          </div>
          {group.memberCount > 5 && (
            <span className="text-xs text-muted-foreground">
              +{group.memberCount - 5} more
            </span>
          )}
        </div>
      )}

      {/* Action button */}
      <Button
        asChild
        size="sm"
        variant={group.isMember ? "outline" : "default"}
        className="w-full"
      >
        <Link href={`/groups/${group.slug}`}>
          {group.isMember ? "Open" : "View Group"}
        </Link>
      </Button>
    </div>
  );
}

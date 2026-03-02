"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { getOnlineStatus, type OnlineStatus } from "@/lib/utils/status";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function hashIdToColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

function StatusDot({ status }: { status: OnlineStatus }) {
  return (
    <span
      className={cn(
        "absolute right-1 top-1 size-2 rounded-full ring-2 ring-background",
        status === "online" && "bg-green-500",
        status === "away" && "bg-yellow-500",
        status === "offline" && "bg-muted-foreground/50"
      )}
      title={status === "online" ? "Online" : status === "away" ? "Recently active" : "Offline"}
    />
  );
}

function isNewMember(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return created >= sevenDaysAgo;
}

interface MemberCardProps {
  profile: Profile;
}

export default function MemberCard({ profile }: MemberCardProps) {
  const status = getOnlineStatus(profile.last_seen_at);
  const initials = getInitials(profile.display_name);
  const avatarColor = hashIdToColor(profile.id);
  const skills = profile.skills ?? [];
  const displaySkills = skills.slice(0, 4);
  const extraCount = skills.length - 4;

  return (
    <Card className="relative transition-all hover:border-primary/50 hover:shadow-md">
      {isNewMember(profile.created_at) && (
        <Badge
          variant="secondary"
          className="absolute right-2 top-2 bg-indigo-500/90 text-white hover:bg-indigo-500/90"
        >
          New
        </Badge>
      )}
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className={cn("size-12", avatarColor)}>
              <AvatarFallback className={cn("text-white", avatarColor)}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <StatusDot status={status} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{profile.display_name}</h3>
            {profile.headline && (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {profile.headline}
              </p>
            )}
            {profile.location && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{profile.location}</span>
              </div>
            )}
          </div>
        </div>
        {(displaySkills.length > 0 || profile.open_to_referrals) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {displaySkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {extraCount > 0 && (
              <span className="text-xs text-muted-foreground">+{extraCount}</span>
            )}
            {profile.open_to_referrals && (
              <Badge className="bg-green-600 text-white hover:bg-green-600">
                Open to Mock Interviews
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Button variant="default" size="sm" asChild>
          <Link href={`/members/${profile.id}`}>View Profile</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/messages?new=${profile.id}`} prefetch={false}>Message</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

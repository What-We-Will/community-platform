"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getOnlineStatus } from "@/lib/utils/status";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

function isNewMember(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return created >= sevenDaysAgo;
}

interface MemberCardProps {
  profile: Profile;
  /** When set, this profile is shown as online if profile.id === currentUserId */
  currentUserId?: string | null;
}

export default function MemberCard({ profile, currentUserId }: MemberCardProps) {
  const status = getOnlineStatus(profile.last_seen_at, {
    isCurrentUser: currentUserId != null && profile.id === currentUserId,
  });
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
          <UserAvatar
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            size="lg"
            showStatus
            status={status}
          />
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

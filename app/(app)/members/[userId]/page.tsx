import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
  Linkedin,
  Github,
  Globe,
  MessageSquare,
  UserCircle,
} from "lucide-react";
import { QuickCallButton } from "@/components/video/QuickCallButton";
import { LiveStatusAvatar } from "@/components/shared/LiveStatusAvatar";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Member Groups ────────────────────────────────────────────────────────────

async function MemberGroups({
  userId,
  viewerId,
}: {
  userId: string;
  viewerId: string | null;
}) {
  const supabase = await createClient();

  // Get all groups this member belongs to
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium">Groups</h2>
        <p className="mt-2 text-sm text-muted-foreground">Not a member of any groups yet.</p>
      </div>
    );
  }

  const groupIds = memberships.map((m) => m.group_id);

  // Get viewer's groups to determine visibility of private groups
  let viewerGroupIds: string[] = [];
  if (viewerId) {
    const { data: viewerMemberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", viewerId);
    viewerGroupIds = (viewerMemberships ?? []).map((m) => m.group_id);
  }

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, slug, is_private")
    .in("id", groupIds);

  // Show: public groups + private groups where viewer is also a member
  const visibleGroups = (groups ?? []).filter(
    (g) => !g.is_private || viewerGroupIds.includes(g.id)
  );

  if (visibleGroups.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium">Groups</h2>
        <p className="mt-2 text-sm text-muted-foreground">No shared or public groups.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-medium">Groups</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {visibleGroups.map((group) => (
          <Link key={group.id} href={`/groups/${group.slug}`}>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              {group.name}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatMemberSince(createdAt: string): string {
  const date = new Date(createdAt);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

type ProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile || !profile.is_onboarded) {
    notFound();
  }

  const typedProfile = profile as Profile;
  const isOwnProfile = currentUser?.id === userId;

  let viewerDisplayName = "";
  if (currentUser) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", currentUser.id)
      .single();
    viewerDisplayName = (viewerProfile?.display_name as string) ?? "Guest";
  }

  const links = [
    {
      url: typedProfile.linkedin_url,
      label: "LinkedIn",
      icon: Linkedin,
    },
    {
      url: typedProfile.github_url,
      label: "GitHub",
      icon: Github,
    },
    {
      url: typedProfile.portfolio_url,
      label: "Portfolio",
      icon: Globe,
    },
  ].filter((l) => l.url);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <LiveStatusAvatar
          avatarUrl={typedProfile.avatar_url}
          displayName={typedProfile.display_name}
          size="xl"
          lastSeenAt={typedProfile.last_seen_at}
          isCurrentUser={isOwnProfile}
          className="ring-4 ring-background"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {typedProfile.display_name}
          </h1>
          {typedProfile.headline && (
            <p className="mt-1 text-muted-foreground">
              {typedProfile.headline}
            </p>
          )}
          {typedProfile.location && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {typedProfile.location}
            </div>
          )}
          {typedProfile.open_to_referrals && (
            <Badge className="mt-2 bg-green-600 text-white hover:bg-green-600">
              Open to Mock Interviews
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isOwnProfile ? (
          <Button asChild>
            <Link href="/profile">
              <UserCircle className="mr-2 size-4" />
              Edit Profile
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild>
              <Link href={`/messages?new=${userId}`} prefetch={false}>
                <MessageSquare className="mr-2 size-4" />
                Send Message
              </Link>
            </Button>
            <QuickCallButton
              targetUserId={userId}
              currentUserDisplayName={viewerDisplayName}
            />
          </>
        )}
      </div>

      {typedProfile.bio && (
        <div>
          <h2 className="text-sm font-medium">Bio</h2>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
            {typedProfile.bio}
          </p>
        </div>
      )}

      {(typedProfile.skills?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-medium">Skills</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {typedProfile.skills!.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div>
          <h2 className="text-sm font-medium">Links</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {links.map(({ url, label, icon: Icon }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Icon className="size-4" />
                {label}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      <MemberGroups userId={userId} viewerId={currentUser?.id ?? null} />

      <p className="text-sm text-muted-foreground">
        Member since {formatMemberSince(typedProfile.created_at)}
      </p>
    </div>
  );
}

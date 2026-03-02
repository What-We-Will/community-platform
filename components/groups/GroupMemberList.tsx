"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MoreVertical,
  Shield,
  Crown,
  UserMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { getOnlineStatus } from "@/lib/utils/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Profile, GroupMember } from "@/lib/types";

interface MemberWithRole extends Profile {
  role: GroupMember["role"];
}

interface GroupMemberListProps {
  members: MemberWithRole[];
  currentUserId: string;
  currentUserRole: "member" | "admin" | "moderator" | null;
  groupId: string;
  groupName: string;
  onUpdateRole: (userId: string, role: GroupMember["role"]) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

function RoleBadge({ role }: { role: GroupMember["role"] }) {
  if (role === "admin") {
    return (
      <Badge variant="default" className="gap-1 text-[10px] px-1.5 h-5">
        <Crown className="size-2.5" />
        Admin
      </Badge>
    );
  }
  if (role === "moderator") {
    return (
      <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 h-5">
        <Shield className="size-2.5" />
        Mod
      </Badge>
    );
  }
  return null;
}

function OnlineDot({
  lastSeenAt,
  isCurrentUser,
}: {
  lastSeenAt: string | null;
  isCurrentUser?: boolean;
}) {
  const status = getOnlineStatus(lastSeenAt, { isCurrentUser });
  if (status === "offline") return null;
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 size-2 rounded-full ring-1 ring-background",
        status === "online" ? "bg-emerald-500" : "bg-amber-400"
      )}
    />
  );
}

export function GroupMemberList({
  members,
  currentUserId,
  currentUserRole,
  groupName,
  onUpdateRole,
  onRemoveMember,
}: GroupMemberListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const memberToRemove = members.find((m) => m.id === removingId);

  async function handleRemove() {
    if (!removingId) return;
    setLoadingId(removingId);
    await onRemoveMember(removingId);
    setLoadingId(null);
    setRemovingId(null);
  }

  async function handleRole(userId: string, role: GroupMember["role"]) {
    setLoadingId(userId);
    await onUpdateRole(userId, role);
    setLoadingId(null);
  }

  return (
    <>
      <div className="divide-y">
        {members.map((member) => {
          const isCurrentUser = member.id === currentUserId;
          const canManage = currentUserRole === "admin" && !isCurrentUser;

          return (
            <div key={member.id} className="flex items-center gap-3 py-3">
              {/* Avatar */}
              <Link href={`/members/${member.id}`} className="relative shrink-0">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-white text-sm font-semibold",
                    getAvatarColor(member.display_name)
                  )}
                >
                  {getInitials(member.display_name)}
                </div>
                <OnlineDot
                  lastSeenAt={member.last_seen_at}
                  isCurrentUser={member.id === currentUserId}
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/members/${member.id}`}
                    className="text-sm font-medium hover:underline truncate"
                  >
                    {member.display_name}
                    {isCurrentUser && (
                      <span className="ml-1 text-muted-foreground font-normal">(you)</span>
                    )}
                  </Link>
                  <RoleBadge role={member.role} />
                </div>
                {member.headline && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {member.headline}
                  </p>
                )}
              </div>

              {/* Admin actions */}
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      disabled={loadingId === member.id}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role !== "moderator" && (
                      <DropdownMenuItem
                        onClick={() => handleRole(member.id, "moderator")}
                      >
                        <Shield className="mr-2 size-4" />
                        Make Moderator
                      </DropdownMenuItem>
                    )}
                    {member.role !== "admin" && (
                      <DropdownMenuItem
                        onClick={() => handleRole(member.id, "admin")}
                      >
                        <Crown className="mr-2 size-4" />
                        Make Admin
                      </DropdownMenuItem>
                    )}
                    {member.role !== "member" && (
                      <DropdownMenuItem
                        onClick={() => handleRole(member.id, "member")}
                      >
                        <UserMinus className="mr-2 size-4" />
                        Reset to Member
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setRemovingId(member.id)}
                    >
                      <UserMinus className="mr-2 size-4" />
                      Remove from Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm remove dialog */}
      <AlertDialog open={!!removingId} onOpenChange={() => setRemovingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{memberToRemove?.display_name}</strong> from{" "}
              <strong>{groupName}</strong>? They will lose access to the group
              chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={!!loadingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen, Video, Loader2, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { ConversationView } from "@/components/messages/ConversationView";
import { GroupHeader } from "@/components/groups/GroupHeader";
import { GroupMemberList } from "@/components/groups/GroupMemberList";
import {
  joinGroupAction,
  leaveGroupAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "@/app/(app)/groups/actions";
import { JoinRequestsPanel } from "@/components/groups/JoinRequestsPanel";
import type { Group, Profile, GroupMember, MessageWithSender, GroupJoinRequestWithProfile } from "@/lib/types";

interface GroupHubClientProps {
  group: Group;
  currentUser: { id: string; display_name: string; avatar_url: string | null };
  currentUserRole: GroupMember["role"] | null;
  isMember: boolean;
  members: Array<Profile & { role: GroupMember["role"] }>;
  initialMessages: MessageWithSender[];
  pendingRequests: GroupJoinRequestWithProfile[];
}

export function GroupHubClient({
  group,
  currentUser,
  currentUserRole,
  isMember,
  members,
  initialMessages,
  pendingRequests,
}: GroupHubClientProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [leavingOpen, setLeavingOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleJoin() {
    setJoining(true);
    setActionError(null);
    const result = await joinGroupAction(group.id);
    setJoining(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleLeave() {
    setLeaving(true);
    const result = await leaveGroupAction(group.id);
    setLeaving(false);
    setLeavingOpen(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      router.push("/groups");
    }
  }

  async function handleUpdateRole(userId: string, role: GroupMember["role"]) {
    await updateMemberRoleAction(group.id, userId, role);
    router.refresh();
  }

  async function handleRemoveMember(userId: string) {
    await removeMemberAction(group.id, userId);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Group info header */}
      <div className="flex flex-col gap-4">
        <GroupHeader
          group={group}
          memberCount={members.length}
          currentUserRole={currentUserRole}
          recentMembers={members.slice(0, 6)}
        />

        {/* Leave button — only visible to non-admin members */}
        {isMember && currentUserRole !== "admin" && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeavingOpen(true)}
            >
              <LogOut className="mr-2 size-4" />
              Leave Group
            </Button>
            {actionError && (
              <p className="text-sm text-destructive">{actionError}</p>
            )}
          </div>
        )}
        {!isMember && actionError && (
          <p className="text-sm text-destructive">{actionError}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            Members ({members.length})
            {pendingRequests.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>

        {/* Chat */}
        <TabsContent value="chat" className="mt-0">
          {group.conversation_id ? (
            <div className="h-[calc(100dvh-22rem)] min-h-80 rounded-lg border overflow-hidden">
              <ConversationView
                conversationId={group.conversation_id}
                currentUser={currentUser}
                isGroup
                groupName={group.name}
                groupSlug={group.slug}
                memberCount={members.length}
                participants={members}
                initialMessages={initialMessages}
                readOnlyFooter={
                  !isMember ? (
                    <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        Join this group to send messages
                      </p>
                      <Button
                        size="sm"
                        onClick={handleJoin}
                        disabled={joining}
                      >
                        {joining && (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Join Group
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border h-40 text-sm text-muted-foreground">
              Chat unavailable.
            </div>
          )}
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-4">
          {pendingRequests.length > 0 && (
            <JoinRequestsPanel
              requests={pendingRequests}
              onRefresh={() => router.refresh()}
            />
          )}
          <GroupMemberList
            members={members}
            currentUserId={currentUser.id}
            currentUserRole={currentUserRole}
            groupId={group.id}
            groupName={group.name}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
          />
        </TabsContent>

        {/* Notes placeholder */}
        <TabsContent value="notes" className="mt-4">
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
            <NotebookPen className="size-10 opacity-40" />
            <p className="font-medium">Shared notes coming soon</p>
            <p className="text-sm max-w-xs">
              Collaborate on notes with your group members. This feature is
              coming in a future update.
            </p>
          </div>
        </TabsContent>

        {/* Recordings placeholder */}
        <TabsContent value="recordings" className="mt-4">
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
            <Video className="size-10 opacity-40" />
            <p className="font-medium">Event recordings coming soon</p>
            <p className="text-sm max-w-xs">
              Watch recordings from group sessions and events. This feature is
              coming in a future update.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Leave confirmation dialog */}
      <AlertDialog open={leavingOpen} onOpenChange={setLeavingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {group.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <strong>{group.name}</strong>? You
              will lose access to the group chat and will need to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={leaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

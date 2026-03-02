"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen, Video, Loader2, LogOut, Settings, Archive } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { InviteMemberDialog } from "@/components/groups/InviteMemberDialog";
import {
  joinGroupAction,
  leaveGroupAction,
  updateMemberRoleAction,
  removeMemberAction,
  updateGroupSettingsAction,
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
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState(group.description ?? "");
  const [groupSlug, setGroupSlug] = useState(group.slug);
  const [isPrivate, setIsPrivate] = useState(group.is_private);
  const [isDiscoverable, setIsDiscoverable] = useState(group.is_discoverable);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

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
    setActionError(null);
    const result = await removeMemberAction(group.id, userId);
    if (result.error) {
      setActionError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleToggleDiscoverable(value: boolean) {
    setSavingSettings(true);
    setSettingsError(null);
    setIsDiscoverable(value);
    const result = await updateGroupSettingsAction(group.id, { is_discoverable: value });
    setSavingSettings(false);
    if (result.error) {
      setIsDiscoverable(!value);
      setSettingsError(result.error);
    }
  }

  async function handleSaveNameDescription() {
    setSavingSettings(true);
    setSettingsError(null);
    const result = await updateGroupSettingsAction(group.id, {
      name: groupName.trim() || group.name,
      description: groupDescription.trim() || null,
    });
    setSavingSettings(false);
    if (result.error) setSettingsError(result.error);
    else router.refresh();
  }

  async function handleSaveSlug() {
    setSavingSettings(true);
    setSettingsError(null);
    const result = await updateGroupSettingsAction(group.id, { slug: groupSlug.trim() || group.slug });
    setSavingSettings(false);
    if (result.error) {
      setSettingsError(result.error);
    } else if (result.newSlug) {
      router.push(`/groups/${result.newSlug}`);
    } else {
      router.refresh();
    }
  }

  async function handleTogglePrivate(value: boolean) {
    setSavingSettings(true);
    setSettingsError(null);
    setIsPrivate(value);
    if (value) setIsDiscoverable(true);
    const result = await updateGroupSettingsAction(group.id, { is_private: value, is_discoverable: value ? isDiscoverable : true });
    setSavingSettings(false);
    if (result.error) {
      setIsPrivate(!value);
      setSettingsError(result.error);
    } else router.refresh();
  }

  async function handleArchive() {
    setArchiving(true);
    setSettingsError(null);
    const result = await updateGroupSettingsAction(group.id, { archived: true });
    setArchiving(false);
    setArchiveOpen(false);
    if (result.error) setSettingsError(result.error);
    else router.push("/groups");
  }

  async function handleUnarchive() {
    setSavingSettings(true);
    setSettingsError(null);
    const result = await updateGroupSettingsAction(group.id, { archived: false });
    setSavingSettings(false);
    if (result.error) setSettingsError(result.error);
    else router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {group.archived && (
        <div className="rounded-lg border bg-muted/50 px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
          <Archive className="size-4 shrink-0" />
          <span>This group is archived. It’s hidden from the directory but members can still view it.</span>
        </div>
      )}

      {/* Group info header */}
      <div className="flex flex-col gap-4">
        <GroupHeader
          group={group}
          memberCount={members.length}
          currentUserRole={currentUserRole}
          recentMembers={members.slice(0, 6)}
        />

        {/* Leave button — visible to all members (last admin is blocked by the server) */}
        {isMember && (
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
          {currentUserRole === "admin" && (
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="size-3.5" />
              Settings
            </TabsTrigger>
          )}
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
        <TabsContent value="members" className="mt-4 space-y-4">
          {pendingRequests.length > 0 && (
            <JoinRequestsPanel
              requests={pendingRequests}
              onRefresh={() => router.refresh()}
            />
          )}

          {/* Invite button for admins */}
          {currentUserRole === "admin" && (
            <div className="flex justify-end">
              <InviteMemberDialog
                groupId={group.id}
                currentMemberIds={members.map((m) => m.id)}
                onInvited={() => router.refresh()}
              />
            </div>
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

        {/* Settings — admins only */}
        {currentUserRole === "admin" && (
          <TabsContent value="settings" className="mt-6">
            <div className="max-w-lg space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Group Settings</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rename, change visibility, or archive this group.
                </p>
              </div>

              {/* Group URL slug */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label htmlFor="group-slug" className="text-sm font-medium">Group URL</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">/groups/</span>
                  <Input
                    id="group-slug"
                    value={groupSlug}
                    onChange={(e) => setGroupSlug(e.target.value)}
                    placeholder="your-group-slug"
                    maxLength={60}
                    disabled={savingSettings}
                    className="max-w-xs font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only. Changing this updates the group link.
                </p>
                <Button size="sm" variant="secondary" onClick={handleSaveSlug} disabled={savingSettings}>
                  {savingSettings && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save URL
                </Button>
              </div>

              {/* Rename */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label htmlFor="group-name" className="text-sm font-medium">Group name</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  maxLength={50}
                  disabled={savingSettings}
                  className="max-w-sm"
                />
                <div>
                  <Label htmlFor="group-description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="group-description"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="What is this group about?"
                    rows={3}
                    maxLength={300}
                    disabled={savingSettings}
                    className="mt-1.5"
                  />
                </div>
                <Button size="sm" onClick={handleSaveNameDescription} disabled={savingSettings}>
                  {savingSettings && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save name & description
                </Button>
              </div>

              {/* Public / Private */}
              <div className="rounded-lg border p-4 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="private-toggle" className="text-sm font-medium">
                      Private group
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPrivate
                        ? "Only members and approved join requests can access."
                        : "Anyone in the community can find and join."}
                    </p>
                  </div>
                  <Switch
                    id="private-toggle"
                    checked={isPrivate}
                    onCheckedChange={handleTogglePrivate}
                    disabled={savingSettings}
                  />
                </div>
              </div>

              {isPrivate && (
                <div className="rounded-lg border p-4 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="discoverable-toggle" className="text-sm font-medium">
                        Discoverable
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isDiscoverable
                          ? "Appears in the groups directory; people can request to join."
                          : "Hidden from the directory; invite or direct link only."}
                      </p>
                    </div>
                    <Switch
                      id="discoverable-toggle"
                      checked={isDiscoverable}
                      onCheckedChange={handleToggleDiscoverable}
                      disabled={savingSettings}
                    />
                  </div>
                </div>
              )}

              {settingsError && (
                <p className="text-sm text-destructive">{settingsError}</p>
              )}

              {/* Archive */}
              <div className="rounded-lg border border-destructive/50 p-4 space-y-2">
                <p className="text-sm font-medium">Archive group</p>
                <p className="text-xs text-muted-foreground">
                  Archived groups are hidden from the directory. Members can still open the group and view chat; you can unarchive later from the group page.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className={group.archived ? undefined : "border-destructive/50 text-destructive hover:bg-destructive/10"}
                  onClick={() => (group.archived ? handleUnarchive() : setArchiveOpen(true))}
                  disabled={savingSettings}
                >
                  <Archive className="mr-2 size-4" />
                  {group.archived ? "Unarchive group" : "Archive group"}
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

      {/* Archive confirmation */}
      {currentUserRole === "admin" && (
        <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive {group.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This group will be hidden from the groups directory. Current members can still open it and view the chat. You can unarchive it later from Settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchive}
                disabled={archiving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {archiving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
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

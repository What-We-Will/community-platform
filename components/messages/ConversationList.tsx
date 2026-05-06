"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LiveStatusAvatar } from "@/components/shared/LiveStatusAvatar";
import { getAvatarColor } from "@/lib/utils/avatar";
import { formatRelativeTime } from "@/lib/utils/time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UsersRound, Archive, Video, BookMarked } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NewMessageDialog } from "./NewMessageDialog";
import type { ConversationWithDetails, Message } from "@/lib/types";

interface ConversationListProps {
  initialConversations: ConversationWithDetails[];
  currentUserId: string;
  selfNotesId: string;
}

export function ConversationList({
  initialConversations,
  currentUserId,
  selfNotesId,
}: ConversationListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] =
    useState<ConversationWithDetails[]>(initialConversations);
  const prevInitialIdsRef = useRef(
    initialConversations.map((c) => c.conversation.id).sort().join(",")
  );

  // Sync from server when initialConversations gains new conversations (e.g. after starting a new thread + refresh)
  useEffect(() => {
    const ids = initialConversations
      .map((c) => c.conversation.id)
      .sort()
      .join(",");
    if (prevInitialIdsRef.current !== ids) {
      prevInitialIdsRef.current = ids;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversations(initialConversations);
    }
  }, [initialConversations]);

  // Reset unread count when a conversation becomes active
  useEffect(() => {
    const match = pathname.match(/\/messages\/([^/]+)/);
    if (!match) return;
    const convId = match[1];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation.id === convId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, [pathname]);

  // Subscribe to new messages for real-time list updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("conversation-list")
      // When the current user is added to a new conversation (new DM or group),
      // refresh the server data so the thread appears in the sidebar immediately.
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;

          setConversations((prev) => {
            const idx = prev.findIndex(
              (c) => c.conversation.id === newMsg.conversation_id
            );

            if (idx === -1) {
              return prev;
            }

            const updated = [...prev];
            const conv = { ...updated[idx] };
            conv.lastMessage = newMsg;

            const isViewing = pathname === `/messages/${newMsg.conversation_id}`;
            if (newMsg.sender_id !== currentUserId && !isViewing) {
              conv.unreadCount = (conv.unreadCount ?? 0) + 1;
            }

            updated.splice(idx, 1);
            return [conv, ...updated];
          });

          // Unknown conversation — refresh from server as a fallback.
          // Must be outside the updater to avoid setState-during-render warning.
          if (!conversations.some((c) => c.conversation.id === newMsg.conversation_id)) {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, pathname, router]);

  async function handleArchive(e: React.MouseEvent, conversationId: string) {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    await supabase
      .from("conversation_participants")
      .update({ archived: true })
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUserId);
    setConversations((prev) => prev.filter((c) => c.conversation.id !== conversationId));
    if (pathname === `/messages/${conversationId}`) {
      router.push("/messages");
    }
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <h2 className="text-base font-semibold">Messages</h2>
        <NewMessageDialog />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {/* My Notes — always pinned at top */}
        {(() => {
          const isNotesActive = pathname === `/messages/${selfNotesId}`;
          const notesConv = conversations.find((c) => c.conversation.id === selfNotesId);
          const lastNoteMsg = notesConv?.lastMessage;
          return (
            <Link
              href={`/messages/${selfNotesId}`}
              className={cn(
                "flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent",
                isNotesActive && "bg-accent"
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookMarked className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">My Notes</p>
                  {lastNoteMsg && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatRelativeTime(lastNoteMsg.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {lastNoteMsg ? lastNoteMsg.content : "Save notes to yourself"}
                </p>
              </div>
            </Link>
          );
        })()}

        {conversations.filter((c) => c.conversation.id !== selfNotesId).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Message a member to get started.
            </p>
          </div>
        ) : (
          conversations.filter((c) => c.conversation.id !== selfNotesId).map(
            ({ conversation, participants, lastMessage, unreadCount, groupName }) => {
              const isActive = pathname === `/messages/${conversation.id}`;
              const hasUnread = unreadCount > 0;
              const isGroupConv = conversation.type === "group";

              const isPendingCall =
                lastMessage?.message_type === "video_invite" &&
                lastMessage.sender_id !== currentUserId;

              if (isGroupConv) {
                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "flex items-center gap-1 border-b px-4 py-3 transition-colors hover:bg-accent",
                      isActive && "bg-accent"
                    )}
                  >
                    <Link
                      href={`/messages/${conversation.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 py-0.5 -my-0.5 -mx-1 px-1 rounded-md hover:bg-transparent"
                    >
                      {/* Group icon avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full text-white text-sm font-semibold",
                            getAvatarColor(groupName ?? "Group")
                          )}
                        >
                          <UsersRound className="size-4" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p
                              className={cn(
                                "text-sm truncate",
                                hasUnread ? "font-semibold" : "font-medium"
                              )}
                            >
                              {groupName ?? "Group"}
                            </p>
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[10px] px-1.5 py-0 h-4"
                            >
                              Group
                            </Badge>
                          </div>
                          {lastMessage && (
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {formatRelativeTime(lastMessage.created_at)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p
                            className={cn(
                              "text-xs truncate",
                              hasUnread
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {lastMessage
                              ? lastMessage.message_type === "system"
                                ? lastMessage.content
                                : lastMessage.message_type === "video_invite"
                                  ? lastMessage.sender_id === currentUserId
                                    ? "You started a video call"
                                    : "Incoming video call"
                                  : `${lastMessage.sender_id === currentUserId ? "You: " : ""}${lastMessage.content}`
                              : "No messages yet"}
                          </p>
                          {isPendingCall ? (
                            <span className="shrink-0 flex items-center gap-1 rounded-full bg-green-500 text-white px-2 py-0.5 text-[10px] font-semibold animate-pulse">
                              <Video className="size-3" />
                              Incoming call
                            </span>
                          ) : hasUnread ? (
                            <Badge
                              variant="destructive"
                              className="shrink-0 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            onClick={(e) => handleArchive(e, conversation.id)}
                          >
                            <Archive className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Archive conversation</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              }

              // DM row
              const otherUser = participants[0];
              if (!otherUser) return null;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-1 border-b px-4 py-3 transition-colors hover:bg-accent",
                    isActive && "bg-accent"
                  )}
                >
                  <Link
                    href={`/messages/${conversation.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 py-0.5 -my-0.5 -mx-1 px-1 rounded-md hover:bg-transparent"
                  >
                    <LiveStatusAvatar
                      avatarUrl={otherUser.avatar_url ?? null}
                      displayName={otherUser.display_name}
                      size="md"
                      lastSeenAt={otherUser.last_seen_at}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm truncate",
                            hasUnread ? "font-semibold" : "font-medium"
                          )}
                        >
                          {otherUser.display_name}
                        </p>
                        {lastMessage && (
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {formatRelativeTime(lastMessage.created_at)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className={cn(
                            "text-xs truncate",
                            hasUnread
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {lastMessage
                            ? lastMessage.message_type === "system"
                              ? lastMessage.content
                              : lastMessage.message_type === "video_invite"
                                ? lastMessage.sender_id === currentUserId
                                  ? "You started a video call"
                                  : "Incoming video call"
                                : `${lastMessage.sender_id === currentUserId ? "You: " : ""}${lastMessage.content}`
                            : "No messages yet"}
                        </p>
                        {isPendingCall ? (
                          <span className="shrink-0 flex items-center gap-1 rounded-full bg-green-500 text-white px-2 py-0.5 text-[10px] font-semibold animate-pulse">
                            <Video className="size-3" />
                            Incoming call
                          </span>
                        ) : hasUnread ? (
                          <Badge
                            variant="destructive"
                            className="shrink-0 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          onClick={(e) => handleArchive(e, conversation.id)}
                        >
                          <Archive className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Archive conversation</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
}

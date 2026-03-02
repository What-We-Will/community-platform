"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { formatRelativeTime } from "@/lib/utils/time";
import { getOnlineStatus } from "@/lib/utils/status";
import { Badge } from "@/components/ui/badge";
import { NewMessageDialog } from "./NewMessageDialog";
import type { ConversationWithDetails, Message } from "@/lib/types";

interface ConversationListProps {
  initialConversations: ConversationWithDetails[];
  currentUserId: string;
}

function OnlineDot({ status }: { status: "online" | "away" | "offline" }) {
  if (status === "offline") return null;
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-background",
        status === "online" ? "bg-emerald-500" : "bg-amber-400"
      )}
    />
  );
}

export function ConversationList({
  initialConversations,
  currentUserId,
}: ConversationListProps) {
  const pathname = usePathname();
  const [conversations, setConversations] =
    useState<ConversationWithDetails[]>(initialConversations);

  // Reset unread count when a conversation becomes active
  useEffect(() => {
    const match = pathname.match(/\/messages\/([^/]+)/);
    if (!match) return;
    const convId = match[1];
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;

          setConversations((prev) => {
            const idx = prev.findIndex(
              (c) => c.conversation.id === newMsg.conversation_id
            );
            if (idx === -1) return prev;

            const updated = [...prev];
            const conv = { ...updated[idx] };
            conv.lastMessage = newMsg;

            // Increment unread if not ours and not currently viewing this conversation
            const isViewing =
              pathname === `/messages/${newMsg.conversation_id}`;
            if (newMsg.sender_id !== currentUserId && !isViewing) {
              conv.unreadCount = (conv.unreadCount ?? 0) + 1;
            }

            // Move to top
            updated.splice(idx, 1);
            return [conv, ...updated];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, pathname]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <h2 className="text-base font-semibold">Messages</h2>
        <NewMessageDialog />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Message a member to get started.
            </p>
          </div>
        ) : (
          conversations.map(
            ({ conversation, participants, lastMessage, unreadCount }) => {
              const otherUser = participants[0];
              if (!otherUser) return null;

              const isActive = pathname === `/messages/${conversation.id}`;
              const hasUnread = unreadCount > 0;
              const onlineStatus = getOnlineStatus(otherUser.last_seen_at);

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className={cn(
                    "flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent",
                    isActive && "bg-accent"
                  )}
                >
                  {/* Avatar + status dot */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full text-white text-sm font-semibold",
                        getAvatarColor(otherUser.display_name)
                      )}
                    >
                      {getInitials(otherUser.display_name)}
                    </div>
                    <OnlineDot status={onlineStatus} />
                  </div>

                  {/* Name + last message */}
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
                          ? `${lastMessage.sender_id === currentUserId ? "You: " : ""}${lastMessage.content}`
                          : "No messages yet"}
                      </p>
                      {hasUnread && (
                        <Badge
                          variant="destructive"
                          className="shrink-0 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            }
          )
        )}
      </div>
    </div>
  );
}

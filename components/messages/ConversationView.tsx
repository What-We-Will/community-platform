"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getAvatarColor } from "@/lib/utils/avatar";
import { getOnlineStatus } from "@/lib/utils/status";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Video, UsersRound, Archive, BookMarked } from "lucide-react";
import { getVideoRoomName } from "@/lib/utils/video";
import { VideoCallModal } from "@/components/video/VideoCallModal";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import type { MessageWithSender, Profile, Message } from "@/lib/types";

interface CurrentUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface ConversationViewProps {
  conversationId: string;
  currentUser: CurrentUser;
  initialMessages: MessageWithSender[];
  /** When set, open the video call modal immediately (e.g. from ?videoRoom= in URL) */
  initialVideoRoom?: string | null;
  // DM mode
  otherUser?: Profile;
  // Self-notes mode
  isSelfNotes?: boolean;
  // Group mode
  isGroup?: boolean;
  groupName?: string;
  groupSlug?: string;
  memberCount?: number;
  participants?: Profile[];
  // When set, replaces the message input with this node (e.g. a join CTA)
  readOnlyFooter?: React.ReactNode;
}

function buildSenderProfile(user: CurrentUser): Profile {
  return {
    id: user.id,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    resume_path: null,
    headline: null,
    bio: null,
    location: null,
    skills: [],
    open_to_referrals: false,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    timezone: "",
    is_onboarded: true,
    approval_status: "approved",
    role: "member",
    last_seen_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function ConversationView({
  conversationId,
  currentUser,
  initialMessages,
  initialVideoRoom,
  otherUser,
  isSelfNotes = false,
  isGroup = false,
  groupName,
  groupSlug,
  memberCount,
  participants = [],
  readOnlyFooter,
}: ConversationViewProps) {
  const supabase = createClient();
  const router = useRouter();

  // Build a lookup map from all known participants
  const participantMap = useRef(
    new Map<string, Profile>(participants.map((p) => [p.id, p]))
  );

  // Keep participant map in sync when prop changes
  useEffect(() => {
    participantMap.current = new Map(participants.map((p) => [p.id, p]));
    if (otherUser) participantMap.current.set(otherUser.id, otherUser);
    participantMap.current.set(currentUser.id, buildSenderProfile(currentUser));
  }, [participants, otherUser, currentUser]);

  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const pendingOptimisticIds = useRef(new Set<string>());
  const [inputValue, setInputValue] = useState("");
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [videoRoomName, setVideoRoomName] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  // Poll other user's last_seen_at so status stays current while in chat
  const [otherUserLastSeenAt, setOtherUserLastSeenAt] = useState<string | null>(
    otherUser?.last_seen_at ?? null
  );

  // Sync initial otherUser last_seen_at and poll for updates (DM only)
  useEffect(() => {
    setOtherUserLastSeenAt(otherUser?.last_seen_at ?? null);
  }, [otherUser?.id, otherUser?.last_seen_at]);

  useEffect(() => {
    if (!otherUser?.id) return;
    const fetchLastSeen = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("last_seen_at")
        .eq("id", otherUser.id)
        .maybeSingle();
      if (data?.last_seen_at) setOtherUserLastSeenAt(data.last_seen_at);
    };
    const interval = setInterval(fetchLastSeen, 30_000); // every 30s
    fetchLastSeen(); // run once immediately
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUser?.id]);

  // Open video modal when landing with ?videoRoom= (e.g. from "Join call" in list)
  useEffect(() => {
    if (initialVideoRoom) {
      setVideoRoomName(initialVideoRoom);
      setVideoCallOpen(true);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("videoRoom");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [initialVideoRoom]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isTrackingRef = useRef(false);
  const isInitialRender = useRef(true);

  // Scroll to bottom
  useEffect(() => {
    if (isInitialRender.current) {
      bottomRef.current?.scrollIntoView();
      isInitialRender.current = false;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, typingNames.length]);

  // Mark as read
  const markAsRead = useCallback(async () => {
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUser.id);
  }, [conversationId, currentUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Real-time message subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // Suppress Realtime INSERTs from the current user while any send is in-flight.
          // The optimistic entry uses a client-side UUID; the real DB id isn't known until
          // the API responds, so we can't do per-id dedup here. The isSending guard in
          // handleSend structurally limits pendingOptimisticIds to at most 1 entry per tab,
          // so the suppression window is bounded to a single sub-second API round-trip.
          // Multi-tab: a message sent from another tab during that window won't appear
          // here until the next page load — a stale read, not data loss.
          // If this log fires frequently, move to a replay-buffer approach.
          if (newMsg.sender_id === currentUser.id && pendingOptimisticIds.current.size > 0) {
            return;
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            let sender: Profile | null = null;
            if (newMsg.sender_id) {
              sender = participantMap.current.get(newMsg.sender_id) ?? null;
            }

            return [...prev, { ...newMsg, sender }];
          });

          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUser.id, markAsRead]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typing indicator via Realtime Presence
  useEffect(() => {
    const typingChannel = supabase.channel(`typing:${conversationId}`);
    typingChannelRef.current = typingChannel;

    typingChannel
      .on(
        "presence",
        { event: "sync" },
        () => {
          const state = typingChannel.presenceState<{
            user_id: string;
            display_name: string;
            typing: boolean;
          }>();
          const allPresences = Object.values(state).flat();
          const names = allPresences
            .filter((p) => p.user_id !== currentUser.id && p.typing)
            .map((p) => p.display_name);
          setTypingNames(names);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [conversationId, currentUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleInputChange(value: string) {
    setInputValue(value);
    if (sendError) setSendError(null);

    const channel = typingChannelRef.current;
    if (!channel) return;

    if (value.trim()) {
      channel.track({
        user_id: currentUser.id,
        display_name: currentUser.display_name,
        typing: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        channel.untrack();
        isTrackingRef.current = false;
      }, 2000);
      isTrackingRef.current = true;
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTrackingRef.current) {
        channel.untrack();
        isTrackingRef.current = false;
      }
    }
  }

  async function handleSend(content: string, file?: File) {
    if (!content && !file) return;
    if (isSending) return;

    const text = content.trim();
    setInputValue("");
    setSendError(null);
    setIsSending(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTrackingRef.current && typingChannelRef.current) {
      typingChannelRef.current.untrack();
      isTrackingRef.current = false;
    }

    let metadata: Record<string, unknown> = {};
    let messageType: "text" | "file" = "text";

    if (file) {
      const { uploadPrivateFile, validateFile } = await import("@/lib/storage");
      const allowed = [
        "image/png", "image/jpeg", "image/webp", "image/gif",
        "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain",
      ];
      const err = validateFile(file, { maxSizeMB: 25, allowedTypes: allowed });
      if (err) {
        setSendError(err);
        setIsSending(false);
        return;
      }
      const path = `${conversationId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const result = await uploadPrivateFile("attachments", path, file);
      if (result.error) {
        setSendError(result.error);
        setIsSending(false);
        return;
      }
      metadata = {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: result.path,
      };
      messageType = "file";
    }

    const optimisticId = crypto.randomUUID();
    const optimisticMsg: MessageWithSender = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: text,
      message_type: messageType,
      metadata,
      edited_at: null,
      created_at: new Date().toISOString(),
      sender: buildSenderProfile(currentUser),
    };
    pendingOptimisticIds.current.add(optimisticId);
    setMessages((prev) => [...prev, optimisticMsg]);

    // Use the API route so the server can fire email notifications to other participants
    let savedMsg: Message | null = null;
    let errorMsg: string | null = null;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: text,
          message_type: messageType,
          metadata,
        }),
      });
      if (res.ok) {
        savedMsg = (await res.json()) as Message;
      } else {
        const body = await res.json().catch(() => ({}));
        errorMsg = (body as { error?: string }).error ?? "Failed to send. Try again.";
      }
    } catch {
      errorMsg = "Failed to send. Try again.";
    }

    if (errorMsg || !savedMsg) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      pendingOptimisticIds.current.delete(optimisticId);
      setSendError(errorMsg ?? "Failed to send. Try again.");
    } else {
      const confirmed: MessageWithSender = { ...savedMsg, sender: optimisticMsg.sender };
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? confirmed : m))
      );
      pendingOptimisticIds.current.delete(optimisticId);
    }

    setIsSending(false);
  }

  async function handleArchive() {
    setIsArchiving(true);
    await supabase
      .from("conversation_participants")
      .update({ archived: true })
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUser.id);
    router.push("/messages");
    router.refresh();
  }

  async function handleVideoCallEnd() {
    setVideoCallOpen(false);
    setVideoRoomName(null);
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: null,
      content: "Video call ended",
      message_type: "system",
    });
    // Message will appear via Realtime subscription (avoids duplicate if we added optimistically)
  }

  async function handleStartVideoCall() {
    const type = isGroup ? "group" : "dm";
    const roomName = getVideoRoomName({ type, id: conversationId });
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: `${currentUser.display_name} started a video call`,
      message_type: "video_invite",
      metadata: {
        room_name: roomName,
        started_by: currentUser.display_name,
      },
    });
    if (error) return;
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: `${currentUser.display_name} started a video call`,
        message_type: "video_invite" as const,
        metadata: { room_name: roomName, started_by: currentUser.display_name },
        edited_at: null,
        created_at: new Date().toISOString(),
        sender: buildSenderProfile(currentUser),
      },
    ]);
    setVideoRoomName(roomName);
    setVideoCallOpen(true);
  }

  const videoCallTitle = isGroup
    ? `Video call — ${groupName ?? "Group"}`
    : `Video call with ${otherUser?.display_name ?? "Unknown"}`;

  // ── Header ──────────────────────────────────────────────────────────────────

  const renderHeader = () => {
    if (isSelfNotes) {
      return (
        <div className="flex items-center gap-3 border-b px-3 py-2.5 shrink-0 bg-background">
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="md:hidden -ml-1">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0 px-2 py-1">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookMarked className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">My Notes</p>
              <p className="text-xs text-muted-foreground">Only visible to you</p>
            </div>
          </div>
        </div>
      );
    }

    if (isGroup) {
      return (
        <div className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0 sticky top-0 z-30 bg-background">
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="md:hidden -ml-1">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>

          {groupSlug ? (
            <Link
              href={`/groups/${groupSlug}`}
              className="flex items-center gap-3 flex-1 min-w-0 group rounded-lg px-2 py-1 hover:bg-accent transition-colors"
            >
              <GroupAvatar name={groupName ?? "Group"} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate group-hover:underline">
                  {groupName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0 px-2 py-1">
              <GroupAvatar name={groupName ?? "Group"} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{groupName}</p>
                <p className="text-xs text-muted-foreground">
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {!readOnlyFooter && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleStartVideoCall}
                  >
                    <Video className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start video call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  <Archive className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Archive conversation</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    // DM header — use polled last_seen_at so status updates while in chat
    const onlineStatus = getOnlineStatus(otherUserLastSeenAt ?? otherUser?.last_seen_at ?? null);
    const statusLabel =
      onlineStatus === "online"
        ? "Online"
        : onlineStatus === "away"
          ? "Away"
          : "Offline";
    const statusColor =
      onlineStatus === "online"
        ? "text-emerald-500"
        : onlineStatus === "away"
          ? "text-amber-500"
          : "text-muted-foreground";

    return (
      <div className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0 sticky top-0 z-30 bg-background">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="md:hidden -ml-1">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>

        <Link
          href={`/members/${otherUser?.id}`}
          className="flex items-center gap-3 flex-1 min-w-0 group rounded-lg px-2 py-1 hover:bg-accent transition-colors"
        >
          <UserAvatar
            avatarUrl={otherUser?.avatar_url ?? null}
            displayName={otherUser?.display_name ?? "?"}
            size="md"
            showStatus
            status={onlineStatus}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate group-hover:underline">
              {otherUser?.display_name}
            </p>
            <p className={cn("text-xs", statusColor)}>{statusLabel}</p>
          </div>
        </Link>

        {!readOnlyFooter && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStartVideoCall}
                >
                  <Video className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start video call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleArchive}
                disabled={isArchiving}
              >
                <Archive className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive conversation</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const allowed = [
      "image/png", "image/jpeg", "image/webp", "image/gif",
      "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain",
    ];
    if (file.size > 25 * 1024 * 1024) return;
    if (!allowed.includes(file.type)) return;
    setPendingAttachment(file);
  }

  return (
    <div className="flex flex-col h-full relative">
      {renderHeader()}

      {/* Messages with drag-drop zone */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-primary/10 border-2 border-dashed border-primary">
            <p className="text-sm font-medium text-primary">Drop to upload file</p>
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              {isGroup
                ? "No messages yet — start the conversation! 💬"
                : "No messages yet — say hi! 👋"}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          // For system messages, always treat as a new block
          const showSenderInfo =
            msg.message_type === "system" || msg.message_type === "video_invite"
              ? false
              : !prevMsg ||
                prevMsg.sender_id !== msg.sender_id ||
                prevMsg.message_type === "system" ||
                prevMsg.message_type === "video_invite";

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUser.id}
              showSenderInfo={showSenderInfo}
              onJoinVideoCall={
                msg.message_type === "video_invite"
                  ? (roomName) => {
                      setVideoRoomName(roomName);
                      setVideoCallOpen(true);
                    }
                  : undefined
              }
            />
          );
        })}

        <TypingIndicator names={typingNames} />

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input or read-only footer */}
      {readOnlyFooter ?? (
        <>
          {sendError && (
            <p className="px-3 py-1.5 text-sm text-destructive bg-destructive/10 border-t">
              {sendError}
            </p>
          )}
          <MessageInput
            value={inputValue}
            onChange={handleInputChange}
            onSend={handleSend}
            disabled={isSending}
            attachment={pendingAttachment}
            onAttachmentChange={setPendingAttachment}
          />
        </>
      )}

      {videoRoomName && (
        <VideoCallModal
          roomName={videoRoomName}
          displayName={currentUser.display_name}
          title={videoCallTitle}
          isOpen={videoCallOpen}
          onClose={handleVideoCallEnd}
        />
      )}
    </div>
  );
}

function GroupAvatar({ name }: { name: string }) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold",
        getAvatarColor(name)
      )}
    >
      <UsersRound className="size-4" />
    </div>
  );
}

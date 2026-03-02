"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { getOnlineStatus } from "@/lib/utils/status";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Video } from "lucide-react";
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
  otherUser: Profile;
  initialMessages: MessageWithSender[];
}

function buildSenderProfile(user: CurrentUser): Profile {
  return {
    id: user.id,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
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
    role: "member",
    last_seen_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function ConversationView({
  conversationId,
  currentUser,
  otherUser,
  initialMessages,
}: ConversationViewProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );
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
  }, [messages.length, isOtherUserTyping]);

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

          setMessages((prev) => {
            // Deduplicate: skip if already in list (optimistic insert)
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            const sender: Profile | null =
              newMsg.sender_id === currentUser.id
                ? buildSenderProfile(currentUser)
                : newMsg.sender_id === otherUser.id
                  ? otherUser
                  : null;

            return [...prev, { ...newMsg, sender }];
          });

          // Mark as read since conversation is open
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUser.id, otherUser.id, markAsRead]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typing indicator with Realtime Presence
  useEffect(() => {
    const typingChannel = supabase.channel(`typing:${conversationId}`);
    typingChannelRef.current = typingChannel;

    typingChannel
      .on("presence", { event: "sync" }, () => {
        const state = typingChannel.presenceState<{
          user_id: string;
          typing: boolean;
        }>();
        const allPresences = Object.values(state).flat();
        setIsOtherUserTyping(
          allPresences.some((p) => p.user_id === otherUser.id && p.typing)
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [conversationId, otherUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Input change handler with typing presence tracking
  function handleInputChange(value: string) {
    setInputValue(value);

    const channel = typingChannelRef.current;
    if (!channel) return;

    if (value.trim()) {
      channel.track({ user_id: currentUser.id, typing: true });

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

  // Send message with optimistic UI
  async function handleSend() {
    const content = inputValue.trim();
    if (!content || isSending) return;

    setInputValue("");
    setIsSending(true);

    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTrackingRef.current && typingChannelRef.current) {
      typingChannelRef.current.untrack();
      isTrackingRef.current = false;
    }

    // Optimistic message
    const optimisticId = crypto.randomUUID();
    const optimisticMsg: MessageWithSender = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content,
      message_type: "text",
      metadata: {},
      edited_at: null,
      created_at: new Date().toISOString(),
      sender: buildSenderProfile(currentUser),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content,
        message_type: "text",
      })
      .select()
      .single();

    if (error) {
      // Revert optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } else {
      // Replace optimistic with real message (deduplicates Realtime callback)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId
            ? { ...data, sender: optimisticMsg.sender }
            : m
        )
      );
    }

    setIsSending(false);
  }

  const onlineStatus = getOnlineStatus(otherUser.last_seen_at);
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0 bg-background">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="md:hidden -ml-1">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>

        <Link
          href={`/members/${otherUser.id}`}
          className="flex items-center gap-3 flex-1 min-w-0 group rounded-lg px-2 py-1 hover:bg-accent transition-colors"
        >
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold",
              getAvatarColor(otherUser.display_name)
            )}
          >
            {getInitials(otherUser.display_name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate group-hover:underline">
              {otherUser.display_name}
            </p>
            <p className={cn("text-xs", statusColor)}>{statusLabel}</p>
          </div>
        </Link>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled>
                <Video className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              No messages yet — say hi! 👋
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          const showSenderInfo =
            !prevMsg || prevMsg.sender_id !== msg.sender_id;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUser.id}
              showSenderInfo={showSenderInfo}
            />
          );
        })}

        {isOtherUserTyping && (
          <TypingIndicator name={otherUser.display_name} />
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <MessageInput
        value={inputValue}
        onChange={handleInputChange}
        onSend={handleSend}
        disabled={isSending}
      />
    </div>
  );
}

import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { Button } from "@/components/ui/button";
import type { MessageWithSender } from "@/lib/types";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showSenderInfo: boolean;
  onJoinVideoCall?: (roomName: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showSenderInfo,
  onJoinVideoCall,
}: MessageBubbleProps) {
  // System messages: centered pill with muted text, no avatar
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  // Video invite: card with Join Call button
  if (message.message_type === "video_invite") {
    let meta = message.metadata;
    if (typeof meta === "string") {
      try {
        meta = JSON.parse(meta) as Record<string, unknown>;
      } catch {
        meta = {};
      }
    }
    const metadata = (meta ?? {}) as { room_name?: string; started_by?: string };
    const startedBy = metadata.started_by ?? message.sender?.display_name ?? "Someone";
    const roomName = metadata.room_name;

    return (
      <div className="flex justify-center py-2">
        <div className="rounded-lg border bg-muted/40 px-4 py-3 max-w-[85%] text-center">
          <p className="text-sm text-foreground mb-2">
            📹 <strong>{startedBy}</strong> started a video call
          </p>
          {roomName && onJoinVideoCall && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onJoinVideoCall(roomName)}
            >
              <Video className="size-4" />
              Join Call
            </Button>
          )}
        </div>
      </div>
    );
  }

  const senderName = message.sender?.display_name ?? "Unknown";

  return (
    <div
      className={cn(
        "flex gap-2 mb-0.5",
        isOwn ? "flex-row-reverse" : "flex-row",
        showSenderInfo && "mt-4"
      )}
    >
      {/* Avatar placeholder — keeps alignment for grouped messages */}
      {!isOwn && (
        <div className="w-7 shrink-0 self-end">
          {showSenderInfo && (
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-white text-xs font-semibold",
                getAvatarColor(senderName)
              )}
            >
              {getInitials(senderName)}
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {!isOwn && showSenderInfo && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">
            {senderName}
          </span>
        )}

        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm break-words leading-relaxed",
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {message.content}
        </div>

        {showSenderInfo && (
          <span className="text-[11px] text-muted-foreground mt-1 px-1">
            {formatRelativeTime(message.created_at)}
          </span>
        )}
      </div>
    </div>
  );
}

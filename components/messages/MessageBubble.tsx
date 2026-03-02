import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import type { MessageWithSender } from "@/lib/types";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showSenderInfo: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showSenderInfo,
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

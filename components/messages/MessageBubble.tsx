import { useState, useMemo, useEffect } from "react";
import { Video, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getSignedUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MessageWithSender } from "@/lib/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileMessageBubble({
  isOwn,
  showSenderInfo,
  senderName,
  senderAvatarUrl,
  content,
  createdAt,
  storagePath,
  fileName,
  fileSize,
  isImage,
}: {
  isOwn: boolean;
  showSenderInfo: boolean;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string;
  createdAt: string;
  storagePath?: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  isImage: boolean;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!storagePath) return;
    getSignedUrl("attachments", storagePath, 3600).then(setSignedUrl);
  }, [storagePath]);

  function handleOpenUrl() {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    } else if (storagePath) {
      getSignedUrl("attachments", storagePath, 3600).then((url) => {
        if (url) window.open(url, "_blank");
      });
    }
  }

  return (
    <div
      className={cn(
        "flex gap-2 mb-1",
        isOwn ? "flex-row-reverse" : "flex-row",
        showSenderInfo && "mt-3"
      )}
    >
      {!isOwn && (
        <div className="w-7 shrink-0 self-end">
          {showSenderInfo && (
            <UserAvatar
              avatarUrl={senderAvatarUrl}
              displayName={senderName}
              size="xs"
            />
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
          {isImage && signedUrl && !loadFailed ? (
            <button
              type="button"
              onClick={handleOpenUrl}
              className="block max-w-full rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={fileName}
                className="max-w-[280px] max-h-[280px] object-contain"
                onError={() => setLoadFailed(true)}
              />
            </button>
          ) : !isImage && storagePath ? (
            <div className="flex items-center gap-2">
              <FileText className="size-5 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-medium">{fileName}</p>
                {fileSize != null && (
                  <p className="text-xs opacity-80">{formatFileSize(fileSize)}</p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant={isOwn ? "secondary" : "outline"}
                className="shrink-0"
                onClick={handleOpenUrl}
              >
                Download
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground">Unable to load file</span>
          )}
          {content && (
            <p className={cn(isImage || !isImage ? "mt-2" : "", "whitespace-pre-wrap")}>
              {content}
            </p>
          )}
        </div>
        {showSenderInfo && (
          <span className="text-[11px] text-muted-foreground mt-1 px-1">
            {formatRelativeTime(createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showSenderInfo: boolean;
  currentUserId: string;
  currentUserDisplayName: string;
  onJoinVideoCall?: (roomName: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showSenderInfo,
  currentUserId,
  currentUserDisplayName,
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

  // File attachment message
  if (message.message_type === "file") {
    let meta = message.metadata;
    if (typeof meta === "string") {
      try {
        meta = JSON.parse(meta) as Record<string, unknown>;
      } catch {
        meta = {};
      }
    }
    const fileMeta = (meta ?? {}) as {
      file_name?: string;
      file_size?: number;
      file_type?: string;
      storage_path?: string;
    };
    const storagePath = fileMeta.storage_path;
    const fileName = fileMeta.file_name ?? "file";
    const fileSize = fileMeta.file_size;
    const fileType = fileMeta.file_type ?? "";
    const isImage = fileType.startsWith("image/");

    return (
      <>
        <FileMessageBubble
          isOwn={isOwn}
          showSenderInfo={showSenderInfo}
          senderName={message.sender?.display_name ?? "Unknown"}
          senderAvatarUrl={message.sender?.avatar_url ?? null}
          content={message.content}
          createdAt={message.created_at}
          storagePath={storagePath}
          fileName={fileName}
          fileSize={fileSize}
          fileType={fileType}
          isImage={isImage}
        />
        <MessageReactions
          message={message}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          isOwn={isOwn}
        />
      </>
    );
  }

  const senderName = message.sender?.display_name ?? "Unknown";

  return (
    <div
      className={cn(
        "flex gap-2 mb-1",
        isOwn ? "flex-row-reverse" : "flex-row",
        showSenderInfo && "mt-3"
      )}
    >
      {!isOwn && (
        <div className="w-7 shrink-0 self-end">
          {showSenderInfo && (
            <UserAvatar
              avatarUrl={message.sender?.avatar_url ?? null}
              displayName={senderName}
              size="xs"
            />
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

        <MessageReactions
          message={message}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          isOwn={isOwn}
        />

        {showSenderInfo && (
          <span className="text-[11px] text-muted-foreground mt-1 px-1">
            {formatRelativeTime(message.created_at)}
          </span>
        )}
      </div>
    </div>
  );
}

const emojiOptions = [
  "👍",
  "❤️",
  "😂",
  "🎉",
  "🤩",
  "🙌",
  "✨",
  "💬",
] as const;

function MessageReactions({
  message,
  currentUserId,
  currentUserDisplayName,
  isOwn,
}: {
  message: MessageWithSender;
  currentUserId: string;
  currentUserDisplayName: string;
  isOwn: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const initialCounts = useMemo(() => {
    const meta = message.metadata as Record<string, unknown> | null;
    const reactionData = meta?.reactions;
    if (reactionData && typeof reactionData === "object") {
      return Object.entries(reactionData).reduce<Record<string, number>>(
        (acc, [key, value]) => {
          if (typeof value === "number") acc[key] = value;
          return acc;
        },
        {}
      );
    }
    return {};
  }, [message.metadata]);

  const initialOwnerMap = useMemo(() => {
    const meta = message.metadata as Record<string, unknown> | null;
    const ownerData = meta?.reaction_owners;
    if (ownerData && typeof ownerData === "object") {
      return Object.entries(ownerData).reduce<Record<string, string[]>>(
        (acc, [key, value]) => {
          if (Array.isArray(value)) {
            acc[key] = value.filter((item) => typeof item === "string") as string[];
          }
          return acc;
        },
        {}
      );
    }
    return {};
  }, [message.metadata]);

  const initialUserReactions = useMemo(() => {
    const meta = message.metadata as Record<string, unknown> | null;
    const userReactions = meta?.user_reactions;
    if (Array.isArray(userReactions)) {
      return userReactions.filter((item) => typeof item === "string") as string[];
    }
    return [];
  }, [message.metadata]);

  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(initialCounts);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(initialUserReactions);
  const [reactionOwners, setReactionOwners] = useState<Record<string, string[]>>(initialOwnerMap);

  const reactionEntries = useMemo(
    () =>
      Object.entries(reactionCounts).sort((a, b) => {
        if (a[1] !== b[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      }),
    [reactionCounts]
  );

  function handleToggleMenu() {
    setMenuOpen((open) => !open);
  }

  function handleSelectEmoji(emoji: string) {
    if (selectedEmojis.includes(emoji)) {
      setMenuOpen(false);
      return;
    }

    setSelectedEmojis((prev) => [...prev, emoji]);
    setReactionCounts((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] ?? 0) + 1,
    }));
    setReactionOwners((prev) => ({
      ...prev,
      [emoji]: [...new Set([...(prev[emoji] ?? []), currentUserDisplayName])],
    }));
    setMenuOpen(false);
  }

  if (message.message_type === "system" || message.message_type === "video_invite") {
    return null;
  }

  return (
    <div className="mt-0.5 mb-3 flex flex-wrap items-center gap-2">
      {reactionEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {reactionEntries.map(([emoji, count]) => {
            const isSelected = selectedEmojis.includes(emoji);
            const owners = reactionOwners[emoji] ?? [];
            const ownerList = owners.length > 5 ? `${owners.slice(0, 5).join(", ")}…` : owners.join(", ");
            const label =
              owners.length > 0
                ? ownerList
                : `${count} people reacted with ${emoji}`;
            return (
              <TooltipProvider key={emoji}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs cursor-default select-none",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-muted/20 text-foreground"
                      )}
                    >
                      <span>{emoji}</span>
                      {count > 1 && (
                        <span className="text-[11px] text-muted-foreground">{count}</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={handleToggleMenu}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{ filter: "grayscale(1)" }}
          aria-expanded={menuOpen}
          aria-label="Open reaction selector"
        >
          <span aria-hidden="true">😊+</span>
        </button>

        {menuOpen && (
          <div className={cn(
            "absolute z-20 grid w-max grid-cols-4 gap-2 rounded-2xl border bg-popover p-3 text-sm shadow-lg",
            isOwn ? "bottom-full right-0 left-auto mb-2" : "top-full left-0 mt-2"
          )}>
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectEmoji(emoji)}
                className={cn(
                  "rounded-2xl px-2.5 py-2 text-lg transition hover:bg-accent/80",
                  selectedEmojis.includes(emoji) && "opacity-50"
                )}
                disabled={selectedEmojis.includes(emoji)}
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

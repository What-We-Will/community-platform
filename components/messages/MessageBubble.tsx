import { useState, useEffect } from "react";
import { Video, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getSignedUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
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
        "flex gap-2 mb-0.5",
        isOwn ? "flex-row-reverse" : "flex-row",
        showSenderInfo && "mt-4"
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
              {/* eslint-disable-next-line @next/next/no-img-element -- dimensions unknown at render time; next/image requires explicit width/height */}
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
        isImage={isImage}
      />
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

        {showSenderInfo && (
          <span className="text-[11px] text-muted-foreground mt-1 px-1">
            {formatRelativeTime(message.created_at)}
          </span>
        )}
      </div>
    </div>
  );
}

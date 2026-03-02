"use client";

import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { OnlineStatus } from "@/lib/utils/status";

const SIZE_CLASSES = {
  xs: "size-7",
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
  xl: "size-20",
} as const;

function avatarImageUrl(avatarUrl: string | null, size: keyof typeof SIZE_CLASSES): string | null {
  if (!avatarUrl) return null;
  if (size === "xs" || size === "sm" || size === "md") {
    const sep = avatarUrl.includes("?") ? "&" : "?";
    return `${avatarUrl}${sep}width=80&height=80`;
  }
  return avatarUrl;
}

interface UserAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  status?: OnlineStatus;
  className?: string;
}

export function UserAvatar({
  avatarUrl,
  displayName,
  size = "md",
  showStatus = false,
  status,
  className,
}: UserAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const initials = getInitials(displayName);
  const colorClass = getAvatarColor(displayName);
  const src = avatarImageUrl(avatarUrl, size);

  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={cn(sizeClass, colorClass)}>
        {src && <AvatarImage src={src} alt={displayName} />}
        <AvatarFallback className={cn("text-white", colorClass)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showStatus && status && status !== "offline" && (
        <span
          className={cn(
            "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-background",
            status === "online" ? "bg-emerald-500" : "bg-amber-400"
          )}
          title={status === "online" ? "Online" : "Away"}
        />
      )}
    </div>
  );
}

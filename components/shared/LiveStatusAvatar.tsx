"use client";

import { useState, useEffect } from "react";
import { getOnlineStatus } from "@/lib/utils/status";
import { subscribeToStatusClock } from "@/lib/utils/status-clock";
import { UserAvatar } from "./UserAvatar";
import type { ComponentProps } from "react";

type UserAvatarProps = ComponentProps<typeof UserAvatar>;

interface LiveStatusAvatarProps extends Omit<UserAvatarProps, "status" | "showStatus"> {
  lastSeenAt: string | null;
  isCurrentUser?: boolean;
}

export function LiveStatusAvatar({
  lastSeenAt,
  isCurrentUser,
  ...avatarProps
}: LiveStatusAvatarProps) {
  const [status, setStatus] = useState(() =>
    getOnlineStatus(lastSeenAt, { isCurrentUser })
  );

  useEffect(() => {
    setStatus(getOnlineStatus(lastSeenAt, { isCurrentUser }));
    return subscribeToStatusClock(() => {
      setStatus(getOnlineStatus(lastSeenAt, { isCurrentUser }));
    });
  }, [lastSeenAt, isCurrentUser]);

  return <UserAvatar {...avatarProps} showStatus status={status} />;
}

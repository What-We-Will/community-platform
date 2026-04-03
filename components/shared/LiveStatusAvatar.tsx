"use client";

import { useState, useEffect } from "react";
import { getOnlineStatus } from "@/lib/utils/status";
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(getOnlineStatus(lastSeenAt, { isCurrentUser }));
    const id = setInterval(() => {
      setStatus(getOnlineStatus(lastSeenAt, { isCurrentUser }));
    }, 60_000);
    return () => clearInterval(id);
  }, [lastSeenAt, isCurrentUser]);

  return <UserAvatar {...avatarProps} showStatus status={status} />;
}

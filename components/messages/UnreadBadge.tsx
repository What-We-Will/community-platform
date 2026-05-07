"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UnreadBadgeProps {
  initialCount: number;
  userId: string;
}

export function UnreadBadge({ initialCount, userId }: UnreadBadgeProps) {
  const [count, setCount] = useState(initialCount);
  const pathname = usePathname();

  async function fetchUnreadCount() {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_total_unread_count");
    setCount(Number(data ?? 0));
  }

  // Re-fetch whenever the user navigates (catches mark-as-read from conversation pages)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnreadCount();
  }, [pathname]);  

  // Subscribe to new messages for live increment
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`unread-badge-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        fetchUnreadCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);  

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

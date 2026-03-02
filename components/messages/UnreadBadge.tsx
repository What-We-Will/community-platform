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

    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);

    if (!participations || participations.length === 0) {
      setCount(0);
      return;
    }

    const counts = await Promise.all(
      participations.map(async (p) => {
        const { count: c } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", p.conversation_id)
          .neq("sender_id", userId)
          .gt("created_at", p.last_read_at);
        return c ?? 0;
      })
    );

    setCount(counts.reduce((sum, c) => sum + c, 0));
  }

  // Re-fetch whenever the user navigates (catches mark-as-read from conversation pages)
  useEffect(() => {
    fetchUnreadCount();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

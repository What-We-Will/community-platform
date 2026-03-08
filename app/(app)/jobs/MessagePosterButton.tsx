"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { messageJobPoster } from "./actions";

interface Props {
  posterId: string;
  posterName: string;
  /** Renders as a small icon-only button for inline use next to the poster name */
  compact?: boolean;
}

export function MessagePosterButton({ posterId, posterName, compact = false }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await messageJobPoster(posterId);
    setLoading(false);
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        title={`Message ${posterName} about a referral`}
        className="flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <MessageCircle className="size-3" />
        )}
        Message
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
      onClick={handleClick}
      disabled={loading}
      title={`Message ${posterName} about a referral`}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <MessageCircle className="size-3.5" />
      )}
      Ask for Referral
    </Button>
  );
}

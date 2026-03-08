"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { messageJobPoster } from "./actions";

export function MessagePosterButton({ posterId, posterName }: { posterId: string; posterName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await messageJobPoster(posterId);
    // redirect happens server-side; if it fails the loading state will reset
    setLoading(false);
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

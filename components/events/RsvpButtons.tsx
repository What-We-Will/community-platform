"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, X } from "lucide-react";
import { updateRsvp } from "@/app/(app)/events/actions";
import type { EventRsvp } from "@/lib/types";

type RsvpStatus = "going" | "maybe" | "declined";

interface RsvpButtonsProps {
  eventId: string;
  currentUserRsvp: EventRsvp | null;
  rsvpCounts: { going: number; maybe: number; declined: number };
  maxAttendees: number | null;
  onRsvpChange?: (status: RsvpStatus | null, counts: { going: number; maybe: number; declined: number }) => void;
}

export function RsvpButtons({
  eventId,
  currentUserRsvp,
  rsvpCounts,
  maxAttendees,
  onRsvpChange,
}: RsvpButtonsProps) {
  const [status, setStatus] = useState<RsvpStatus | null>(
    currentUserRsvp?.status ?? null
  );
  const [counts, setCounts] = useState(rsvpCounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFull = maxAttendees != null && counts.going >= maxAttendees;
  const canRsvpGoing = !isFull || status === "going";

  async function handleClick(newStatus: RsvpStatus) {
    if (loading) return;
    if (newStatus === "going" && !canRsvpGoing) return;

    const previousStatus = status;
    const previousCounts = { ...counts };

    setError(null);

    if (previousStatus === newStatus) {
      setStatus(null);
      const nextCounts = { ...counts };
      if (newStatus === "going") nextCounts.going = Math.max(0, nextCounts.going - 1);
      else if (newStatus === "maybe") nextCounts.maybe = Math.max(0, nextCounts.maybe - 1);
      else if (newStatus === "declined") nextCounts.declined = Math.max(0, nextCounts.declined - 1);
      setCounts(nextCounts);
      onRsvpChange?.(null, nextCounts);
    } else {
      setStatus(newStatus);
      const nextCounts = { ...counts };
      if (previousStatus === "going") nextCounts.going = Math.max(0, nextCounts.going - 1);
      else if (previousStatus === "maybe") nextCounts.maybe = Math.max(0, nextCounts.maybe - 1);
      else if (previousStatus === "declined") nextCounts.declined = Math.max(0, nextCounts.declined - 1);
      if (newStatus === "going") nextCounts.going += 1;
      else if (newStatus === "maybe") nextCounts.maybe += 1;
      else if (newStatus === "declined") nextCounts.declined += 1;
      setCounts(nextCounts);
      onRsvpChange?.(newStatus, nextCounts);
    }

    setLoading(true);
    try {
      await updateRsvp(eventId, newStatus);
    } catch (e) {
      setStatus(previousStatus);
      setCounts(previousCounts);
      setError(e instanceof Error ? e.message : "Failed to update RSVP");
      onRsvpChange?.(previousStatus, previousCounts);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={status === "going" ? "default" : "outline"}
          size="sm"
          onClick={() => handleClick("going")}
          disabled={loading || !canRsvpGoing}
          className="gap-1.5"
        >
          <Check className="size-4" />
          Going
        </Button>
        <Button
          variant={status === "maybe" ? "default" : "outline"}
          size="sm"
          onClick={() => handleClick("maybe")}
          disabled={loading}
          className="gap-1.5"
        >
          <HelpCircle className="size-4" />
          Maybe
        </Button>
        <Button
          variant={status === "declined" ? "default" : "outline"}
          size="sm"
          onClick={() => handleClick("declined")}
          disabled={loading}
          className="gap-1.5"
        >
          <X className="size-4" />
          Can&apos;t Make It
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {counts.going} going · {counts.maybe} maybe
      </p>
      {isFull && status !== "going" && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          This event is full
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

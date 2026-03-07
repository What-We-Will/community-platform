"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Check, HelpCircle, X, Users, Video, Repeat2 } from "lucide-react";
import { eventTypeConfig } from "@/lib/utils/events";
import { updateRsvp } from "@/app/(app)/events/actions";
import type { EventRsvp } from "@/lib/types";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    host_id: string | null;
    group_id: string | null;
    location: string | null;
    video_room_name: string | null;
    starts_at: string;
    ends_at: string;
    max_attendees: number | null;
    created_at: string;
    updated_at: string;
    recurrence_rule?: string | null;
    parent_event_id?: string | null;
    host: { id: string; display_name: string; avatar_url: string | null } | null;
  };
  rsvpCounts: { going: number; maybe: number; declined: number };
  currentUserRsvp: EventRsvp | null;
  currentUserId: string;
}

const JITSI_BASE = "https://meet.jit.si";

export function EventCard({
  event,
  rsvpCounts,
  currentUserRsvp,
}: EventCardProps) {
  const [status, setStatus] = useState<"going" | "maybe" | "declined" | null>(
    currentUserRsvp?.status ?? null
  );
  const [counts, setCounts] = useState(rsvpCounts);
  const [loading, setLoading] = useState(false);

  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);
  const now = new Date();
  const isLive = startsAt <= now && now <= endsAt;
  const isPast = endsAt < now;
  const minsToStart = Math.round((startsAt.getTime() - now.getTime()) / 60000);
  const startingSoon = !isLive && !isPast && minsToStart >= 0 && minsToStart <= 15;

  const typeConfig = eventTypeConfig[event.event_type] ?? eventTypeConfig.other;
  const maxAttendees = event.max_attendees;
  const isFull = maxAttendees != null && counts.going >= maxAttendees;
  const canRsvpGoing = !isFull || status === "going";

  async function handleRsvp(newStatus: "going" | "maybe" | "declined") {
    if (loading) return;
    if (newStatus === "going" && !canRsvpGoing) return;

    const prev = status;
    const prevCounts = { ...counts };

    if (prev === newStatus) {
      setStatus(null);
      const next = { ...counts };
      if (newStatus === "going") next.going = Math.max(0, next.going - 1);
      else if (newStatus === "maybe") next.maybe = Math.max(0, next.maybe - 1);
      else next.declined = Math.max(0, next.declined - 1);
      setCounts(next);
    } else {
      setStatus(newStatus);
      const next = { ...counts };
      if (prev === "going") next.going = Math.max(0, next.going - 1);
      else if (prev === "maybe") next.maybe = Math.max(0, next.maybe - 1);
      else if (prev === "declined") next.declined = Math.max(0, next.declined - 1);
      if (newStatus === "going") next.going += 1;
      else if (newStatus === "maybe") next.maybe += 1;
      else next.declined += 1;
      setCounts(next);
    }

    setLoading(true);
    try {
      await updateRsvp(event.id, newStatus);
    } catch {
      setStatus(prev);
      setCounts(prevCounts);
    } finally {
      setLoading(false);
    }
  }

  const videoUrl = event.video_room_name
    ? `${JITSI_BASE}/${event.video_room_name}`
    : null;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-[10px] border ${typeConfig.color}`}
              >
                {typeConfig.label}
              </Badge>
              {(event.recurrence_rule || event.parent_event_id) && (
                <Badge variant="secondary" className="text-[10px] border gap-0.5 text-muted-foreground">
                  <Repeat2 className="size-2.5" />
                  {event.recurrence_rule === "daily" ? "Weekdays" : "Weekly"}
                </Badge>
              )}
            </div>
            <Link
              href={`/events/${event.id}`}
              className="font-semibold text-foreground hover:underline line-clamp-1"
            >
              {event.title}
            </Link>
          </div>
          {isLive && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              Live
            </div>
          )}
          {startingSoon && !isLive && (
            <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              Starting in {minsToStart} min
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isLive ? (
            "Happening now"
          ) : (
            <>
              {format(startsAt, "EEE, MMM d")} · {format(startsAt, "h:mm a")} –{" "}
              {format(endsAt, "h:mm a")}
            </>
          )}
        </p>

        {event.host && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Hosted by</span>
            <UserAvatar
              avatarUrl={event.host.avatar_url}
              displayName={event.host.display_name}
              size="sm"
            />
            <span>{event.host.display_name}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {counts.going} going · {counts.maybe} maybe
          {maxAttendees != null && (
            <>
              {" "}
              · {counts.going} / {maxAttendees} spots
              {isFull && (
                <Badge variant="destructive" className="ml-1 text-[10px]">
                  Full
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={status === "going" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("going")}
            disabled={loading || !canRsvpGoing}
            className="gap-1"
          >
            <Check className="size-3.5" />
            Going
          </Button>
          <Button
            variant={status === "maybe" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("maybe")}
            disabled={loading}
            className="gap-1"
          >
            <HelpCircle className="size-3.5" />
            Maybe
          </Button>
          <Button
            variant={status === "declined" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("declined")}
            disabled={loading}
            className="gap-1"
          >
            <X className="size-3.5" />
            Can&apos;t go
          </Button>
        </div>

        {isLive && videoUrl && (
          <Button asChild size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700">
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <Video className="size-4" />
              Join Call
            </a>
          </Button>
        )}
        {startingSoon && videoUrl && (
          <Button asChild size="sm" variant="secondary" className="gap-1.5">
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <Video className="size-4" />
              Join Video Call
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

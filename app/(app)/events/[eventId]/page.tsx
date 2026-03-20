import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatInTimeZone } from "@/lib/utils/timezone";
import {
  ArrowLeft,
  Video,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { RsvpButtons } from "@/components/events/RsvpButtons";
import { AttendeesList } from "@/components/events/AttendeesList";
import { fetchEventWithDetails } from "@/lib/events";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { eventTypeConfig } from "@/lib/utils/events";
import type { Profile, EventRsvp } from "@/lib/types";

const JITSI_BASE = "https://meet.jit.si";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const viewerTimezone = viewerProfile?.timezone ?? "America/Chicago";

  const eventData = await fetchEventWithDetails(eventId, user.id);
  if (!eventData) notFound();

  const event = eventData as {
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
    host: Profile | null;
    group: unknown;
    rsvpCounts: { going: number; maybe: number; declined: number };
    currentUserRsvp: EventRsvp | null;
    isLive: boolean;
    isPast: boolean;
  };

  const { data: attendees } = await supabase
    .from("event_rsvps")
    .select("*, profile:profiles!user_id(*)")
    .eq("event_id", eventId)
    .in("status", ["going", "maybe"])
    .order("created_at", { ascending: true });

  const startsAt = new Date(event.starts_at);
  const now = new Date();
  const minsToStart = Math.round((startsAt.getTime() - now.getTime()) / 60000);
  const startingSoon =
    !event.isLive && !event.isPast && minsToStart >= 0 && minsToStart <= 15;

  const typeConfig =
    eventTypeConfig[event.event_type] ?? eventTypeConfig.other;
  const videoUrl = event.video_room_name
    ? `${JITSI_BASE}/${event.video_room_name}`
    : null;

  const attendeeRows = (attendees ?? []).map((a) => ({
    user_id: (a as { user_id: string }).user_id,
    status: (a as { status: string }).status,
    profile: (a as { profile: Profile | null }).profile,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Events
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${typeConfig.color}`}
          >
            {typeConfig.label}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {event.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4 shrink-0" />
              {formatInTimeZone(event.starts_at, viewerTimezone, "EEEE, MMMM d, yyyy")} ·{" "}
              {formatInTimeZone(event.starts_at, viewerTimezone, "h:mm a")} –{" "}
              {formatInTimeZone(event.ends_at, viewerTimezone, "h:mm a")}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" />
                {event.location}
              </span>
            )}
          </div>

          {event.host && (
            <Link
              href={`/members/${event.host.id}`}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <UserAvatar
                avatarUrl={event.host.avatar_url}
                displayName={event.host.display_name}
                size="md"
              />
              <span>{event.host.display_name}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                Host
              </span>
            </Link>
          )}

          {event.host_id === user.id && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/events/${eventId}/edit`}>Edit Event</Link>
              </Button>
              <DeleteEventButton eventId={eventId} eventTitle={event.title} />
            </div>
          )}
        </div>
      </div>

      {event.description && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {event.description}
          </p>
        </section>
      )}

      {/* Video / Join section */}
      <Card
        className={
          event.isLive
            ? "border-green-500/50 bg-green-500/10"
            : startingSoon
              ? "border-amber-500/50 bg-amber-500/10"
              : "bg-muted/50"
        }
      >
        <CardContent className="pt-6">
          {event.isLive && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-red-500" />
                </span>
                <span className="font-medium">This event is live</span>
              </div>
              {videoUrl && (
                <Button asChild size="lg" className="gap-2 bg-green-600 hover:bg-green-700 w-fit">
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <Video className="size-5" />
                    Join Video Call
                  </a>
                </Button>
              )}
            </div>
          )}
          {startingSoon && !event.isLive && (
            <div className="flex flex-col gap-3">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Starting in {minsToStart} minutes
              </p>
              {videoUrl && (
                <Button asChild size="lg" variant="secondary" className="gap-2 w-fit">
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <Video className="size-5" />
                    Join Video Call
                  </a>
                </Button>
              )}
            </div>
          )}
          {!event.isLive && !startingSoon && !event.isPast && (
            <p className="text-sm text-muted-foreground">
              Video call will be available when the event starts
            </p>
          )}
          {event.isPast && (
            <p className="text-sm text-muted-foreground">
              This event has ended
            </p>
          )}
        </CardContent>
      </Card>

      {/* RSVP */}
      <section>
        <h2 className="mb-2 text-sm font-semibold">RSVP</h2>
        <RsvpButtons
          eventId={eventId}
          currentUserRsvp={event.currentUserRsvp}
          rsvpCounts={event.rsvpCounts}
          maxAttendees={event.max_attendees}
        />
      </section>

      {/* Attendees */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">
          Who&apos;s Going ({event.rsvpCounts.going})
        </h2>
        {event.rsvpCounts.going === 0 && event.rsvpCounts.maybe === 0 ? (
          <p className="text-sm text-muted-foreground">
            Be the first to RSVP!
          </p>
        ) : (
          <>
            <AttendeesList
              attendees={attendeeRows}
              statusFilter="going"
              title="Going"
            />
            <AttendeesList
              attendees={attendeeRows}
              statusFilter="maybe"
              title="Maybe"
            />
          </>
        )}
      </section>
    </div>
  );
}

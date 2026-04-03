import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatInTimeZone, getTimeZoneAbbreviation } from "@/lib/utils/timezone";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { fetchUpcomingEvents } from "@/lib/events";

export async function UpcomingEventsCard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [events, viewerProfileResult] = await Promise.all([
    fetchUpcomingEvents({ groupId: null, limit: 5 }).catch(() => []),
    user
      ? supabase.from("profiles").select("timezone").eq("id", user.id).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const now = new Date();
  const viewerTimezone = viewerProfileResult.data?.timezone ?? "America/Chicago";

  const goingByEventId: Record<string, number> = {};
  if (events.length > 0) {
    const eventIds = events.map((e) => (e as { id: string }).id);
    const { data: rsvps } = await supabase
      .from("event_rsvps")
      .select("event_id")
      .in("event_id", eventIds)
      .eq("status", "going");
    for (const r of rsvps ?? []) {
      const eid = (r as { event_id: string }).event_id;
      goingByEventId[eid] = (goingByEventId[eid] ?? 0) + 1;
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="size-4" />
          Upcoming Events
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/events/create" className="gap-1">
            <Plus className="size-4" />
            Create
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No upcoming events. Create one to get the community together!
            </p>
            <Button variant="secondary" size="sm" className="mt-2" asChild>
              <Link href="/events/create">Create Event</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => {
              const e = event as {
                id: string;
                title: string;
                starts_at: string;
                video_room_name: string | null;
                event_type: string;
                timezone: string;
              };
              const startsAt = new Date(e.starts_at);
              const isLive =
                startsAt <= now &&
                now <= new Date((event as { ends_at: string }).ends_at);
              const dotClass =
                isLive
                  ? "bg-red-500"
                  : {
                      skillshare: "bg-blue-500",
                      workshop: "bg-purple-500",
                      ama: "bg-green-500",
                      mock_interview: "bg-orange-500",
                      social: "bg-pink-500",
                      other: "bg-gray-500",
                    }[e.event_type] ?? "bg-gray-500";
              const goingCount = goingByEventId[e.id] ?? 0;

              return (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    className="flex items-start gap-2 rounded-lg p-2 -mx-2 hover:bg-accent/50 transition-colors"
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${dotClass} ${isLive ? "animate-pulse" : ""}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium whitespace-normal break-words">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatInTimeZone(e.starts_at, e.timezone || viewerTimezone, "MMM d")} ·{" "}
                        {formatInTimeZone(e.starts_at, e.timezone || viewerTimezone, "h:mm a")}{" "}
                        {getTimeZoneAbbreviation(e.starts_at, e.timezone || viewerTimezone)}
                        {goingCount > 0 && ` · ${goingCount} going`}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {events.length > 0 && (
        <CardFooter className="pt-0">
          <Link
            href="/events"
            className="text-sm text-primary hover:underline"
          >
            View all events →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

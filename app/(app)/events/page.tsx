import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  isToday,
  isSameDay,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCard } from "@/components/events/EventCard";
import { EventsCalendarClient } from "@/components/events/EventsCalendarClient";
import { fetchUpcomingEvents, fetchPastEvents } from "@/lib/events";
import type { Profile } from "@/lib/types";

type EventRow = {
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
  host: Profile | null;
};

type SectionKey = "today" | "tomorrow" | "thisWeek" | "nextWeek" | "later";

function getSection(startsAt: Date): SectionKey {
  const now = new Date();
  const dayStart = startOfDay(now);
  const tomorrow = addDays(dayStart, 1);
  const thisWeekEnd = endOfWeek(now);
  const nextWeekStart = startOfWeek(addWeeks(now, 1));
  const nextWeekEnd = endOfWeek(addWeeks(now, 1));

  if (isToday(startsAt)) return "today";
  if (isSameDay(startsAt, tomorrow)) return "tomorrow";
  if (isWithinInterval(startsAt, { start: dayStart, end: thisWeekEnd }))
    return "thisWeek";
  if (isWithinInterval(startsAt, { start: nextWeekStart, end: nextWeekEnd }))
    return "nextWeek";
  return "later";
}

const SECTION_ORDER: SectionKey[] = [
  "today",
  "tomorrow",
  "thisWeek",
  "nextWeek",
  "later",
];
const SECTION_LABELS: Record<SectionKey, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  thisWeek: "This Week",
  nextWeek: "Next Week",
  later: "Later",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; type?: string }>;
}) {
  const params = await searchParams;
  const view = params.view ?? "list";
  const typeParam = params.type ?? "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [upcomingRaw, pastRaw] = await Promise.all([
    fetchUpcomingEvents({ groupId: null, type: typeParam }),
    fetchPastEvents({ limit: 10 }),
  ]);

  const upcoming = upcomingRaw as EventRow[];
  const past = pastRaw as EventRow[];

  const eventIds = upcoming.map((e) => e.id);
  const rsvpCountsMap: Record<
    string,
    { going: number; maybe: number; declined: number }
  > = {};
  const userRsvpMap: Record<string, { status: string }> = {};

  if (eventIds.length > 0) {
    const { data: rsvps } = await supabase
      .from("event_rsvps")
      .select("event_id, user_id, status")
      .in("event_id", eventIds);

    for (const eid of eventIds) {
      rsvpCountsMap[eid] = { going: 0, maybe: 0, declined: 0 };
    }
    for (const r of rsvps ?? []) {
      const row = r as { event_id: string; user_id: string; status: string };
      if (!rsvpCountsMap[row.event_id]) continue;
      rsvpCountsMap[row.event_id][row.status as "going" | "maybe" | "declined"]++;
      if (row.user_id === user.id) {
        userRsvpMap[row.event_id] = { status: row.status };
      }
    }
  }

  const upcomingWithDetails = upcoming.map((e) => ({
    ...e,
    rsvpCounts: rsvpCountsMap[e.id] ?? { going: 0, maybe: 0, declined: 0 },
    currentUserRsvp: userRsvpMap[e.id]
      ? {
          event_id: e.id,
          user_id: user.id,
          status: userRsvpMap[e.id].status as "going" | "maybe" | "declined",
          created_at: "",
        }
      : null,
  }));

  const sections = SECTION_ORDER.map((key) => ({
    key,
    label: SECTION_LABELS[key],
    events: upcomingWithDetails.filter(
      (e) => getSection(new Date(e.starts_at)) === key
    ),
  })).filter((s) => s.events.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Calendar className="size-6" />
          Events
        </h1>
        <Button asChild>
          <Link href="/events/create" className="gap-2">
            <Plus className="size-4" />
            Create Event
          </Link>
        </Button>
      </div>

      <EventFilters />

      {view === "calendar" ? (
        <EventsCalendarClient
          events={upcomingWithDetails}
          currentUserId={user.id}
        />
      ) : (
        <>
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.key}>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {section.label}
                </h2>
                <ul className="space-y-3">
                  {section.events.map((event) => (
                    <li key={event.id}>
                      <EventCard
                        event={event}
                        rsvpCounts={event.rsvpCounts}
                        currentUserRsvp={event.currentUserRsvp}
                        currentUserId={user.id}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <PastEventsSection past={past} currentUserId={user.id} />
        </>
      )}
    </div>
  );
}

function PastEventsSection({
  past,
  currentUserId,
}: {
  past: EventRow[];
  currentUserId: string;
}) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-semibold text-muted-foreground hover:text-foreground">
        Past Events
      </summary>
      <ul className="mt-3 space-y-3 opacity-90">
        {past.map((event) => (
          <li key={event.id}>
            <EventCard
              event={event}
              rsvpCounts={{ going: 0, maybe: 0, declined: 0 }}
              currentUserRsvp={null}
              currentUserId={currentUserId}
            />
          </li>
        ))}
      </ul>
    </details>
  );
}


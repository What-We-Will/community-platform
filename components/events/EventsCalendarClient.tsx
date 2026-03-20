"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { formatInTimeZone } from "@/lib/utils/timezone";
import { EventCalendarView } from "./EventCalendarView";
import { EventCard } from "./EventCard";

type EventItem = {
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
  host: { id: string; display_name: string; avatar_url: string | null } | null;
  rsvpCounts: { going: number; maybe: number; declined: number };
  currentUserRsvp: {
    event_id: string;
    user_id: string;
    status: "going" | "maybe" | "declined";
    created_at: string;
  } | null;
};

interface EventsCalendarClientProps {
  events: EventItem[];
  currentUserId: string;
  viewerTimezone: string;
}

export function EventsCalendarClient({
  events,
  currentUserId,
  viewerTimezone,
}: EventsCalendarClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  const calendarEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        starts_at: e.starts_at,
        event_type: e.event_type,
      })),
    [events]
  );

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const selectedKey = format(selectedDate, "yyyy-MM-dd");
    return events.filter(
      (e) => formatInTimeZone(e.starts_at, viewerTimezone, "yyyy-MM-dd") === selectedKey
    );
  }, [events, selectedDate, viewerTimezone]);

  return (
    <div className="space-y-6">
      <EventCalendarView
        events={calendarEvents}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        viewerTimezone={viewerTimezone}
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {selectedDate
            ? format(selectedDate, "EEEE, MMMM d")
            : "Select a day"}
        </h2>
        {eventsForSelectedDay.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events on this day
          </p>
        ) : (
          <ul className="space-y-3">
            {eventsForSelectedDay.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  rsvpCounts={event.rsvpCounts}
                  currentUserRsvp={event.currentUserRsvp}
                  currentUserId={currentUserId}
                  viewerTimezone={viewerTimezone}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

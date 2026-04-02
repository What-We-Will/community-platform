"use client";

import { useState, useEffect } from "react";
import { formatInTimeZone, getTimeZoneAbbreviation } from "@/lib/utils/timezone";

interface EventTimeDisplayProps {
  startsAt: string;
  endsAt: string;
  eventTimezone: string;
  profileTimezone: string;
  /** Date format for the primary line, e.g. "EEE, MMM d" or "EEEE, MMMM d, yyyy" */
  dateFormat?: string;
}

export function EventTimeDisplay({
  startsAt,
  endsAt,
  eventTimezone,
  profileTimezone,
  dateFormat = "EEE, MMM d",
}: EventTimeDisplayProps) {
  const [browserTz, setBrowserTz] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrowserTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const eventTzAbbr = getTimeZoneAbbreviation(startsAt, eventTimezone);

  const showProfile = profileTimezone !== eventTimezone;
  const showBrowser =
    browserTz !== null &&
    browserTz !== eventTimezone &&
    browserTz !== profileTimezone;

  return (
    <div className="text-sm text-muted-foreground">
      <p>
        {formatInTimeZone(startsAt, eventTimezone, dateFormat)} ·{" "}
        {formatInTimeZone(startsAt, eventTimezone, "h:mm a")} –{" "}
        {formatInTimeZone(endsAt, eventTimezone, "h:mm a")} {eventTzAbbr}
      </p>
      {showProfile && (
        <p className="text-xs text-muted-foreground/70">
          {formatInTimeZone(startsAt, profileTimezone, "h:mm a")} –{" "}
          {formatInTimeZone(endsAt, profileTimezone, "h:mm a")}{" "}
          {getTimeZoneAbbreviation(startsAt, profileTimezone)} in your time
        </p>
      )}
      {showBrowser && (
        <p className="text-xs text-muted-foreground/70">
          {formatInTimeZone(startsAt, browserTz, "h:mm a")} –{" "}
          {formatInTimeZone(endsAt, browserTz, "h:mm a")}{" "}
          {getTimeZoneAbbreviation(startsAt, browserTz)} local time
        </p>
      )}
    </div>
  );
}

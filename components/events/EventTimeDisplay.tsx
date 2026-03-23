"use client";

import { formatInTimeZone, getTimeZoneAbbreviation } from "@/lib/utils/timezone";

const SHOW_BROWSER_TZ =
  process.env.NEXT_PUBLIC_SHOW_BROWSER_TIMEZONE === "true";

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
  const browserTz = typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : profileTimezone;

  const eventTzAbbr = getTimeZoneAbbreviation(startsAt, eventTimezone);

  const showProfile = profileTimezone !== eventTimezone;
  const showBrowser =
    SHOW_BROWSER_TZ &&
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

import { cn } from "@/lib/utils";

const CALENDAR_ID = "hello@wwwrise.org";
const DEFAULT_TIMEZONE = "America/New_York";

type EmbedMode = "WEEK" | "AGENDA";

function buildEmbedSrc(
  timezone: string,
  mode?: EmbedMode
): string {
  const params = new URLSearchParams({
    src: CALENDAR_ID,
    ctz: timezone,
  });

  if (mode) {
    params.set("mode", mode);
    if (mode === "WEEK") params.set("wkst", "1");
    params.set("showNav", "1");
    params.set("showDate", "1");
    params.set("showTitle", "0");
    params.set("showTabs", "0");
    params.set("showCalendars", "0");
    params.set("showPrint", "0");
  }

  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
}

interface GoogleCalendarEmbedProps {
  timezone?: string;
  mode?: EmbedMode;
  height?: number;
  className?: string;
}

export function GoogleCalendarEmbed({
  timezone = DEFAULT_TIMEZONE,
  mode,
  height = 600,
  className,
}: GoogleCalendarEmbedProps) {
  const src = buildEmbedSrc(timezone, mode);

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-background", className)}>
      <iframe
        src={src}
        title="Community events calendar"
        className="w-full border-0"
        style={{ height: `${height}px` }}
        loading="lazy"
      />
    </div>
  );
}

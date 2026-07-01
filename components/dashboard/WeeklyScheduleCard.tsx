"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ChevronDown, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleCalendarEmbed } from "@/components/events/GoogleCalendarEmbed";

interface ScheduleRow {
  id: string;
  name: string;
  days: string;
  time: string;
  zoom_url: string | null;
  position: number;
}

interface Props {
  rows: ScheduleRow[];
  isPlatformAdmin: boolean;
}

const CALENDAR_SUBSCRIBE_URL = "https://tinyurl.com/calendarwww";
const SHARED_CALENDAR_EMAIL = "hello@wwwrise.org";

function useCalendarLayout() {
  const [layout, setLayout] = useState<{
    mode: "WEEK" | "AGENDA";
    height: number;
    isMobile: boolean;
  } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      const isMobile = media.matches;
      setLayout({
        isMobile,
        mode: isMobile ? "AGENDA" : "WEEK",
        height: isMobile ? 340 : 480,
      });
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return layout;
}

function ScheduleJoinLink({ url, className }: { url: string; className: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <Video className="size-3.5 shrink-0" />
      Join
    </a>
  );
}

function ScheduleRowCards({ rows }: { rows: ScheduleRow[] }) {
  return (
    <ul className="divide-y lg:hidden">
      {rows.map((row) => (
        <li key={row.id} className="px-3 py-3 sm:px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{row.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{row.days}</p>
              <p className="text-xs text-muted-foreground">{row.time}</p>
            </div>
            <div className="shrink-0 pt-0.5">
              {row.zoom_url ? (
                <ScheduleJoinLink
                  url={row.zoom_url}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
                />
              ) : (
                <span className="text-xs text-muted-foreground/40">—</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ScheduleTable({
  rows,
  isPlatformAdmin,
  AdminComponent,
}: {
  rows: ScheduleRow[];
  isPlatformAdmin: boolean;
  AdminComponent: React.ComponentType<{ rows: ScheduleRow[] }> | null;
}) {
  return (
    <div className="overflow-x-auto overscroll-x-contain lg:overflow-visible">
      <table
        className={cn(
          "w-full text-sm",
          !isPlatformAdmin && "hidden lg:table",
          isPlatformAdmin && "min-w-[32rem]"
        )}
      >
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground sm:px-4">
              Name
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground sm:px-4">
              Days
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground sm:px-4">
              Time
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground sm:px-4">
              Video Link
            </th>
            {isPlatformAdmin && <th className="w-20" />}
          </tr>
        </thead>
        {isPlatformAdmin && AdminComponent ? (
          <AdminComponent rows={rows} />
        ) : (
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={i % 2 === 0 ? "border-b" : "border-b bg-muted/20"}
              >
                <td className="px-3 py-2.5 font-medium sm:px-4">{row.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground sm:px-4">{row.days}</td>
                <td className="px-3 py-2.5 text-muted-foreground sm:px-4">{row.time}</td>
                <td className="px-3 py-2.5 sm:px-4">
                  {row.zoom_url ? (
                    <ScheduleJoinLink
                      url={row.zoom_url}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    />
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

export function WeeklyScheduleCard({ rows, isPlatformAdmin }: Props) {
  const [open, setOpen] = useState(true);
  const calendarLayout = useCalendarLayout();
  const [AdminComponent, setAdminComponent] = useState<React.ComponentType<{ rows: ScheduleRow[] }> | null>(null);

  async function handleOpen() {
    if (!open && isPlatformAdmin && !AdminComponent) {
      const mod = await import("./WeeklyScheduleAdmin");
      setAdminComponent(() => mod.WeeklyScheduleAdmin);
    }
    setOpen((o) => !o);
  }

  return (
    <Card className="col-span-full overflow-hidden">
      <CardHeader
        className="cursor-pointer select-none px-4 pb-3 sm:px-6"
        onClick={handleOpen}
      >
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            Weekly Schedule
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CardTitle>
        <p
          className="mt-2 text-xs leading-relaxed text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          To add this calendar to your personal calendar,{" "}
          <a
            href={CALENDAR_SUBSCRIBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            click here
          </a>
          . If you want to add an event to our shared calendar, simply invite:{" "}
          <span className="font-medium text-foreground">{SHARED_CALENDAR_EMAIL}</span>
        </p>
      </CardHeader>

      {open && (
        <CardContent className="p-0">
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-0">
            <div className="min-w-0 border-b lg:border-b-0 lg:border-r">
              {!isPlatformAdmin && <ScheduleRowCards rows={rows} />}
              <ScheduleTable
                rows={rows}
                isPlatformAdmin={isPlatformAdmin}
                AdminComponent={AdminComponent}
              />
            </div>
            <div className="min-w-0 px-3 pb-4 pt-1 sm:px-4 sm:pb-4 lg:p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground sm:mb-3">
                {calendarLayout?.isMobile ? "Upcoming events" : "This week's events"}
              </p>
              {calendarLayout ? (
                <GoogleCalendarEmbed
                  mode={calendarLayout.mode}
                  height={calendarLayout.height}
                  className="border-0 shadow-none"
                />
              ) : (
                <div
                  className="animate-pulse rounded-lg bg-muted/40"
                  style={{ height: 340 }}
                  aria-hidden
                />
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

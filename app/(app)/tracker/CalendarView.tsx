"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_MAP } from "./constants";
import type { Application } from "./TrackerClient";
import type { Interview } from "./actions";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ── Unified event model ───────────────────────────────────────────────────────

type InterviewEvent = {
  kind: "interview";
  key: string;
  date: string;
  sortKey: string;
  app: Application;
  title: string;
  time: string | null;
};

type StageEvent = {
  kind: "stage";
  key: string;
  date: string;
  sortKey: string;
  app: Application;
  statusKey: string;
  label: string;
};

type CalendarEvent = InterviewEvent | StageEvent;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  applications: Application[];
  interviews: Interview[];
  onOpenApp: (app: Application) => void;
}

export function CalendarView({ applications, interviews, onOpenApp }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const appById = new Map(applications.map((a) => [a.id, a]));
  const todayStr = toYMD(today);

  // ── Build all events ──────────────────────────────────────────────────────

  const interviewEvents: InterviewEvent[] = interviews
    .map((iv) => {
      const app = appById.get(iv.application_id);
      if (!app) return null;
      return {
        kind: "interview" as const,
        key: iv.id,
        date: iv.interview_date,
        sortKey: iv.interview_date + (iv.interview_time ?? ""),
        app,
        title: iv.title,
        time: iv.interview_time,
      };
    })
    .filter((e): e is InterviewEvent => e !== null);

  const stageEvents: StageEvent[] = applications.flatMap((app) =>
    Object.entries(app.status_dates ?? {}).flatMap(([statusKey, date]) => {
      const info = STATUS_MAP[statusKey];
      if (!info || !date) return [];
      return [{
        kind: "stage" as const,
        key: `stage-${app.id}-${statusKey}`,
        date,
        sortKey: date,
        app,
        statusKey,
        label: info.label,
      }];
    })
  );

  const allEvents: CalendarEvent[] = [...interviewEvents, ...stageEvents];

  function forDay(d: Date): CalendarEvent[] {
    const ymd = toYMD(d);
    return allEvents
      .filter((e) => e.date === ymd)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const weeks = buildMonthGrid(year, month);

  // ── Upcoming list ─────────────────────────────────────────────────────────

  const upcoming = allEvents
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // ── Chip renderer (inside calendar grid) ─────────────────────────────────

  function EventChip({ event }: { event: CalendarEvent }) {
    const s = STATUS_MAP[event.app.status];
    const bgClass = s?.bg ?? "bg-muted border text-muted-foreground";

    if (event.kind === "interview") {
      return (
        <button
          onClick={() => onOpenApp(event.app)}
          className={cn(
            "w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate leading-tight transition-opacity hover:opacity-80",
            bgClass,
          )}
          title={`${event.title} — ${event.app.company}${event.time ? ` at ${fmt12h(event.time)}` : ""}`}
        >
          <span className="flex items-center gap-0.5 truncate">
            <Clock className="size-2 shrink-0 opacity-60" />
            <span className="truncate">{event.app.company}</span>
          </span>
          {event.time && <span className="opacity-60">{fmt12h(event.time)}</span>}
        </button>
      );
    }

    // Stage event — dashed border to distinguish from scheduled interviews
    const stageS = STATUS_MAP[event.statusKey] ?? s;
    return (
      <button
        onClick={() => onOpenApp(event.app)}
        className={cn(
          "w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate leading-tight transition-opacity hover:opacity-80 border-dashed",
          stageS?.bg ?? bgClass,
        )}
        title={`${event.label} — ${event.app.company}`}
      >
        <span className="flex items-center gap-0.5 truncate">
          <CheckCircle2 className="size-2 shrink-0 opacity-60" />
          <span className="truncate">{event.label}</span>
        </span>
        <span className="block truncate opacity-60 text-[9px]">{event.app.company}</span>
      </button>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Calendar grid */}
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">{MONTH_NAMES[month]} {year}</h2>
            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-2.5" /> Scheduled interview
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-2.5" /> Stage date
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day, di) => {
              const dayEvents = day ? forDay(day) : [];
              const isToday = day ? toYMD(day) === todayStr : false;
              const isPast = day ? toYMD(day) < todayStr : false;

              return (
                <div
                  key={di}
                  className={cn(
                    "min-h-[88px] p-1.5",
                    di < 6 && "border-r",
                    !day && "bg-muted/10",
                    isPast && day && "bg-muted/5",
                  )}
                >
                  {day && (
                    <>
                      <p className={cn(
                        "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground",
                      )}>
                        {day.getDate()}
                      </p>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <EventChip key={e.key} event={e} />
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[9px] text-muted-foreground pl-1">
                            +{dayEvents.length - 3} more
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Upcoming list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Upcoming
        </h3>

        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed">
            <CalendarDays className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nothing upcoming on the calendar.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Stage dates from your applications and scheduled interviews will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((e) => {
              const s = e.kind === "stage" ? (STATUS_MAP[e.statusKey] ?? STATUS_MAP[e.app.status]) : STATUS_MAP[e.app.status];
              const evDate = new Date(e.date + "T00:00:00");
              const isToday = e.date === todayStr;

              return (
                <button
                  key={e.key}
                  onClick={() => onOpenApp(e.app)}
                  className="w-full text-left flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  {/* Date block */}
                  <div className={cn(
                    "flex flex-col items-center justify-center size-12 shrink-0 rounded-lg font-bold",
                    isToday ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}>
                    <span className="text-[10px] uppercase tracking-wide leading-none">
                      {MONTH_NAMES[evDate.getMonth()].slice(0, 3)}
                    </span>
                    <span className="text-lg leading-tight">{evDate.getDate()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {e.kind === "interview" ? (
                      <>
                        <p className="font-semibold text-sm leading-snug truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Clock className="size-3 shrink-0" />
                          {e.app.company} · {e.app.position}
                        </p>
                        {e.time && (
                          <p className="text-xs text-muted-foreground">{fmt12h(e.time)}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-sm leading-snug truncate flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 shrink-0 text-muted-foreground" />
                          {e.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {e.app.company} · {e.app.position}
                        </p>
                      </>
                    )}
                  </div>

                  <span className={cn(
                    "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                    e.kind === "interview" ? "border-dashed" : "",
                    s?.bg,
                  )}>
                    {e.kind === "interview" ? "Interview" : "Stage"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

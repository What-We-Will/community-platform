"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
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

/** Format a TIME string (HH:MM:SS or HH:MM) to 12-hour display */
function fmt12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Build a local YYYY-MM-DD string for a Date object (avoids UTC offset issues) */
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns an array of weeks (each week = 7 Date|null slots) for the given month */
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

interface EnrichedInterview extends Interview {
  app: Application;
}

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

  const enriched: EnrichedInterview[] = interviews
    .map((iv) => {
      const app = appById.get(iv.application_id);
      return app ? { ...iv, app } : null;
    })
    .filter((iv): iv is EnrichedInterview => iv !== null);

  const todayStr = toYMD(today);

  function forDay(date: Date): EnrichedInterview[] {
    const ymd = toYMD(date);
    return enriched
      .filter((iv) => iv.interview_date === ymd)
      .sort((a, b) => (a.interview_time ?? "").localeCompare(b.interview_time ?? ""));
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()); }

  const weeks = buildMonthGrid(year, month);

  // Upcoming: all future interviews sorted by date then time
  const upcoming = enriched
    .filter((iv) => iv.interview_date >= todayStr)
    .sort((a, b) =>
      a.interview_date.localeCompare(b.interview_date) ||
      (a.interview_time ?? "").localeCompare(b.interview_time ?? "")
    )
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* ── Calendar ─── */}
      <div className="rounded-xl border overflow-hidden bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <h2 className="text-base font-semibold">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={goToday}>
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

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day, di) => {
              const dayIvs = day ? forDay(day) : [];
              const isToday = day ? toYMD(day) === todayStr : false;
              const isPast = day ? toYMD(day) < todayStr : false;

              return (
                <div
                  key={di}
                  className={cn(
                    "min-h-[88px] p-1.5 relative",
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
                          : "text-muted-foreground"
                      )}>
                        {day.getDate()}
                      </p>

                      <div className="space-y-0.5">
                        {dayIvs.slice(0, 3).map((iv) => {
                          const s = STATUS_MAP[iv.app.status];
                          return (
                            <button
                              key={iv.id}
                              onClick={() => onOpenApp(iv.app)}
                              className={cn(
                                "w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate leading-tight transition-opacity hover:opacity-80",
                                s?.bg ?? "bg-primary/10 border border-primary/20 text-primary"
                              )}
                              title={`${iv.title} — ${iv.app.company}${iv.interview_time ? ` at ${fmt12h(iv.interview_time)}` : ""}`}
                            >
                              <span className="block truncate">{iv.app.company}</span>
                              {iv.interview_time && (
                                <span className="opacity-70">{fmt12h(iv.interview_time)}</span>
                              )}
                            </button>
                          );
                        })}
                        {dayIvs.length > 3 && (
                          <p className="text-[9px] text-muted-foreground pl-1">
                            +{dayIvs.length - 3} more
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

      {/* ── Upcoming list ─── */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Upcoming Interviews
        </h3>

        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed">
            <CalendarDays className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming interviews scheduled.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Open an application card and add an interview to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((iv) => {
              const s = STATUS_MAP[iv.app.status];
              const ivDate = new Date(iv.interview_date + "T00:00:00");
              const isToday = iv.interview_date === todayStr;
              return (
                <button
                  key={iv.id}
                  onClick={() => onOpenApp(iv.app)}
                  className="w-full text-left flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  {/* Date block */}
                  <div className={cn(
                    "flex flex-col items-center justify-center size-12 shrink-0 rounded-lg font-bold",
                    isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <span className="text-[10px] uppercase tracking-wide leading-none">
                      {MONTH_NAMES[ivDate.getMonth()].slice(0, 3)}
                    </span>
                    <span className="text-lg leading-tight">{ivDate.getDate()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug truncate">{iv.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {iv.app.company} · {iv.app.position}
                    </p>
                    {iv.interview_time && (
                      <p className="text-xs text-muted-foreground">{fmt12h(iv.interview_time)}</p>
                    )}
                  </div>

                  <span className={cn(
                    "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                    s?.bg
                  )}>
                    {s?.label ?? iv.app.status}
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

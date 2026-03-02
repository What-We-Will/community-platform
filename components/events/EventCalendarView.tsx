"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { eventTypeConfig } from "@/lib/utils/events";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  starts_at: string;
  event_type: string;
}

interface EventCalendarViewProps {
  events: CalendarEvent[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventCalendarView({
  events,
  selectedDate,
  onSelectDate,
}: EventCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ?? new Date();
    return startOfMonth(d);
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start so first day aligns with Sunday
  const startPad = monthStart.getDay();
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const dayKey = format(startOfDay(new Date(e.starts_at)), "yyyy-MM-dd");
    const arr = eventsByDay.get(dayKey) ?? [];
    arr.push(e);
    eventsByDay.set(dayKey, arr);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
        {WEEKDAY_HEADERS.map((day) => (
          <div key={day} className="py-1 text-muted-foreground font-medium">
            {day}
          </div>
        ))}
        {paddedDays.map((day, i) => {
          if (day === null) {
            return <div key={`pad-${i}`} />;
          }
          const dayKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(dayKey) ?? [];
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex min-h-10 flex-col items-center justify-center rounded-md p-1 transition-colors",
                !isCurrentMonth && "text-muted-foreground/50",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && isCurrentMonth && "hover:bg-accent",
                isToday(day) && !isSelected && "ring-2 ring-primary/50"
              )}
            >
              <span>{format(day, "d")}</span>
              <div className="flex gap-0.5 mt-0.5 justify-center">
                {dayEvents.slice(0, 3).map((ev) => {
                  const dotClass =
                    {
                      skillshare: "bg-blue-500",
                      workshop: "bg-purple-500",
                      ama: "bg-green-500",
                      mock_interview: "bg-orange-500",
                      social: "bg-pink-500",
                      other: "bg-gray-500",
                    }[ev.event_type] ?? "bg-gray-500";
                  return (
                    <span
                      key={ev.id}
                      className={cn("size-1.5 rounded-full", dotClass)}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ChangeTime({
  dateTime,
  timeZone,
  children,
}: {
  dateTime: string;
  /** Defaults to the viewer's own timezone. */
  timeZone?: string;
  children: string;
}) {
  return (
    // A popover, not a tooltip: Radix tooltips never open on touch.
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${children}. Show exact time`}
          className="justify-self-end rounded-sm text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <time dateTime={dateTime}>{children}</time>
        </button>
      </PopoverTrigger>
      {/* Content renders only when open, in the browser, so the viewer's timezone can't cause a hydration mismatch. */}
      <PopoverContent align="end" className="w-auto px-3 py-1.5 text-xs">
        {new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone,
          timeZoneName: "short",
        }).format(new Date(dateTime))}
      </PopoverContent>
    </Popover>
  );
}

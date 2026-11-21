"use client";

import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ChangeTime({
  dateTime,
  timeZone,
  children,
}: {
  dateTime: string;
  /** Defaults to the viewer's own timezone. */
  timeZone?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Focusable so keyboard and touch users can reach the exact time too. */}
        <time
          dateTime={dateTime}
          tabIndex={0}
          className="justify-self-end rounded-sm text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {children}
        </time>
      </TooltipTrigger>
      {/* Content renders only when open, in the browser, so the viewer's timezone can't cause a hydration mismatch. */}
      <TooltipContent>
        {new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone,
          timeZoneName: "short",
        }).format(new Date(dateTime))}
      </TooltipContent>
    </Tooltip>
  );
}

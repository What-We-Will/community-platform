"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { List, Calendar as CalendarIcon } from "lucide-react";
import { eventTypeOptions } from "@/lib/utils/events";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get("view") ?? "list";
  const type = searchParams.get("type") ?? "all";

  function updateParams(updates: { view?: string; type?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.view !== undefined) {
      if (updates.view !== "list") params.set("view", updates.view);
      else params.delete("view");
    }
    if (updates.type !== undefined) {
      if (updates.type && updates.type !== "all") params.set("type", updates.type);
      else params.delete("type");
    }
    router.push(`/events${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-md border border-input bg-transparent p-0.5">
        <Button
          type="button"
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          className="gap-1.5"
          onClick={() => updateParams({ view: "list" })}
        >
          <List className="size-4" />
          List
        </Button>
        <Button
          type="button"
          variant={view === "calendar" ? "secondary" : "ghost"}
          size="sm"
          className="gap-1.5"
          onClick={() => updateParams({ view: "calendar" })}
        >
          <CalendarIcon className="size-4" />
          Calendar
        </Button>
      </div>

      <Select
        value={type}
        onValueChange={(v) => updateParams({ type: v })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Event type" />
        </SelectTrigger>
        <SelectContent>
          {eventTypeOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createEventAction } from "@/app/(app)/events/actions";
import { eventTypeOptions } from "@/lib/utils/events";
import { formatTimeLabel, countWeekdays } from "@/lib/utils/format";
import type { Group } from "@/lib/types";

type RecurrenceRule = "none" | "daily" | "weekly";

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  for (const m of [0, 30]) {
    if (h === 23 && m === 30) break;
    TIME_OPTIONS.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    );
  }
}

interface CreateEventFormProps {
  groups: Group[];
  preselectedGroupId: string | null;
}

export function CreateEventForm({
  groups,
  preselectedGroupId,
}: CreateEventFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [location, setLocation] = useState("Online");
  const [maxAttendees, setMaxAttendees] = useState<string>("");
  const [groupId, setGroupId] = useState<string>(preselectedGroupId ?? "none");
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function handleStartTimeChange(value: string) {
    setStartTime(value);
    const [sh, sm] = value.split(":").map(Number);
    let eh = sh + 1;
    let em = sm;
    if (em === 60) {
      em = 0;
      eh++;
    }
    if (eh >= 24) eh = 23;
    setEndTime(
      `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`
    );
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (title.length > 100) next.title = "Title must be 100 characters or less";
    if (!eventType) next.event_type = "Event type is required";
    if (description.length > 2000) next.description = "Description must be 2000 characters or less";
    if (!date) next.date = "Date is required";
    if (!startTime) next.startTime = "Start time is required";
    if (!endTime) next.endTime = "End time is required";
    if (date && startTime && endTime) {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);
      if (end <= start) next.endTime = "End time must be after start time";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) next.date = "Date must be today or in the future";
    }
    if (maxAttendees) {
      const max = parseInt(maxAttendees, 10);
      if (isNaN(max) || max < 1)
        next.max_attendees = "Max attendees must be a positive number";
    }
    if (recurrenceRule !== "none") {
      if (!recurrenceEndDate) {
        next.recurrenceEndDate = "Repeat until date is required";
      } else if (date && recurrenceEndDate <= date) {
        next.recurrenceEndDate = "Repeat until must be after the event date";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const starts_at = start.toISOString();
    const ends_at = end.toISOString();

    startTransition(async () => {
      try {
        await createEventAction({
          title: title.trim(),
          description: description.trim() || "",
          event_type: eventType,
          starts_at,
          ends_at,
          location: location.trim() || "Online",
          max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
          group_id: groupId === "none" ? null : groupId,
          recurrence_rule: recurrenceRule === "none" ? null : recurrenceRule,
          recurrence_end_date: recurrenceRule !== "none" ? recurrenceEndDate : null,
        });
      } catch (err) {
        setErrors({
          form: err instanceof Error ? err.message : "Something went wrong",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          maxLength={100}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_type">Event type *</Label>
        <Select value={eventType} onValueChange={setEventType} required>
          <SelectTrigger id="event_type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypeOptions
              .filter((o) => o.value !== "all")
              .map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {errors.event_type && (
          <p className="text-sm text-destructive">{errors.event_type}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this event about?"
          rows={4}
          maxLength={2000}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Timezone</Label>
          <p className="text-sm text-muted-foreground pt-2">
            Times are in {timezone}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start time *</Label>
          <Select value={startTime} onValueChange={handleStartTimeChange}>
            <SelectTrigger id="startTime">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {formatTimeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End time *</Label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger id="endTime">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {formatTimeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.endTime && (
            <p className="text-sm text-destructive">{errors.endTime}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Online"
        />
      </div>

      {/* Recurrence */}
      <div className="space-y-3">
        <Label className="flex items-center gap-1.5">
          <Repeat2 className="size-3.5" />
          Repeat
        </Label>
        <div className="flex gap-2">
          {(["none", "daily", "weekly"] as RecurrenceRule[]).map((rule) => (
            <button
              key={rule}
              type="button"
              onClick={() => setRecurrenceRule(rule)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors capitalize",
                recurrenceRule === rule
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              )}
            >
              {rule === "none" ? "No repeat" : rule === "daily" ? "Every weekday" : "Every week"}
            </button>
          ))}
        </div>

        {recurrenceRule !== "none" && (
          <div className="space-y-1.5">
            <Label htmlFor="recurrenceEndDate">Repeat until *</Label>
            <Input
              id="recurrenceEndDate"
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => setRecurrenceEndDate(e.target.value)}
              min={date ? (() => { const d = new Date(date); d.setDate(d.getDate() + (recurrenceRule === "daily" ? 1 : 7)); return d.toISOString().slice(0, 10); })() : undefined}
            />
            {recurrenceEndDate && date && (
              <p className="text-xs text-muted-foreground">
                {recurrenceRule === "daily"
                  ? `Creates ~${Math.min(1500, countWeekdays(date, recurrenceEndDate))} weekday occurrences`
                  : `Creates ~${Math.min(260, Math.floor((new Date(recurrenceEndDate).getTime() - new Date(date).getTime()) / (7 * 86400000)))} weekly occurrences`}
              </p>
            )}
            {errors.recurrenceEndDate && (
              <p className="text-sm text-destructive">{errors.recurrenceEndDate}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_attendees">Max attendees (optional)</Label>
        <Input
          id="max_attendees"
          type="number"
          min={1}
          value={maxAttendees}
          onChange={(e) => setMaxAttendees(e.target.value)}
          placeholder="Unlimited"
        />
        {errors.max_attendees && (
          <p className="text-sm text-destructive">{errors.max_attendees}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="group">Group (optional)</Label>
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger id="group">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (community-wide)</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {errors.form && (
        <p className="text-sm text-destructive">{errors.form}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create Event"}
      </Button>
    </form>
  );
}


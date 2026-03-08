import { createClient } from "@/lib/supabase/server";
import { getVideoRoomName } from "@/lib/utils/video";

export async function createEvent(data: {
  title: string;
  description?: string;
  event_type: string;
  host_id: string;
  group_id?: string | null;
  location?: string;
  starts_at: string;
  ends_at: string;
  max_attendees?: number | null;
  recurrence_rule?: "daily" | "weekly" | null;
  recurrence_end_date?: string | null;
}) {
  const supabase = await createClient();
  const eventId = crypto.randomUUID();
  const videoRoomName = getVideoRoomName({ type: "event", id: eventId });

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      id: eventId,
      ...data,
      group_id: data.group_id ?? null,
      max_attendees: data.max_attendees ?? null,
      video_room_name: videoRoomName,
      location: data.location ?? "Online",
      recurrence_rule: data.recurrence_rule ?? null,
      recurrence_end_date: data.recurrence_end_date ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("event_rsvps").insert({
    event_id: event.id,
    user_id: data.host_id,
    status: "going",
  });

  return event;
}

export async function fetchUpcomingEvents(options: {
  groupId?: string | null;
  type?: string | null;
  limit?: number;
} = {}) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("events")
    .select("*, host:profiles!host_id(*)")
    .gte("ends_at", now)
    .order("starts_at", { ascending: true });

  if (options.groupId !== undefined && options.groupId !== null) {
    query = query.eq("group_id", options.groupId);
  } else if (options.groupId === null) {
    query = query.is("group_id", null);
  }

  if (options.type && options.type !== "all") {
    query = query.eq("event_type", options.type);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchPastEvents(options: { limit?: number } = {}) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("*, host:profiles!host_id(*)")
    .lt("ends_at", now)
    .is("group_id", null)
    .order("starts_at", { ascending: false })
    .limit(options.limit ?? 20);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchEventWithDetails(
  eventId: string,
  userId: string
): Promise<{
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  host_id: string | null;
  group_id: string | null;
  location: string | null;
  video_room_name: string | null;
  starts_at: string;
  ends_at: string;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
  host: unknown;
  group: unknown;
  rsvpCounts: { going: number; maybe: number; declined: number };
  currentUserRsvp: unknown;
  isLive: boolean;
  isPast: boolean;
} | null> {
  const supabase = await createClient();
  const now = new Date();

  const [eventResult, rsvpsResult, userRsvpResult] = await Promise.all([
    supabase
      .from("events")
      .select("*, host:profiles!host_id(*), group:groups!group_id(*)")
      .eq("id", eventId)
      .single(),
    supabase.from("event_rsvps").select("*").eq("event_id", eventId),
    supabase
      .from("event_rsvps")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (eventResult.error || !eventResult.data) return null;

  const event = eventResult.data as Record<string, unknown>;
  const rsvps = (rsvpsResult.data ?? []) as Array<{ status: string }>;

  const rsvpCounts = {
    going: rsvps.filter((r) => r.status === "going").length,
    maybe: rsvps.filter((r) => r.status === "maybe").length,
    declined: rsvps.filter((r) => r.status === "declined").length,
  };

  const startsAt = new Date(event.starts_at as string);
  const endsAt = new Date(event.ends_at as string);

  return {
    ...event,
    rsvpCounts,
    currentUserRsvp: userRsvpResult.data ?? null,
    isLive: startsAt <= now && now <= endsAt,
    isPast: endsAt < now,
  } as {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    host_id: string | null;
    group_id: string | null;
    location: string | null;
    video_room_name: string | null;
    starts_at: string;
    ends_at: string;
    max_attendees: number | null;
    created_at: string;
    updated_at: string;
    host: unknown;
    group: unknown;
    rsvpCounts: { going: number; maybe: number; declined: number };
    currentUserRsvp: unknown;
    isLive: boolean;
    isPast: boolean;
  };
}

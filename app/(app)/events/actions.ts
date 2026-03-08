"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEvent } from "@/lib/events";
import { getVideoRoomName } from "@/lib/utils/video";

export async function updateRsvp(
  eventId: string,
  status: "going" | "maybe" | "declined"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === status) {
    await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
  } else {
    if (status === "going") {
      const { data: event } = await supabase
        .from("events")
        .select("max_attendees")
        .eq("id", eventId)
        .single();

      if (event?.max_attendees != null) {
        const { count } = await supabase
          .from("event_rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .eq("status", "going");
        if ((count ?? 0) >= event.max_attendees) {
          throw new Error("This event is full");
        }
      }
    }

    await supabase.from("event_rsvps").upsert(
      { event_id: eventId, user_id: user.id, status },
      { onConflict: "event_id,user_id" }
    );
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
}

export async function createEventAction(formData: {
  title: string;
  description: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  location: string;
  max_attendees: number | null;
  group_id: string | null;
  recurrence_rule?: "daily" | "weekly" | null;
  recurrence_end_date?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { recurrence_rule, recurrence_end_date, ...baseData } = formData;

  // Create the parent (first) event
  const event = await createEvent({
    ...baseData,
    host_id: user.id,
    recurrence_rule: recurrence_rule ?? null,
    recurrence_end_date: recurrence_end_date ?? null,
  });

  // Generate recurring instances if requested
  if (recurrence_rule && recurrence_end_date) {
    const maxInstances = recurrence_rule === "daily" ? 1500 : 260;
    const durationMs =
      new Date(formData.ends_at).getTime() - new Date(formData.starts_at).getTime();
    const endDate = new Date(recurrence_end_date + "T23:59:59Z");

    // Advance from the parent's date to generate subsequent occurrences
    const cursor = new Date(formData.starts_at);
    cursor.setUTCDate(cursor.getUTCDate() + 1);

    const instances: object[] = [];

    while (cursor <= endDate && instances.length < maxInstances) {
      const day = cursor.getUTCDay(); // 0 = Sun, 6 = Sat
      const isWeekend = day === 0 || day === 6;

      // For weekly: only the same weekday as the original. For daily: skip weekends.
      const skip =
        recurrence_rule === "weekly"
          ? day !== new Date(formData.starts_at).getUTCDay()
          : isWeekend;

      if (!skip) {
        const id = crypto.randomUUID();
        instances.push({
          id,
          title: formData.title,
          description: formData.description || null,
          event_type: formData.event_type,
          host_id: user.id,
          group_id: formData.group_id,
          location: formData.location || "Online",
          max_attendees: formData.max_attendees,
          starts_at: new Date(cursor).toISOString(),
          ends_at: new Date(cursor.getTime() + durationMs).toISOString(),
          video_room_name: getVideoRoomName({ type: "event", id }),
          recurrence_rule,
          parent_event_id: event.id,
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    if (instances.length > 0) {
      const { data: inserted, error } = await supabase
        .from("events")
        .insert(instances)
        .select("id");
      if (error) throw new Error(error.message);

      // Auto-RSVP the host to every instance
      if (inserted && inserted.length > 0) {
        await supabase.from("event_rsvps").insert(
          inserted.map((e) => ({ event_id: e.id, user_id: user.id, status: "going" }))
        );
      }
    }
  }

  redirect(`/events/${event.id}`);
}

export async function updateEventAction(
  eventId: string,
  formData: {
    title: string;
    description: string;
    event_type: string;
    starts_at: string;
    ends_at: string;
    location: string;
    max_attendees: number | null;
    group_id: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (!existing || existing.host_id !== user.id) {
    throw new Error("Only the host can edit this event");
  }

  const { error } = await supabase
    .from("events")
    .update({
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      event_type: formData.event_type,
      starts_at: formData.starts_at,
      ends_at: formData.ends_at,
      location: formData.location.trim() || "Online",
      max_attendees: formData.max_attendees,
      group_id: formData.group_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("host_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  redirect(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("host_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/events");
  redirect("/events");
}

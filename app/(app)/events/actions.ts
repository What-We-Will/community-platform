"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEvent } from "@/lib/events";

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
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const event = await createEvent({
    ...formData,
    host_id: user.id,
  });

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

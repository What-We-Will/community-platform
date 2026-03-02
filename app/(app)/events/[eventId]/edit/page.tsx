import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { EditEventForm } from "@/components/events/EditEventForm";
import type { Group } from "@/lib/types";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, event_type, host_id, starts_at, ends_at, location, max_attendees, group_id"
    )
    .eq("id", eventId)
    .single();

  if (!event || event.host_id !== user.id) notFound();

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, slug)")
    .eq("user_id", user.id);

  const groups: Group[] = [];
  for (const m of memberships ?? []) {
    const row = m as unknown as { groups: Group | null };
    const g = row.groups;
    if (g) groups.push(g);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Event
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>

      <EditEventForm
        eventId={eventId}
        event={{
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          location: event.location,
          max_attendees: event.max_attendees,
          group_id: event.group_id,
        }}
        groups={groups}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    .select("id, title, host_id")
    .eq("id", eventId)
    .single();

  if (!event || event.host_id !== user.id) notFound();

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
      <p className="text-muted-foreground">
        Event editing will be available in a future update. For now, you can
        delete and recreate the event if needed.
      </p>
      <Button asChild variant="outline">
        <Link href={`/events/${eventId}`}>View Event</Link>
      </Button>
    </div>
  );
}

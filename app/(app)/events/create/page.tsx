import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateEventForm } from "@/components/events/CreateEventForm";
import type { Group } from "@/lib/types";

export default async function CreateEventPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const params = await searchParams;
  const preselectedGroupId = params.group ?? null;

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
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Events
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>

      <CreateEventForm
        groups={groups}
        preselectedGroupId={preselectedGroupId}
        profileTimezone={profile?.timezone ?? "America/Chicago"}
      />
    </div>
  );
}

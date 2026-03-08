import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsAdmin } from "./AnnouncementsAdmin";

export async function AnnouncementsCard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, content")
    .order("created_at", { ascending: true });

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const isPlatformAdmin = profile?.role === "admin";
  const items = announcements ?? [];

  if (items.length === 0 && !isPlatformAdmin) return null;

  return (
    <div className="col-span-full rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Gray header bar */}
      <div className="flex items-center gap-2 bg-muted px-4 py-2.5 border-b">
        <Megaphone className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Announcements
        </span>
      </div>

      {/* Announcement items */}
      {items.length > 0 ? (
        <ul className="divide-y bg-card">
          {items.map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm text-foreground leading-relaxed">
              {a.content}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-muted-foreground italic">No announcements yet.</p>
      )}

      {/* Admin controls */}
      {isPlatformAdmin && <AnnouncementsAdmin announcements={items} />}
    </div>
  );
}

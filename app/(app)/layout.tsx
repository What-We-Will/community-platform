import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, is_onboarded, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_onboarded) {
    redirect("/onboarding");
  }

  // Compute initial unread message count for the sidebar badge
  let unreadCount = 0;
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);

  if (participations && participations.length > 0) {
    const counts = await Promise.all(
      participations.map(async (p) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", p.conversation_id)
          .neq("sender_id", user.id)
          .gt("created_at", p.last_read_at);
        return count ?? 0;
      })
    );
    unreadCount = counts.reduce((sum, c) => sum + c, 0);
  }

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email ?? "",
        displayName:
          profile?.display_name ??
          user.user_metadata?.full_name ??
          user.email ??
          "User",
        avatarUrl: profile?.avatar_url ?? null,
        unreadCount,
        isAdmin: profile?.role === "admin",
      }}
    >
      {children}
    </AppShell>
  );
}

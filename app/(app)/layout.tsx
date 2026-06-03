import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NOINDEX_METADATA } from "@/lib/seo";
import AppShell from "./app-shell";

export const metadata: Metadata = NOINDEX_METADATA;

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

  const { data: total } = await supabase.rpc("get_total_unread_count");
  const unreadCount = Number(total ?? 0);

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

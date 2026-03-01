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
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email ?? "",
        displayName: profile?.display_name ?? user.user_metadata?.full_name ?? user.email ?? "User",
        avatarUrl: profile?.avatar_url ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}

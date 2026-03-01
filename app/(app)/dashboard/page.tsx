import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const displayName =
    profile?.display_name ??
    user?.user_metadata?.full_name ??
    user?.email ??
    "there";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back, {displayName}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Your dashboard is under construction. Check back soon!
      </p>
    </div>
  );
}

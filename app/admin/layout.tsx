import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = NOINDEX_METADATA;

// Canonical admin gate for /admin/*. Pages under this subtree must not add
// their own redirect — the layout enforces it. Server actions still need
// their own guard (e.g. ensureAdmin() in actions.ts); layouts do not run
// on action calls.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("[admin-layout] role lookup failed:", error.message);
  }

  if (profile?.role !== "admin") redirect("/dashboard");

  return children;
}

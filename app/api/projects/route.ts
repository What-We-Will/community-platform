import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { canViewFeature } from "@/lib/feature-flags";

// Service-role client — bypasses RLS for reading projects (public open-source data)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  const supabase = await createServerClient();
  // Route Handlers cannot share React request memoization with the resolver.
  // Accept the duplicate auth round trip to keep its verification independent.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await canViewFeature("projects"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await adminSupabase
    .from("projects")
    .select(`
      id, github_url, title, description, image_url, language, stars,
      roles_seeking, offers_mentorship, seeks_mentorship, created_at,
      creator:created_by(id, display_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/projects] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

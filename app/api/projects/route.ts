import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Service-role client — bypasses RLS for reading projects (public open-source data)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  // Still require the user to be authenticated
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

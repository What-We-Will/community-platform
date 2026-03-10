import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ProjectsClient, type ProjectRow } from "./ProjectsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

// Service-role client — bypasses RLS for reading projects (public open-source data)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = getAdminClient();

  const [projectsResult, { data: profile }] = await Promise.all([
    adminSupabase
      .from("projects")
      .select(`
        id, github_url, title, description, image_url, language, stars,
        roles_seeking, offers_mentorship, seeks_mentorship, created_at,
        creator:created_by(id, display_name)
      `)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (projectsResult.error) {
    console.error("[projects page] fetch error:", projectsResult.error);
  }

  const normalised: ProjectRow[] = (projectsResult.data ?? []).map((p) => {
    const raw = Array.isArray(p.creator) ? (p.creator[0] ?? null) : p.creator;
    return {
      ...p,
      roles_seeking: (p.roles_seeking ?? []) as string[],
      creator: raw as ProjectRow["creator"],
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <ProjectsClient
        projects={normalised}
        currentUserId={user.id}
        isPlatformAdmin={profile?.role === "admin"}
      />
    </div>
  );
}

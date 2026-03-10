import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProjectsClient, type ProjectRow } from "./ProjectsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [projectsResult, { data: profile }] = await Promise.all([
    supabase
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
  const projects = projectsResult.data;

  // Normalise the creator join (Supabase may return an array)
  const normalised: ProjectRow[] = (projects ?? []).map((p) => {
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

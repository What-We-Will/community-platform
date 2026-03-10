import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ProjectsClient, type ProjectRow } from "./ProjectsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [projectsResult, { data: profile }] = await Promise.all([
    fetchProjects(supabase),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (projectsResult.error) {
    console.error("[projects page] fetch error:", projectsResult.error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalised: ProjectRow[] = (projectsResult.data ?? []).map((p: any) => {
    const raw = Array.isArray(p.creator) ? (p.creator[0] ?? null) : p.creator;
    return {
      ...p,
      roles_seeking: (p.roles_seeking ?? []) as string[],
      creator: raw as ProjectRow["creator"],
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      {projectsResult.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error loading projects: {projectsResult.error.message}
        </div>
      )}
      <ProjectsClient
        projects={normalised}
        currentUserId={user.id}
        isPlatformAdmin={profile?.role === "admin"}
      />
    </div>
  );
}

// Try admin client (bypasses RLS) first; fall back to regular authenticated client
async function fetchProjects(regularClient: Awaited<ReturnType<typeof createClient>>) {
  const SELECT = `
    id, github_url, title, description, image_url, language, stars,
    roles_seeking, offers_mentorship, seeks_mentorship, created_at,
    creator:created_by(id, display_name)
  `;

  // Try with service role key (bypasses RLS) if the env var is available
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceKey && supabaseUrl) {
    try {
      const admin = createAdminClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });
      const result = await admin
        .from("projects")
        .select(SELECT)
        .order("created_at", { ascending: false });

      if (!result.error) return result;
      console.error("[projects] admin client error, falling back:", result.error);
    } catch (e) {
      console.error("[projects] admin client threw, falling back:", e);
    }
  }

  // Fallback: regular authenticated client (subject to RLS)
  return regularClient
    .from("projects")
    .select(SELECT)
    .order("created_at", { ascending: false });
}

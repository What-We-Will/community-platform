import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Github, Star, Code, Users, GraduationCap, BookOpen } from "lucide-react";
import { AddProjectForm, PROJECT_ROLES } from "./AddProjectForm";
import { DeleteProjectButton } from "./DeleteProjectButton";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Projects" };

const ROLE_COLORS: Record<string, string> = {
  engineer: "bg-blue-100 text-blue-700 border-blue-200",
  designer:  "bg-purple-100 text-purple-700 border-purple-200",
  pm:        "bg-amber-100 text-amber-700 border-amber-200",
  data:      "bg-teal-100 text-teal-700 border-teal-200",
  devops:    "bg-orange-100 text-orange-700 border-orange-200",
  security:  "bg-red-100 text-red-700 border-red-200",
  sme:       "bg-green-100 text-green-700 border-green-200",
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: projects }, { data: profile }] = await Promise.all([
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

  const isPlatformAdmin = profile?.role === "admin";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Open source projects seeking community contributors.
          </p>
        </div>
        <AddProjectForm />
      </div>

      {/* Empty state */}
      {(!projects || projects.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Github className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Be the first to share an open source project seeking contributors.
          </p>
        </div>
      )}

      {/* Project grid */}
      {projects && projects.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {projects.map((project) => {
            const creatorRaw = Array.isArray(project.creator) ? (project.creator[0] ?? null) : project.creator;
            const creator = creatorRaw as Pick<Profile, "id" | "display_name"> | null;
            const canDelete = isPlatformAdmin || (creator as { id: string } | null)?.id === user.id;
            const roles = (project.roles_seeking ?? []) as string[];

            return (
              <div
                key={project.id}
                className="group flex flex-col rounded-xl border bg-card overflow-hidden hover:border-primary/30 transition-colors"
              >
                {/* Social preview image */}
                {project.image_url && (
                  <div className="relative aspect-[2/1] bg-muted">
                    <Image
                      src={project.image_url}
                      alt={project.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2.5 p-4 flex-1">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug"
                    >
                      <Github className="size-4 shrink-0 text-muted-foreground" />
                      {project.title}
                    </a>
                    {canDelete && <DeleteProjectButton id={project.id} />}
                  </div>

                  {/* Meta: stars + language */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {project.stars > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {project.stars.toLocaleString()}
                      </span>
                    )}
                    {project.language && (
                      <span className="flex items-center gap-1">
                        <Code className="size-3" />
                        {project.language}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                  )}

                  {/* Roles seeking */}
                  {roles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground mr-0.5">
                        <Users className="size-3" /> Seeking:
                      </span>
                      {roles.map((r) => {
                        const roleLabel = PROJECT_ROLES.find((pr) => pr.value === r)?.label ?? r;
                        const colorCls = ROLE_COLORS[r] ?? "bg-muted text-muted-foreground border-border";
                        return (
                          <span
                            key={r}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${colorCls}`}
                          >
                            {roleLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Mentorship badges */}
                  {(project.offers_mentorship || project.seeks_mentorship) && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {project.offers_mentorship && (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <GraduationCap className="size-3" /> Offers mentorship
                        </span>
                      )}
                      {project.seeks_mentorship && (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
                          <BookOpen className="size-3" /> Seeking mentorship
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer: posted by */}
                  {creator && (
                    <p className="text-[11px] text-muted-foreground mt-auto pt-1">
                      Added by {creator.display_name}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

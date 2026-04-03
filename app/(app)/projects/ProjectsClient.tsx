"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Github, Star, Code, Users, GraduationCap, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddProjectForm, PROJECT_ROLES } from "./AddProjectForm";
import { DeleteProjectButton } from "./DeleteProjectButton";

const ROLE_COLORS: Record<string, string> = {
  engineer: "bg-blue-100 text-blue-700 border-blue-200",
  designer:  "bg-purple-100 text-purple-700 border-purple-200",
  pm:        "bg-amber-100 text-amber-700 border-amber-200",
  data:      "bg-teal-100 text-teal-700 border-teal-200",
  devops:    "bg-orange-100 text-orange-700 border-orange-200",
  security:  "bg-red-100 text-red-700 border-red-200",
  sme:       "bg-green-100 text-green-700 border-green-200",
};

export interface ProjectRow {
  id: string;
  github_url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  language: string | null;
  stars: number;
  roles_seeking: string[];
  offers_mentorship: boolean;
  seeks_mentorship: boolean;
  created_at: string;
  creator: { id: string; display_name: string | null } | null;
}

interface Props {
  projects: ProjectRow[];
  currentUserId: string;
  isPlatformAdmin: boolean;
}

type MentorshipFilter = "offers" | "seeks";

export function ProjectsClient({ projects, currentUserId, isPlatformAdmin }: Props) {
  const [roleFilter, setRoleFilter]           = useState<string | null>(null);
  const [mentorshipFilters, setMentorshipFilters] = useState<Set<MentorshipFilter>>(new Set());

  function toggleMentorship(f: MentorshipFilter) {
    setMentorshipFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  }

  const hasFilters = roleFilter !== null || mentorshipFilters.size > 0;

  function clearFilters() {
    setRoleFilter(null);
    setMentorshipFilters(new Set());
  }

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (roleFilter && !p.roles_seeking.includes(roleFilter)) return false;
      if (mentorshipFilters.has("offers") && !p.offers_mentorship) return false;
      if (mentorshipFilters.has("seeks")  && !p.seeks_mentorship)  return false;
      return true;
    });
  }, [projects, roleFilter, mentorshipFilters]);

  return (
    <div className="space-y-6">
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

      {/* Filters */}
      {projects.length > 0 && (
        <div className="space-y-2.5">
          {/* Role filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-1">
              Role
            </span>
            <button
              onClick={() => setRoleFilter(null)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                roleFilter === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              All
            </button>
            {PROJECT_ROLES.map((r) => {
              const active = roleFilter === r.value;
              const colorCls = ROLE_COLORS[r.value] ?? "";
              return (
                <button
                  key={r.value}
                  onClick={() => setRoleFilter(active ? null : r.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? colorCls + " ring-1 ring-offset-1 ring-current"
                      : "border-border bg-muted text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Mentorship filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-1">
              Mentorship
            </span>
            <button
              onClick={() => toggleMentorship("offers")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                mentorshipFilters.has("offers")
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-offset-1 ring-emerald-400"
                  : "border-border bg-muted text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              <GraduationCap className="size-3" /> Offers mentorship
            </button>
            <button
              onClick={() => toggleMentorship("seeks")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                mentorshipFilters.has("seeks")
                  ? "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-offset-1 ring-sky-400"
                  : "border-border bg-muted text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              <BookOpen className="size-3" /> Seeking mentorship
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
              >
                <X className="size-3" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state — no projects at all */}
      {projects.length === 0 && (
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

      {/* Empty state — filters returned nothing */}
      {projects.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No projects match the selected filters.</p>
          <button onClick={clearFilters} className="mt-2 text-sm underline underline-offset-2 hover:text-foreground text-muted-foreground">
            Clear filters
          </button>
        </div>
      )}

      {/* Project grid */}
      {filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {filtered.map((project) => {
            const canDelete = isPlatformAdmin || project.creator?.id === currentUserId;
            const roles = project.roles_seeking ?? [];

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

                  {/* Stars + language */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {project.stars > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {project.stars.toLocaleString()}
                      </span>
                    )}
                    {project.language && (
                      <span className="flex items-center gap-1">
                        <Code className="size-3" /> {project.language}
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
                        const colorCls  = ROLE_COLORS[r] ?? "bg-muted text-muted-foreground border-border";
                        return (
                          <button
                            key={r}
                            onClick={() => setRoleFilter(roleFilter === r ? null : r)}
                            className={cn(
                              "text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors",
                              colorCls,
                              roleFilter === r && "ring-1 ring-offset-1 ring-current"
                            )}
                            title={`Filter by ${roleLabel}`}
                          >
                            {roleLabel}
                          </button>
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

                  {/* Added by */}
                  {project.creator && (
                    <p className="text-[11px] text-muted-foreground mt-auto pt-1">
                      Added by {project.creator.display_name}
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

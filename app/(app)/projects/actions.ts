"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── GitHub metadata fetch ─────────────────────────────────────────────────────

export interface GitHubMeta {
  title: string;
  description: string | null;
  image_url: string;
  stars: number;
  language: string | null;
}

export async function fetchGitHubMeta(githubUrl: string): Promise<{ data?: GitHubMeta; error?: string }> {
  const match = githubUrl.trim().match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!match) return { error: "Please enter a valid GitHub repository URL." };
  const [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, "");

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "what-we-will-community-platform",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      if (res.status === 404) return { error: "Repository not found. Make sure the URL is correct and the repo is public." };
      return { error: `GitHub API error: ${res.status}` };
    }
    const json = await res.json();
    return {
      data: {
        title: json.name as string,
        description: (json.description as string | null) ?? null,
        // GitHub's social preview OG image
        image_url: `https://opengraph.githubassets.com/1/${owner}/${cleanRepo}`,
        stars: (json.stargazers_count as number) ?? 0,
        language: (json.language as string | null) ?? null,
      },
    };
  } catch {
    return { error: "Could not reach GitHub. Please try again." };
  }
}

// ── Project CRUD ──────────────────────────────────────────────────────────────

export interface ProjectFormData {
  github_url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  language: string | null;
  stars: number;
  roles_seeking: string[];
  offers_mentorship: boolean;
  seeks_mentorship: boolean;
}

export async function createProject(data: ProjectFormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("projects").insert({
    created_by: user.id,
    github_url: data.github_url.trim(),
    title: data.title.trim(),
    description: data.description?.trim() || null,
    image_url: data.image_url || null,
    language: data.language || null,
    stars: data.stars,
    roles_seeking: data.roles_seeking,
    offers_mentorship: data.offers_mentorship,
    seeks_mentorship: data.seeks_mentorship,
  });

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

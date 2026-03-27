"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ResourceType } from "./types";
import { logger } from "@/lib/logger";

// ── Paths ─────────────────────────────────────────────────────────────────────

export async function createPath(title: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("learning_paths").insert({
    title: title.trim(),
    description: description.trim() || null,
    created_by: user.id,
  });
  if (error) {
    logger.error("server-action:error", { action: "createPath", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "createPath", userId: user.id, revalidated: ["/learning"] });
  return { error: null };
}

export async function deletePath(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("learning_paths").delete().eq("id", id);
  if (error) {
    logger.error("server-action:error", { action: "deletePath", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "deletePath", userId: user.id, pathId: id, revalidated: ["/learning"] });
  return { error: null };
}

export async function toggleStarPath(id: string, current: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admins only" };

  const { error } = await supabase
    .from("learning_paths").update({ is_starred: !current }).eq("id", id);
  if (error) {
    logger.error("server-action:error", { action: "toggleStarPath", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "toggleStarPath", userId: user.id, pathId: id, starred: !current, revalidated: ["/learning"] });
  return { error: null };
}

// ── Path Items ────────────────────────────────────────────────────────────────

export async function addPathItem(
  pathId: string,
  title: string,
  url: string,
  description: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [{ data: path }, { data: profile }] = await Promise.all([
    supabase.from("learning_paths").select("created_by").eq("id", pathId).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (path?.created_by !== user.id && profile?.role !== "admin") {
    return { error: "Only the path creator or admins can add resources" };
  }

  const { data: existing } = await supabase
    .from("learning_path_items")
    .select("position")
    .eq("path_id", pathId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("learning_path_items").insert({
    path_id: pathId,
    title: title.trim(),
    url: url.trim(),
    description: description.trim() || null,
    position: nextPosition,
  });
  if (error) {
    logger.error("server-action:error", { action: "addPathItem", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "addPathItem", userId: user.id, pathId, revalidated: ["/learning"] });
  return { error: null };
}

export async function deletePathItem(id: string, pathId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [{ data: path }, { data: profile }] = await Promise.all([
    supabase.from("learning_paths").select("created_by").eq("id", pathId).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (path?.created_by !== user.id && profile?.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase.from("learning_path_items").delete().eq("id", id);
  if (error) {
    logger.error("server-action:error", { action: "deletePathItem", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "deletePathItem", userId: user.id, itemId: id, pathId, revalidated: ["/learning"] });
  return { error: null };
}

// ── Resources ─────────────────────────────────────────────────────────────────

export async function addResource(
  type: ResourceType,
  title: string,
  url: string,
  description: string,
  tags: string[] = [],
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("learning_resources").insert({
    type,
    title: title.trim(),
    url: url.trim(),
    description: description.trim() || null,
    tags,
    added_by: user.id,
  });
  if (error) {
    logger.error("server-action:error", { action: "addResource", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "addResource", userId: user.id, resourceType: type, revalidated: ["/learning"] });
  return { error: null };
}

export async function deleteResource(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("learning_resources").delete().eq("id", id);
  if (error) {
    logger.error("server-action:error", { action: "deleteResource", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "deleteResource", userId: user.id, resourceId: id, revalidated: ["/learning"] });
  return { error: null };
}

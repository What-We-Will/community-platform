"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export type LinkCategory =
  | "organization"
  | "learning"
  | "tool"
  | "article"
  | "other"
  | "job_board_general"
  | "job_board_remote"
  | "job_board_civic"
  | "community"
  | "labor_org";

export async function createLink(formData: {
  title: string;
  url: string;
  description?: string;
  category: LinkCategory;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Normalise URL — add https:// if missing
  let url = formData.url.trim();
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

  const { error } = await supabase.from("community_links").insert({
    title: formData.title.trim(),
    url,
    description: formData.description?.trim() || null,
    category: formData.category,
    posted_by: user.id,
  });

  if (error) {
    logger.error("server-action:error", { action: "createLink", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/links");
  logger.info("server-action:complete", { action: "createLink", userId: user.id, category: formData.category, revalidated: ["/links"] });
  return {};
}

export async function deleteLink(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("community_links").delete().eq("id", id);
  if (error) {
    logger.error("server-action:error", { action: "deleteLink", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/links");
  logger.info("server-action:complete", { action: "deleteLink", userId: user.id, linkId: id, revalidated: ["/links"] });
  return {};
}

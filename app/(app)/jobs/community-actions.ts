"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addToWishlist(jobPostingId: string, company: string, position: string, url?: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Avoid duplicates — check if already wishlisted
  const { data: existing } = await supabase
    .from("job_applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_posting_id", jobPostingId)
    .maybeSingle();

  if (existing) return { error: "already_wishlisted" };

  const { error } = await supabase.from("job_applications").insert({
    user_id: user.id,
    job_posting_id: jobPostingId,
    company,
    position,
    status: "wishlist",
    url: url ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath("/tracker");
  return {};
}

export async function removeFromWishlist(jobPostingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("user_id", user.id)
    .eq("job_posting_id", jobPostingId)
    .eq("status", "wishlist");

  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath("/tracker");
  return {};
}

export async function addJobComment(jobPostingId: string, content: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("job_posting_comments").insert({
    job_posting_id: jobPostingId,
    user_id: user.id,
    content: content.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath("/jobs");
  return {};
}

export async function deleteJobComment(commentId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("job_posting_comments")
    .delete()
    .eq("id", commentId);

  if (error) return { error: error.message };
  revalidatePath("/jobs");
  return {};
}

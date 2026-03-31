"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  return { supabase, userId: user.id };
}

export async function createNewsPost(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const isPublished = formData.get("is_published") === "on";
  const coverImageUrl = String(formData.get("cover_image_url") ?? "").trim();

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  const slug = toSlug(slugInput || title);
  if (!slug) throw new Error("Please provide a valid slug or title.");

  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("news_posts").insert({
    title,
    slug,
    excerpt: excerpt || null,
    content,
    is_published: isPublished,
    published_at: isPublished ? nowIso : null,
    cover_image_url: coverImageUrl || null,
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
}

export async function deleteNewsPost(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing post id.");

  const { error } = await supabase.from("news_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
}

export async function togglePublishNewsPost(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const publish = String(formData.get("publish") ?? "") === "true";
  if (!id) throw new Error("Missing post id.");

  const { error } = await supabase
    .from("news_posts")
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
}

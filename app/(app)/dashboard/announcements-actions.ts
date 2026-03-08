"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return supabase;
}

export async function createAnnouncement(content: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("announcements").insert({
      content: content.trim(),
      created_by: user!.id,
    });
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateAnnouncement(id: string, content: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("announcements")
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteAnnouncement(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

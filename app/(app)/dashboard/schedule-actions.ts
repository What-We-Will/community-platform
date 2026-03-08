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

export async function createScheduleRow(
  row: { name: string; days: string; time: string; position: number }
): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("weekly_schedule").insert(row);
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateScheduleRow(
  id: string,
  row: { name: string; days: string; time: string }
): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("weekly_schedule")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteScheduleRow(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("weekly_schedule").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

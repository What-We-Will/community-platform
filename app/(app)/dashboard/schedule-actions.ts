"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ScheduleCategory } from "@/lib/utils/weekly-schedule";

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

  return supabase;
}

export async function createScheduleRow(row: {
  name: string;
  days: string;
  time: string;
  zoom_url: string;
  position: number;
  category: ScheduleCategory;
}): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("weekly_schedule")
      .insert({
        ...row,
        zoom_url: row.zoom_url.trim() || null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    if (!data) return { error: "Insert failed — no row returned" };

    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateScheduleRow(
  id: string,
  row: {
    name: string;
    days: string;
    time: string;
    zoom_url: string;
  }
): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("weekly_schedule")
      .update({
        name: row.name,
        days: row.days,
        time: row.time,
        zoom_url: row.zoom_url.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")
      .single();

    if (error) return { error: error.message };
    if (!data) return { error: "Update failed — row not found" };

    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteScheduleRow(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("weekly_schedule")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) return { error: error.message };
    if (!data) return { error: "Delete failed — row not found" };

    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

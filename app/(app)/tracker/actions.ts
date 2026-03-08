"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ApplicationStatus =
  | "wishlist" | "applied" | "phone_screen"
  | "first_interview" | "second_interview" | "third_interview"
  | "offer" | "rejected" | "withdrawn" | "interview";

export interface JobApplicationInput {
  company: string;
  position: string;
  applied_date?: string;
  status: ApplicationStatus;
  notes?: string;
  url?: string;
  is_shared?: boolean;
}

export async function createApplication(input: JobApplicationInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("job_applications").insert({ ...input, user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/tracker");
  return {};
}

export async function updateApplication(
  id: string,
  input: Partial<JobApplicationInput>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase
    .from("job_applications")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/tracker");
  return {};
}

export async function deleteApplication(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/tracker");
  return {};
}

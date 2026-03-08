"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type JobType = "full_time" | "part_time" | "contract" | "internship" | "volunteer";

export interface JobPostingInput {
  title: string;
  company: string;
  location?: string;
  job_type: JobType;
  description?: string;
  url?: string;
}

export async function createJobPosting(input: JobPostingInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("job_postings").insert({
    ...input,
    posted_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/jobs");
  return {};
}

export async function deleteJobPosting(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("job_postings").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/jobs");
  return {};
}

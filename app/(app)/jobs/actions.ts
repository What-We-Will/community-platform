"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findExistingDM, createDMConversation } from "@/lib/messages";

export type JobType = "full_time" | "part_time" | "contract" | "internship" | "volunteer";

export interface JobPostingInput {
  title: string;
  company: string;
  location?: string;
  job_type: JobType;
  description?: string;
  url?: string;
  roles?: string[];
  offers_referral?: boolean;
  is_community_network?: boolean;
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

export async function messageJobPoster(posterId: string): Promise<never> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let conversationId = await findExistingDM(user.id, posterId);
  if (!conversationId) {
    conversationId = await createDMConversation(user.id, posterId);
  }
  redirect(`/messages/${conversationId}`);
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

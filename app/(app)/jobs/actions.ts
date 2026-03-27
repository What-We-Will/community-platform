"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findExistingDM, createDMConversation } from "@/lib/messages";
import { logger } from "@/lib/logger";

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

  if (error) {
    logger.error("server-action:error", { action: "createJobPosting", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/jobs");
  logger.info("server-action:complete", { action: "createJobPosting", userId: user.id, company: input.company, revalidated: ["/jobs"] });
  return {};
}

export async function updateJobPosting(
  id: string,
  input: Partial<JobPostingInput>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership or admin — mirrors the RLS policy
  const { data: posting } = await supabase
    .from("job_postings")
    .select("posted_by")
    .eq("id", id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isPoster = posting?.posted_by === user.id;

  if (!isAdmin && !isPoster) return { error: "Not authorized" };

  const { error } = await supabase
    .from("job_postings")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    logger.error("server-action:error", { action: "updateJobPosting", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/jobs");
  logger.info("server-action:complete", { action: "updateJobPosting", userId: user.id, jobPostingId: id, revalidated: ["/jobs"] });
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
  if (error) {
    logger.error("server-action:error", { action: "deleteJobPosting", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/jobs");
  logger.info("server-action:complete", { action: "deleteJobPosting", userId: user.id, jobPostingId: id, revalidated: ["/jobs"] });
  return {};
}

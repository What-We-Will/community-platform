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
  community_notes?: string;
  url?: string;
  is_shared?: boolean;
}

export async function createApplication(input: JobApplicationInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Seed status_dates with today for the initial status
  const today = new Date().toISOString().split("T")[0];
  const status_dates: Record<string, string> = { [input.status]: today };
  if (input.applied_date) status_dates["applied"] = input.applied_date;

  const { error } = await supabase.from("job_applications").insert({
    ...input,
    user_id: user.id,
    status_dates,
  });
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

  // If status is changing, auto-record today's date for the new status
  // (only if the caller hasn't explicitly provided status_dates)
  let extra: Record<string, unknown> = {};
  if (input.status) {
    const { data: existing } = await supabase
      .from("job_applications")
      .select("status, status_dates")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existing && existing.status !== input.status) {
      const currentDates = (existing.status_dates ?? {}) as Record<string, string>;
      if (!currentDates[input.status]) {
        const today = new Date().toISOString().split("T")[0];
        extra = { status_dates: { ...currentDates, [input.status]: today } };
      }
    }
  }

  const { error } = await supabase
    .from("job_applications")
    .update({ ...input, ...extra, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/tracker");
  return {};
}

/** Saves the date recorded for a specific status stage */
export async function updateStatusDate(
  id: string,
  status: ApplicationStatus,
  date: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("job_applications")
    .select("status_dates")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) return { error: "Not found" };

  const currentDates = (existing.status_dates ?? {}) as Record<string, string>;
  const updated = date
    ? { ...currentDates, [status]: date }
    : Object.fromEntries(Object.entries(currentDates).filter(([k]) => k !== status));

  const { error } = await supabase
    .from("job_applications")
    .update({ status_dates: updated, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/tracker");
  return {};
}

/**
 * Syncs the community note from a tracker entry to job_posting_comments.
 * Called when community_notes is saved on an application that has a job_posting_id.
 * Passing an empty string deletes any existing comment.
 */
export async function syncCommunityNote(
  jobPostingId: string,
  content: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!content.trim()) {
    // Remove the comment if content is cleared
    await supabase
      .from("job_posting_comments")
      .delete()
      .eq("job_posting_id", jobPostingId)
      .eq("user_id", user.id);
    revalidatePath("/jobs");
    return {};
  }

  // Upsert: update existing comment or insert new one
  const { data: existing } = await supabase
    .from("job_posting_comments")
    .select("id")
    .eq("job_posting_id", jobPostingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("job_posting_comments")
      .update({ content: content.trim() })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("job_posting_comments")
      .insert({ job_posting_id: jobPostingId, user_id: user.id, content: content.trim() });
  }

  revalidatePath("/jobs");
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

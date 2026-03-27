"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function createPollAction(formData: FormData) {
  const question = formData.get("question") as string | null;
  const optionsRaw = formData.get("options") as string | null; // JSON array of strings
  const allowMultiple = formData.get("allow_multiple") === "true";

  if (!question?.trim()) {
    return { error: "Question is required." };
  }

  let options: string[] = [];
  try {
    options = optionsRaw ? JSON.parse(optionsRaw) : [];
  } catch {
    return { error: "Invalid options." };
  }

  const labels = options
    .map((o) => (typeof o === "string" ? o.trim() : ""))
    .filter(Boolean);

  if (labels.length < 2 || labels.length > 4) {
    return { error: "Provide between 2 and 4 options." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to create a poll." };
  }

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      question: question.trim(),
      created_by: user.id,
      group_id: null,
      allow_multiple: allowMultiple,
      closes_at: null,
    })
    .select("id")
    .single();

  if (pollError || !poll) {
    return { error: pollError?.message ?? "Failed to create poll." };
  }

  const { error: optionsError } = await supabase.from("poll_options").insert(
    labels.map((label, i) => ({
      poll_id: poll.id,
      label,
      order_index: i,
    }))
  );

  if (optionsError) {
    return { error: optionsError.message ?? "Failed to add options." };
  }

  revalidatePath("/dashboard");
  logger.info("server-action:complete", { action: "createPoll", userId: user.id, pollId: poll.id, revalidated: ["/dashboard"] });
  return { success: true };
}

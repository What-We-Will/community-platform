"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FLAG_KEYS, invalidateFlagSnapshot } from "@/lib/feature-flags";

export type SetFeatureFlagResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "unauthorized" | "conflict" | "failed" };

export async function setFeatureFlagEnabled(input: {
  key: string;
  enabled: boolean;
  expectedUpdatedAt: string;
}): Promise<SetFeatureFlagResult> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "invalid" };
  }
  const { key, enabled, expectedUpdatedAt } = input;
  if (
    typeof key !== "string" ||
    !(FLAG_KEYS as readonly string[]).includes(key) ||
    typeof enabled !== "boolean" ||
    typeof expectedUpdatedAt !== "string" ||
    Number.isNaN(Date.parse(expectedUpdatedAt))
  ) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: "unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || profile?.role !== "admin") {
    return { ok: false, error: "unauthorized" };
  }

  const { data, error } = await supabase
    .from("feature_flags")
    .update({ enabled })
    .eq("key", key)
    .eq("updated_at", expectedUpdatedAt)
    .select("key");

  if (error) {
    console.error("[feature-flags] Update failed:", error);
    return { ok: false, error: "failed" };
  }
  // RLS denial on update returns zero rows without an error, so an empty
  // result can never be reported as success.
  if (!data || data.length === 0) {
    return { ok: false, error: "conflict" };
  }

  invalidateFlagSnapshot();
  revalidatePath("/admin/feature-flags");
  revalidatePath("/", "layout");
  return { ok: true };
}

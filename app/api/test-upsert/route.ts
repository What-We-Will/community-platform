import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Test endpoint — remove before going to production
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, step: "auth", error: authError?.message ?? "Not signed in" },
      { status: 401 }
    );
  }

  // Step 1: Read current state
  const { data: before, error: readError } = await supabase
    .from("profiles")
    .select("id, display_name, headline, is_onboarded, updated_at")
    .eq("id", user.id)
    .single();

  if (readError) {
    return NextResponse.json(
      { ok: false, step: "read", error: readError.message },
      { status: 500 }
    );
  }

  // Step 2: Upsert with a sentinel headline value
  const testHeadline = `upsert-test-${Date.now()}`;
  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: before?.display_name ?? user.email ?? "Test",
      headline: testHeadline,
      is_onboarded: true,
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    return NextResponse.json(
      { ok: false, step: "upsert", error: upsertError.message },
      { status: 500 }
    );
  }

  // Step 3: Read back to confirm write persisted
  const { data: after, error: confirmError } = await supabase
    .from("profiles")
    .select("id, display_name, headline, is_onboarded, updated_at")
    .eq("id", user.id)
    .single();

  if (confirmError) {
    return NextResponse.json(
      { ok: false, step: "confirm-read", error: confirmError.message },
      { status: 500 }
    );
  }

  // Step 4: Restore original headline
  await supabase
    .from("profiles")
    .update({ headline: before?.headline ?? null })
    .eq("id", user.id);

  const upsertWorked = after?.headline === testHeadline;

  return NextResponse.json({
    ok: upsertWorked,
    user_id: user.id,
    before,
    after,
    expected_headline: testHeadline,
    headline_matched: upsertWorked,
  });
}

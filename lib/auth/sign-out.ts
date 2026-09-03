import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

interface SignOutRouter {
  push(href: string): void;
  refresh(): void;
}

/**
 * The one sign-out path for every logout surface. Clears the superset of the
 * middleware cache cookies (the two legacy surfaces each cleared a different
 * subset) and resets analytics identity with `reset(true)` — the `true` also
 * rotates `$device_id`, so successive accounts on a shared browser cannot be
 * correlated. Bare `reset()` is a privacy regression.
 */
export async function signOutAndReset(router: SignOutRouter): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  document.cookie = "profile_onboarded=; path=/; max-age=0; samesite=lax";
  document.cookie = "profile_approved=; path=/; max-age=0; samesite=lax";
  if (posthog.__loaded) {
    posthog.reset(true);
  }
  router.push("/login");
  router.refresh();
}

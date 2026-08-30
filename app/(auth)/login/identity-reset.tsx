"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * PostHog persistence (localStorage) outlives the Supabase session. On a
 * shared computer an expired session would otherwise attribute the next
 * person's activity to the previous member — so the login page clears any
 * lingering identified state on load. An identified visitor is one whose
 * distinct_id has diverged from the device id.
 */
export default function IdentityReset() {
  useEffect(() => {
    if (!posthog.__loaded) return;
    if (posthog.get_distinct_id() !== posthog.get_property("$device_id")) {
      posthog.reset(true);
    }
  }, []);

  return null;
}

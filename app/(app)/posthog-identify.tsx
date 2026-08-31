"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Identifies the member to PostHog with the Supabase UUID and nothing else —
 * no person properties, no email, no display name (ADR privacy criterion).
 *
 * PostHog persistence outlives the Supabase session, and OAuth/magic-link
 * entry never passes the login page's reset — so a lingering identified id
 * from a different member (shared computer) is cleared here, immediately
 * before identification. An identified visitor is one whose distinct_id has
 * diverged from the device id.
 */
export default function PostHogIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    if (!posthog.__loaded) return;
    const distinctId = posthog.get_distinct_id();
    if (
      distinctId !== userId &&
      distinctId !== posthog.get_property("$device_id")
    ) {
      posthog.reset(true);
    }
    posthog.identify(userId);
  }, [userId]);

  return null;
}

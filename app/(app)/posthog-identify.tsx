"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Identifies the member to PostHog with the Supabase UUID and nothing else —
 * no person properties, no email, no display name (ADR privacy criterion).
 */
export default function PostHogIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    if (posthog.__loaded) {
      posthog.identify(userId);
    }
  }, [userId]);

  return null;
}

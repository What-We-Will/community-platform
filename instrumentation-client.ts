import posthog from "posthog-js";
import { buildPosthogClientConfig } from "@/lib/analytics/client-config";

// Token unset (dev, preview, prod pre-enablement) → PostHog never initializes
// and nothing is sent. The token is the only enable switch.
const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token) {
  posthog.init(
    token,
    buildPosthogClientConfig({ origin: window.location.origin })
  );
}

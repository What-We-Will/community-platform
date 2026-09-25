/**
 * @vitest-environment jsdom
 */
// jsdom, not node: the helper's observable side effects are document.cookie writes.
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import { signOutAndReset } from "./sign-out";

vi.mock("posthog-js", () => ({
  default: { __loaded: true, reset: vi.fn() },
}));

const { signOut } = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ auth: { signOut } })),
}));

function makeRouter() {
  return { push: vi.fn(), refresh: vi.fn() };
}

describe("signOutAndReset — the single sign-out path for every logout surface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    posthog.__loaded = true;
    document.cookie = "profile_onboarded=1; path=/";
    document.cookie = "profile_approved=1; path=/";
  });

  it("should sign out of Supabase when invoked", async () => {
    const router = makeRouter();

    await signOutAndReset(router);

    expect(createClient).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
  });

  it("should clear both onboarding and approval cookies when signing out", async () => {
    // Superset of what the two legacy surfaces cleared individually — the
    // shared helper must not regress either one.
    await signOutAndReset(makeRouter());

    expect(document.cookie).not.toContain("profile_onboarded");
    expect(document.cookie).not.toContain("profile_approved");
  });

  it("should reset PostHog identity including the device id when signing out", async () => {
    await signOutAndReset(makeRouter());

    expect(posthog.reset).toHaveBeenCalledWith(true);
  });

  it("should skip the PostHog reset when the SDK never initialized", async () => {
    posthog.__loaded = false;

    await signOutAndReset(makeRouter());

    expect(posthog.reset).not.toHaveBeenCalled();
  });

  it("should navigate to the login page and refresh when signing out", async () => {
    const router = makeRouter();

    await signOutAndReset(router);

    expect(router.push).toHaveBeenCalledWith("/login");
    expect(router.refresh).toHaveBeenCalled();
  });
});

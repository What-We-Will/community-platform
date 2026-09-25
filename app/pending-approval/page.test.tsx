import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import posthog from "posthog-js";
import PendingApprovalPage from "./page";

const { push, refresh, signOut, getUser } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("posthog-js", () => ({
  default: { __loaded: true, reset: vi.fn() },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signOut, getUser },
  })),
}));

describe("Pending approval sign out — uses the shared sign-out helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "profile_onboarded=1; path=/";
    document.cookie = "profile_approved=1; path=/";
  });

  it("should sign out, clear both cookies, and reset analytics identity when Sign out is clicked", async () => {
    render(<PendingApprovalPage />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(signOut).toHaveBeenCalled();
    expect(document.cookie).not.toContain("profile_onboarded");
    expect(document.cookie).not.toContain("profile_approved");
    expect(posthog.reset).toHaveBeenCalledWith(true);
    expect(refresh).toHaveBeenCalled();
  });
});

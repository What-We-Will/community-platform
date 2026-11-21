/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import FeatureFlagsPage from "./page";

const { createClient, setFeatureFlagEnabled } = vi.hoisted(() => ({
  createClient: vi.fn(),
  setFeatureFlagEnabled: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("server-only", () => ({}));
vi.mock("./actions", () => ({ setFeatureFlagEnabled }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("Feature flags admin page — each switch carries its own row's version", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setFeatureFlagEnabled.mockResolvedValue({ ok: true });
  });

  it("should send the flag's own updated_at when an admin flips it", async () => {
    const { client } = buildMockSupabaseClient({
      tables: {
        feature_flags: {
          data: [
            makeFeatureFlagRow({ key: "learningTracker", updated_at: "2026-11-01T08:00:00.000Z" }),
            makeFeatureFlagRow({ key: "projects", updated_at: "2026-11-19T17:45:12.345Z" }),
          ],
          error: null,
        },
        feature_flag_changes: { data: [], error: null },
      },
    });
    createClient.mockResolvedValue(client);
    render(await FeatureFlagsPage());

    await userEvent.click(screen.getByRole("switch", { name: "Projects" }));

    await waitFor(() =>
      expect(setFeatureFlagEnabled).toHaveBeenCalledWith({
        key: "projects",
        enabled: true,
        expectedUpdatedAt: "2026-11-19T17:45:12.345Z",
      })
    );
  });
});

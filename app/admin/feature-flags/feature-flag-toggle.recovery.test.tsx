/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeatureFlagToggle } from "./feature-flag-toggle";

const { setFeatureFlagEnabled, refresh } = vi.hoisted(() => ({
  setFeatureFlagEnabled: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("./actions", () => ({ setFeatureFlagEnabled }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

async function flipProjectsOn() {
  render(
    <FeatureFlagToggle
      flagKey="projects"
      label="Projects"
      enabled={false}
      updatedAt="2026-11-20T00:00:00.000Z"
    />
  );
  await userEvent.click(screen.getByRole("switch", { name: "Projects" }));
}

describe("Feature flag toggle — recovering from failed flips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should refresh the page data when the flag changed since the page loaded", async () => {
    setFeatureFlagEnabled.mockResolvedValue({ ok: false, error: "conflict" });

    await flipProjectsOn();

    expect(await screen.findByRole("alert")).toHaveTextContent(/changed since the page loaded/);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("should not refresh the page data when the flip failed for another reason", async () => {
    setFeatureFlagEnabled.mockResolvedValue({ ok: false, error: "failed" });

    await flipProjectsOn();

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update this flag.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("should show the generic failure message when the action call itself throws", async () => {
    setFeatureFlagEnabled.mockRejectedValue(new Error("network down"));

    await flipProjectsOn();

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update this flag. Try again.");
  });

  it("should clear an earlier error when a later flip succeeds", async () => {
    setFeatureFlagEnabled
      .mockResolvedValueOnce({ ok: false, error: "failed" })
      .mockResolvedValueOnce({ ok: true });
    await flipProjectsOn();
    await screen.findByRole("alert");

    await userEvent.click(screen.getByRole("switch", { name: "Projects" }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(setFeatureFlagEnabled).toHaveBeenCalledTimes(2);
  });
});

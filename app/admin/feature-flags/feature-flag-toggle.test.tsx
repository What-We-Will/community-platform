/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeatureFlagToggle } from "./feature-flag-toggle";

const { setFeatureFlagEnabled } = vi.hoisted(() => ({
  setFeatureFlagEnabled: vi.fn(),
}));

vi.mock("./actions", () => ({ setFeatureFlagEnabled }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const UPDATED_AT = "2026-11-20T00:00:00.000Z";

function renderToggle(enabled: boolean) {
  render(
    <FeatureFlagToggle
      flagKey="projects"
      label="Projects"
      enabled={enabled}
      updatedAt={UPDATED_AT}
    />
  );
  return screen.getByRole("switch", { name: "Projects" });
}

describe("Feature flag toggle — admin flips a flag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setFeatureFlagEnabled.mockResolvedValue({ ok: true });
  });

  it("should turn a flag on without confirmation when it is off", async () => {
    const toggle = renderToggle(false);

    await userEvent.click(toggle);

    await waitFor(() =>
      expect(setFeatureFlagEnabled).toHaveBeenCalledWith({
        key: "projects",
        enabled: true,
        expectedUpdatedAt: UPDATED_AT,
      })
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("should not flip the switch optimistically when the action succeeds", async () => {
    const toggle = renderToggle(false);

    await userEvent.click(toggle);

    await waitFor(() => expect(setFeatureFlagEnabled).toHaveBeenCalled());
    expect(toggle).not.toBeChecked();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("should disable the switch without flipping it when a flip is still in flight", async () => {
    setFeatureFlagEnabled.mockReturnValue(new Promise(() => {}));
    const toggle = renderToggle(false);

    await userEvent.click(toggle);

    await waitFor(() => expect(toggle).toBeDisabled());
    expect(toggle).not.toBeChecked();
  });

  it.each([
    ["conflict", "This flag changed since the page loaded. Showing the current state now."],
    ["unauthorized", "You don't have permission to change feature flags."],
    ["failed", "Could not update this flag. Try again."],
    ["invalid", "Could not update this flag. Try again."],
  ])("should explain the problem when the action returns %s", async (error, message) => {
    setFeatureFlagEnabled.mockResolvedValue({ ok: false, error });
    const toggle = renderToggle(false);

    await userEvent.click(toggle);

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});

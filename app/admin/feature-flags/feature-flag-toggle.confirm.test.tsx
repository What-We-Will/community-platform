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

describe("Feature flag toggle — confirming before turning a flag off", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setFeatureFlagEnabled.mockResolvedValue({ ok: true });
  });

  it("should warn that members lose access when asking to confirm turning off", async () => {
    const toggle = renderToggle(true);

    await userEvent.click(toggle);

    const dialog = await screen.findByRole("alertdialog", { name: "Turn off Projects?" });
    expect(dialog).toHaveTextContent(/lose access/);
    expect(setFeatureFlagEnabled).not.toHaveBeenCalled();
  });

  it("should send nothing and keep the flag on when turning off is cancelled", async () => {
    const toggle = renderToggle(true);
    await userEvent.click(toggle);
    const cancel = await screen.findByRole("button", { name: "Cancel" });

    await userEvent.click(cancel);

    expect(setFeatureFlagEnabled).not.toHaveBeenCalled();
    expect(toggle).toBeChecked();
  });

  it("should turn the flag off at the loaded version when the admin confirms", async () => {
    const toggle = renderToggle(true);

    await userEvent.click(toggle);
    await userEvent.click(await screen.findByRole("button", { name: "Turn off" }));

    await waitFor(() =>
      expect(setFeatureFlagEnabled).toHaveBeenCalledWith({
        key: "projects",
        enabled: false,
        expectedUpdatedAt: UPDATED_AT,
      })
    );
  });

  it("should close the confirmation dialog when the admin confirms", async () => {
    renderToggle(true);
    await userEvent.click(screen.getByRole("switch", { name: "Projects" }));
    const turnOff = await screen.findByRole("button", { name: "Turn off" });

    await userEvent.click(turnOff);

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it.each([
    ["cancels with Escape", "{Escape}"],
    ["confirms with Enter on Turn off", "{Tab}{Enter}"],
  ])("should return keyboard focus to the switch when the admin %s", async (_case, keys) => {
    const toggle = renderToggle(true);
    toggle.focus();
    await userEvent.keyboard(" ");
    await screen.findByRole("alertdialog");

    await userEvent.keyboard(keys);

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(toggle).toHaveFocus());
  });
});

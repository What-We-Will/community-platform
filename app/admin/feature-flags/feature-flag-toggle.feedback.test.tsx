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

function renderToggle(enabled: boolean) {
  render(
    <FeatureFlagToggle
      flagKey="projects"
      label="Projects"
      enabled={enabled}
      updatedAt="2026-11-20T00:00:00.000Z"
    />
  );
  return screen.getByRole("switch", { name: "Projects" });
}

describe("Feature flag toggle — what the admin sees around a flip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setFeatureFlagEnabled.mockResolvedValue({ ok: true });
  });

  it.each([
    [true, "On"],
    [false, "Off"],
  ])("should show the stored state as text when the flag is enabled=%s", (enabled, text) => {
    renderToggle(enabled);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("should show saving instead of the state when a flip is still in flight", async () => {
    let finish: (result: { ok: true }) => void = () => {};
    setFeatureFlagEnabled.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const toggle = renderToggle(false);

    await userEvent.click(toggle);

    expect(await screen.findByText("Saving…")).toBeInTheDocument();
    expect(screen.queryByText("Off")).toBeNull();
    // React 19 holds later transitions behind an unsettled one, so settle it before the next test.
    finish({ ok: true });
    await waitFor(() => expect(screen.queryByText("Saving…")).toBeNull());
  });

  it("should announce only that the flag turned on when turning on succeeds", async () => {
    const toggle = renderToggle(false);

    await userEvent.click(toggle);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/^Projects turned on\.$/)
    );
  });

  it("should announce the flag turned off when the admin confirms turning it off", async () => {
    const toggle = renderToggle(true);
    await userEvent.click(toggle);

    await userEvent.click(screen.getByRole("button", { name: "Turn off" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/^Projects turned off\.$/)
    );
  });

  it("should drop the success message when a later flip fails", async () => {
    setFeatureFlagEnabled
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, error: "failed" });
    const toggle = renderToggle(false);
    await userEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("turned on"));

    await userEvent.click(toggle);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update this flag.");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

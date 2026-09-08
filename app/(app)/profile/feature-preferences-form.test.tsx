import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FEATURE_KEYS } from "@/lib/feature-keys";
import { FEATURE_DESCRIPTIONS } from "@/lib/feature-preferences";
import FeaturePreferencesForm from "./feature-preferences-form";

// Radix measures the checked indicator, which needs ResizeObserver — absent in jsdom.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const updateEnabledFeaturesMock = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({
  updateEnabledFeatures: updateEnabledFeaturesMock,
}));

describe("FeaturePreferencesForm — editing feature preferences after onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check the features the profile already carries", () => {
    render(<FeaturePreferencesForm initialFeatures={["events"]} />);

    expect(
      screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS.events.label })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: FEATURE_DESCRIPTIONS.discussions.label,
      })
    ).not.toBeChecked();
  });

  it("should resync the checkboxes when the profile arrives with a new selection", () => {
    const { rerender } = render(
      <FeaturePreferencesForm initialFeatures={["events"]} />
    );

    rerender(<FeaturePreferencesForm initialFeatures={["discussions"]} />);

    expect(
      screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS.events.label })
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: FEATURE_DESCRIPTIONS.discussions.label,
      })
    ).toBeChecked();
  });

  it("should save the edited selection and confirm success", async () => {
    const user = userEvent.setup();
    updateEnabledFeaturesMock.mockResolvedValue({});
    render(<FeaturePreferencesForm initialFeatures={[...FEATURE_KEYS]} />);

    await user.click(
      screen.getByRole("checkbox", {
        name: FEATURE_DESCRIPTIONS.resource_hub.label,
      })
    );
    await user.click(screen.getByRole("button", { name: /save features/i }));

    expect(updateEnabledFeaturesMock).toHaveBeenCalledWith([
      "events",
      "discussions",
      "job_referrals",
    ]);
    expect(await screen.findByText(/features updated/i)).toBeInTheDocument();
  });

  it("should show the server's message when the save is rejected", async () => {
    const user = userEvent.setup();
    updateEnabledFeaturesMock.mockResolvedValue({
      error: "That is not a supported platform feature.",
    });
    render(<FeaturePreferencesForm initialFeatures={[]} />);

    await user.click(screen.getByRole("button", { name: /save features/i }));

    expect(
      await screen.findByText(/not a supported platform feature/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/features updated/i)).not.toBeInTheDocument();
  });
});

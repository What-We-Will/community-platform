import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FEATURE_KEYS } from "@/lib/feature-keys";
import { FEATURE_DESCRIPTIONS } from "@/lib/feature-preferences";
import { makeOnboardingInitialData } from "@/lib/__tests__/factories";
import OnboardingForm from "./onboarding-form";
import type { completeOnboarding } from "./actions";

// TimezoneCombobox renders a Radix popover, which needs ResizeObserver — absent in jsdom.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const completeOnboardingMock = vi.hoisted(() =>
  vi.fn<typeof completeOnboarding>()
);

vi.mock("./actions", () => ({ completeOnboarding: completeOnboardingMock }));
vi.mock("@/app/(app)/profile/actions", () => ({ updateAvatarUrl: vi.fn() }));

const initialData = makeOnboardingInitialData({
  github_url: "https://github.com/janedoe",
});

describe("OnboardingForm — platform feature selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    completeOnboardingMock.mockResolvedValue({});
  });

  // The page seeds the full set when there is no profile row yet, so a new
  // member's onboarding is opt-out.
  it("should check every feature when the page seeds the full set", () => {
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    for (const key of FEATURE_KEYS) {
      expect(
        screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS[key].label })
      ).toBeChecked();
    }
  });

  it("should leave unseeded features unchecked when a member resumes a partial selection", () => {
    render(
      <OnboardingForm
        initialData={makeOnboardingInitialData({
          github_url: "https://github.com/janedoe",
          enabled_features: ["events"],
        })}
        userId="user-1"
      />
    );

    expect(
      screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS.events.label })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: FEATURE_DESCRIPTIONS.discussions.label,
      })
    ).not.toBeChecked();
  });

  it("should submit the full set when the member changes nothing", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    expect(completeOnboardingMock).toHaveBeenCalledWith(
      expect.objectContaining({ enabled_features: [...FEATURE_KEYS] })
    );
  });

  it("should submit only the remaining features when one is deselected", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.click(
      screen.getByRole("checkbox", {
        name: FEATURE_DESCRIPTIONS.job_referrals.label,
      })
    );
    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    expect(completeOnboardingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled_features: ["events", "discussions", "resource_hub"],
      })
    );
  });
});

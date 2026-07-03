import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("./actions", () => ({
  completeOnboarding: completeOnboardingMock,
}));

vi.mock("@/app/(app)/profile/actions", () => ({
  updateAvatarUrl: vi.fn(),
}));

const initialData = {
  display_name: "Jane Doe",
  headline: "",
  location: "",
  bio: "",
  skills: [],
  open_to_referrals: false,
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
};

describe("OnboardingForm — verification link group", () => {
  beforeEach(() => {
    completeOnboardingMock.mockReset();
  });

  it("renders LinkedIn, GitHub, and Website as separate optional inputs", () => {
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    expect(screen.getByLabelText(/linkedin url/i)).not.toBeRequired();
    expect(screen.getByLabelText(/github url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
  });

  it("blocks submission and shows an error when no link is provided", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    expect(
      screen.getByText(/provide at least one link/i)
    ).toBeInTheDocument();
    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });

  it("submits successfully with only a GitHub URL filled in", async () => {
    const user = userEvent.setup();
    completeOnboardingMock.mockResolvedValue({});
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.type(
      screen.getByLabelText(/github url/i),
      "https://github.com/janedoe"
    );
    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    expect(completeOnboardingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: null,
        github_url: "https://github.com/janedoe",
        portfolio_url: null,
      })
    );
    expect(
      screen.queryByText(/provide at least one link/i)
    ).not.toBeInTheDocument();
  });
});

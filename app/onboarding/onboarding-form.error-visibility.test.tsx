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

// The banner renders at the top of the card and the submit button sits below
// every other field, so asserting the message merely exists proves nothing about
// whether a user can see it. These assert it is brought to them.
describe("OnboardingForm — a rejected submit puts its message in front of the user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    completeOnboardingMock.mockReset();
  });

  it("should focus and scroll to the message when no link is provided", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/provide at least one link/i);
    expect(alert).toHaveFocus();
    expect(alert.scrollIntoView).toHaveBeenCalled();
  });

  it("should focus the message again when the same rejection repeats", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialData={initialData} userId="user-1" />);
    const submit = screen.getByRole("button", { name: /complete profile/i });

    await user.click(submit);
    // Moving focus away models the user scrolling back down to try again; the
    // message text is unchanged, so nothing re-renders unless the form forces it.
    screen.getByLabelText(/github url/i).focus();
    await user.click(submit);

    expect(screen.getByRole("alert")).toHaveFocus();
  });

  it("should focus the message when the server rejects the submitted link", async () => {
    const user = userEvent.setup();
    completeOnboardingMock.mockResolvedValue({
      error: "Please provide a valid URL starting with https://",
    });
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.type(
      screen.getByLabelText(/github url/i),
      "http://github.com/janedoe"
    );
    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/valid url starting with https/i);
    expect(alert).toHaveFocus();
  });
});

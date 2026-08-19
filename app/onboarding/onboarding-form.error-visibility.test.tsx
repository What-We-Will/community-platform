import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingForm from "./onboarding-form";
import { HTTPS_URL_ERROR } from "@/lib/utils/url";
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

const linkField = (name: RegExp) =>
  screen.getByLabelText(name) as HTMLInputElement;

// A rejected submit has to say which input is at fault, not just which rule
// failed: the banner sits at the top of the card, a full scroll from the link
// fields. These assert the rejection reaches the field, the way a malformed URL
// already does through the browser's own constraint validation.
describe("OnboardingForm — a rejected link points at the field that caused it", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    completeOnboardingMock.mockReset();
  });

  it("should attach the rule to the first link field when no link is provided", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    expect(linkField(/linkedin url/i).validationMessage).toMatch(
      /provide at least one link/i
    );
    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });

  it("should attach the rejection to the offending field when a link is not https", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.type(linkField(/github url/i), "http://github.com/janedoe");
    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    expect(linkField(/github url/i).validationMessage).toBe(HTTPS_URL_ERROR);
    expect(linkField(/linkedin url/i).validationMessage).toBe("");
    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });

  // A custom validity outliving its cause would block the browser from ever
  // firing submit again, stranding the user on a message they already fixed.
  it("should clear the rejection when the user edits any link", async () => {
    const user = userEvent.setup();
    completeOnboardingMock.mockResolvedValue({});
    render(<OnboardingForm initialData={initialData} userId="user-1" />);
    const submit = screen.getByRole("button", { name: /complete profile/i });

    await user.click(submit);
    await user.type(linkField(/github url/i), "https://github.com/janedoe");

    expect(linkField(/linkedin url/i).validationMessage).toBe("");

    await user.click(submit);

    expect(completeOnboardingMock).toHaveBeenCalled();
  });
});

// Errors belonging to no field keep the banner treatment, which still has to be
// brought to the user rather than painted offscreen above the submit button.
describe("OnboardingForm — an error with no field of its own reaches the banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    completeOnboardingMock.mockReset();
  });

  it("should focus and scroll to the banner when the server rejects for another reason", async () => {
    const user = userEvent.setup();
    completeOnboardingMock.mockResolvedValue({ error: "Something went wrong." });
    render(<OnboardingForm initialData={initialData} userId="user-1" />);

    await user.type(linkField(/github url/i), "https://github.com/janedoe");
    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong.");
    expect(alert).toHaveFocus();
    expect(alert.scrollIntoView).toHaveBeenCalled();
  });
});

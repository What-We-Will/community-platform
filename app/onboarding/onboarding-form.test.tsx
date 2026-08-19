import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingForm from "./onboarding-form";
import type { completeOnboarding } from "./actions";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_TOO_LONG_ERROR,
} from "@/lib/utils/display-name";

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

// The form must never be stricter than the server and the CHECK constraint,
// which both count Unicode code points. A native maxLength attribute counts
// UTF-16 code units and would silently halve the limit for astral-plane names.
describe("OnboardingForm — display name is bounded by code points, not UTF-16 units", () => {
  beforeEach(() => {
    completeOnboardingMock.mockReset();
  });

  it("should block submission and show the shared error when the name is one over the limit", async () => {
    const user = userEvent.setup();
    render(
      <OnboardingForm
        initialData={{
          ...initialData,
          display_name: "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1),
        }}
        userId="user-1"
      />
    );

    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    expect(screen.getByText(DISPLAY_NAME_TOO_LONG_ERROR)).toBeInTheDocument();
    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });

  it("should keep all 100 emoji a user types, where a native maxLength would have stopped at 50", async () => {
    const user = userEvent.setup();
    completeOnboardingMock.mockResolvedValue({});
    const name = "💩".repeat(DISPLAY_NAME_MAX_LENGTH);
    render(
      <OnboardingForm
        initialData={{
          ...initialData,
          display_name: "",
          github_url: "https://github.com/janedoe",
        }}
        userId="user-1"
      />
    );

    // Typed, not seeded through initialData: maxLength only ever constrained
    // user input, so seeding the value would pass with or without the fix.
    const field = screen.getByLabelText(/display name/i) as HTMLInputElement;
    await user.type(field, name);

    expect(Array.from(field.value).length).toBe(DISPLAY_NAME_MAX_LENGTH);

    await user.click(screen.getByRole("button", { name: /complete profile/i }));

    expect(completeOnboardingMock).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: name })
    );
    expect(screen.queryByText(DISPLAY_NAME_TOO_LONG_ERROR)).not.toBeInTheDocument();
  });
});

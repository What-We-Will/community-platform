import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "./profile-form";
import { makeBaseProfile } from "@/lib/__tests__/factories";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_TOO_LONG_ERROR,
} from "@/lib/utils/display-name";
import type { updateProfile } from "./actions";

// TimezoneCombobox renders a Radix popover, which needs ResizeObserver — absent in jsdom.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const updateProfileMock = vi.hoisted(() => vi.fn<typeof updateProfile>());

vi.mock("./actions", () => ({
  updateProfile: updateProfileMock,
  updateAvatarUrl: vi.fn(),
  updateResumePath: vi.fn(),
  getResumeSignedUrl: vi.fn(),
  deleteResume: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// The banner renders at the top of the card and the submit button sits below
// every other field, so asserting the message merely exists proves nothing about
// whether a user can see it. These assert it is brought to them.
describe("ProfileForm — a rejected save puts its message in front of the user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProfileMock.mockReset();
  });

  it("should focus and scroll to the message when the display name is too long", async () => {
    const user = userEvent.setup();
    render(
      <ProfileForm
        profile={makeBaseProfile({
          display_name: "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1),
        })}
      />
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(DISPLAY_NAME_TOO_LONG_ERROR);
    expect(alert).toHaveFocus();
    expect(alert.scrollIntoView).toHaveBeenCalled();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("should focus the message when the server rejects a submitted link", async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({
      error: "Please provide a valid URL starting with https://",
    });
    render(<ProfileForm profile={makeBaseProfile()} />);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/valid url starting with https/i);
    expect(alert).toHaveFocus();
  });
});

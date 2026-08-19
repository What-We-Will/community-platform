import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "./profile-form";
import { makeBaseProfile } from "@/lib/__tests__/factories";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_TOO_LONG_ERROR,
} from "@/lib/utils/display-name";
import { HTTPS_URL_ERROR } from "@/lib/utils/url";
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

const field = (name: RegExp) => screen.getByLabelText(name) as HTMLInputElement;
const save = () => screen.getByRole("button", { name: /save changes/i });

// A rejected save has to say which input is at fault, not just which rule
// failed: the banner sits at the top of the card, a full scroll from the link
// fields. These assert the rejection reaches the field, the way a malformed URL
// already does through the browser's own constraint validation.
describe("ProfileForm — a rejected save points at the field that caused it", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProfileMock.mockReset();
  });

  it("should attach the rejection to the name field when the display name is over the limit", async () => {
    const user = userEvent.setup();
    render(
      <ProfileForm
        profile={makeBaseProfile({
          display_name: "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1),
        })}
      />
    );

    await user.click(save());

    expect(field(/display name/i).validationMessage).toBe(
      DISPLAY_NAME_TOO_LONG_ERROR
    );
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  // The server returns only the first of the three URL errors, so without a
  // client-side check a second bad link repeats an identical message with
  // nothing to say the subject changed.
  it("should attach the rejection to the offending field when a link is not https", async () => {
    const user = userEvent.setup();
    render(
      <ProfileForm
        profile={makeBaseProfile({ portfolio_url: "http://jane.dev" })}
      />
    );

    await user.click(save());

    expect(field(/portfolio url/i).validationMessage).toBe(HTTPS_URL_ERROR);
    expect(field(/github url/i).validationMessage).toBe("");
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  // A custom validity outliving its cause would block the browser from ever
  // firing submit again, stranding the user on a message they already fixed.
  it("should clear the rejection when the user edits the field", async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({});
    render(
      <ProfileForm
        profile={makeBaseProfile({ portfolio_url: "http://jane.dev" })}
      />
    );

    await user.click(save());
    await user.clear(field(/portfolio url/i));
    await user.type(field(/portfolio url/i), "https://jane.dev");

    expect(field(/portfolio url/i).validationMessage).toBe("");

    await user.click(save());

    expect(updateProfileMock).toHaveBeenCalled();
  });
});

// Errors belonging to no field keep the banner treatment, which still has to be
// brought to the user rather than painted offscreen above the submit button.
describe("ProfileForm — an error with no field of its own reaches the banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProfileMock.mockReset();
  });

  it("should focus and scroll to the banner when the server rejects for another reason", async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({ error: "Something went wrong." });
    render(<ProfileForm profile={makeBaseProfile()} />);

    await user.click(save());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong.");
    expect(alert).toHaveFocus();
    expect(alert.scrollIntoView).toHaveBeenCalled();
  });
});

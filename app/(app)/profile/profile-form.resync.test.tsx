import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "./profile-form";
import { makeBaseProfile } from "@/lib/__tests__/factories";

// TimezoneCombobox renders a Radix popover, which needs ResizeObserver — absent in jsdom.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("./actions", () => ({
  updateProfile: vi.fn(),
  updateAvatarUrl: vi.fn(),
  updateResumePath: vi.fn(),
  getResumeSignedUrl: vi.fn(),
  deleteResume: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const field = (name: RegExp) => screen.getByLabelText(name) as HTMLInputElement;

// After a save, router.refresh() hands the form the stored profile. The fields
// must show what the server now holds, not what was typed before the refresh.
describe("ProfileForm — fields follow the profile the server sends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show the refreshed values when a new profile arrives", () => {
    const { rerender } = render(
      <ProfileForm
        profile={makeBaseProfile({ display_name: "Jane Doe", headline: null })}
      />
    );

    rerender(
      <ProfileForm
        profile={makeBaseProfile({
          display_name: "Jane Q. Doe",
          headline: "Platform engineer",
          skills: ["Go", "SQL"],
        })}
      />
    );

    expect(field(/display name/i).value).toBe("Jane Q. Doe");
    expect(field(/headline/i).value).toBe("Platform engineer");
    expect(field(/skills/i).value).toBe("Go, SQL");
  });

  it("should keep unsaved edits when the form re-renders with the same profile", async () => {
    const user = userEvent.setup();
    const profile = makeBaseProfile({ headline: "Engineer" });
    const { rerender } = render(<ProfileForm profile={profile} />);

    await user.clear(field(/headline/i));
    await user.type(field(/headline/i), "Staff engineer");
    rerender(<ProfileForm profile={profile} />);

    expect(field(/headline/i).value).toBe("Staff engineer");
  });

  it("should fall back to empty fields when the refreshed profile clears them", () => {
    const { rerender } = render(
      <ProfileForm
        profile={makeBaseProfile({ headline: "Engineer", location: "Chicago" })}
      />
    );

    rerender(
      <ProfileForm profile={makeBaseProfile({ headline: null, location: null })} />
    );

    expect(field(/headline/i).value).toBe("");
    expect(field(/location/i).value).toBe("");
  });
});

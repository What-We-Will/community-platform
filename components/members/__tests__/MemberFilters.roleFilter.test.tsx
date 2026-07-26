import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MemberFilters from "../MemberFilters";

const pushMock = vi.fn();
const replaceMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => currentSearchParams,
}));

describe("Member filters platform-role dropdown", () => {
  const ROLE = /^role$/i;

  // Radix's Select needs pointer capture and scrollIntoView, neither of which
  // jsdom implements. Captured and restored so the stubs don't outlive the
  // suite that needs them.
  const stubbed = [
    "hasPointerCapture",
    "setPointerCapture",
    "releasePointerCapture",
    "scrollIntoView",
  ] as const;
  const original: Partial<Record<(typeof stubbed)[number], unknown>> = {};

  beforeAll(() => {
    for (const method of stubbed) {
      original[method] = Element.prototype[method];
      Element.prototype[method] = vi.fn(() => false);
    }
  });

  afterAll(() => {
    for (const method of stubbed) {
      Element.prototype[method] = original[method] as never;
    }
  });

  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    currentSearchParams = new URLSearchParams();
  });

  it("should render the dropdown for every viewer", () => {
    render(<MemberFilters allSkills={[]} />);

    expect(screen.getByLabelText(ROLE)).toBeInTheDocument();
  });

  it("should show every role as selectable when opened", async () => {
    const user = userEvent.setup();
    render(<MemberFilters allSkills={[]} />);

    await user.click(screen.getByLabelText(ROLE));

    expect(screen.getByRole("option", { name: /all roles/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /members/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /platform admins/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /moderators/i })).toBeInTheDocument();
  });

  it.each([
    ["member", /^members$/i],
    ["admin", /platform admins/i],
    ["moderator", /moderators/i],
  ])("should show the current selection when the URL carries role=%s", (role, label) => {
    currentSearchParams = new URLSearchParams(`role=${role}`);

    render(<MemberFilters allSkills={[]} />);

    expect(screen.getByLabelText(ROLE)).toHaveTextContent(label);
  });

  it("should fall back to All roles when the URL carries an unknown role", () => {
    currentSearchParams = new URLSearchParams("role=ADMIN");

    render(<MemberFilters allSkills={[]} />);

    expect(screen.getByLabelText(ROLE)).toHaveTextContent(/all roles/i);
  });

  // The listing is unfiltered for a repeated role, so the control must not
  // claim one — reading the first value would say "Members" over a full list.
  it("should fall back to All roles when the URL repeats the role param", () => {
    currentSearchParams = new URLSearchParams("role=member&role=admin");

    render(<MemberFilters allSkills={[]} />);

    expect(screen.getByLabelText(ROLE)).toHaveTextContent(/all roles/i);
  });

  it("should push the chosen role to the URL when a role is selected", async () => {
    const user = userEvent.setup();
    render(<MemberFilters allSkills={[]} />);

    await user.click(screen.getByLabelText(ROLE));
    await user.click(screen.getByRole("option", { name: /moderators/i }));

    expect(pushMock).toHaveBeenCalledWith(
      "/members?role=moderator",
      expect.objectContaining({ scroll: false })
    );
  });

  it("should drop role from the URL when All roles is selected", async () => {
    currentSearchParams = new URLSearchParams("role=admin");
    const user = userEvent.setup();
    render(<MemberFilters allSkills={[]} />);

    await user.click(screen.getByLabelText(ROLE));
    await user.click(screen.getByRole("option", { name: /all roles/i }));

    expect(pushMock).toHaveBeenCalledWith(
      "/members",
      expect.objectContaining({ scroll: false })
    );
  });

  it("should preserve in-progress search text when a role is selected", async () => {
    const user = userEvent.setup();
    render(<MemberFilters allSkills={[]} />);

    fireEvent.change(screen.getByLabelText(/search/i), {
      target: { value: "alice" },
    });
    await user.click(screen.getByLabelText(ROLE));
    await user.click(screen.getByRole("option", { name: /platform admins/i }));

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/members\?(?=.*q=alice)(?=.*role=admin)/),
      expect.objectContaining({ scroll: false })
    );
  });
});

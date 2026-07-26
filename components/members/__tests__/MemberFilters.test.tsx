import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MemberFilters from "../MemberFilters";

const pushMock = vi.fn();
const replaceMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => currentSearchParams,
}));

describe("MemberFilters", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    currentSearchParams = new URLSearchParams("q=al");
  });

  it("keeps in-progress search text when unrelated URL params change", () => {
    const { rerender } = render(<MemberFilters allSkills={[]} />);

    const search = screen.getByLabelText(/search/i);
    fireEvent.change(search, { target: { value: "alice" } });

    currentSearchParams = new URLSearchParams("q=al&skill=design");
    rerender(<MemberFilters allSkills={[]} />);

    expect(screen.getByLabelText(/search/i)).toHaveValue("alice");
  });

  it("commits on Enter via router.push", () => {
    render(<MemberFilters allSkills={[]} />);

    const search = screen.getByLabelText(/search/i);
    fireEvent.change(search, { target: { value: "alice" } });
    fireEvent.keyDown(search, { key: "Enter" });

    expect(pushMock).toHaveBeenCalledWith(
      "/members?q=alice",
      expect.objectContaining({ scroll: false })
    );
  });

  it("debounced typing navigates via router.replace, not push", () => {
    vi.useFakeTimers();
    try {
      render(<MemberFilters allSkills={[]} />);

      const search = screen.getByLabelText(/search/i);
      fireEvent.change(search, { target: { value: "alice" } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(replaceMock).toHaveBeenCalledWith(
        "/members?q=alice",
        expect.objectContaining({ scroll: false })
      );
      expect(pushMock).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("Enter after a debounce-replace still commits via router.push", () => {
    vi.useFakeTimers();
    try {
      render(<MemberFilters allSkills={[]} />);

      const search = screen.getByLabelText(/search/i);
      fireEvent.change(search, { target: { value: "alice" } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(pushMock).not.toHaveBeenCalled();

      fireEvent.keyDown(search, { key: "Enter" });

      expect(pushMock).toHaveBeenCalledWith(
        "/members?q=alice",
        expect.objectContaining({ scroll: false })
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("Enter before debounce fires cancels the pending replace", () => {
    vi.useFakeTimers();
    try {
      render(<MemberFilters allSkills={[]} />);

      const search = screen.getByLabelText(/search/i);
      fireEvent.change(search, { target: { value: "alice" } });
      fireEvent.keyDown(search, { key: "Enter" });

      expect(pushMock).toHaveBeenCalledWith(
        "/members?q=alice",
        expect.objectContaining({ scroll: false })
      );

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(replaceMock).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("toggling referrals after typing preserves the in-progress q", () => {
    render(<MemberFilters allSkills={[]} />);

    const search = screen.getByLabelText(/search/i);
    fireEvent.change(search, { target: { value: "alice" } });

    const referrals = screen.getByLabelText(/open to mock interviews/i);
    fireEvent.click(referrals);

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/members\?(?=.*q=alice)(?=.*referrals=true)/),
      expect.objectContaining({ scroll: false })
    );
  });
});

describe("Member filters platform-role dropdown", () => {
  const ROLE = /^role$/i;

  // Radix's Select needs pointer capture and scrollIntoView, neither of which
  // jsdom implements.
  beforeAll(() => {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
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

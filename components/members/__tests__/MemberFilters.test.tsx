import { act, fireEvent, render, screen } from "@testing-library/react";

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

describe("Member filters platform-admin toggle", () => {
  const ADMINS_ONLY = /platform admins only/i;

  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    currentSearchParams = new URLSearchParams();
  });

  it("should render the toggle for every viewer", () => {
    render(<MemberFilters allSkills={[]} />);

    expect(screen.getByLabelText(ADMINS_ONLY)).toBeInTheDocument();
  });

  it("should add role=admin to the URL when checked", () => {
    render(<MemberFilters allSkills={[]} />);

    fireEvent.click(screen.getByLabelText(ADMINS_ONLY));

    expect(pushMock).toHaveBeenCalledWith(
      "/members?role=admin",
      expect.objectContaining({ scroll: false })
    );
  });

  it("should drop role from the URL when unchecked", () => {
    currentSearchParams = new URLSearchParams("role=admin");
    render(<MemberFilters allSkills={[]} />);

    fireEvent.click(screen.getByLabelText(ADMINS_ONLY));

    expect(pushMock).toHaveBeenCalledWith(
      "/members",
      expect.objectContaining({ scroll: false })
    );
  });

  it("should show as checked when the URL already carries role=admin", () => {
    currentSearchParams = new URLSearchParams("role=admin");

    render(<MemberFilters allSkills={[]} />);

    expect(screen.getByLabelText(ADMINS_ONLY)).toBeChecked();
  });

  it("should preserve in-progress search text when toggled", () => {
    render(<MemberFilters allSkills={[]} />);

    fireEvent.change(screen.getByLabelText(/search/i), {
      target: { value: "alice" },
    });
    fireEvent.click(screen.getByLabelText(ADMINS_ONLY));

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/members\?(?=.*q=alice)(?=.*role=admin)/),
      expect.objectContaining({ scroll: false })
    );
  });
});

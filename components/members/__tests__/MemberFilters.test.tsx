import { fireEvent, render, screen } from "@testing-library/react";

import MemberFilters from "../MemberFilters";

const pushMock = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => currentSearchParams,
}));

describe("MemberFilters", () => {
  beforeEach(() => {
    pushMock.mockReset();
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
});

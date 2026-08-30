import { render } from "@testing-library/react";
import posthog from "posthog-js";
import PostHogIdentify from "./posthog-identify";

vi.mock("posthog-js", () => ({
  default: { __loaded: true, identify: vi.fn() },
}));

const mocked = vi.mocked(posthog);

describe("PostHogIdentify — authenticated layout identifies members by UUID only", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.__loaded = true;
  });

  it("should identify with the bare user id and no person properties when mounted", () => {
    render(<PostHogIdentify userId="6f9619ff-8b86-4011-b42d-00c04fc964ff" />);

    expect(mocked.identify).toHaveBeenCalledTimes(1);
    expect(mocked.identify).toHaveBeenCalledWith(
      "6f9619ff-8b86-4011-b42d-00c04fc964ff"
    );
  });

  it("should not identify again when re-rendered with the same user id", () => {
    const { rerender } = render(<PostHogIdentify userId="user-1" />);

    rerender(<PostHogIdentify userId="user-1" />);

    expect(mocked.identify).toHaveBeenCalledTimes(1);
  });

  it("should do nothing when the SDK never initialized", () => {
    mocked.__loaded = false;

    render(<PostHogIdentify userId="user-1" />);

    expect(mocked.identify).not.toHaveBeenCalled();
  });

  it("should render nothing when mounted", () => {
    const { container } = render(<PostHogIdentify userId="user-1" />);

    expect(container).toBeEmptyDOMElement();
  });
});

import { render } from "@testing-library/react";
import posthog from "posthog-js";
import PostHogIdentify from "./posthog-identify";

vi.mock("posthog-js", () => ({
  default: {
    __loaded: true,
    identify: vi.fn(),
    reset: vi.fn(),
    get_distinct_id: vi.fn(),
    get_property: vi.fn(),
  },
}));

const mocked = vi.mocked(posthog);
const USER_ID = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

describe("PostHogIdentify — authenticated layout identifies members by UUID only", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.__loaded = true;
    mocked.get_distinct_id.mockReturnValue("device-123");
    mocked.get_property.mockReturnValue("device-123");
  });

  it("should identify with the bare user id and no person properties when mounted", () => {
    render(<PostHogIdentify userId={USER_ID} />);

    expect(mocked.identify).toHaveBeenCalledTimes(1);
    expect(mocked.identify).toHaveBeenCalledWith(USER_ID);
  });

  it("should not identify again when re-rendered with the same user id", () => {
    const { rerender } = render(<PostHogIdentify userId="user-1" />);

    rerender(<PostHogIdentify userId="user-1" />);

    expect(mocked.identify).toHaveBeenCalledTimes(1);
  });

  it("should reset identity before identifying when a different member's id lingers", () => {
    // OAuth/magic-link entry never passes the login page's reset; a stale
    // identified id on a shared computer must not receive this visit's events.
    mocked.get_distinct_id.mockReturnValue("previous-member-uuid");

    render(<PostHogIdentify userId={USER_ID} />);

    expect(mocked.reset).toHaveBeenCalledWith(true);
    expect(mocked.reset.mock.invocationCallOrder[0]).toBeLessThan(
      mocked.identify.mock.invocationCallOrder[0]
    );
    expect(mocked.identify).toHaveBeenCalledWith(USER_ID);
  });

  it("should not reset when the visitor is anonymous", () => {
    render(<PostHogIdentify userId={USER_ID} />);

    expect(mocked.reset).not.toHaveBeenCalled();
    expect(mocked.identify).toHaveBeenCalledWith(USER_ID);
  });

  it("should not reset when the lingering identity already belongs to this member", () => {
    mocked.get_distinct_id.mockReturnValue(USER_ID);

    render(<PostHogIdentify userId={USER_ID} />);

    expect(mocked.reset).not.toHaveBeenCalled();
    expect(mocked.identify).toHaveBeenCalledWith(USER_ID);
  });

  it("should do nothing when the SDK never initialized", () => {
    mocked.__loaded = false;

    render(<PostHogIdentify userId="user-1" />);

    expect(mocked.identify).not.toHaveBeenCalled();
    expect(mocked.reset).not.toHaveBeenCalled();
  });

  it("should render nothing when mounted", () => {
    const { container } = render(<PostHogIdentify userId="user-1" />);

    expect(container).toBeEmptyDOMElement();
  });
});

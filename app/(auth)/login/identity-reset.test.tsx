import { render } from "@testing-library/react";
import posthog from "posthog-js";
import IdentityReset from "./identity-reset";

vi.mock("posthog-js", () => ({
  default: {
    __loaded: true,
    get_distinct_id: vi.fn(),
    get_property: vi.fn(),
    reset: vi.fn(),
  },
}));

const mocked = vi.mocked(posthog);

describe("IdentityReset — login page clears lingering identified analytics state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.__loaded = true;
  });

  it("should reset identity including the device id when a lingering identified distinct id is present", () => {
    // Persistence outlives the Supabase session: an expired session on a
    // shared computer must not attribute the next person to the old member.
    mocked.get_distinct_id.mockReturnValue("member-uuid");
    mocked.get_property.mockReturnValue("device-123");

    render(<IdentityReset />);

    expect(mocked.reset).toHaveBeenCalledWith(true);
  });

  it("should not reset when the visitor is anonymous", () => {
    mocked.get_distinct_id.mockReturnValue("device-123");
    mocked.get_property.mockReturnValue("device-123");

    render(<IdentityReset />);

    expect(mocked.reset).not.toHaveBeenCalled();
  });

  it("should do nothing when the SDK never initialized", () => {
    mocked.__loaded = false;

    render(<IdentityReset />);

    expect(mocked.reset).not.toHaveBeenCalled();
  });

  it("should render nothing when mounted", () => {
    mocked.get_distinct_id.mockReturnValue("device-123");
    mocked.get_property.mockReturnValue("device-123");

    const { container } = render(<IdentityReset />);

    expect(container).toBeEmptyDOMElement();
  });
});

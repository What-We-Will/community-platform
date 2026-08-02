vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("./community-actions", () => ({
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedFunction } from "vitest";
import { addToWishlist, removeFromWishlist } from "./community-actions";
import { WishlistButton } from "./WishlistButton";

const mockAddToWishlist = addToWishlist as MockedFunction<typeof addToWishlist>;
const mockRemoveFromWishlist = removeFromWishlist as MockedFunction<typeof removeFromWishlist>;

function renderButton() {
  return render(
    <WishlistButton
      jobPostingId="job-1"
      company="ACME"
      position="Engineer"
      initialWishlisted={false}
    />
  );
}

// C05-A01 — the button treated every error except the "already_wishlisted"
// sentinel as success (`if (res.error !== "already_wishlisted") setWishlisted(true)`).
// That was nearly harmless before this phase, but addToWishlist can now
// routinely return { error: "Feature not available" } from the ghostJobBoard
// guard, and the inverted check would render that denial as a successful add.
describe("WishlistButton — add error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows wishlisted after a successful add", async () => {
    mockAddToWishlist.mockResolvedValue({});
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^wishlisted$/i })).toBeInTheDocument();
    });
  });

  it("treats the already_wishlisted sentinel as its own non-error success case", async () => {
    mockAddToWishlist.mockResolvedValue({ error: "already_wishlisted" });
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^wishlisted$/i })).toBeInTheDocument();
    });
  });

  it("does not show wishlisted when the write is denied by the flag guard", async () => {
    mockAddToWishlist.mockResolvedValue({ error: "Feature not available" });
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^add to wishlist$/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /^wishlisted$/i })).not.toBeInTheDocument();
  });

  it("does not show wishlisted for any other unrecognized error string", async () => {
    mockAddToWishlist.mockResolvedValue({ error: "Something else went wrong" });
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^add to wishlist$/i })).toBeInTheDocument();
    });
  });

  it("does not call removeFromWishlist while adding", async () => {
    mockAddToWishlist.mockResolvedValue({});
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^wishlisted$/i })).toBeInTheDocument();
    });
    expect(mockRemoveFromWishlist).not.toHaveBeenCalled();
  });
});

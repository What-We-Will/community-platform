import { render, screen } from "@testing-library/react";
import { WelcomeBanner } from "./WelcomeBanner";

// The dashboard Job Board CTA is a live instance of the durability contract's
// clause 4: the server resolves canViewFeature("ghostJobBoard", ...) and
// passes only a boolean here — WelcomeBanner never resolves the flag itself.
describe("WelcomeBanner Job Board CTA", () => {
  it("shows the Browse Jobs button when showJobBoardCta is true", () => {
    render(<WelcomeBanner profile={null} showJobBoardCta={true} />);

    expect(screen.getByRole("link", { name: /browse jobs/i })).toBeInTheDocument();
  });

  it("hides the Browse Jobs button when showJobBoardCta is false, without breaking the other CTAs", () => {
    render(<WelcomeBanner profile={null} showJobBoardCta={false} />);

    expect(screen.queryByRole("link", { name: /browse jobs/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /find members/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my groups/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new message/i })).toBeInTheDocument();
  });
});

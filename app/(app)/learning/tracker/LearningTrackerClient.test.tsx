// Isolates this render test from the server-action module's own transitive
// "server-only" import — the drag/drop handlers it provides are not exercised
// by these CTA assertions.
vi.mock("../learning-tracker-actions", () => ({
  updateTrackerStatus: vi.fn(),
  removeFromTracker: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { render, screen } from "@testing-library/react";
import { LearningTrackerClient } from "./LearningTrackerClient";

// Both CTAs below navigate to /learning, a route gated on the groupLearning
// flag. The server resolves canViewFeature("groupLearning", ...) and passes
// only a boolean here — this component never resolves the flag itself. See
// WelcomeBanner's showJobBoardCta for the signed precedent this follows.
describe("LearningTrackerClient Group Learning CTAs", () => {
  it("links both empty-state CTAs to /learning when showGroupLearningCta is true", () => {
    render(
      <LearningTrackerClient
        trackerItems={[]}
        myStudyGroups={[]}
        showGroupLearningCta={true}
      />
    );

    expect(screen.getByRole("link", { name: /browse learning/i })).toHaveAttribute(
      "href",
      "/learning"
    );
    expect(screen.getByRole("link", { name: /group learning/i })).toHaveAttribute(
      "href",
      "/learning"
    );
  });

  it("hides both empty-state CTAs' links to /learning when showGroupLearningCta is false, without breaking the surrounding text", () => {
    render(
      <LearningTrackerClient
        trackerItems={[]}
        myStudyGroups={[]}
        showGroupLearningCta={false}
      />
    );

    expect(screen.queryByRole("link", { name: /browse learning/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /group learning/i })).not.toBeInTheDocument();
    expect(screen.getByText(/haven.t joined any study groups yet/i)).toBeInTheDocument();
    expect(document.body.textContent).toContain("Group Learning");
    expect(screen.getByText(/your tracker is empty/i)).toBeInTheDocument();
  });
});

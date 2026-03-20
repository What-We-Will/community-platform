import { computeJobBoardTier } from "./job-board-tier";

describe("computeJobBoardTier", () => {
  it("tier 0 when offers referral", () => {
    expect(
      computeJobBoardTier({
        offers_referral: true,
        is_community_network: false,
        directCommentCount: 0,
      })
    ).toBe(0);
  });

  it("tier 1 when has direct comments (even if also community network)", () => {
    expect(
      computeJobBoardTier({
        offers_referral: false,
        is_community_network: true,
        directCommentCount: 1,
      })
    ).toBe(1);
  });

  it("tier 2 for community network without comments", () => {
    expect(
      computeJobBoardTier({
        offers_referral: false,
        is_community_network: true,
        directCommentCount: 0,
      })
    ).toBe(2);
  });

  it("tier 3 default", () => {
    expect(
      computeJobBoardTier({
        offers_referral: false,
        is_community_network: false,
        directCommentCount: 0,
      })
    ).toBe(3);
  });
});

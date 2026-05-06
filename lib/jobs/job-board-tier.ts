/**
 * Job board sort priority (lower = higher in list).
 * Mirrors logic in `app/(app)/jobs/page.tsx`.
 */
export function computeJobBoardTier(input: {
  offers_referral: boolean;
  is_community_network: boolean;
  directCommentCount: number;
}): number {
  if (input.offers_referral) return 0;
  if (input.directCommentCount > 0) return 1;
  if (input.is_community_network) return 2;
  return 3;
}

export type OnlineStatus = "online" | "away" | "offline";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

/**
 * Returns the online status based on last_seen_at timestamp.
 * - online: within last 5 minutes (or always when isCurrentUser — logged-in user is shown as online)
 * - away: within last 30 minutes
 * - offline: older than 30 minutes or null
 */
export function getOnlineStatus(
  lastSeenAt: string | null,
  options?: { isCurrentUser?: boolean }
): OnlineStatus {
  if (options?.isCurrentUser) return "online";

  if (!lastSeenAt) return "offline";

  const lastSeen = new Date(lastSeenAt).getTime();
  const now = Date.now();
  const diff = now - lastSeen;

  if (diff <= FIVE_MINUTES_MS) return "online";
  if (diff <= THIRTY_MINUTES_MS) return "away";
  return "offline";
}

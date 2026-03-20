/** Default days between My Tools reminder emails per member. */
export const MY_TOOLS_REMINDER_COOLDOWN_DAYS = 7;

/**
 * Whether we may send another reminder, comparing ISO timestamps lexicographically
 * (valid for PostgreSQL/JS ISO strings).
 */
export function canSendReminderEmail(
  lastSentAtIso: string | null,
  now: Date,
  cooldownDays: number = MY_TOOLS_REMINDER_COOLDOWN_DAYS
): boolean {
  if (!lastSentAtIso) return true;
  const cutoff = new Date(
    now.getTime() - cooldownDays * 24 * 60 * 60 * 1000
  ).toISOString();
  return lastSentAtIso < cutoff;
}

import { fromZonedTime } from "date-fns-tz";

export interface RecurrenceDatePair {
  starts_at: string;
  ends_at: string;
}

/**
 * Generates the starts_at / ends_at pairs for all recurring instances after
 * the parent event.
 *
 * Rules:
 *  - "daily"  → every weekday (Mon–Fri) from the day after the parent up to
 *               recurrenceEndDate, capped at maxInstances (default 1500).
 *  - "weekly" → every occurrence of the same weekday as the parent, from
 *               one week later up to recurrenceEndDate, capped at 260.
 *
 * The parent event itself is NOT included in the returned array.
 */
export function buildRecurrenceDates(
  parentStartsAt: string,
  parentEndsAt: string,
  rule: "daily" | "weekly",
  recurrenceEndDate: string,
  eventTimezone: string,
  maxInstances = rule === "daily" ? 1500 : 260,
): RecurrenceDatePair[] {
  const durationMs =
    new Date(parentEndsAt).getTime() - new Date(parentStartsAt).getTime();

  const endDate = fromZonedTime(recurrenceEndDate + "T23:59:59", eventTimezone);
  const parentWeekday = new Date(parentStartsAt).getUTCDay();

  const cursor = new Date(parentStartsAt);
  cursor.setUTCDate(cursor.getUTCDate() + 1); // start from the next day

  const pairs: RecurrenceDatePair[] = [];

  while (cursor <= endDate && pairs.length < maxInstances) {
    const day = cursor.getUTCDay(); // 0 = Sun, 6 = Sat
    const isWeekend = day === 0 || day === 6;

    const skip =
      rule === "weekly"
        ? day !== parentWeekday
        : isWeekend;

    if (!skip) {
      pairs.push({
        starts_at: new Date(cursor).toISOString(),
        ends_at: new Date(cursor.getTime() + durationMs).toISOString(),
      });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return pairs;
}

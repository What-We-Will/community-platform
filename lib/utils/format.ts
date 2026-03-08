/**
 * Converts a 24-hour "HH:MM" string to a 12-hour "H:MM AM/PM" label.
 * e.g. "14:30" → "2:30 PM", "00:00" → "12:00 AM", "12:00" → "12:00 PM"
 */
export function formatTimeLabel(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Counts weekday (Mon–Fri) days strictly after startDate up to and
 * including endDate.
 * Used to preview how many daily-recurring event instances will be created.
 */
export function countWeekdays(startDate: string, endDate: string): number {
  let count = 0;
  // Parse as explicit UTC midnight so local timezone never shifts the date
  const cursor = new Date(startDate + "T00:00:00Z");
  cursor.setUTCDate(cursor.getUTCDate() + 1); // first instance is the day after the parent
  const end = new Date(endDate + "T00:00:00Z");
  while (cursor <= end) {
    const d = cursor.getUTCDay();
    if (d !== 0 && d !== 6) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

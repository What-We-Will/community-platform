/**
 * Maps profile completeness `missing` labels → friendly sentences for reminder emails.
 */
export function missingFieldToReminderTip(m: string): string {
  if (m.startsWith("At least")) return `Add ${m.toLowerCase()}.`;
  if (m === "Bio") return "Add a short career summary to your bio.";
  if (m === "A longer bio (40+ characters)")
    return "Expand your bio to at least 40 characters.";
  if (m === "LinkedIn URL") return "Add your LinkedIn URL.";
  if (m === "Headline") return "Add a professional headline.";
  if (m === "Location") return "Add your location.";
  return `Complete: ${m}.`;
}

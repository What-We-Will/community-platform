/**
 * Generate a deterministic, unique room name for Jitsi based on context.
 */
export function getVideoRoomName(context: {
  type: "dm" | "group" | "event" | "booking";
  id: string;
}): string {
  return `whatwewill-${context.type}-${context.id}`;
}

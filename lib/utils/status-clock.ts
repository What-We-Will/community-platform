type Listener = () => void;
const listeners = new Set<Listener>();

if (typeof window !== "undefined") {
  setInterval(() => listeners.forEach((l) => l()), 60_000);
}

export function subscribeToStatusClock(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

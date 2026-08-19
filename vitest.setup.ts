// Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.) on Vitest's expect.
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom implements no layout, so it ships no scrollIntoView at all. Components that
// scroll a message into view would throw here rather than in a browser; stub it so
// tests can assert the call instead. Guarded because this file also loads under the
// node environment, where there is no Element to patch.
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = vi.fn();
}

/**
 * Next.js runs this file on matching requests. It must be named middleware.ts
 * and export a default (or named "middleware") function.
 * Delegates to the proxy for session refresh, last_seen_at updates, and auth redirects.
 */
export { proxy as middleware, config } from "./proxy";

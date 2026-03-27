/**
 * Structured logger for server-side use only.
 *
 * - Outputs structured JSON in production (for Vercel / log aggregation)
 * - Pretty-prints in development (for terminal readability)
 * - Do NOT import this in Client Components — it is server-only.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("server-action:complete", { action: "updateRsvp", userId: "abc" });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  action?: string;
  userId?: string;
  path?: string;
  revalidated?: string[];
  error?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL;
  if (env && env in LOG_LEVELS) return env as LogLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function log(level: LogLevel, message: string, context?: LogContext) {
  if (LOG_LEVELS[level] < LOG_LEVELS[getMinLevel()]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  if (process.env.NODE_ENV === "production") {
    // Structured JSON for log aggregation (Vercel, Datadog, etc.)
    console[level](JSON.stringify(entry));
  } else {
    // Readable output for local development
    const ctx = context ? ` ${JSON.stringify(context)}` : "";
    console[level](`[${level.toUpperCase()}] ${message}${ctx}`);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};

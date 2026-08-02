/**
 * Server-only resolution has no NEXT_PUBLIC_ authority: feature_flags is the
 * sole site-definition source, cold acquisition failures fail closed, and
 * future scoped definitions extend the ordered chain without changing callers.
 */
import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const FLAG_KEYS = [
  "jobApplicationTracker",
  "learningTracker",
  "ghostJobBoard",
] as const;

export type FeatureFlag = (typeof FLAG_KEYS)[number];

export type FlagContext = {
  targetingKey: string;
  attributes?: Record<string, string>;
};

export type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  fail_mode: "open" | "closed";
  updated_at: string;
};

type FeatureFlagDefinition = {
  enabled: boolean;
  failMode: "open" | "closed";
  updatedAt: string;
};

export type FlagSnapshot = ReadonlyMap<FeatureFlag, FeatureFlagDefinition>;

type ScopeLevel = "site";

type ResolutionSource =
  | "site-default"
  | "stale-snapshot"
  | "fail-mode"
  | "error-fallback";

const SNAPSHOT_TTL_MS = 30_000;
const FLAG_KEY_SET = new Set<string>(FLAG_KEYS);

export const SCOPE_CHAIN: readonly ScopeLevel[] = ["site"];

let lastKnownGood:
  | { snapshot: FlagSnapshot; refreshedAt: number }
  | undefined;

function isFeatureFlagKey(value: string): value is FeatureFlag {
  return FLAG_KEY_SET.has(value);
}

function validateSnapshot(data: unknown): FlagSnapshot {
  if (!Array.isArray(data)) {
    throw new Error("Feature flag response must be an array");
  }

  const definitions = new Map<FeatureFlag, FeatureFlagDefinition>();
  for (const row of data) {
    if (!row || typeof row !== "object" || !("key" in row)) continue;

    const candidate = row as Record<string, unknown>;
    if (typeof candidate.key !== "string" || !isFeatureFlagKey(candidate.key)) {
      continue;
    }

    if (
      typeof candidate.enabled !== "boolean" ||
      (candidate.fail_mode !== "open" && candidate.fail_mode !== "closed") ||
      typeof candidate.updated_at !== "string" ||
      Number.isNaN(Date.parse(candidate.updated_at)) ||
      definitions.has(candidate.key)
    ) {
      throw new Error(`Malformed feature flag row for ${candidate.key}`);
    }

    definitions.set(candidate.key, {
      enabled: candidate.enabled,
      failMode: candidate.fail_mode,
      updatedAt: candidate.updated_at,
    });
  }

  return definitions;
}

async function readFlagSnapshot(): Promise<FlagSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Feature flags require an authenticated user");
  }

  const now = Date.now();
  if (lastKnownGood && now - lastKnownGood.refreshedAt < SNAPSHOT_TTL_MS) {
    return lastKnownGood.snapshot;
  }

  const { data, error } = await supabase
    .from("feature_flags")
    .select("key, enabled, fail_mode, updated_at");

  if (error) {
    throw new Error(`Feature flag read failed: ${error.message}`);
  }

  const snapshot = validateSnapshot(data);
  lastKnownGood = { snapshot, refreshedAt: now };
  return snapshot;
}

const getRequestFlagSnapshot = cache(readFlagSnapshot);

export async function getFlagSnapshot(): Promise<FlagSnapshot> {
  return getRequestFlagSnapshot();
}

function evaluateSiteFlag(
  definition: FeatureFlagDefinition,
  context: FlagContext
): boolean {
  if (!context.targetingKey) {
    throw new Error("Feature flag context requires a targeting key");
  }
  return definition.enabled;
}

const SCOPE_EVALUATORS: Record<
  ScopeLevel,
  (definition: FeatureFlagDefinition, context: FlagContext) => boolean
> = {
  site: evaluateSiteFlag,
};

function evaluateFlag(
  definition: FeatureFlagDefinition,
  context: FlagContext
): boolean {
  return SCOPE_CHAIN.every((scope) => SCOPE_EVALUATORS[scope](definition, context));
}

function logResolution(
  flag: FeatureFlag,
  source: ResolutionSource,
  value: boolean,
  error?: unknown
) {
  console.info(
    "feature flag resolved",
    error ? { flag, source, value, error } : { flag, source, value }
  );
}

async function resolveFeature(
  flag: FeatureFlag,
  context: FlagContext
): Promise<boolean> {
  let definition: FeatureFlagDefinition | undefined;
  let source: ResolutionSource = "site-default";
  let snapshotError: unknown;

  try {
    definition = (await getFlagSnapshot()).get(flag);
  } catch (error) {
    snapshotError = error;
    definition = lastKnownGood?.snapshot.get(flag);
    source = definition ? "stale-snapshot" : "error-fallback";
  }

  if (!definition) {
    logResolution(flag, "error-fallback", false, snapshotError);
    return false;
  }

  try {
    const value = evaluateFlag(definition, context);
    if (source !== "site-default") {
      logResolution(flag, source, value, snapshotError);
    }
    return value;
  } catch (error) {
    const value = definition.failMode === "open";
    logResolution(flag, "fail-mode", value, error);
    return value;
  }
}

export async function canViewFeature(
  flag: FeatureFlag,
  context: FlagContext
): Promise<boolean> {
  const value = await resolveFeature(flag, context);
  return value || context.attributes?.role === "admin";
}

export async function canMutateFeature(
  flag: FeatureFlag,
  context: FlagContext
): Promise<boolean> {
  return resolveFeature(flag, context);
}

export function resetFeatureFlagCacheForTests() {
  lastKnownGood = undefined;
}

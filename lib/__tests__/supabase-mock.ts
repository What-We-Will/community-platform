import { vi } from "vitest";

export type MockQueryResult<T = unknown> = {
  data: T | null;
  error: {
    message: string;
    details?: string | null;
    hint?: string | null;
    code?: string;
  } | null;
};

export type RecordedQuery = {
  table: string;
  /** Every builder method called on this query, in call order. */
  calls: Array<{ method: string; args: unknown[] }>;
};

type BuildOptions = {
  /** null models an unauthenticated session. */
  user?: { id: string } | null;
  /** Models getUser() rejecting the current authentication credentials. */
  userError?: { message: string } | null;
  /**
   * What each `from(table)` query resolves to. An array is consumed in call
   * order — needed when one caller issues several queries against the same
   * table — and a bare result is reused for every call.
   */
  tables?: Record<string, MockQueryResult | MockQueryResult[]>;
};

const EMPTY_RESULT: MockQueryResult = { data: [], error: null };

// PostgREST builder methods the app chains. Each returns the builder, so a
// query resolves only when it is awaited. Write methods belong here for the same
// reason reads do — `upsert()` returns the builder so callers may chain
// `.select()` onto it, and awaiting the chain is what resolves the result.
const CHAINABLE_METHODS = [
  "select",
  "insert",
  "upsert",
  "update",
  "delete",
  "eq",
  "neq",
  "in",
  "is",
  "not",
  "or",
  "gte",
  "lte",
  "match",
  "contains",
  "textSearch",
  "order",
  "limit",
  "range",
  "single",
  "maybeSingle",
] as const;

/**
 * Builds a Supabase client stand-in that records the queries made against it.
 * Assert on the recorded calls rather than on mock call order — the point is
 * which filters reached the query, not how the caller assembled them.
 */
export function buildMockSupabaseClient(options: BuildOptions = {}) {
  const { user = { id: "user-1" }, userError = null, tables = {} } = options;
  const queries: RecordedQuery[] = [];
  const consumed: Record<string, number> = {};

  function claimResult(table: string): MockQueryResult {
    const configured = tables[table];
    if (!configured) return EMPTY_RESULT;
    if (!Array.isArray(configured)) return configured;
    const index = consumed[table] ?? 0;
    consumed[table] = index + 1;
    return configured[index] ?? EMPTY_RESULT;
  }

  function from(table: string) {
    // Claimed up front so each query keeps its own result regardless of the
    // order the caller awaits them in.
    const result = claimResult(table);
    const recorded: RecordedQuery = { table, calls: [] };
    queries.push(recorded);

    const builder: Record<string, unknown> = {
      then: (resolve: (value: MockQueryResult) => unknown) =>
        Promise.resolve(result).then(resolve),
    };
    for (const method of CHAINABLE_METHODS) {
      builder[method] = vi.fn((...args: unknown[]) => {
        recorded.calls.push({ method, args });
        return builder;
      });
    }
    return builder;
  }

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: userError }),
      getClaims: vi.fn().mockResolvedValue({
        data: user ? { claims: { sub: user.id } } : null,
        error: null,
      }),
    },
    from: vi.fn(from),
  };

  return { client, queries };
}

/** True when the query applied exactly this builder call. */
export function appliedFilter(
  query: RecordedQuery,
  method: string,
  ...args: unknown[]
): boolean {
  return query.calls.some(
    (call) =>
      call.method === method &&
      JSON.stringify(call.args) === JSON.stringify(args)
  );
}

/**
 * The arguments a write method received, for assertions that cannot be an exact
 * match — most often "the payload must not carry this column at all", which
 * appliedFilter's whole-args comparison cannot express. Returns undefined when
 * the method was never called, so a missing write fails as a missing value
 * rather than passing vacuously.
 */
export function writeArgs(
  query: RecordedQuery,
  method: string
): unknown[] | undefined {
  return query.calls.find((call) => call.method === method)?.args;
}

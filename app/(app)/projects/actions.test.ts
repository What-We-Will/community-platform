/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/feature-flags", () => ({ canMutateFeature: vi.fn() }));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canMutateFeature } from "@/lib/feature-flags";
import * as ProjectsActionsModule from "./actions";
import { fetchGitHubMeta, createProject, deleteProject } from "./actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockCanMutateFeature = canMutateFeature as MockedFunction<typeof canMutateFeature>;

function makeChain(thenResult = { error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

function authedClient(userId: string, fromImpl?: (...args: any[]) => any) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
    from: fromImpl ?? vi.fn(),
  } as any;
}

function anonClient() {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(),
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCanMutateFeature.mockResolvedValue(true);
});

// ── Mutation gate (projects) ────────────────────────────────────────────────
//
// All three exports guard with canMutateFeature("projects", ...) immediately
// after the auth check. fetchGitHubMeta had no auth check before this phase;
// C07-RULING-001 (guard all ten, uniform shape, no fetchGitHubMeta carve-out)
// requires deriving targetingKey the same way the other actions do, so an
// auth check was added here as necessary plumbing for the guard, not scope
// creep.

type GuardCase = {
  name: string;
  call: () => Promise<{ error?: string; [k: string]: unknown }>;
};

const GUARD_CASES: GuardCase[] = [
  { name: "fetchGitHubMeta", call: () => fetchGitHubMeta("https://github.com/octocat/hello-world") },
  {
    name: "createProject",
    call: () =>
      createProject({
        github_url: "https://github.com/octocat/hello-world",
        title: "Hello World",
        description: null,
        image_url: null,
        language: null,
        stars: 0,
        roles_seeking: [],
        offers_mentorship: false,
        seeks_mentorship: false,
      }),
  },
  { name: "deleteProject", call: () => deleteProject("project-1") },
];

describe("exported-action inventory pinned to the export set", () => {
  it("every exported action has a guard case", () => {
    const exportedActionNames = Object.keys(ProjectsActionsModule).filter(
      (key) => typeof (ProjectsActionsModule as Record<string, unknown>)[key] === "function"
    );
    const coveredActionNames = GUARD_CASES.map((c) => c.name);

    expect(exportedActionNames.sort()).toEqual(coveredActionNames.sort());
  });
});

describe.each(GUARD_CASES)("$name — mutation gate", ({ call }) => {
  it("returns the existing auth error for an unauthenticated caller without disclosing flag state", async () => {
    const client = anonClient();
    mockCreateClient.mockResolvedValue(client);

    const result = await call();

    expect(result.error).toBeTruthy();
    expect(mockCanMutateFeature).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("denies an authenticated member when the flag is off", async () => {
    const client = authedClient("member-1");
    mockCreateClient.mockResolvedValue(client);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await call();

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledTimes(1);
    expect(mockCanMutateFeature).toHaveBeenCalledWith("projects", { targetingKey: "member-1" });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("denies an authenticated admin identically when the flag is off — no role ever reaches the guard", async () => {
    const client = authedClient("admin-1");
    mockCreateClient.mockResolvedValue(client);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await call();

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledWith("projects", { targetingKey: "admin-1" });
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("reaches existing behavior when the flag is on", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchGitHubMeta fetches repo metadata", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1"));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          name: "hello-world",
          description: "A repo",
          stargazers_count: 5,
          language: "TypeScript",
        }),
    }) as any;

    const result = await fetchGitHubMeta("https://github.com/octocat/hello-world");

    expect(result.data?.title).toBe("hello-world");
    expect(mockCanMutateFeature).toHaveBeenCalledWith("projects", { targetingKey: "user-1" });
  });

  it("createProject inserts and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await createProject({
      github_url: "https://github.com/octocat/hello-world",
      title: "Hello World",
      description: null,
      image_url: null,
      language: null,
      stars: 0,
      roles_seeking: [],
      offers_mentorship: false,
      seeks_mentorship: false,
    });

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("projects", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/projects");
  });

  it("deleteProject deletes and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await deleteProject("project-1");

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("projects", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/projects");
  });
});

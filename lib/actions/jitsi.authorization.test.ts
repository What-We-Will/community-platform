/**
 * @vitest-environment node
 */
import { generateKeyPairSync } from "node:crypto";
import { appliedFilter, buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import {
  makeBaseProfile,
  makeEventHostRow,
  makeEventRsvpRow,
  makeParticipantRow,
} from "@/lib/__tests__/factories";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

let mockClient: ReturnType<typeof buildMockSupabaseClient>["client"];

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

function decodeRoom(token: string): string {
  const payloadB64 = token.split(".")[1];
  return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")).room;
}

async function importAction() {
  const actions = await import("./jitsi");
  return actions.getJitsiJwt;
}

const PROFILE_TABLE = { profiles: { data: makeBaseProfile(), error: null } };
const originalEnv = process.env;

describe("getJitsiJwt room authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_JITSI_APP_ID: "app-id",
      JITSI_JWT_KID: "kid-1",
      JITSI_PRIVATE_KEY: PRIVATE_KEY_PEM,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return null when the user is not a participant in the conversation", async () => {
    mockClient = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: { ...PROFILE_TABLE, conversation_participants: { data: null, error: null } },
    }).client;
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt({ type: "dm", id: "someone-elses-conv" });

    expect(token).toBeNull();
  });

  it("should return null when the user is not a participant in the group conversation", async () => {
    mockClient = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: { ...PROFILE_TABLE, conversation_participants: { data: null, error: null } },
    }).client;
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt({ type: "group", id: "group-conv-9" });

    expect(token).toBeNull();
  });

  it("should sign a group room keyed by the conversation id when the user participates in it", async () => {
    // group_members is empty on purpose: group rooms are keyed by the group's
    // conversation id (the id the UI passes), so membership must resolve via
    // conversation_participants, never group_members.
    const { client, queries } = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: {
        ...PROFILE_TABLE,
        conversation_participants: { data: makeParticipantRow(), error: null },
        group_members: { data: null, error: null },
      },
    });
    mockClient = client;
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt({ type: "group", id: "group-conv-9" });

    expect(token).not.toBeNull();
    expect(decodeRoom(token as string)).toBe("app-id/whatwewill-group-group-conv-9");
    const lookup = queries.find((q) => q.table === "conversation_participants");
    if (!lookup) throw new Error("participant lookup was never queried");
    expect(appliedFilter(lookup, "eq", "conversation_id", "group-conv-9")).toBe(true);
    expect(appliedFilter(lookup, "eq", "user_id", "user-1")).toBe(true);
  });

  it("should return null when the participant lookup fails with a query error", async () => {
    const rlsDenied = { code: "42501", message: "permission denied", details: null, hint: null };
    mockClient = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: { ...PROFILE_TABLE, conversation_participants: { data: null, error: rlsDenied } },
    }).client;
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt({ type: "dm", id: "conv-1" });

    expect(token).toBeNull();
  });

  it("should return null when the user neither hosts nor has an RSVP for the event", async () => {
    mockClient = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: {
        ...PROFILE_TABLE,
        events: { data: makeEventHostRow({ host_id: "someone-else" }), error: null },
        event_rsvps: { data: null, error: null },
      },
    }).client;
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt({ type: "event", id: "evt-1" });

    expect(token).toBeNull();
  });

  it("should sign a token when the user has a going RSVP for the event", async () => {
    const { client, queries } = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: {
        ...PROFILE_TABLE,
        events: { data: makeEventHostRow({ host_id: "someone-else" }), error: null },
        event_rsvps: { data: makeEventRsvpRow(), error: null },
      },
    });
    mockClient = client;
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt({ type: "event", id: "evt-1" });

    expect(token).not.toBeNull();
    expect(decodeRoom(token as string)).toBe("app-id/whatwewill-event-evt-1");
    const rsvpLookup = queries.find((q) => q.table === "event_rsvps");
    if (!rsvpLookup) throw new Error("rsvp lookup was never queried");
    expect(appliedFilter(rsvpLookup, "eq", "event_id", "evt-1")).toBe(true);
    expect(appliedFilter(rsvpLookup, "eq", "user_id", "user-1")).toBe(true);
  });
});

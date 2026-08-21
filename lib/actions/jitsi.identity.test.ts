/**
 * @vitest-environment node
 */
import { generateKeyPairSync } from "node:crypto";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeBaseProfile, makeParticipantRow } from "@/lib/__tests__/factories";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

let mockClient: ReturnType<typeof buildMockSupabaseClient>["client"];

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

type JwtPayload = {
  context: { user: { id: string; name: string; moderator: string } };
  room: string;
};

function decodePayload(token: string): JwtPayload {
  const payloadB64 = token.split(".")[1];
  return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
}

// The action is network-reachable, so a caller can send any argument list
// regardless of the TypeScript signature. This models that attacker.
type UntypedAction = (...args: unknown[]) => Promise<string | null>;

async function importAction() {
  const actions = await import("./jitsi");
  return actions.getJitsiJwt as unknown as UntypedAction;
}

const PROFILE_TABLE = { profiles: { data: makeBaseProfile(), error: null } };
const originalEnv = process.env;

describe("getJitsiJwt session and identity handling", () => {
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

  it("should return null when there is no authenticated session", async () => {
    mockClient = buildMockSupabaseClient({ user: null }).client;
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt({ type: "dm", id: "conv-1" });

    expect(token).toBeNull();
  });

  it("should sign a session-derived identity for a conversation participant even when the caller supplies a forged identity and moderator flag", async () => {
    mockClient = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: {
        ...PROFILE_TABLE,
        conversation_participants: { data: makeParticipantRow(), error: null },
      },
    }).client;
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt(
      { type: "dm", id: "conv-1" },
      "Impersonated Name",
      "attacker-chosen-id",
      { moderator: true }
    );

    expect(token).not.toBeNull();
    const payload = decodePayload(token as string);
    expect(payload.context.user.id).toBe("user-1");
    expect(payload.context.user.name).toBe("Jane Doe");
    expect(payload.context.user.moderator).toBe("false");
    expect(payload.room).toBe("app-id/whatwewill-dm-conv-1");
  });

  it("should return null when the Jitsi signing environment is not configured", async () => {
    mockClient = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: {
        ...PROFILE_TABLE,
        conversation_participants: { data: makeParticipantRow(), error: null },
      },
    }).client;
    process.env.JITSI_PRIVATE_KEY = "";
    const getJitsiJwt = await importAction();

    const token = await getJitsiJwt({ type: "dm", id: "conv-1" });

    expect(token).toBeNull();
  });
});

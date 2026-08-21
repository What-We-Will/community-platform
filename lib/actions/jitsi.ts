"use server";

import { createSign } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getVideoRoomName } from "@/lib/utils/video";

type VideoRoom = { type: "dm" | "group" | "event"; id: string };

async function isRoomParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  room: VideoRoom
): Promise<boolean> {
  switch (room.type) {
    // Group rooms are keyed by the group's conversation id, not the group id
    // (see ConversationView), and group membership flows mirror members into
    // conversation_participants — so dm and group authorize identically.
    case "dm":
    case "group": {
      const { data } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", room.id)
        .eq("user_id", userId)
        .maybeSingle();
      return data !== null;
    }
    case "event": {
      const { data: event } = await supabase
        .from("events")
        .select("host_id")
        .eq("id", room.id)
        .maybeSingle();
      if (!event) return false;
      if (event.host_id === userId) return true;
      const { data: rsvp } = await supabase
        .from("event_rsvps")
        .select("status")
        .eq("event_id", room.id)
        .eq("user_id", userId)
        .maybeSingle();
      return rsvp?.status === "going" || rsvp?.status === "maybe";
    }
    default:
      return false;
  }
}

/**
 * Base64url encode (no padding, URL-safe).
 */
function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generate a Jitsi JWT for 8x8 JaaS. Required when using JaaS (NEXT_PUBLIC_JITSI_APP_ID).
 * Call from the client before opening the video modal; pass the token into the embed.
 *
 * Identity comes from the server-side session, and the room name is resolved
 * server-side from an authorized {type, id} after verifying the user's
 * participation — never from a caller-supplied string. Tokens are never minted
 * with moderator rights; grant moderator server-side if a feature needs it.
 * "booking" rooms are denied until a producer for them exists.
 *
 * Env (server-only):
 * - JITSI_JWT_KID: Key ID from JaaS console (e.g. "vpaas-magic-cookie-xxx/4f4910")
 * - JITSI_PRIVATE_KEY: PEM private key (full string, including -----BEGIN...-----)
 */
export async function getJitsiJwt(room: VideoRoom): Promise<string | null> {
  const appId = process.env.NEXT_PUBLIC_JITSI_APP_ID ?? "";
  const kid = process.env.JITSI_JWT_KID ?? "";
  const privateKey = process.env.JITSI_PRIVATE_KEY ?? "";

  if (!appId || !kid || !privateKey) {
    return null;
  }

  if (typeof room?.id !== "string" || room.id.length === 0) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  if (!(await isRoomParticipant(supabase, user.id, room))) {
    return null;
  }

  const roomName = getVideoRoomName(room);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 2; // 2 hours
  const nbf = now - 60; // allow 1 min clock skew

  // JaaS room name format when using JaaS is AppID/roomName
  const jaasRoomName = `${appId}/${roomName}`;

  const header = {
    alg: "RS256",
    kid,
    typ: "JWT",
  };

  const payload = {
    aud: "jitsi",
    context: {
      user: {
        id: user.id,
        name: profile?.display_name ?? user.email ?? "",
        avatar: profile?.avatar_url ?? "",
        email: user.email ?? "",
        moderator: "false",
      },
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        "outbound-call": false,
        "inbound-call": false,
      },
      room: { regex: false },
    },
    exp,
    iss: "chat",
    nbf,
    room: jaasRoomName,
    sub: appId,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  try {
    const sign = createSign("RSA-SHA256");
    sign.update(signingInput);
    const signature = sign.sign(privateKey);
    const sigB64 = base64url(Buffer.isBuffer(signature) ? signature : Buffer.from(signature));
    return `${signingInput}.${sigB64}`;
  } catch (err) {
    console.error("[getJitsiJwt] sign error:", err);
    return null;
  }
}

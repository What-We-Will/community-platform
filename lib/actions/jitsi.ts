"use server";

import { createSign } from "crypto";

const JITSI_APP_ID = process.env.NEXT_PUBLIC_JITSI_APP_ID ?? "";
const JITSI_JWT_KID = process.env.JITSI_JWT_KID ?? "";
const JITSI_PRIVATE_KEY = process.env.JITSI_PRIVATE_KEY ?? "";

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
 * Env (server-only):
 * - JITSI_JWT_KID: Key ID from JaaS console (e.g. "vpaas-magic-cookie-xxx/4f4910")
 * - JITSI_PRIVATE_KEY: PEM private key (full string, including -----BEGIN...-----)
 */
export async function getJitsiJwt(
  roomName: string,
  displayName: string,
  userId: string,
  options?: { moderator?: boolean; avatar?: string; email?: string }
): Promise<string | null> {
  if (!JITSI_APP_ID || !JITSI_JWT_KID || !JITSI_PRIVATE_KEY) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 2; // 2 hours
  const nbf = now - 60; // allow 1 min clock skew

  // JaaS room name format when using JaaS is AppID/roomName
  const jaasRoomName = `${JITSI_APP_ID}/${roomName}`;

  const header = {
    alg: "RS256",
    kid: JITSI_JWT_KID,
    typ: "JWT",
  };

  const payload = {
    aud: "jitsi",
    context: {
      user: {
        id: userId,
        name: displayName,
        avatar: options?.avatar ?? "",
        email: options?.email ?? "",
        moderator: options?.moderator ? "true" : "false",
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
    sub: JITSI_APP_ID,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  try {
    const sign = createSign("RSA-SHA256");
    sign.update(signingInput);
    const signature = sign.sign(JITSI_PRIVATE_KEY);
    const sigB64 = base64url(Buffer.isBuffer(signature) ? signature : Buffer.from(signature));
    return `${signingInput}.${sigB64}`;
  } catch (err) {
    console.error("[getJitsiJwt] sign error:", err);
    return null;
  }
}

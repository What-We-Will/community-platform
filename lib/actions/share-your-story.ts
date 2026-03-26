"use server";

import { headers } from "next/headers";

const FORM_RESPONSE_URL =
  process.env.GOOGLE_FORM_SHARE_YOUR_STORY_URL ??
  "https://docs.google.com/forms/d/e/1FAIpQLScIHbzanh1i_mQsn3KZ1YtcM2Oz4Wd4comxB0R0Ihi-UPIsLw/formResponse";

const ENTRY = {
  name: "entry.838646267",
  anonymous: "entry.1537978588",
  email: "entry.1217872030",
  zip: "entry.1081502524",
  story: "entry.1664592696",
} as const;

const RATE_WINDOW_MS = 60 * 60 * 1000;
/** Per-IP cap on server action invocations (any payload), including failed validation. */
const RATE_MAX_PER_WINDOW = 15;

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_ZIP = 10;
const MAX_STORY = 50_000;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function pruneRateBuckets() {
  if (rateLimitBuckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of rateLimitBuckets) {
    if (now > v.resetAt) rateLimitBuckets.delete(k);
  }
}

function allowSubmission(ip: string): boolean {
  pruneRateBuckets();
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX_PER_WINDOW) return false;
  bucket.count++;
  return true;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return h.get("x-real-ip") ?? "unknown";
}

function emailOk(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export type ShareYourStoryResult =
  | { ok: true }
  | {
      ok: false;
      error: "rate_limited" | "validation_failed" | "submission_failed";
    };

export async function submitShareYourStory(input: {
  name: string;
  anonymous: string;
  email: string;
  zip: string;
  story: string;
}): Promise<ShareYourStoryResult> {
  const ip = await getClientIp();
  if (!allowSubmission(ip)) {
    return { ok: false, error: "rate_limited" };
  }

  const name = input.name.trim().slice(0, MAX_NAME);
  const anonymous = input.anonymous.trim();
  const email = input.email.trim().slice(0, MAX_EMAIL);
  const zip = input.zip.trim().slice(0, MAX_ZIP);
  const story = input.story.trim().slice(0, MAX_STORY);

  if (!anonymous || (anonymous !== "Yes" && anonymous !== "No")) {
    return { ok: false, error: "validation_failed" };
  }
  if (!email || !emailOk(email)) {
    return { ok: false, error: "validation_failed" };
  }
  if (!zip) {
    return { ok: false, error: "validation_failed" };
  }
  if (!story) {
    return { ok: false, error: "validation_failed" };
  }

  const data = new FormData();
  data.append(ENTRY.name, name);
  data.append(ENTRY.anonymous, anonymous);
  data.append(ENTRY.email, email);
  data.append(ENTRY.zip, zip);
  data.append(ENTRY.story, story);

  let response: Response;
  try {
    response = await fetch(FORM_RESPONSE_URL, {
      method: "POST",
      body: data,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ShareYourStory/1.0)",
      },
    });
  } catch (err) {
    console.error("Story form submission failed:", err);
    return { ok: false, error: "submission_failed" };
  }

  const text = await response.text();
  if (!response.ok) {
    return { ok: false, error: "submission_failed" };
  }

  // Google Forms confirmation HTML (English) — do not report success without it.
  if (!/Your response has been recorded/i.test(text)) {
    return { ok: false, error: "submission_failed" };
  }

  return { ok: true };
}

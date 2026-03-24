"use server";

const ENTRY = {
  name: "entry.838646267",
  anonymous: "entry.1537978588",
  email: "entry.1217872030",
  zip: "entry.1081502524",
  story: "entry.1664592696",
} as const;

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_ZIP = 10;
const MAX_STORY = 50_000;

function emailOk(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function zipOk(v: string) {
  return /^\d{5}(-\d{4})?$/.test(v);
}

function sanitizeForSpreadsheet(v: string): string {
  if (/^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

export type ShareYourStoryResult =
  | { ok: true }
  | {
      ok: false;
      error: "validation_failed" | "submission_failed";
    };

export async function submitShareYourStory(input: {
  name: string;
  anonymous: string;
  email: string;
  zip: string;
  story: string;
}): Promise<ShareYourStoryResult> {
  const formResponseUrl = process.env.GOOGLE_FORM_SHARE_YOUR_STORY_URL;
  if (!formResponseUrl) {
    console.error("[share-your-story] GOOGLE_FORM_SHARE_YOUR_STORY_URL is not configured.");
    return { ok: false, error: "submission_failed" };
  }

  const url = new URL(formResponseUrl);
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") {
    console.error("[share-your-story] GOOGLE_FORM_SHARE_YOUR_STORY_URL must be an https://docs.google.com URL");
    return { ok: false, error: "submission_failed" };
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
  if (!zip || !zipOk(zip)) {
    return { ok: false, error: "validation_failed" };
  }
  if (!story) {
    return { ok: false, error: "validation_failed" };
  }

  const data = new FormData();
  data.append(ENTRY.name, sanitizeForSpreadsheet(name));
  data.append(ENTRY.anonymous, anonymous);
  data.append(ENTRY.email, sanitizeForSpreadsheet(email));
  data.append(ENTRY.zip, zip);
  data.append(ENTRY.story, sanitizeForSpreadsheet(story));

  let response: Response;
  try {
    response = await fetch(formResponseUrl, {
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

  if (!response.ok) {
    return { ok: false, error: "submission_failed" };
  }

  return { ok: true };
}

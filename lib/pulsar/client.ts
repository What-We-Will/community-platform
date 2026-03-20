import {
  WhatWeWillBriefRequest,
  WhatWeWillBriefResponse,
  WhatWeWillMatchResponse,
  WhatWeWillProfileRequest,
} from "./types";

function getPulsarConfig() {
  const baseUrl = process.env.PULSAR_BASE_URL;
  const apiKey = process.env.WHATWEWILL_API_KEY;

  if (!baseUrl) {
    throw new Error("PULSAR_BASE_URL is not configured");
  }
  if (!apiKey) {
    throw new Error("WHATWEWILL_API_KEY is not configured");
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
  };
}

async function postJson<TResponse>(path: string, payload: unknown): Promise<TResponse> {
  const { baseUrl, apiKey } = getPulsarConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`Pulsar request failed (${res.status}): ${bodyText}`);
  }

  return (await res.json()) as TResponse;
}

export async function fetchPulsarMatches(
  payload: WhatWeWillProfileRequest
): Promise<WhatWeWillMatchResponse> {
  return postJson<WhatWeWillMatchResponse>(
    "/api/integrations/whatwewill/match",
    payload
  );
}

export async function fetchPulsarBrief(
  payload: WhatWeWillBriefRequest
): Promise<WhatWeWillBriefResponse> {
  return postJson<WhatWeWillBriefResponse>(
    "/api/integrations/whatwewill/brief",
    payload
  );
}


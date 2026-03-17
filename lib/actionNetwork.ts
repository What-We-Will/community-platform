const ACTION_NETWORK_BASE_URL =
  process.env.ACTION_NETWORK_BASE_URL ?? "https://actionnetwork.org/api/v2";
const ACTION_NETWORK_API_KEY = process.env.ACTION_NETWORK_API_KEY;
const ACTION_NETWORK_FORM_ID = process.env.ACTION_NETWORK_FORM_ID;

if (!ACTION_NETWORK_API_KEY) {
  // Intentionally throw at module init in non-test environments so misconfig is obvious
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.warn(
      "[actionNetwork] ACTION_NETWORK_API_KEY is not set; newsletter signup will fail.",
    );
  }
}

type SubscribeResult = {
  ok: boolean;
  status: number;
  error?: string;
};

function isValidUsZip(zip: string) {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

type SubscribeOptions = {
  email: string;
  firstName?: string;
  lastName?: string;
  zipCode?: string;
};

export async function subscribeEmailToNewsletter(
  options: SubscribeOptions | string,
): Promise<SubscribeResult> {
  const email = typeof options === "string" ? options : options.email;
  const firstName =
    typeof options === "string" ? undefined : options.firstName;
  const lastName = typeof options === "string" ? undefined : options.lastName;
  const zipCode = typeof options === "string" ? undefined : options.zipCode;

  if (!email) {
    return {
      ok: false,
      status: 400,
      error: "Email is required",
    };
  }

  if (!ACTION_NETWORK_API_KEY) {
    return {
      ok: false,
      status: 500,
      error: "Action Network API key is not configured",
    };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Very basic format check; UI should validate as well
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid email address",
    };
  }

  const trimmedZip = zipCode?.trim();
  if (trimmedZip && !isValidUsZip(trimmedZip)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid US ZIP code",
    };
  }

  const endpoint =
    ACTION_NETWORK_FORM_ID != null && ACTION_NETWORK_FORM_ID !== ""
      ? `${ACTION_NETWORK_BASE_URL}/forms/${encodeURIComponent(
          ACTION_NETWORK_FORM_ID,
        )}/submissions`
      : `${ACTION_NETWORK_BASE_URL}/people`;

  const personFields: {
    email_addresses: Array<{ address: string }>;
    given_name?: string;
    family_name?: string;
    postal_addresses?: Array<{ postal_code: string }>;
  } = {
    email_addresses: [{ address: trimmedEmail }],
  };
  if (firstName) personFields.given_name = firstName;
  if (lastName) personFields.family_name = lastName;
  if (trimmedZip)
    personFields.postal_addresses = [{ postal_code: trimmedZip }];

  const payload =
    ACTION_NETWORK_FORM_ID != null && ACTION_NETWORK_FORM_ID !== ""
      ? {
          person: personFields,
        }
      : {
          email_addresses: [{ address: trimmedEmail }],
          ...(firstName && { given_name: firstName }),
          ...(lastName && { family_name: lastName }),
          ...(trimmedZip && {
            postal_addresses: [{ postal_code: trimmedZip }],
          }),
        };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "OSDI-API-Token": ACTION_NETWORK_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let upstreamMessage = `Upstream error ${res.status}`;
    try {
      const data = (await res.json()) as {
        error?: string;
        errors?: Array<{ title?: string; detail?: string }>;
      };

      if (typeof data?.error === "string" && data.error.trim() !== "") {
        upstreamMessage = data.error;
      } else if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        if (first?.title) {
          upstreamMessage = first.title;
        } else if (first?.detail) {
          upstreamMessage = first.detail;
        }
      }
    } catch {
      // ignore JSON parse errors; keep default upstreamMessage
    }

    const isServerError = res.status >= 500;

    return {
      ok: false,
      status: res.status,
      // For 5xx errors, hide low-level details from the user but
      // still surface something human-friendly.
      error: isServerError
        ? "Our newsletter service is currently unavailable. Please try again in a little while."
        : upstreamMessage,
    };
  }

  return { ok: true, status: res.status };
}


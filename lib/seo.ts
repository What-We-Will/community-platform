import type { Metadata } from "next";

export const OG_IMAGE = {
  url: "/images/link-preview.webp",
  alt: "What We Will — organizing for human-first AI and worker power",
};

/** Prevent indexing of authenticated, utility, and internal pages. */
export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
};

export function canonicalPath(path: string): Metadata["alternates"] {
  if (path.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new Error("canonicalPath only accepts site-relative paths");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return { canonical: normalized };
}

/**
 * Serialize a JSON-LD payload for inline `<script type="application/ld+json">`.
 * Escapes `<` to `\u003c` so `</script>` inside string fields can't break out of
 * the tag — defense-in-depth for when payloads ever become non-literal.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

import type { Metadata } from "next";

/** Mass Call campaign site (movement subdomain). */
export const MASS_CALL_URL = "https://movement.wwwrise.org";

export const OG_IMAGE = {
  url: "/images/link-preview.webp",
  alt: "What We Will — organizing for human-first AI and worker power",
};

/** Prevent indexing of authenticated, utility, and internal pages. */
export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
};

export function canonicalPath(path: string): Metadata["alternates"] {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return { canonical: normalized };
}

import { getServerSiteUrl } from "@/lib/utils/get-site-url";

export const ORGANIZATION_NAME = "What We Will";

export const ORGANIZATION_DESCRIPTION =
  "A nonprofit worker center supporting AI-displaced tech workers through human-first AI policy and community support for those navigating job loss with layoff support, mutual aid, political advocacy, and community organizing.";

/** Public profiles and the main marketing site. */
export const ORGANIZATION_SAME_AS = [
  "https://www.instagram.com/www_rise/",
  "https://www.tiktok.com/@www_rise",
  "https://bsky.app/profile/wwwrise.bsky.social",
  "https://www.linkedin.com/company/wwwrise/",
  "https://www.youtube.com/@whatwewill_rise",
] as const;

export function getOrganizationJsonLd() {
  const siteUrl = getServerSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION_NAME,
    url: siteUrl,
    logo: `${siteUrl}/images/branding/WWW-logo-full.png`,
    description: ORGANIZATION_DESCRIPTION,
    sameAs: [...ORGANIZATION_SAME_AS],
  };
}

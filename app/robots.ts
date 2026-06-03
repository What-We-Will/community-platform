import type { MetadataRoute } from "next";
import { getServerSiteUrl } from "@/lib/utils/get-site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getServerSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/branding",
        "/dashboard",
        "/forgot-password",
        "/login",
        "/signup",
        "/update-password",
        "/onboarding",
        "/pending-approval",
        "/members",
        "/messages",
        "/groups",
        "/events",
        "/jobs",
        "/projects",
        "/tracker",
        "/learning",
        "/links",
        "/profile",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

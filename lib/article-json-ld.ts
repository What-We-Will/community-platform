import type { Article } from "@/lib/news";
import { ORGANIZATION_NAME } from "@/lib/organization-json-ld";
import { getServerSiteUrl } from "@/lib/utils/get-site-url";

export function getArticleJsonLd(article: Article) {
  const siteUrl = getServerSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.datePublished,
    author: {
      "@type": "Organization",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/branding/WWW-logo-full.png`,
      },
    },
    mainEntityOfPage: `${siteUrl}/news/${article.slug}`,
  };
}

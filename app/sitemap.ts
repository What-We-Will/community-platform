import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/news";
import { getServerSiteUrl } from "@/lib/utils/get-site-url";

const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about-us", priority: 0.8, changeFrequency: "monthly" },
  { path: "/news", priority: 0.9, changeFrequency: "weekly" },
  { path: "/our-platform", priority: 0.8, changeFrequency: "monthly" },
  { path: "/programs/no-robo-bosses", priority: 0.8, changeFrequency: "monthly" },
  { path: "/share-your-story", priority: 0.7, changeFrequency: "monthly" },
  { path: "/social", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getServerSiteUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${base}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })
  );

  const articleEntries: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${base}/news/${article.slug}`,
    lastModified: new Date(article.datePublished),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...articleEntries];
}

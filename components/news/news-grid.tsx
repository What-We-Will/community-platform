import Link from "next/link";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { ARTICLES, type Article } from "@/lib/news";
import { NewsAchievements } from "@/components/news/news-achievements";

const CATEGORY_COLORS: Record<string, string> = {
  "Policy & Advocacy": "bg-accent-blue/10 text-accent-blue",
  "Campaign Update": "bg-primary-orange/10 text-primary-orange",
  Community: "bg-accent-green/10 text-accent-green",
  Resources: "bg-accent-gold/10 text-[#9a7234]",
  Research: "bg-dark-blue/10 text-dark-blue",
  Announcement: "bg-primary-orange/10 text-primary-orange",
};

function CategoryBadge({ category }: { category: string }) {
  const colorClass =
    CATEGORY_COLORS[category] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      <Tag className="size-3" />
      {category}
    </span>
  );
}

function FeaturedArticleCard({ article }: { article: Article }) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-full flex-col md:flex-row">
        {/* Accent stripe */}
        <div className="hidden w-1.5 shrink-0 bg-primary-orange md:block" />

        <div className="flex flex-1 flex-col justify-between gap-4 p-6 md:p-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <CategoryBadge category={article.category} />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {article.date}
              </span>
            </div>

            <h2 className="font-bebas text-2xl leading-tight text-dark-blue sm:text-3xl md:text-4xl">
              {article.title}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              By {article.author}
            </span>
            <Link
              href={`/news/${article.slug}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-orange transition-colors hover:text-primary-orange-hover"
            >
              Read more
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary-orange/60 to-accent-gold/60" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={article.category} />
        </div>

        <h3 className="font-bebas text-xl leading-tight text-dark-blue sm:text-2xl">
          {article.title}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {article.date}
          </span>
          <Link
            href={`/news/${article.slug}`}
            className="flex items-center gap-1 text-xs font-semibold text-primary-orange transition-colors hover:text-primary-orange-hover"
          >
            Read more
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function NewsGrid() {
  const featured = ARTICLES.find((a) => a.featured);
  const rest = ARTICLES.filter((a) => !a.featured);

  return (
    <section className="border-t bg-white px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Achievements highlights */}
        <NewsAchievements />

        {/* Featured article */}
        {featured && (
          <div className="space-y-4">
            <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
              Latest
            </h2>
            <FeaturedArticleCard article={featured} />
          </div>
        )}

        {/* Article grid */}
        <div className="space-y-4">
          <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
            More Updates
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <li key={article.slug} className="flex h-full">
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter CTA */}
        <div className="rounded-xl bg-primary-orange px-6 py-10 text-center text-white md:px-12">
          <h3 className="font-bebas text-3xl tracking-wide sm:text-4xl">
            Stay in the Loop
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-base text-white/80">
            Subscribe to our newsletter and get updates on campaigns, events,
            and resources delivered straight to your inbox.
          </p>
          <Link
            href="/#newsletter"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-primary-orange transition-colors hover:bg-white/90"
          >
            Subscribe
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

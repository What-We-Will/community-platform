import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ARTICLES, getArticleBySlug, type ArticleSection } from "@/lib/news";

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | What We Will`,
    description: article.excerpt,
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  "Policy & Advocacy": "bg-accent-blue/10 text-accent-blue",
  "Campaign Update": "bg-primary-orange/10 text-primary-orange",
  Community: "bg-accent-green/10 text-accent-green",
  Resources: "bg-accent-gold/10 text-[#9a7234]",
  Research: "bg-dark-blue/10 text-dark-blue",
  Announcement: "bg-primary-orange/10 text-primary-orange",
};

function ArticleBody({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section, i) => {
        if (section.type === "paragraph") {
          return (
            <p key={i} className="text-base leading-relaxed text-foreground">
              {section.text}
            </p>
          );
        }

        if (section.type === "heading") {
          return (
            <h2
              key={i}
              className="pt-4 font-bebas text-2xl text-dark-blue sm:text-3xl"
            >
              {section.text}
            </h2>
          );
        }

        if (section.type === "pullquote") {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-primary-orange bg-warm-beige px-6 py-5 rounded-r-xl"
            >
              <p className="text-base font-medium italic leading-relaxed text-dark-blue">
                {section.text}
              </p>
              {section.attribution && (
                <footer className="mt-2 text-sm text-muted-foreground">
                  {section.attribution}
                </footer>
              )}
            </blockquote>
          );
        }

        if (section.type === "list") {
          return (
            <ul key={i} className="space-y-2 pl-2">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-base text-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-orange" />
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
}

function ComingSoon({ article }: { article: { title: string; excerpt: string } }) {
  return (
    <div className="rounded-xl border border-border bg-warm-beige px-8 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary-orange">
        Full article
      </p>
      <h2 className="mx-auto mt-3 max-w-xl font-bebas text-2xl text-dark-blue sm:text-3xl">
        {article.title}
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
        {article.excerpt}
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        Full text coming soon. Check back or{" "}
        <Link href="/#newsletter" className="font-medium text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover">
          subscribe to our newsletter
        </Link>{" "}
        to be notified.
      </p>
    </div>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const categoryColor =
    CATEGORY_COLORS[article.category] ?? "bg-muted text-muted-foreground";

  const related = ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category
  ).slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />

      <main className="flex-1">
        {/* Article header */}
        <div className="border-b border-border/40 bg-muted/30 px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/news"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary-orange"
            >
              <ArrowLeft className="size-4" />
              Back to News
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColor}`}
              >
                <Tag className="size-3" />
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {article.date}
              </span>
            </div>

            <h1 className="mt-4 font-bebas text-4xl leading-tight tracking-wide text-dark-blue sm:text-5xl md:text-6xl">
              {article.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>

            <div className="mt-6 flex items-center gap-2 border-t border-border/40 pt-6">
              <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                <User className="size-4 text-muted-foreground" />
              </span>
              <span className="text-sm text-muted-foreground">{article.author}</span>
            </div>
          </div>
        </div>

        {/* Article body */}
        <div className="px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            {article.body ? (
              <ArticleBody sections={article.body} />
            ) : (
              <ComingSoon article={article} />
            )}
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="border-t bg-white px-4 py-12">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-bebas text-2xl text-dark-blue sm:text-3xl">
                Related Updates
              </h2>
              <ul className="mt-4 space-y-4">
                {related.map((rel) => (
                  <li key={rel.slug}>
                    <Link
                      href={`/news/${rel.slug}`}
                      className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <span className="text-xs text-muted-foreground">
                        {rel.date}
                      </span>
                      <span className="font-bebas text-xl text-dark-blue group-hover:text-primary-orange sm:text-2xl">
                        {rel.title}
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {rel.excerpt}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NewsPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, published_at, created_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">News</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Updates from What We Will.
      </p>

      <div className="mt-8 space-y-4">
        {(posts ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No news posts yet.</p>
        ) : (
          (posts ?? []).map((post) => (
            <article key={post.id} className="rounded-xl border p-5">
              <h2 className="text-xl font-semibold">
                <Link href={`/news/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
              </p>
              {post.excerpt ? (
                <p className="mt-3 text-sm text-muted-foreground">{post.excerpt}</p>
              ) : null}
              <Link href={`/news/${post.slug}`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                Read more
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

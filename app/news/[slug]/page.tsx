import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  let query = supabase
    .from("news_posts")
    .select("title, excerpt, content, cover_image_url, is_published, published_at, created_at")
    .eq("slug", slug);

  if (!isAdmin) query = query.eq("is_published", true);

  const { data: post } = await query.maybeSingle();
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{post.title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
        {!post.is_published ? " · Draft" : ""}
      </p>
      {post.excerpt ? (
        <p className="mt-4 text-base text-muted-foreground">{post.excerpt}</p>
      ) : null}
      {post.cover_image_url ? (
        // Plain img keeps this flexible for external image URLs.
        <img
          src={post.cover_image_url}
          alt=""
          className="mt-6 w-full rounded-lg border object-cover"
        />
      ) : null}
      <div className="prose prose-neutral mt-8 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}

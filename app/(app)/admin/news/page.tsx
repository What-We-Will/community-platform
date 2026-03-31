import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createNewsPost, deleteNewsPost, togglePublishNewsPost } from "./actions";

export default async function AdminNewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: posts } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">News Admin</h1>
        <p className="text-sm text-muted-foreground">
          Publish front-page updates in a blog-style format.
        </p>
      </div>

      <section className="rounded-xl border p-4 sm:p-6">
        <h2 className="text-lg font-medium">Create News Post</h2>
        <form action={createNewsPost} className="mt-4 space-y-3">
          <Input name="title" placeholder="Title" required />
          <Input name="slug" placeholder="Slug (optional, auto-generated from title)" />
          <Textarea
            name="excerpt"
            placeholder="Short excerpt (optional)"
            className="min-h-20"
          />
          <Textarea
            name="content"
            placeholder="Write update content in markdown..."
            className="min-h-40"
            required
          />
          <Input
            name="cover_image_url"
            placeholder="Cover image URL (optional)"
            type="url"
          />
          <label className="flex items-center gap-2 text-sm">
            <input name="is_published" type="checkbox" />
            Publish immediately
          </label>
          <Button type="submit">Create post</Button>
        </form>
      </section>

      <section className="rounded-xl border">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-medium">Existing Posts</h2>
        </div>
        <div className="divide-y">
          {(posts ?? []).length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            (posts ?? []).map((post) => (
              <div key={post.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /news/{post.slug} · {post.is_published ? "Published" : "Draft"}
                  </p>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(post.created_at).toLocaleDateString()}
                    {post.published_at
                      ? ` · Published ${new Date(post.published_at).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/news/${post.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <form action={togglePublishNewsPost}>
                    <input type="hidden" name="id" value={post.id} />
                    <input
                      type="hidden"
                      name="publish"
                      value={post.is_published ? "false" : "true"}
                    />
                    <Button variant="outline" size="sm" type="submit">
                      {post.is_published ? "Unpublish" : "Publish"}
                    </Button>
                  </form>
                  <form action={deleteNewsPost}>
                    <input type="hidden" name="id" value={post.id} />
                    <Button variant="destructive" size="sm" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

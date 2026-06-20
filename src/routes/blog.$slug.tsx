import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Q } from "@/lib/queries";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} — AI Tools Hub Blog` },
      { name: "description", content: `Read ${prettify(params.slug)} on the AI Tools Hub blog.` },
      { property: "og:title", content: `${prettify(params.slug)} — AI Tools Hub` },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/blog/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
  }),
  component: BlogPost,
});

function prettify(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function BlogPost() {
  const { slug } = Route.useParams();
  const post = useQuery({ queryKey: ["blog", slug], queryFn: async () => (await Q.blogPostBySlug(slug)).data });

  if (post.isLoading) return <div className="mx-auto max-w-3xl px-4 py-20">Loading...</div>;
  if (!post.data) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Post not found</h1>
      <Link to="/blog" className="mt-4 inline-block text-primary">← Blog</Link>
    </div>
  );

  const p = post.data;
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/blog" className="text-sm text-muted-foreground">← Blog</Link>
      {p.category && <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>}
      <h1 className="font-display text-3xl sm:text-5xl font-bold mt-1">{p.title}</h1>
      {p.published_at && (
        <div className="text-sm text-muted-foreground mt-2">{new Date(p.published_at).toLocaleDateString()}</div>
      )}
      {p.cover_url && (
        <img src={p.cover_url} alt={p.title} className="mt-6 w-full rounded-2xl object-cover max-h-96" />
      )}
      <div className="mt-8 prose prose-invert max-w-none whitespace-pre-line text-foreground/90">
        {p.content}
      </div>
    </article>
  );
}

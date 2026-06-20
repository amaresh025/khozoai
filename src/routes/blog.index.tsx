import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Q } from "@/lib/queries";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "AI Blog — Guides, Reviews & News | AI Tools Hub" },
      { name: "description", content: "Guides, tool reviews, comparisons, and news from the world of AI." },
      { property: "og:title", content: "AI Blog — AI Tools Hub" },
      { property: "og:url", content: "https://khozoai.com/blog" },
    ],
    links: [{ rel: "canonical", href: "https://khozoai.com/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  const posts = useQuery({ queryKey: ["blog"], queryFn: async () => (await Q.blogPosts()).data ?? [] });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-5xl font-bold">The <span className="text-gradient">Blog</span></h1>
      <p className="mt-2 text-muted-foreground">Guides, reviews, comparisons, and AI news.</p>

      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.data?.map((p) => (
          <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="card-hover rounded-2xl border border-border/60 bg-card overflow-hidden">
            {p.cover_url && <img src={p.cover_url} alt={p.title} loading="lazy" className="h-44 w-full object-cover" />}
            <div className="p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>
              <div className="font-display font-semibold mt-1 line-clamp-2">{p.title}</div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Sparkles, Plus, Award, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { Q } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { CategoryCard } from "@/components/CategoryCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khozoai — The Curated Directory of the Best AI Tools" },
      {
        name: "description",
        content:
          "Browse, compare, and review the best AI tools. Curated across writing, image, video, code, marketing, and more on Khozoai.",
      },
      { property: "og:title", content: "Khozoai — The Best AI Tools Directory" },
      { property: "og:description", content: "Discover and compare the best AI tools, curated for builders, marketers, and creators." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const featured = useQuery({ queryKey: ["tools", "featured"], queryFn: async () => (await Q.tools({ featured: true, limit: 8 })).data ?? [] });
  const trending = useQuery({ queryKey: ["tools", "trending"], queryFn: async () => (await Q.tools({ sort: "views", limit: 8 })).data ?? [] });
  const newest = useQuery({ queryKey: ["tools", "newest"], queryFn: async () => (await Q.tools({ sort: "newest", limit: 8 })).data ?? [] });
  const topRated = useQuery({ queryKey: ["tools", "top-rated"], queryFn: async () => (await Q.tools({ sort: "rating", limit: 8 })).data ?? [] });
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => (await Q.categories()).data ?? [] });
  const blogPosts = useQuery({ queryKey: ["blog", "home"], queryFn: async () => (await Q.blogPosts({ limit: 3 })).data ?? [] });

  return (
    <>
      {/* Hero */}
      <section className="relative border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Curated & verified AI tools
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Khoz<span className="text-gradient">oai</span> — find the right<br className="hidden sm:block" /> AI tool for any job.
          </h1>
          <p className="mt-5 mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            Browse, compare, and review the best AI tools across writing, image, video, code, and marketing.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } });
            }}
            className="relative mx-auto mt-8 max-w-xl"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ChatGPT, Midjourney, Cursor…"
              className="h-14 w-full rounded-xl border border-border bg-background pl-12 pr-28 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
            <Button type="submit" className="absolute right-2 top-1/2 h-10 -translate-y-1/2 px-5">
              Search
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard"><Button size="lg" className="px-6">Go to dashboard</Button></Link>
                <Link to="/submit"><Button size="lg" variant="outline" className="px-6">Submit a tool</Button></Link>
              </>
            ) : (
              <>
                <Link to="/auth" search={{ tab: "signup" }}>
                  <Button size="lg" className="px-6">Get started — free</Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="px-6">Sign in</Button>
                </Link>
              </>
            )}
          </div>

          {/* trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified listings</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Updated weekly</span>
            <span className="inline-flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" /> Editor-reviewed</span>
          </div>
        </div>
      </section>

      <Section title="Featured Tools" subtitle="Hand-picked by our editors" href="/tools" hrefLabel="See all">
        <Grid items={featured.data} />
      </Section>

      <Section title="Browse by Category" subtitle="Explore tools across every workflow" href="/categories" hrefLabel="All categories">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categories.data?.slice(0, 8).map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      </Section>

      <Section title="Trending This Week" subtitle="Most viewed tools right now" icon={<TrendingUp className="h-4 w-4" />} href="/tools" hrefLabel="See all">
        <Grid items={trending.data} />
      </Section>

      <Section title="Newly Added" subtitle="Fresh launches added to the directory" icon={<Plus className="h-4 w-4" />} href="/tools" hrefLabel="See all">
        <Grid items={newest.data} />
      </Section>

      <Section title="Top Rated" subtitle="Loved by our community" href="/tools" hrefLabel="See all">
        <Grid items={topRated.data} />
      </Section>

      <Section title="From the Blog" subtitle="Guides, reviews, and roundups" href="/blog" hrefLabel="All posts">
        <div className="grid gap-5 md:grid-cols-3">
          {blogPosts.data?.map((p) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="card-hover overflow-hidden rounded-xl border border-border bg-card"
            >
              {p.cover_url && (
                <img src={p.cover_url} alt="" loading="lazy" className="h-40 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-primary">{p.category}</div>
                <div className="mt-1 line-clamp-2 font-semibold tracking-tight">{p.title}</div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-7xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-brand p-10 text-center text-white shadow-brand">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Get the best new AI tools weekly</h2>
          <p className="mt-2 text-white/90">One concise email each Friday. Unsubscribe anytime.</p>
          <div className="mt-6 flex justify-center">
            <NewsletterSignup />
          </div>
        </div>
      </section>
    </>
  );
}

function Section({
  title, subtitle, icon, href, hrefLabel, children,
}: { title: string; subtitle?: string; icon?: React.ReactNode; href?: string; hrefLabel?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {href && (
          <Link to={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
            {hrefLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ items }: { items: Awaited<ReturnType<typeof Q.tools>>["data"] | undefined }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items?.map((t) => <ToolCard key={t.id} tool={t} />)}
    </div>
  );
}

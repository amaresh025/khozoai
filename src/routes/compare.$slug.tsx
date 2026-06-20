import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, ExternalLink, Check, X, BadgeCheck } from "lucide-react";
import { Q } from "@/lib/queries";
import type { Tool } from "@/lib/queries";

export const Route = createFileRoute("/compare/$slug")({
  head: ({ params }) => {
    const title = params.slug.split("-vs-").map(prettify).join(" vs ");
    return {
      meta: [
        { title: `${title} — Detailed Comparison | AI Tools Hub` },
        { name: "description", content: `${title}: features, pricing, ratings, pros and cons. See which one is right for you.` },
        { property: "og:title", content: `${title} — AI Tools Hub` },
        { property: "og:url", content: `/compare/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/compare/${params.slug}` }],
    };
  },
  component: CompareDetail,
});

function prettify(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function CompareDetail() {
  const { slug } = Route.useParams();
  const [aSlug, bSlug] = slug.split("-vs-");
  const a = useQuery({ queryKey: ["tool", aSlug], queryFn: async () => (await Q.toolBySlug(aSlug)).data });
  const b = useQuery({ queryKey: ["tool", bSlug], queryFn: async () => (await Q.toolBySlug(bSlug)).data });

  if (a.isLoading || b.isLoading) return <div className="mx-auto max-w-5xl px-4 py-20">Loading…</div>;
  if (!a.data || !b.data) return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Comparison not found</h1>
      <Link to="/compare" className="mt-4 inline-block text-primary">← Back to compare</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/compare" className="text-sm text-muted-foreground hover:text-foreground">← All comparisons</Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {a.data.name} <span className="text-muted-foreground">vs</span> {b.data.name}
      </h1>
      <p className="mt-2 text-muted-foreground">A side-by-side comparison of features, pricing, and ratings.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card tool={a.data} />
        <Card tool={b.data} />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-1/3 px-5 py-3 text-left font-semibold">Specification</th>
              <th className="px-5 py-3 text-left font-semibold">{a.data.name}</th>
              <th className="px-5 py-3 text-left font-semibold">{b.data.name}</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Rating" a={`★ ${Number(a.data.rating).toFixed(1)}`} b={`★ ${Number(b.data.rating).toFixed(1)}`} highlight={a.data.rating > b.data.rating ? "a" : a.data.rating < b.data.rating ? "b" : null} />
            <Row label="Reviews" a={String(a.data.review_count)} b={String(b.data.review_count)} />
            <Row label="Pricing" a={a.data.pricing} b={b.data.pricing} />
            <Row label="Category" a={a.data.category?.name ?? "—"} b={b.data.category?.name ?? "—"} />
            <Row label="Verified" a={a.data.verified ? "Yes" : "No"} b={b.data.verified ? "Yes" : "No"} />
            <Row label="Platforms" a={(a.data.platforms ?? []).join(", ") || "—"} b={(b.data.platforms ?? []).join(", ") || "—"} />
            <Row label="Popularity" a={Intl.NumberFormat("en", { notation: "compact" }).format(a.data.views)} b={Intl.NumberFormat("en", { notation: "compact" }).format(b.data.views)} highlight={a.data.views > b.data.views ? "a" : a.data.views < b.data.views ? "b" : null} />
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {[a.data, b.data].map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-display font-bold">{t.name} — Pros & Cons</h3>
            {t.pros && t.pros.length > 0 && (
              <ul className="mb-4 space-y-1.5">
                {t.pros.map((p, i) => <li key={i} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{p}</li>)}
              </ul>
            )}
            {t.cons && t.cons.length > 0 && (
              <ul className="space-y-1.5">
                {t.cons.map((p, i) => <li key={i} className="flex gap-2 text-sm"><X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />{p}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ tool }: { tool: Tool }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface">
          {tool.logo_url ? (
            <img src={tool.logo_url} alt="" className="h-full w-full object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")} />
          ) : <span className="font-display text-xl font-bold text-foreground/60">{tool.name[0]}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight">
            {tool.name}
            {tool.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
          </h2>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {Number(tool.rating).toFixed(1)} <span className="text-muted-foreground">({tool.review_count})</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{tool.short_description}</p>
      <div className="mt-4 flex gap-3 text-sm">
        <Link to="/tools/$slug" params={{ slug: tool.slug }} className="font-medium text-primary hover:underline">View details</Link>
        <a href={tool.website_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
          Visit <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function Row({ label, a, b, highlight }: { label: string; a: string; b: string; highlight?: "a" | "b" | null }) {
  return (
    <tr className="border-t border-border">
      <td className="px-5 py-3 text-muted-foreground">{label}</td>
      <td className={`px-5 py-3 font-medium ${highlight === "a" ? "text-primary" : ""}`}>{a}</td>
      <td className={`px-5 py-3 font-medium ${highlight === "b" ? "text-primary" : ""}`}>{b}</td>
    </tr>
  );
}

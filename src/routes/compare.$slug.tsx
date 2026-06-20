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

  const featuresA = useQuery({
    enabled: !!a.data?.id,
    queryKey: ["tool", aSlug, "features"],
    queryFn: async () => (await Q.toolFeatures(a.data!.id)).data ?? [],
  });
  const featuresB = useQuery({
    enabled: !!b.data?.id,
    queryKey: ["tool", bSlug, "features"],
    queryFn: async () => (await Q.toolFeatures(b.data!.id)).data ?? [],
  });

  if (a.isLoading || b.isLoading) return <div className="mx-auto max-w-5xl px-4 py-20">Loading…</div>;
  if (!a.data || !b.data) return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Comparison not found</h1>
      <Link to="/compare" className="mt-4 inline-block text-primary">← Back to compare</Link>
    </div>
  );

  const getPricingAvailability = (pricing: string) => {
    return ["free", "freemium"].includes((pricing || "").toLowerCase()) ? "Yes" : "No";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/compare" className="text-sm text-muted-foreground hover:text-foreground">← All comparisons</Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {a.data.name} <span className="text-muted-foreground">vs</span> {b.data.name}
      </h1>
      <p className="mt-2 text-muted-foreground">A side-by-side comparison of features, pricing, and capabilities.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card tool={a.data} />
        <Card tool={b.data} />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed min-w-[650px]">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-1/4 px-5 py-4 text-left font-semibold">Specification</th>
                <th className="px-5 py-4 text-left font-semibold">{a.data.name}</th>
                <th className="px-5 py-4 text-left font-semibold">{b.data.name}</th>
              </tr>
            </thead>
            <tbody>
              <Row
                label="Main usecase"
                a={<p className="text-muted-foreground leading-relaxed text-sm">{a.data.short_description}</p>}
                b={<p className="text-muted-foreground leading-relaxed text-sm">{b.data.short_description}</p>}
              />
              <Row
                label="Category"
                a={a.data.category?.name ?? "—"}
                b={b.data.category?.name ?? "—"}
              />
              <Row
                label="Pricing"
                a={
                  <div>
                    <span className="capitalize font-semibold text-foreground">{a.data.pricing}</span>
                    {a.data.pricing_details && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a.data.pricing_details}</p>
                    )}
                  </div>
                }
                b={
                  <div>
                    <span className="capitalize font-semibold text-foreground">{b.data.pricing}</span>
                    {b.data.pricing_details && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{b.data.pricing_details}</p>
                    )}
                  </div>
                }
              />
              <Row
                label="Free plan"
                a={getPricingAvailability(a.data.pricing)}
                b={getPricingAvailability(b.data.pricing)}
              />
              <Row
                label="Key features"
                a={
                  featuresA.isLoading ? (
                    <span className="text-muted-foreground text-xs">Loading features…</span>
                  ) : featuresA.data && featuresA.data.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-sm">
                      {featuresA.data.map((f) => (
                        <li key={f.id}>{f.feature}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-xs">None listed</span>
                  )
                }
                b={
                  featuresB.isLoading ? (
                    <span className="text-muted-foreground text-xs">Loading features…</span>
                  ) : featuresB.data && featuresB.data.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-sm">
                      {featuresB.data.map((f) => (
                        <li key={f.id}>{f.feature}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-xs">None listed</span>
                  )
                }
              />
              <Row
                label="Strengths"
                a={
                  a.data.pros && a.data.pros.length > 0 ? (
                    <ul className="space-y-1.5 text-muted-foreground text-sm">
                      {a.data.pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )
                }
                b={
                  b.data.pros && b.data.pros.length > 0 ? (
                    <ul className="space-y-1.5 text-muted-foreground text-sm">
                      {b.data.pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )
                }
              />
              <Row
                label="Limitations"
                a={
                  a.data.cons && a.data.cons.length > 0 ? (
                    <ul className="space-y-1.5 text-muted-foreground text-sm">
                      {a.data.cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )
                }
                b={
                  b.data.cons && b.data.cons.length > 0 ? (
                    <ul className="space-y-1.5 text-muted-foreground text-sm">
                      {b.data.cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )
                }
              />
              <Row
                label="Official website"
                a={
                  <a
                    href={a.data.website_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-xs font-semibold text-foreground shadow-xs hover:bg-accent transition-colors"
                  >
                    Visit website <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                }
                b={
                  <a
                    href={b.data.website_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-xs font-semibold text-foreground shadow-xs hover:bg-accent transition-colors"
                  >
                    Visit website <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                }
              />
            </tbody>
          </table>
        </div>
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

function Row({ label, a, b, highlight }: { label: string; a: React.ReactNode; b: React.ReactNode; highlight?: "a" | "b" | null }) {
  return (
    <tr className="border-t border-border">
      <td className="px-5 py-4 text-muted-foreground align-top font-medium w-1/4">{label}</td>
      <td className={`px-5 py-4 align-top font-medium ${highlight === "a" ? "text-primary font-semibold" : ""}`}>{a}</td>
      <td className={`px-5 py-4 align-top font-medium ${highlight === "b" ? "text-primary font-semibold" : ""}`}>{b}</td>
    </tr>
  );
}

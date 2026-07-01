import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Check } from "lucide-react";
import { useEffect } from "react";
import { Q, logEvent } from "@/lib/queries";
import type { Tool } from "@/lib/queries";

export const Route = createFileRoute("/compare/$slug")({
  head: ({ params }) => {
    const title = params.slug.split("-vs-").map(prettify).join(" vs ");
    return {
      meta: [
        { title: `${title} — Detailed Comparison | AI Tools Hub` },
        {
          name: "description",
          content: `${title}: features, pricing, ratings, pros and cons. See which one is right for you.`,
        },
      ],
    };
  },
  component: CompareDetail,
});

function prettify(s: string) {
  return s
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function isEmpty(val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") return val.trim() === "";
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

function CompareDetail() {
  const { slug } = Route.useParams();
  const [aSlug, bSlug] = slug.split("-vs-");
  const a = useQuery({
    queryKey: ["tool", aSlug],
    queryFn: async () => (await Q.toolBySlug(aSlug)).data as Tool | null,
  });
  const b = useQuery({
    queryKey: ["tool", bSlug],
    queryFn: async () => (await Q.toolBySlug(bSlug)).data as Tool | null,
  });

  useEffect(() => {
    if (a.data?.id && b.data?.id) {
      logEvent("tool_compare", { aSlug, bSlug, aId: a.data.id, bId: b.data.id });
    }
  }, [a.data?.id, b.data?.id, aSlug, bSlug]);

  if (a.isLoading || b.isLoading)
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-muted-foreground font-medium animate-pulse">Loading comparison…</div>;
  
  if (!a.data || !b.data)
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">Comparison not found</h1>
        <Link to="/compare" className="mt-4 inline-block text-primary hover:underline">
          ← Back to compare
        </Link>
      </div>
    );

  const taglineA = a.data.tagline;
  const taglineB = b.data.tagline;
  
  const capabilityA = a.data.capabilities;
  const capabilityB = b.data.capabilities;

  const categoryA = a.data.category;
  const categoryB = b.data.category;

  const subCategoryA = a.data.sub_category;
  const subCategoryB = b.data.sub_category;

  const pricingA = a.data.pricing;
  const pricingDetailsA = a.data.pricing_details;
  const pricingB = b.data.pricing;
  const pricingDetailsB = b.data.pricing_details;

  const bestForA = a.data.best_for;
  const bestForB = b.data.best_for;

  const showTagline = !isEmpty(taglineA) || !isEmpty(taglineB);
  const showCapability = !isEmpty(capabilityA) || !isEmpty(capabilityB);
  const showCategory = !isEmpty(categoryA) || !isEmpty(categoryB);
  const showSubCategory = !isEmpty(subCategoryA) || !isEmpty(subCategoryB);
  const showPricing = (!isEmpty(pricingA) || !isEmpty(pricingDetailsA)) || (!isEmpty(pricingB) || !isEmpty(pricingDetailsB));
  const showBestFor = !isEmpty(bestForA) || !isEmpty(bestForB);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link
        to="/compare"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        ← All comparisons
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
        {a.data.tool_name} <span className="text-muted-foreground font-normal">vs</span> {b.data.tool_name}
      </h1>
      <p className="mt-2 text-muted-foreground text-sm sm:text-base">
        A side-by-side comparison of key capabilities, pricing, and details.
      </p>

      {/* Comparison cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 items-stretch">
        <Card tool={a.data} />
        <Card tool={b.data} />
      </div>

      {/* Grid Comparison Table */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3">
          {/* Header Row */}
          <div className="hidden md:block px-6 py-4 bg-surface text-xs uppercase font-bold tracking-wider text-muted-foreground border-b border-border">
            Specification
          </div>
          <div className="col-span-1 px-4 py-3.5 md:px-6 md:py-4 bg-surface text-xs md:text-sm font-bold md:font-semibold text-muted-foreground md:text-foreground border-b border-border flex items-center gap-2">
            <span className="hidden md:inline text-xs font-normal text-muted-foreground uppercase">Tool A:</span> {a.data.tool_name}
          </div>
          <div className="col-span-1 px-4 py-3.5 md:px-6 md:py-4 bg-surface text-xs md:text-sm font-bold md:font-semibold text-muted-foreground md:text-foreground border-b border-border flex items-center gap-2">
            <span className="hidden md:inline text-xs font-normal text-muted-foreground uppercase">Tool B:</span> {b.data.tool_name}
          </div>

          {/* Tagline Row */}
          {showTagline && (
            <RowGrid
              label="Tagline"
              a={!isEmpty(taglineA) ? <p className="text-sm italic text-muted-foreground leading-relaxed break-words">"{taglineA}"</p> : null}
              b={!isEmpty(taglineB) ? <p className="text-sm italic text-muted-foreground leading-relaxed break-words">"{taglineB}"</p> : null}
            />
          )}

          {/* Capability Row */}
          {showCapability && (
            <RowGrid
              label="Capability"
              a={
                !isEmpty(capabilityA) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {capabilityA.map((cap) => (
                      <span
                        key={cap}
                        className="inline-flex items-center rounded-md bg-primary/5 px-2.5 py-1 text-xs text-primary font-medium border border-primary/15"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                ) : null
              }
              b={
                !isEmpty(capabilityB) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {capabilityB.map((cap) => (
                      <span
                        key={cap}
                        className="inline-flex items-center rounded-md bg-primary/5 px-2.5 py-1 text-xs text-primary font-medium border border-primary/15"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                ) : null
              }
            />
          )}

          {/* Category Row */}
          {showCategory && (
            <RowGrid
              label="Category"
              a={
                !isEmpty(categoryA) ? (
                  <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-xs text-secondary-foreground font-medium border border-border">
                    {categoryA}
                  </span>
                ) : null
              }
              b={
                !isEmpty(categoryB) ? (
                  <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-xs text-secondary-foreground font-medium border border-border">
                    {categoryB}
                  </span>
                ) : null
              }
            />
          )}

          {/* Sub Category Row */}
          {showSubCategory && (
            <RowGrid
              label="Sub Category"
              a={
                !isEmpty(subCategoryA) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {subCategoryA.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-xs text-secondary-foreground font-medium border border-border"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : null
              }
              b={
                !isEmpty(subCategoryB) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {subCategoryB.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-xs text-secondary-foreground font-medium border border-border"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : null
              }
            />
          )}

          {/* Pricing Row */}
          {showPricing && (
            <RowGrid
              label="Pricing"
              a={
                (!isEmpty(pricingA) || !isEmpty(pricingDetailsA)) ? (
                  <div className="flex flex-col gap-1">
                    {!isEmpty(pricingA) && (
                      <span className="capitalize font-semibold text-foreground text-sm sm:text-base">
                        {pricingA}
                      </span>
                    )}
                    {!isEmpty(pricingDetailsA) && (
                      <p className="text-xs text-muted-foreground leading-normal break-words">
                        {pricingDetailsA}
                      </p>
                    )}
                  </div>
                ) : null
              }
              b={
                (!isEmpty(pricingB) || !isEmpty(pricingDetailsB)) ? (
                  <div className="flex flex-col gap-1">
                    {!isEmpty(pricingB) && (
                      <span className="capitalize font-semibold text-foreground text-sm sm:text-base">
                        {pricingB}
                      </span>
                    )}
                    {!isEmpty(pricingDetailsB) && (
                      <p className="text-xs text-muted-foreground leading-normal break-words">
                        {pricingDetailsB}
                      </p>
                    )}
                  </div>
                ) : null
              }
            />
          )}

          {/* Best For Row */}
          {showBestFor && (
            <RowGrid
              label="Best For"
              a={
                !isEmpty(bestForA) ? (
                  <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    {bestForA.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 animate-in fade-in zoom-in duration-200" />
                        <span className="break-words leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null
              }
              b={
                !isEmpty(bestForB) ? (
                  <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    {bestForB.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 animate-in fade-in zoom-in duration-200" />
                        <span className="break-words leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ tool }: { tool: Tool }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm h-full transition-all duration-200 hover:shadow-md">
      <div>
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt=""
                className="h-full w-full object-contain bg-background"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <span className="font-display text-lg font-bold text-foreground/60">
                {tool.tool_name[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight text-foreground break-words">
              {tool.tool_name}
            </h2>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {tool.pricing && (
                <span className="capitalize inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {tool.pricing}
                </span>
              )}
              {tool.category && (
                <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {tool.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {tool.short_description}
        </p>
      </div>
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
        <Link
          to="/tools/$slug"
          params={{ slug: tool.slug }}
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View details
        </Link>
        <a
          href={tool.website_url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Visit website <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function RowGrid({
  label,
  a,
  b,
}: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
}) {
  return (
    <>
      {/* Mobile Label: Spans full width of mobile grid (2 cols) but hidden on desktop */}
      <div className="col-span-2 md:hidden px-4 py-2 bg-surface/80 text-xs font-bold uppercase tracking-wider text-muted-foreground border-t border-b border-border/60">
        {label}
      </div>
      
      {/* Desktop Label: Stays in col 1, hidden on mobile */}
      <div className="hidden md:flex col-span-1 px-6 py-6 font-display text-sm font-semibold text-muted-foreground border-b border-border items-center">
        {label}
      </div>

      {/* Tool A Cell */}
      <div className="col-span-1 px-4 py-4 md:px-6 md:py-6 border-r md:border-r-0 md:border-l border-border/50 md:border-b md:border-border min-w-0 flex flex-col justify-center">
        {a}
      </div>

      {/* Tool B Cell */}
      <div className="col-span-1 px-4 py-4 md:px-6 md:py-6 md:border-l border-border/50 md:border-b md:border-border min-w-0 flex flex-col justify-center">
        {b}
      </div>
    </>
  );
}


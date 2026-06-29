import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Check, Globe } from "lucide-react";
import { Q } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const Route = createFileRoute("/tools/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} — Review, Features & Pricing | AI Tools Hub` },
      {
        name: "description",
        content: `In-depth review of ${prettify(params.slug)}: features, pricing, pros/cons, ratings, and alternatives.`,
      },
    ],
  }),
  component: ToolDetail,
});

function prettify(s: string) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
    return "AI Tool Details";
  }
  return s
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function ToolDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  const tool = useQuery({
    queryKey: ["tool", slug],
    queryFn: async () => (await Q.toolBySlug(slug)).data,
  });

  const related = useQuery({
    enabled: !!tool.data?.category,
    queryKey: ["tool", slug, "related", tool.data?.category],
    queryFn: async () => {
      const { data } = await Q.tools({ category: tool.data!.category!, limit: 5 });
      return (data ?? []).filter((t) => t.id !== tool.data!.id).slice(0, 4);
    },
  });

  if (tool.isLoading) return <div className="mx-auto max-w-5xl px-4 py-20 text-center">Loading…</div>;
  if (!tool.data)
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Tool not found</h1>
        <Link to="/tools" className="mt-4 inline-block text-primary">
          ← Browse all tools
        </Link>
      </div>
    );

  const t = tool.data;
  const hostname = (() => {
    try {
      return new URL(t.website_url).hostname.replace(/^www\./, "");
    } catch {
      return t.website_url;
    }
  })();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        to="/tools"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to tools
      </Link>

      <Breadcrumbs
        items={[
          { label: "Tools", href: "/tools" },
          ...(t.category ? [{ label: t.category, href: `/tools?category=${encodeURIComponent(t.category)}` }] : []),
          { label: t.tool_name },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: t.tool_name,
            description: t.short_description,
            applicationCategory: t.category || "MultimediaApplication",
            operatingSystem: "All",
            url: `https://khozoai.com/tools/${t.slug}`,
            ...(t.logo_url ? { image: t.logo_url } : {}),
            offers: {
              "@type": "Offer",
              price: t.pricing === "free" ? "0" : undefined,
              priceCurrency: "USD",
              category: t.pricing,
            },
          }),
        }}
      />

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface sm:h-20 sm:w-20">
            {t.logo_url ? (
              <img
                src={t.logo_url}
                alt=""
                className="h-full w-full object-contain bg-background"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <span className="font-display text-2xl font-bold text-foreground/60">
                {t.tool_name[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {t.tool_name}
              </h1>
              {t.featured && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  Featured
                </span>
              )}
            </div>
            {t.tagline && <p className="mt-1 text-sm text-foreground/80 font-medium italic">{t.tagline}</p>}
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{t.short_description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {t.category && (
                <Link
                  to="/tools"
                  search={{ category: t.category }}
                  className="text-muted-foreground hover:text-primary font-medium"
                >
                  {t.category}
                </Link>
              )}
              <span className="capitalize text-muted-foreground">{t.pricing}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" /> {hostname}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
          <a
            href={t.website_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Visit website <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Hero Image / Cover Preview */}
      {t.hero_image_url && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-muted aspect-[16/9] sm:aspect-[21/9] max-h-[380px] w-full">
          <img
            src={t.hero_image_url}
            alt={`${t.tool_name} Cover`}
            className="h-full w-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {t.full_description && (
            <section>
              <h2 className="font-display text-xl font-bold tracking-tight">About {t.tool_name}</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                {t.full_description}
              </p>
            </section>
          )}

          {t.features && t.features.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold tracking-tight">Key features</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {t.features.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Classification Tags */}
          {((t.capabilities && t.capabilities.length > 0) ||
            (t.use_cases && t.use_cases.length > 0) ||
            (t.best_for && t.best_for.length > 0) ||
            (t.integrations && t.integrations.length > 0)) && (
            <section className="space-y-6">
              {t.capabilities && t.capabilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {t.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 text-xs font-medium text-purple-600"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {t.use_cases && t.use_cases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Use Cases
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {t.use_cases.map((uc) => (
                      <span
                        key={uc}
                        className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {uc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {t.best_for && t.best_for.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Best For
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {t.best_for.map((item) => (
                      <li
                        key={item}
                        className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-600"
                      >
                        <Check className="mr-1 h-3 w-3" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {t.integrations && t.integrations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Integrations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {t.integrations.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <InfoBlock title="Pricing">
            <div className="text-base font-semibold capitalize">{t.pricing}</div>
            {t.pricing_details && (
              <p className="mt-2 text-sm text-muted-foreground">{t.pricing_details}</p>
            )}
          </InfoBlock>

          {t.platforms && t.platforms.length > 0 && (
            <InfoBlock title="Platforms">
              <div className="flex flex-wrap gap-1.5">
                {t.platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </InfoBlock>
          )}

          {t.languages && t.languages.length > 0 && (
            <InfoBlock title="Languages">
              <div className="flex flex-wrap gap-1.5">
                {t.languages.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </InfoBlock>
          )}

          {t.company_name && (
            <InfoBlock title="Company">
              <div className="text-sm font-semibold">{t.company_name}</div>
            </InfoBlock>
          )}

          {related.data && related.data.length > 0 && (
            <div className="pt-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Alternatives
              </div>
              <div className="space-y-3">
                {related.data.map((r) => (
                  <ToolCard key={r.id} tool={r} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

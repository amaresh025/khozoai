import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Check, X } from "lucide-react";
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

  const renderBool = (val: boolean | null | undefined) => {
    return val ? (
      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
        <Check className="h-4 w-4 shrink-0" /> Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-destructive font-semibold">
        <X className="h-4 w-4 shrink-0" /> No
      </span>
    );
  };

  if (a.isLoading || b.isLoading)
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center">Loading…</div>;
  if (!a.data || !b.data)
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Comparison not found</h1>
        <Link to="/compare" className="mt-4 inline-block text-primary">
          ← Back to compare
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/compare" className="text-sm text-muted-foreground hover:text-foreground">
        ← All comparisons
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {a.data.tool_name} <span className="text-muted-foreground">vs</span> {b.data.tool_name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        A side-by-side comparison of features, pricing, and capabilities.
      </p>

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
                <th className="px-5 py-4 text-left font-semibold">{a.data.tool_name}</th>
                <th className="px-5 py-4 text-left font-semibold">{b.data.tool_name}</th>
              </tr>
            </thead>
            <tbody>
              <Row
                label="Tagline"
                a={<p className="text-sm italic text-muted-foreground">{a.data.tagline || "—"}</p>}
                b={<p className="text-sm italic text-muted-foreground">{b.data.tagline || "—"}</p>}
              />
              <Row
                label="Description"
                a={<p className="text-muted-foreground leading-relaxed text-sm">{a.data.short_description}</p>}
                b={<p className="text-muted-foreground leading-relaxed text-sm">{b.data.short_description}</p>}
              />
              <Row
                label="Category"
                a={a.data.category ?? "—"}
                b={b.data.category ?? "—"}
              />
              <Row
                label="Sub Categories"
                a={a.data.sub_category && a.data.sub_category.length > 0 ? a.data.sub_category.join(", ") : "—"}
                b={b.data.sub_category && b.data.sub_category.length > 0 ? b.data.sub_category.join(", ") : "—"}
              />
              <Row
                label="Target Use Cases"
                a={
                  <div className="flex flex-wrap gap-1">
                    {a.data.use_cases && a.data.use_cases.length > 0
                      ? a.data.use_cases.map((uc) => (
                          <span
                            key={uc}
                            className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-medium"
                          >
                            {uc}
                          </span>
                        ))
                      : "—"}
                  </div>
                }
                b={
                  <div className="flex flex-wrap gap-1">
                    {b.data.use_cases && b.data.use_cases.length > 0
                      ? b.data.use_cases.map((uc) => (
                          <span
                            key={uc}
                            className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-medium"
                          >
                            {uc}
                          </span>
                        ))
                      : "—"}
                  </div>
                }
              />
              <Row
                label="Capabilities"
                a={
                  <div className="flex flex-wrap gap-1">
                    {a.data.capabilities && a.data.capabilities.length > 0
                      ? a.data.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium"
                          >
                            {cap}
                          </span>
                        ))
                      : "—"}
                  </div>
                }
                b={
                  <div className="flex flex-wrap gap-1">
                    {b.data.capabilities && b.data.capabilities.length > 0
                      ? b.data.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium"
                          >
                            {cap}
                          </span>
                        ))
                      : "—"}
                  </div>
                }
              />
              <Row
                label="Best For"
                a={
                  a.data.best_for && a.data.best_for.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {a.data.best_for.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )
                }
                b={
                  b.data.best_for && b.data.best_for.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {b.data.best_for.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )
                }
              />
              <Row
                label="Platforms"
                a={a.data.platforms && a.data.platforms.length > 0 ? a.data.platforms.join(", ") : "—"}
                b={b.data.platforms && b.data.platforms.length > 0 ? b.data.platforms.join(", ") : "—"}
              />
              <Row
                label="Pricing"
                a={
                  <div>
                    <span className="capitalize font-semibold text-foreground">{a.data.pricing}</span>
                    {a.data.pricing_details && <p className="mt-1 text-xs text-muted-foreground">{a.data.pricing_details}</p>}
                  </div>
                }
                b={
                  <div>
                    <span className="capitalize font-semibold text-foreground">{b.data.pricing}</span>
                    {b.data.pricing_details && <p className="mt-1 text-xs text-muted-foreground">{b.data.pricing_details}</p>}
                  </div>
                }
              />
              <Row
                label="Free plan"
                a={renderBool(a.data.free_plan)}
                b={renderBool(b.data.free_plan)}
              />
              <Row
                label="Developer API"
                a={renderBool(a.data.api_available)}
                b={renderBool(b.data.api_available)}
              />
              <Row
                label="Browser Extension"
                a={renderBool(a.data.browser_extension)}
                b={renderBool(b.data.browser_extension)}
              />
              <Row
                label="Mobile App"
                a={renderBool(a.data.mobile_app)}
                b={renderBool(b.data.mobile_app)}
              />
              <Row
                label="Integrations"
                a={a.data.integrations && a.data.integrations.length > 0 ? a.data.integrations.join(", ") : "—"}
                b={b.data.integrations && b.data.integrations.length > 0 ? b.data.integrations.join(", ") : "—"}
              />
              <Row
                label="Key Features"
                a={
                  a.data.features && a.data.features.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-sm">
                      {a.data.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )
                }
                b={
                  b.data.features && b.data.features.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-sm">
                      {b.data.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                label="Languages"
                a={a.data.languages && a.data.languages.length > 0 ? a.data.languages.join(", ") : "—"}
                b={b.data.languages && b.data.languages.length > 0 ? b.data.languages.join(", ") : "—"}
              />
              <Row
                label="Company Name"
                a={a.data.company_name || "—"}
                b={b.data.company_name || "—"}
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
            <img
              src={tool.logo_url}
              alt=""
              className="h-full w-full object-contain bg-background"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <span className="font-display text-xl font-bold text-foreground/60">
              {tool.tool_name[0]}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight">
            {tool.tool_name}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {tool.pricing && (
              <span className="capitalize inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {tool.pricing}
              </span>
            )}
            {tool.category && (
              <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {tool.category}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{tool.short_description}</p>
      <div className="mt-4 flex gap-3 text-sm">
        <Link
          to="/tools/$slug"
          params={{ slug: tool.slug }}
          className="font-medium text-primary hover:underline"
        >
          View details
        </Link>
        <a
          href={tool.website_url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
        >
          Visit <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function Row({
  label,
  a,
  b,
  highlight,
}: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
  highlight?: "a" | "b" | null;
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-5 py-4 text-muted-foreground align-top font-medium w-1/4">{label}</td>
      <td
        className={`px-5 py-4 align-top font-medium ${highlight === "a" ? "text-primary font-semibold" : ""}`}
      >
        {a}
      </td>
      <td
        className={`px-5 py-4 align-top font-medium ${highlight === "b" ? "text-primary font-semibold" : ""}`}
      >
        {b}
      </td>
    </tr>
  );
}

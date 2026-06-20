import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Star, BadgeCheck, Heart, Share2, GitCompareArrows, Check, X, Globe } from "lucide-react";
import { useEffect } from "react";
import { Q, logEvent } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} — Review, Features & Pricing | AI Tools Hub` },
      { name: "description", content: `In-depth review of ${prettify(params.slug)}: features, pricing, pros/cons, ratings, and alternatives.` },
      { property: "og:title", content: `${prettify(params.slug)} — AI Tools Hub` },
      { property: "og:url", content: `/tools/${params.slug}` },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: `/tools/${params.slug}` }],
  }),
  component: ToolDetail,
});

function prettify(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function ToolDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const tool = useQuery({ queryKey: ["tool", slug], queryFn: async () => (await Q.toolBySlug(slug)).data });
  const features = useQuery({
    enabled: !!tool.data?.id,
    queryKey: ["tool", slug, "features"],
    queryFn: async () => (await Q.toolFeatures(tool.data!.id)).data ?? [],
  });
  const reviews = useQuery({
    enabled: !!tool.data?.id,
    queryKey: ["tool", slug, "reviews"],
    queryFn: async () => (await Q.reviews(tool.data!.id)).data ?? [],
  });
  const related = useQuery({
    enabled: !!tool.data?.category_id,
    queryKey: ["tool", slug, "related", tool.data?.category_id],
    queryFn: async () => {
      const { data } = await Q.tools({ categoryId: tool.data!.category_id!, limit: 5 });
      return (data ?? []).filter((t) => t.id !== tool.data!.id).slice(0, 4);
    },
  });
  const isFav = useQuery({
    enabled: !!user && !!tool.data?.id,
    queryKey: ["favorite", tool.data?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("id")
        .eq("user_id", user!.id).eq("tool_id", tool.data!.id).maybeSingle();
      return !!data;
    },
  });
  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) { navigate({ to: "/auth" }); return; }
      if (isFav.data) await supabase.from("favorites").delete().eq("user_id", user.id).eq("tool_id", tool.data!.id);
      else await supabase.from("favorites").insert({ user_id: user.id, tool_id: tool.data!.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorite", tool.data?.id] }),
  });

  useEffect(() => { if (tool.data?.id) logEvent("tool_view", { slug }, tool.data.id); }, [tool.data?.id, slug]);

  if (tool.isLoading) return <div className="mx-auto max-w-5xl px-4 py-20">Loading…</div>;
  if (!tool.data) return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Tool not found</h1>
      <Link to="/tools" className="mt-4 inline-block text-primary">← Browse all tools</Link>
    </div>
  );

  const t = tool.data;
  const hostname = (() => { try { return new URL(t.website_url).hostname.replace(/^www\./, ""); } catch { return t.website_url; } })();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/tools" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        ← Back to tools
      </Link>
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/tools" className="hover:text-foreground">Tools</Link>
        {t.category && (
          <>
            <span>/</span>
            <Link to="/category/$slug" params={{ slug: t.category.slug }} className="hover:text-foreground">{t.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="truncate text-foreground">{t.name}</span>
      </nav>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface sm:h-20 sm:w-20">
              {t.logo_url ? (
                <img src={t.logo_url} alt="" className="h-full w-full object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <span className="font-display text-2xl font-bold text-foreground/60">{t.name[0]}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t.name}</h1>
                {t.verified && <BadgeCheck className="h-5 w-5 text-primary" aria-label="Verified" />}
                {t.featured && (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Featured
                  </span>
                )}
              </div>
              <p className="mt-2 text-base text-muted-foreground">{t.short_description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {Number(t.rating).toFixed(1)}
                  <span className="font-normal text-muted-foreground">({t.review_count} reviews)</span>
                </span>
                {t.category && (
                  <Link to="/category/$slug" params={{ slug: t.category.slug }} className="text-muted-foreground hover:text-primary">
                    {t.category.name}
                  </Link>
                )}
                <span className="capitalize text-muted-foreground">{t.pricing}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Globe className="h-3.5 w-3.5" /> {hostname}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
          <a href={t.affiliate_url || t.website_url} target="_blank" rel="noreferrer noopener"
            onClick={() => logEvent("tool_click", { slug: t.slug }, t.id)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Visit website <ExternalLink className="h-4 w-4" />
          </a>
          <Button variant="outline" onClick={() => toggleFav.mutate()}>
            <Heart className={`mr-1 h-4 w-4 ${isFav.data ? "fill-rose-500 text-rose-500" : ""}`} />
            {isFav.data ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/compare", search: { a: t.slug } })}>
            <GitCompareArrows className="mr-1 h-4 w-4" /> Compare
          </Button>
          <Button variant="outline" onClick={() => {
            if (typeof navigator !== "undefined" && navigator.share) {
              navigator.share({ title: t.name, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }
          }}>
            <Share2 className="mr-1 h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {t.full_description && (
            <section>
              <h2 className="font-display text-xl font-bold tracking-tight">About {t.name}</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{t.full_description}</p>
            </section>
          )}

          {features.data && features.data.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold tracking-tight">Key features</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {features.data.map((f) => (
                  <li key={f.id} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f.feature}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(t.pros?.length || t.cons?.length) ? (
            <section className="grid gap-4 md:grid-cols-2">
              {t.pros && t.pros.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
                    <Check className="h-4 w-4 text-emerald-600" /> Pros
                  </h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">{t.pros.map((p, i) => <li key={i}>• {p}</li>)}</ul>
                </div>
              )}
              {t.cons && t.cons.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
                    <X className="h-4 w-4 text-destructive" /> Cons
                  </h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">{t.cons.map((p, i) => <li key={i}>• {p}</li>)}</ul>
                </div>
              )}
            </section>
          ) : null}

          <ReviewsSection toolId={t.id} reviews={reviews.data ?? []} />
        </div>

        <aside className="space-y-5">
          <InfoBlock title="Pricing">
            <div className="text-base font-semibold capitalize">{t.pricing}</div>
            {t.pricing_details && <p className="mt-2 text-sm text-muted-foreground">{t.pricing_details}</p>}
          </InfoBlock>
          {t.platforms && t.platforms.length > 0 && (
            <InfoBlock title="Platforms">
              <div className="flex flex-wrap gap-1.5">
                {t.platforms.map((p) => <span key={p} className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs">{p}</span>)}
              </div>
            </InfoBlock>
          )}
          {related.data && related.data.length > 0 && (
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compare {t.name} with</div>
              <div className="space-y-2">
                {related.data.map((r) => (
                  <Link
                    key={r.id}
                    to="/compare/$slug"
                    params={{ slug: `${t.slug}-vs-${r.slug}` }}
                    className="card-hover flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded border border-border bg-surface">
                      {r.logo_url ? (
                        <img src={r.logo_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-xs font-bold">{r.name[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{t.name} vs {r.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.short_description}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alternatives</div>
              <div className="mt-3 space-y-3">{related.data.map((r) => <ToolCard key={r.id} tool={r} />)}</div>
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
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function ReviewsSection({ toolId, reviews }: { toolId: string; reviews: { id: string; rating: number; title: string | null; body: string | null; created_at: string }[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const submit = useMutation({
    mutationFn: async (vars: { rating: number; title: string; body: string }) => {
      if (!user) { navigate({ to: "/auth" }); return; }
      const { error } = await supabase.from("reviews").upsert({
        tool_id: toolId, user_id: user.id, rating: vars.rating, title: vars.title, body: vars.body, status: "approved",
      }, { onConflict: "tool_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Review posted"); qc.invalidateQueries({ queryKey: ["tool"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight">Reviews</h2>
      <div className="mt-3">
      {user ? (
        <form
          className="space-y-3 rounded-xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            submit.mutate({
              rating: Number(fd.get("rating")),
              title: String(fd.get("title") || ""),
              body: String(fd.get("body") || ""),
            });
            e.currentTarget.reset();
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">Your rating:</span>
            <select name="rating" defaultValue={5} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
              {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <input name="title" placeholder="Title (optional)" maxLength={120} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
          <textarea name="body" placeholder="Share your experience…" maxLength={2000} rows={3} className="w-full rounded-md border border-border bg-background p-3 text-sm" />
          <Button type="submit">Post review</Button>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-5 text-sm">
          <Link to="/auth" className="font-medium text-primary">Sign in</Link> to write a review.
        </div>
      )}
      </div>
      <div className="mt-6 space-y-4">
        {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-auto text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.title && <div className="mt-2 font-semibold">{r.title}</div>}
            {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, X, Star } from "lucide-react";
import { z } from "zod";
import { Q } from "@/lib/queries";
import type { Tool } from "@/lib/queries";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  a: z.string().optional(),
  b: z.string().optional(),
});

export const Route = createFileRoute("/compare/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Compare AI Tools — Side-by-Side | Khozoai" },
      { name: "description", content: "Compare any two AI tools side by side: features, pricing, ratings, and more." },
      { property: "og:title", content: "Compare AI Tools — Khozoai" },
      { property: "og:url", content: "/compare" },
    ],
    links: [{ rel: "canonical", href: "/compare" }],
  }),
  component: ComparePage,
});

function ComparePage() {
  const navigate = useNavigate();
  const { a: aSlugParam, b: bSlugParam } = Route.useSearch();
  const tools = useQuery({
    queryKey: ["tools", "all"],
    queryFn: async () => (await Q.tools({ limit: 1000 })).data ?? [],
  });

  const [a, setA] = useState<Tool | null>(null);
  const [b, setB] = useState<Tool | null>(null);

  // Pre-select from ?a=slug&b=slug
  useEffect(() => {
    if (!tools.data) return;
    if (aSlugParam && !a) {
      const found = tools.data.find((t) => t.slug === aSlugParam);
      if (found) setA(found);
    }
    if (bSlugParam && !b) {
      const found = tools.data.find((t) => t.slug === bSlugParam);
      if (found) setB(found);
    }
  }, [tools.data, aSlugParam, bSlugParam, a, b]);

  function go() {
    if (!a || !b || a.id === b.id) return;
    navigate({ to: "/compare/$slug", params: { slug: `${a.slug}-vs-${b.slug}` } });
  }

  const comparisons = useQuery({ queryKey: ["comparisons"], queryFn: async () => (await Q.comparisons()).data ?? [] });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <Link to="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to tools
      </Link>
      <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold">
        Compare <span className="text-gradient">AI Tools</span>
      </h1>
      <p className="mt-2 text-muted-foreground">Pick any two tools to compare side by side.</p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-6 grid gap-3 sm:gap-4 sm:grid-cols-[1fr_auto_1fr_auto] items-stretch sm:items-center">
        <ToolPicker label="Tool A" value={a} onChange={setA} tools={tools.data ?? []} excludeId={b?.id} />
        <div className="text-center font-display text-xl sm:text-2xl text-gradient self-center">vs</div>
        <ToolPicker label="Tool B" value={b} onChange={setB} tools={tools.data ?? []} excludeId={a?.id} />
        <Button onClick={go} disabled={!a || !b || a?.id === b?.id} className="h-12 bg-gradient-brand text-white border-0">
          Compare
        </Button>
      </div>

      <h2 className="font-display text-2xl font-bold mt-12 mb-4">Popular comparisons</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparisons.data?.map((c) => (
          <Link
            key={c.id}
            to="/compare/$slug"
            params={{ slug: c.slug }}
            className="card-hover rounded-2xl border border-border bg-card p-5"
          >
            <div className="font-display font-semibold">{c.title}</div>
            {c.summary && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.summary}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ToolPicker({
  label,
  value,
  onChange,
  tools,
  excludeId,
}: {
  label: string;
  value: Tool | null;
  onChange: (t: Tool | null) => void;
  tools: Tool[];
  excludeId?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = tools.filter((t) => t.id !== excludeId);
    if (!q) return pool.slice(0, 8);
    return pool
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.short_description?.toLowerCase().includes(q) ||
          t.category?.name.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [tools, query, excludeId]);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 h-12">
        <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded border border-border bg-surface">
          {value.logo_url ? (
            <img src={value.logo_url} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs font-bold">{value.name[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{value.name}</div>
          {value.category && (
            <div className="truncate text-xs text-muted-foreground">{value.category.name}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Change tool"
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={`Search ${label}…`}
        className="h-12 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-80 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange(t);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded border border-border bg-surface">
                {t.logo_url ? (
                  <img src={t.logo_url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs font-bold">{t.name[0]}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {t.category?.name ?? "—"}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(t.rating).toFixed(1)}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && query && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover p-4 text-sm text-muted-foreground shadow-lg">
          No tools match "{query}".
        </div>
      )}
    </div>
  );
}

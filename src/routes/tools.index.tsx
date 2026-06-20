import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Filter } from "lucide-react";
import { Q } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";

const SORTS = [
  { key: "rating", label: "Top rated" },
  { key: "views", label: "Popular" },
  { key: "newest", label: "Newest" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const PRICING = [
  { key: "free", label: "Free" },
  { key: "freemium", label: "Freemium" },
  { key: "paid", label: "Paid" },
  { key: "subscription", label: "Subscription" },
];

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: [
      { title: "All AI Tools — Browse the Full Directory | AI Tools Hub" },
      { name: "description", content: "Browse, filter, and sort every AI tool in our directory by category, pricing, popularity, and rating." },
      { property: "og:title", content: "All AI Tools — AI Tools Hub" },
      { property: "og:url", content: "/tools" },
    ],
    links: [{ rel: "canonical", href: "/tools" }],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const [sort, setSort] = useState<SortKey>("rating");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [pricing, setPricing] = useState<string | undefined>(undefined);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await Q.categories()).data ?? [] });
  const tools = useQuery({
    queryKey: ["tools", "list", { sort, categoryId, pricing }],
    queryFn: async () => (await Q.tools({ sort, categoryId, pricing, limit: 120 })).data ?? [],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">All AI Tools</h1>
        <p className="mt-2 text-muted-foreground">Filter and discover the right tool for the job.</p>
      </div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter className="h-4 w-4" />
          {showMobileFilters ? "Hide Filters" : "Show Filters & Sorting"}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className={`space-y-6 lg:block lg:sticky lg:top-20 lg:self-start ${showMobileFilters ? "block" : "hidden"}`}>
          <FilterGroup label="Sort by">
            <div className="flex flex-col gap-1">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    sort === s.key ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Category">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setCategoryId(undefined)}
                className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  !categoryId ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                All categories
              </button>
              {cats.data?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    categoryId === c.id ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Pricing">
            <div className="flex flex-wrap gap-1.5">
              <Pill active={!pricing} onClick={() => setPricing(undefined)}>Any</Pill>
              {PRICING.map((p) => (
                <Pill key={p.key} active={pricing === p.key} onClick={() => setPricing(p.key)}>
                  {p.label}
                </Pill>
              ))}
            </div>
          </FilterGroup>

          {(categoryId || pricing || sort !== "rating") && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => { setCategoryId(undefined); setPricing(undefined); setSort("rating"); }}>
              Reset filters
            </Button>
          )}
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              {tools.isLoading ? "Loading…" : `${tools.data?.length ?? 0} tools`}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tools.data?.map((t) => <ToolCard key={t.id} tool={t} />)}
          </div>
          {!tools.isLoading && tools.data?.length === 0 && (
            <div className="mt-16 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No tools match those filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active ? "border-primary bg-primary/10 font-medium text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

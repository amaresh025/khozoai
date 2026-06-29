import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Q } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";

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
      {
        name: "description",
        content:
          "Browse, filter, and discover every AI tool in our directory by category, pricing, capabilities, and use cases.",
      },
      { property: "og:title", content: "All AI Tools — AI Tools Hub" },
      { property: "og:url", content: "https://khozoai.com/tools" },
    ],
    links: [{ rel: "canonical", href: "https://khozoai.com/tools" }],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [pricing, setPricing] = useState<string | undefined>(undefined);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    capabilities: true,
    useCases: true,
  });

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await Q.categories()).data ?? [],
  });
  const capabilities = useQuery({
    queryKey: ["dynamic-categories"],
    queryFn: () => Q.dynamicCategories(),
  });
  const useCases = useQuery({
    queryKey: ["dynamic-use-cases"],
    queryFn: () => Q.dynamicUseCases(),
  });

  const tools = useQuery({
    queryKey: [
      "tools",
      "list",
      { categoryNames, pricing, selectedCapabilities, selectedUseCases },
    ],
    queryFn: async () =>
      (
        await Q.tools({
          categoryIds: categoryNames,
          pricing,
          capabilities: selectedCapabilities,
          useCases: selectedUseCases,
          limit: 120,
        })
      ).data ?? [],
  });

  const handleCategoryToggle = (name: string) => {
    setCategoryNames((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const handleCapabilityToggle = (cap: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );
  };

  const handleUseCaseToggle = (uc: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(uc) ? prev.filter((u) => u !== uc) : [...prev, uc],
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters =
    categoryNames.length > 0 ||
    !!pricing ||
    selectedCapabilities.length > 0 ||
    selectedUseCases.length > 0;

  const resetFilters = () => {
    setCategoryNames([]);
    setPricing(undefined);
    setSelectedCapabilities([]);
    setSelectedUseCases([]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">All AI Tools</h1>
        <p className="mt-2 text-muted-foreground">
          Filter and discover the right tool for the job.
        </p>
      </div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter className="h-4 w-4" />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside
          className={`space-y-6 lg:block lg:sticky lg:top-20 lg:self-start ${showMobileFilters ? "block" : "hidden"}`}
        >
          {/* Capabilities Filter */}
          {capabilities.data && capabilities.data.length > 0 && (
            <FilterGroup label="Capabilities">
              <button
                onClick={() => toggleSection("capabilities")}
                className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                {expandedSections.capabilities ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {expandedSections.capabilities && (
                <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1.5">
                  {capabilities.data.slice(0, 20).map((c) => {
                    const isChecked = selectedCapabilities.includes(c.capability);
                    return (
                      <label
                        key={c.capability}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all select-none ${
                          isChecked
                            ? "border-primary/30 bg-primary/5 text-foreground font-medium"
                            : "border-border/40 bg-surface/30 text-muted-foreground hover:bg-surface hover:text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCapabilityToggle(c.capability)}
                          className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/20 accent-primary"
                        />
                        <span className="truncate">{c.capability}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {c.tool_count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </FilterGroup>
          )}

          {/* Use Cases Filter */}
          {useCases.data && useCases.data.length > 0 && (
            <FilterGroup label="Use Cases">
              <button
                onClick={() => toggleSection("useCases")}
                className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                {expandedSections.useCases ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {expandedSections.useCases && (
                <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1.5">
                  {useCases.data.slice(0, 20).map((uc) => {
                    const isChecked = selectedUseCases.includes(uc.use_case);
                    return (
                      <label
                        key={uc.use_case}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all select-none ${
                          isChecked
                            ? "border-emerald-500/30 bg-emerald-500/5 text-foreground font-medium"
                            : "border-border/40 bg-surface/30 text-muted-foreground hover:bg-surface hover:text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleUseCaseToggle(uc.use_case)}
                          className="h-4 w-4 rounded border-border bg-background text-emerald-600 focus:ring-emerald-500/20 accent-emerald-600"
                        />
                        <span className="truncate">{uc.use_case}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {uc.tool_count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </FilterGroup>
          )}

          {/* Category Filter */}
          <FilterGroup label="Categories">
            <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1.5">
              {cats.data?.map((c) => {
                const isChecked = categoryNames.includes(c.name);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all select-none ${
                      isChecked
                        ? "border-primary/30 bg-primary/5 text-foreground font-medium"
                        : "border-border/40 bg-surface/30 text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(c.name)}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/20 accent-primary"
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup label="Pricing">
            <div className="flex flex-wrap gap-1.5">
              <Pill active={!pricing} onClick={() => setPricing(undefined)}>
                Any
              </Pill>
              {PRICING.map((p) => (
                <Pill key={p.key} active={pricing === p.key} onClick={() => setPricing(p.key)}>
                  {p.label}
                </Pill>
              ))}
            </div>
          </FilterGroup>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="w-full" onClick={resetFilters}>
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
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5">
                {selectedCapabilities.map((cap) => (
                  <span
                    key={cap}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {cap}
                    <button
                      onClick={() => handleCapabilityToggle(cap)}
                      className="hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedUseCases.map((uc) => (
                  <span
                    key={uc}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-medium text-emerald-600"
                  >
                    {uc}
                    <button
                      onClick={() => handleUseCaseToggle(uc)}
                      className="hover:text-emerald-600/70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tools.data?.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
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
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

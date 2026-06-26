import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Q } from "@/lib/queries";
import { DynamicCategoryCard } from "@/components/DynamicCategoryCard";
import { CategoryCard } from "@/components/CategoryCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All AI Tool Categories — AI Tools Hub" },
      {
        name: "description",
        content:
          "Browse AI tools by capability, use case, and industry. Find the right AI tool for any job.",
      },
      { property: "og:title", content: "All AI Tool Categories — AI Tools Hub" },
      { property: "og:url", content: "/categories" },
    ],
    links: [{ rel: "canonical", href: "/categories" }],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await Q.categories()).data ?? [],
  });
  const counts = useQuery({
    queryKey: ["categories", "counts"],
    queryFn: async () => {
      const { data } = await supabase.from("tools").select("category_id").eq("status", "approved");
      const m = new Map<string, number>();
      data?.forEach((r) => {
        if (r.category_id) m.set(r.category_id, (m.get(r.category_id) ?? 0) + 1);
      });
      return m;
    },
  });

  const capabilities = useQuery({
    queryKey: ["dynamic-categories"],
    queryFn: () => Q.dynamicCategories(),
  });
  const useCases = useQuery({
    queryKey: ["dynamic-use-cases"],
    queryFn: () => Q.dynamicUseCases(),
  });
  const industries = useQuery({
    queryKey: ["dynamic-industries"],
    queryFn: () => Q.dynamicIndustries(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-5xl font-bold">
        All <span className="text-gradient">Categories</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Browse every AI tool by capability, use case, and industry.
      </p>

      {/* Dynamic Capability Categories */}
      {capabilities.data && capabilities.data.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Browse by <span className="text-primary">Capability</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">What can these tools do?</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {capabilities.data.map((c) => (
              <DynamicCategoryCard
                key={c.capability}
                name={c.capability}
                count={c.tool_count}
                type="capability"
              />
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Use Case Categories */}
      {useCases.data && useCases.data.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Browse by <span className="text-emerald-600">Use Case</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">What are you trying to accomplish?</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {useCases.data.map((uc) => (
              <DynamicCategoryCard
                key={uc.use_case}
                name={uc.use_case}
                count={uc.tool_count}
                type="use_case"
              />
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Industry Categories */}
      {industries.data && industries.data.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Browse by <span className="text-violet-600">Industry</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Tools built for your sector.</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {industries.data.map((ind) => (
              <DynamicCategoryCard
                key={ind.industry}
                name={ind.industry}
                count={ind.tool_count}
                type="industry"
              />
            ))}
          </div>
        </section>
      )}

      {/* Legacy categories for backward compatibility */}
      {cats.data && cats.data.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Legacy <span className="text-muted-foreground">Categories</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Original category listings.</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cats.data.map((c) => (
              <CategoryCard key={c.id} category={c} count={counts.data?.get(c.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Q } from "@/lib/queries";
import { CategoryCard } from "@/components/CategoryCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All AI Tool Categories — AI Tools Hub" },
      { name: "description", content: "Browse AI tools by category: chatbots, writing, coding, image, video, music, and more." },
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-5xl font-bold">All <span className="text-gradient">Categories</span></h1>
      <p className="mt-2 text-muted-foreground">Browse every AI tool category in our directory.</p>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cats.data?.map((c) => (
          <CategoryCard key={c.id} category={c} count={counts.data?.get(c.id)} />
        ))}
      </div>
    </div>
  );
}

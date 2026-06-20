import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Q } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${capitalize(params.slug)} AI Tools — AI Tools Hub` },
      { name: "description", content: `The best ${params.slug.replace(/-/g, " ")} AI tools, ranked and reviewed.` },
      { property: "og:title", content: `${capitalize(params.slug)} AI Tools — AI Tools Hub` },
      { property: "og:url", content: `/category/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/category/${params.slug}` }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const cat = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => (await Q.categoryBySlug(slug)).data,
  });
  const tools = useQuery({
    queryKey: ["tools", "category", cat.data?.id],
    enabled: !!cat.data?.id,
    queryFn: async () => (await Q.tools({ categoryId: cat.data!.id })).data ?? [],
  });

  if (cat.isLoading) return <div className="mx-auto max-w-7xl px-4 py-12">Loading...</div>;
  if (!cat.data) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Category not found</h1>
      <Link to="/categories" className="mt-4 inline-block text-primary">← Back to categories</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground">← All categories</Link>
      <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold">
        Best <span className="text-gradient">{cat.data.name}</span> AI Tools
      </h1>
      {cat.data.description && <p className="mt-2 text-muted-foreground max-w-2xl">{cat.data.description}</p>}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.data?.map((t) => <ToolCard key={t.id} tool={t} />)}
      </div>
      {tools.data && tools.data.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">No tools in this category yet.</p>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

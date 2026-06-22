import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Q } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} AI Tools — AI Tools Hub` },
      { name: "description", content: `The best ${params.slug.replace(/-/g, " ")} AI tools, ranked and reviewed.` },
      { property: "og:title", content: `${prettify(params.slug)} AI Tools — AI Tools Hub` },
      { property: "og:url", content: `https://khozoai.com/category/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `https://khozoai.com/category/${params.slug}` }],
  }),
  component: CategoryPage,
});

function prettify(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const capabilityName = prettify(slug);

  const cat = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => (await Q.categoryBySlug(slug)).data,
  });

  const isLegacyCategory = !!cat.data;

  const toolsByCapability = useQuery({
    queryKey: ["tools", "capability", capabilityName],
    enabled: !isLegacyCategory,
    queryFn: async () => (await Q.toolsByCapability(capabilityName)).data ?? [],
  });

  const toolsByCategory = useQuery({
    queryKey: ["tools", "category", cat.data?.id],
    enabled: !!cat.data?.id,
    queryFn: async () => (await Q.tools({ categoryId: cat.data!.id })).data ?? [],
  });

  const tools = isLegacyCategory ? toolsByCategory.data : toolsByCapability.data;
  const isLoading = isLegacyCategory ? toolsByCategory.isLoading : toolsByCapability.isLoading;
  const displayName = isLegacyCategory ? cat.data!.name : capabilityName;

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-12">Loading...</div>;
  if (!isLegacyCategory && !toolsByCapability.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Category not found</h1>
        <Link to="/categories" className="mt-4 inline-block text-primary">← Back to categories</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Breadcrumbs
        items={[
          { label: "Categories", href: "/categories" },
          { label: displayName },
        ]}
      />
      <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold">
        Best <span className="text-gradient">{displayName}</span> AI Tools
      </h1>
      {isLegacyCategory && cat.data!.description && (
        <p className="mt-2 text-muted-foreground max-w-2xl">{cat.data!.description}</p>
      )}
      {!isLegacyCategory && (
        <p className="mt-2 text-muted-foreground max-w-2xl">
          AI tools with the <strong>{displayName}</strong> capability.
        </p>
      )}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools?.map((t) => <ToolCard key={t.id} tool={t} />)}
      </div>
      {tools && tools.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">No tools in this category yet.</p>
      )}
    </div>
  );
}

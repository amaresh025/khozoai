import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Q } from "@/lib/queries";
import type { Tool } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const Route = createFileRoute("/use-case/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} AI Tools — AI Tools Hub` },
      {
        name: "description",
        content: `Find the best AI tools for ${params.slug.replace(/-/g, " ").toLowerCase()}.`,
      },
      { property: "og:title", content: `${prettify(params.slug)} AI Tools — AI Tools Hub` },
      { property: "og:url", content: `https://khozoai.com/use-case/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `https://khozoai.com/use-case/${params.slug}` }],
  }),
  component: UseCasePage,
});

function prettify(s: string) {
  return s
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function UseCasePage() {
  const { slug } = Route.useParams();
  const useCaseName = prettify(slug);

  const tools = useQuery({
    queryKey: ["tools", "use-case", useCaseName],
    queryFn: async () => ((await Q.toolsByUseCase(useCaseName)).data as Tool[]) ?? [],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Breadcrumbs items={[{ label: "Categories", href: "/categories" }, { label: useCaseName }]} />
      <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold">
        Best <span className="text-gradient">{useCaseName}</span> AI Tools
      </h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        AI tools for <strong>{useCaseName.toLowerCase()}</strong>.
      </p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.data?.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
      {tools.data && tools.data.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">No tools found for this use case.</p>
      )}
    </div>
  );
}

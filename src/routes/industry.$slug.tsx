import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Q } from "@/lib/queries";
import type { Tool } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const Route = createFileRoute("/industry/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} AI Tools — AI Tools Hub` },
      {
        name: "description",
        content: `Find the best AI tools for the ${params.slug.replace(/-/g, " ").toLowerCase()} industry.`,
      },
      { property: "og:title", content: `${prettify(params.slug)} AI Tools — AI Tools Hub` },
      { property: "og:url", content: `https://khozoai.com/industry/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `https://khozoai.com/industry/${params.slug}` }],
  }),
  component: IndustryPage,
});

function prettify(s: string) {
  return s
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function IndustryPage() {
  const { slug } = Route.useParams();
  const industryName = prettify(slug);

  const tools = useQuery({
    queryKey: ["tools", "industry", industryName],
    queryFn: async () => ((await Q.toolsByIndustry(industryName)).data as Tool[]) ?? [],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Breadcrumbs
        items={[{ label: "Categories", href: "/categories" }, { label: industryName }]}
      />
      <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold">
        Best <span className="text-gradient">{industryName}</span> AI Tools
      </h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        AI tools built for the <strong>{industryName.toLowerCase()}</strong> industry.
      </p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.data?.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
      {tools.data && tools.data.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">No tools found for this industry.</p>
      )}
    </div>
  );
}

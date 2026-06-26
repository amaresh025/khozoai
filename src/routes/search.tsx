import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { Q, logEvent } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";

const searchSchema = z.object({ q: z.string().optional().catch("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search AI Tools — AI Tools Hub" },
      {
        name: "description",
        content: "Search across hundreds of AI tools by name, category, or use case.",
      },
      { property: "og:url", content: "/search" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const tools = useQuery({
    queryKey: ["search", q],
    enabled: !!q,
    queryFn: async () => (await Q.tools({ search: q, limit: 60 })).data ?? [],
  });

  useEffect(() => {
    if (q) logEvent("search", { q });
  }, [q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Results for <span className="text-primary">"{q}"</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        {tools.data ? `${tools.data.length} tools found` : "Search across our directory"}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.data?.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
      {tools.data?.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          No tools found. Try a different keyword.
        </p>
      )}
    </div>
  );
}

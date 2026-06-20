import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { Q } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/prompts/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} Prompt — AI Tools Hub` },
      { name: "description", content: `Use this ready-to-go ${prettify(params.slug)} prompt with your favorite AI model.` },
      { property: "og:title", content: `${prettify(params.slug)} Prompt — AI Tools Hub` },
      { property: "og:url", content: `/prompts/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/prompts/${params.slug}` }],
  }),
  component: PromptDetail,
});

function prettify(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function PromptDetail() {
  const { slug } = Route.useParams();
  const p = useQuery({ queryKey: ["prompt", slug], queryFn: async () => (await Q.promptBySlug(slug)).data });

  if (p.isLoading) return <div className="mx-auto max-w-3xl px-4 py-20">Loading...</div>;
  if (!p.data) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Prompt not found</h1>
      <Link to="/prompts" className="mt-4 inline-block text-primary">← Prompt library</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/prompts" className="text-sm text-muted-foreground">← Prompt library</Link>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">{p.data.category} · {p.data.model}</div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">{p.data.title}</h1>
      {p.data.description && <p className="mt-2 text-muted-foreground">{p.data.description}</p>}
      {p.data.use_case && (
        <div className="mt-2 inline-block text-xs px-2 py-1 rounded bg-secondary/60">Use case: {p.data.use_case}</div>
      )}

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">The prompt</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { navigator.clipboard.writeText(p.data!.prompt); toast.success("Copied!"); }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-background/60 rounded-lg p-4 border border-border/40">{p.data.prompt}</pre>
      </div>

      {p.data.tags && p.data.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.data.tags.map((t) => <span key={t} className="text-xs px-2 py-1 rounded bg-secondary/60">#{t}</span>)}
        </div>
      )}
    </div>
  );
}

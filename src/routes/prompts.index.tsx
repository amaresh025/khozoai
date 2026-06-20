import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Q } from "@/lib/queries";

export const Route = createFileRoute("/prompts/")({
  head: () => ({
    meta: [
      { title: "AI Prompt Library — Copy-Paste Prompts for ChatGPT, Claude & more" },
      { name: "description", content: "A library of ready-to-use AI prompts for ChatGPT, Claude, Gemini, coding, marketing, SEO, and more." },
      { property: "og:title", content: "AI Prompt Library — AI Tools Hub" },
      { property: "og:url", content: "/prompts" },
    ],
    links: [{ rel: "canonical", href: "/prompts" }],
  }),
  component: PromptsPage,
});

function PromptsPage() {
  const [cat, setCat] = useState<string | undefined>();
  const prompts = useQuery({
    queryKey: ["prompts", { cat }],
    queryFn: async () => (await Q.prompts({ category: cat })).data ?? [],
  });
  const categories = ["Marketing", "Coding", "Writing", "Research", "SEO", "Social Media", "Education", "Productivity", "Image Generation"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-5xl font-bold">Prompt <span className="text-gradient">Library</span></h1>
      <p className="mt-2 text-muted-foreground">Ready-to-use prompts for the best AI models.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setCat(undefined)} className={`px-3 py-1.5 rounded-full text-sm ${!cat ? "bg-gradient-brand text-white" : "bg-secondary/60"}`}>All</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-sm ${cat === c ? "bg-gradient-brand text-white" : "bg-secondary/60"}`}>{c}</button>
        ))}
      </div>

      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.data?.map((p) => (
          <Link key={p.id} to="/prompts/$slug" params={{ slug: p.slug }} className="card-hover rounded-2xl border border-border/60 bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category} · {p.model}</div>
            <div className="font-display font-semibold mt-1">{p.title}</div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

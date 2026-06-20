import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AI Tools Hub" },
      { name: "description", content: "How AI Tools Hub collects, uses, and protects your data." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
      <h1 className="font-display text-3xl sm:text-5xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      <p className="mt-4 text-muted-foreground">AI Tools Hub respects your privacy. We only collect the data needed to run the directory: optional account email, content you submit (tools, reviews, favorites), and basic analytics. We don't sell your data.</p>
      <p className="mt-4 text-muted-foreground">You can request deletion of your account and content at any time via <a className="text-primary underline" href="/contact">our contact page</a>.</p>
    </div>
  ),
});

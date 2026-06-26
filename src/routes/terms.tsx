import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — AI Tools Hub" },
      { name: "description", content: "Terms governing your use of AI Tools Hub." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
      <h1 className="font-display text-3xl sm:text-5xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">
        By using AI Tools Hub you agree to use the service lawfully, submit accurate information,
        and respect other users. Tools listed are third-party services; we do not warrant their
        availability or performance.
      </p>
      <p className="mt-4 text-muted-foreground">
        Affiliate or sponsored placements are clearly labeled. Content you submit (reviews, tools)
        may be edited or removed at the editors' discretion.
      </p>
    </div>
  ),
});

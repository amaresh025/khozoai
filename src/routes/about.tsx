import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About AI Tools Hub" },
      { name: "description", content: "AI Tools Hub is the ultimate AI tools directory. Learn more about our mission." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl sm:text-5xl font-bold">About <span className="text-gradient">AI Tools Hub</span></h1>
      <p className="mt-6 text-muted-foreground">
        AI Tools Hub is the ultimate directory of AI tools. We curate, review, and rank thousands of tools so you can spend less time searching and more time building.
      </p>
      <p className="mt-4 text-muted-foreground">
        Every tool in our directory is hand-checked. We add new tools weekly and let our community rate, review, and compare them so the best tools rise to the top.
      </p>
      <p className="mt-4 text-muted-foreground">
        Got a tool to submit, feedback, or a partnership in mind? <a className="text-primary underline" href="/contact">Get in touch</a>.
      </p>
    </div>
  );
}

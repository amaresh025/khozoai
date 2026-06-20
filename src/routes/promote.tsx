import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/promote")({
  head: () => ({
    meta: [
      { title: "Promote Your AI Tool — AI Tools Hub" },
      { name: "description", content: "Reach thousands of users actively searching for AI tools. Featured listings, sponsored slots, and more." },
      { property: "og:url", content: "/promote" },
    ],
    links: [{ rel: "canonical", href: "/promote" }],
  }),
  component: PromotePage,
});

const PLANS = [
  { name: "Free Listing", price: "$0", icon: Sparkles, features: ["Standard listing", "Searchable by category", "Submit a tool"], cta: "Submit free", to: "/submit" },
  { name: "Featured Listing", price: "$99/mo", icon: TrendingUp, features: ["Featured on homepage", "Top of category pages", "\"Featured\" badge", "Priority support"], cta: "Get featured", to: "/contact", highlight: true },
  { name: "Sponsored Spot", price: "Contact us", icon: Award, features: ["Top of search results", "Sponsored badge", "Homepage takeover slot", "Custom campaign"], cta: "Talk to us", to: "/contact" },
];

function PromotePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-3xl sm:text-5xl font-bold text-center">Promote <span className="text-gradient">your tool</span></h1>
      <p className="mt-2 text-muted-foreground text-center max-w-2xl mx-auto">
        Reach thousands of users actively looking for the best AI tools.
      </p>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.name} className={`rounded-3xl border p-6 ${p.highlight ? "border-transparent bg-gradient-brand text-white shadow-brand" : "border-border/60 bg-card"}`}>
              <Icon className="h-8 w-8" />
              <div className="font-display text-xl font-bold mt-3">{p.name}</div>
              <div className="font-display text-3xl font-bold mt-1">{p.price}</div>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" /> {f}</li>)}
              </ul>
              <Link to={p.to} className="block mt-6">
                <Button className={p.highlight ? "w-full bg-white text-foreground hover:bg-white/90" : "w-full bg-gradient-brand text-white border-0"}>
                  {p.cta}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

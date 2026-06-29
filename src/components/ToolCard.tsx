import { Link } from "@tanstack/react-router";
import type { Tool } from "@/lib/queries";

const pricingLabels: Record<string, string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
  subscription: "Subscription",
  one_time: "One-time",
  contact: "Contact",
};

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to="/tools/$slug"
      params={{ slug: tool.slug }}
      className="card-hover group relative flex flex-col rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface">
          {tool.logo_url ? (
            <img
              src={tool.logo_url}
              alt=""
              width={44}
              height={44}
              loading="lazy"
              className="h-full w-full object-contain bg-background"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <span className="font-display text-base font-semibold text-foreground/70">
              {tool.tool_name[0]}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-[15px] tracking-tight">{tool.tool_name}</h3>
          </div>
          {tool.category && (
            <div className="truncate text-xs text-muted-foreground">{tool.category}</div>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{tool.short_description}</p>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {pricingLabels[tool.pricing || "free"] ?? tool.pricing}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {tool.featured && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Featured
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

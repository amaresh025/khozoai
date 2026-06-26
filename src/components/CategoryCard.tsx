import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import type { Category } from "@/lib/queries";

export function CategoryCard({ category, count }: { category: Category; count?: number }) {
  const Icon =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      category.icon || "Sparkles"
    ] || Icons.Sparkles;
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="card-hover group flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
    >
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-semibold tracking-tight">{category.name}</div>
        {category.description && (
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {category.description}
          </div>
        )}
      </div>
      {typeof count === "number" && (
        <div className="mt-auto text-xs text-muted-foreground">{count} tools</div>
      )}
    </Link>
  );
}

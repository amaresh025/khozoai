import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  params?: Record<string, string>;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems = [
    { label: "Home", href: "/" },
    ...items,
  ];

  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "https://khozoai.com";

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": allItems.map((item, index) => {
      const itemUrl = item.href ? (item.href.startsWith("http") ? item.href : `${baseOrigin}${item.href}`) : undefined;
      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        ...(itemUrl ? { "item": itemUrl } : {}),
      };
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const showChevron = index < allItems.length - 1;

          return (
            <div key={index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  to={item.href as any}
                  params={item.params}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {index === 0 && <Home className="h-3.5 w-3.5 shrink-0" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className={`truncate flex items-center gap-1 ${isLast ? "text-foreground font-medium" : ""}`}>
                  {index === 0 && <Home className="h-3.5 w-3.5 shrink-0" />}
                  <span>{item.label}</span>
                </span>
              )}
              {showChevron && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
            </div>
          );
        })}
      </nav>
    </>
  );
}

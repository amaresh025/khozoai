import * as Icons from "lucide-react";

const CAPABILITY_ICONS: Record<string, string> = {
  "AI Chatbot": "Bot",
  "AI Writing": "PenTool",
  "AI Coding": "Code2",
  "AI Research": "Search",
  "AI Search": "Globe",
  "AI Image Generation": "ImageIcon",
  "AI Video Generation": "Video",
  "AI Voice Generation": "Mic",
  "AI Music Generation": "Music",
  "AI Automation": "Zap",
  "AI Productivity": "Sparkles",
  "AI Design": "Palette",
  "AI Data Analysis": "BarChart3",
  "AI Translation": "Languages",
  "AI Presentation Creation": "Presentation",
  "AI Resume Building": "FileText",
  "AI 3D Modeling": "Box",
  "AI Education": "GraduationCap",
  "AI Email": "Mail",
  "AI SEO": "TrendingUp",
  "AI Social Media": "Share2",
  "AI Security": "Shield",
  "AI Agent": "Bot",
  "AI Accessibility": "Accessibility",
  "AI Accounting": "Calculator",
  "AI Legal": "Scale",
  "AI Healthcare": "Stethoscope",
  "AI Customer Support": "Headphones",
  "AI Sales": "TrendingUp",
  "AI HR": "Users",
  "AI Project Management": "FolderKanban",
};

const TYPE_COLORS: Record<string, string> = {
  capability: "bg-primary/10 text-primary",
  use_case: "bg-emerald-500/10 text-emerald-600",
  industry: "bg-violet-500/10 text-violet-600",
};

const TYPE_ROUTES: Record<string, string> = {
  capability: "/category",
  use_case: "/use-case",
  industry: "/industry",
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function DynamicCategoryCard({
  name,
  count,
  type = "capability",
}: {
  name: string;
  count?: number;
  type?: "capability" | "use_case" | "industry";
}) {
  const iconName = CAPABILITY_ICONS[name] || "Sparkles";
  const Icon = (Icons as any)[iconName] || Icons.Sparkles;
  const colorClass = TYPE_COLORS[type];
  const routeBase = TYPE_ROUTES[type];
  const slug = slugify(name);

  return (
    <a
      href={`${routeBase}/${slug}`}
      className="card-hover group flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
    >
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-semibold tracking-tight">{name}</div>
      </div>
      {typeof count === "number" && (
        <div className="mt-auto text-xs text-muted-foreground">{count} tools</div>
      )}
    </a>
  );
}

export function TagBadge({
  label,
  href,
  variant = "default",
}: {
  label: string;
  href?: string;
  variant?: "default" | "capability" | "use_case" | "industry";
}) {
  const variantClasses = {
    default: "border-border bg-surface text-muted-foreground hover:bg-surface/80",
    capability: "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
    use_case: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10",
    industry: "border-violet-500/20 bg-violet-500/5 text-violet-600 hover:bg-violet-500/10",
  };

  const className = `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${variantClasses[variant]}`;

  if (href) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return <span className={className}>{label}</span>;
}

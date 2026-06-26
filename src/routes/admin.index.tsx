import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Folder, MessageSquare, Eye, MousePointerClick } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — AI Tools Hub" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [tools, cats, reviews, views, clicks] = await Promise.all([
        supabase.from("tools").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "tool_view"),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "tool_click"),
      ]);
      return {
        tools: tools.count ?? 0,
        categories: cats.count ?? 0,
        reviews: reviews.count ?? 0,
        views: views.count ?? 0,
        clicks: clicks.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">Snapshot of your directory.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Tools" value={stats.data?.tools} icon={Wrench} />
        <Stat label="Categories" value={stats.data?.categories} icon={Folder} />
        <Stat label="Reviews" value={stats.data?.reviews} icon={MessageSquare} />
        <Stat label="Tool views" value={stats.data?.views} icon={Eye} />
        <Stat label="Outbound clicks" value={stats.data?.clicks} icon={MousePointerClick} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | undefined;
  icon: any;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 ${accent ? "border-primary/40 ring-4 ring-primary/10" : "border-border"}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums">{value ?? "—"}</div>
    </div>
  );
}

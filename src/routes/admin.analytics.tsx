import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Eye, MousePointerClick, Search as SearchIcon, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const days = 30;
  const sinceISO = new Date(Date.now() - days * 86400_000).toISOString();

  const events = useQuery({
    queryKey: ["admin", "analytics", days],
    queryFn: async () => {
      const { data } = await supabase
        .from("analytics_events")
        .select("event_type,tool_id,metadata,created_at")
        .gte("created_at", sinceISO)
        .limit(5000);
      return data ?? [];
    },
  });

  const toolsList = useQuery({
    queryKey: ["admin", "analytics", "tools-list"],
    queryFn: async () => {
      const { data } = await supabase.from("tools").select("id,tool_name");
      return data ?? [];
    },
  });

  const topTools = useMemo(() => {
    const viewCounts = new Map<string, number>();
    for (const ev of events.data ?? []) {
      if (ev.event_type === "tool_view" && ev.tool_id) {
        viewCounts.set(ev.tool_id, (viewCounts.get(ev.tool_id) ?? 0) + 1);
      }
    }
    const toolMap = new Map<string, string>();
    toolsList.data?.forEach((t) => {
      toolMap.set(t.id, t.tool_name);
    });

    return Array.from(viewCounts.entries())
      .map(([id, count]) => ({
        id,
        name: toolMap.get(id) || "Unknown Tool",
        views: count,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [events.data, toolsList.data]);

  const cats = useQuery({
    queryKey: ["admin", "analytics", "cat-counts"],
    queryFn: async () => {
      const { data: tools } = await supabase.from("tools").select("category");
      if (!tools) return [];
      const counts = new Map<string, number>();
      tools.forEach((t) => {
        if (t.category) {
          counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
        }
      });
      return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  const byDay = (() => {
    const map = new Map<string, { day: string; views: number; clicks: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      map.set(d, { day: d.slice(5), views: 0, clicks: 0 });
    }
    for (const ev of events.data ?? []) {
      const key = ev.created_at.slice(0, 10);
      const slot = map.get(key);
      if (!slot) continue;
      if (ev.event_type === "tool_view") slot.views++;
      if (ev.event_type === "tool_click") slot.clicks++;
    }
    return Array.from(map.values());
  })();

  const searchTerms = (() => {
    const counts = new Map<string, number>();
    for (const ev of events.data ?? []) {
      if (ev.event_type !== "search") continue;
      const q = (ev.metadata as any)?.q;
      if (typeof q !== "string" || !q) continue;
      counts.set(q.toLowerCase(), (counts.get(q.toLowerCase()) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }));
  })();

  const totalViews = byDay.reduce((s, d) => s + d.views, 0);
  const totalClicks = byDay.reduce((s, d) => s + d.clicks, 0);
  const ctr = totalViews ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last {days} days of activity.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Views" value={totalViews} icon={Eye} />
        <Kpi label="Clicks" value={totalClicks} icon={MousePointerClick} />
        <Kpi label="CTR" value={`${ctr}%`} icon={TrendingUp} />
        <Kpi
          label="Searches"
          value={searchTerms.reduce((s, t) => s + t.count, 0)}
          icon={SearchIcon}
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display text-lg font-bold tracking-tight">
          Views & clicks (daily)
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="var(--color-brand-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-lg font-bold tracking-tight">
            Top tools (views last 30 days)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTools} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="views" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-lg font-bold tracking-tight">Top categories</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cats.data ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="var(--color-brand-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display text-lg font-bold tracking-tight">Top search queries</h2>
        {searchTerms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No search activity yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {searchTerms.map((t) => (
              <li key={t.term} className="flex items-center justify-between py-2">
                <Link to="/search" search={{ q: t.term }} className="hover:text-primary">
                  {t.term}
                </Link>
                <span className="tabular-nums text-muted-foreground">{t.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

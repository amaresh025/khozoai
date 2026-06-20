import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wrench, Folder, Inbox, MessageSquare, Eye, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { approveSubmission } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — AI Tools Hub" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const qc = useQueryClient();
  const approveSub = useServerFn(approveSubmission);
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [tools, cats, subs, reviews, views, clicks] = await Promise.all([
        supabase.from("tools").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "tool_view"),
        supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "tool_click"),
      ]);
      return {
        tools: tools.count ?? 0,
        categories: cats.count ?? 0,
        pendingSubs: subs.count ?? 0,
        reviews: reviews.count ?? 0,
        views: views.count ?? 0,
        clicks: clicks.count ?? 0,
      };
    },
  });

  const pending = useQuery({
    queryKey: ["admin", "submissions"],
    queryFn: async () => (await supabase.from("submissions").select("*").eq("status", "pending").order("created_at", { ascending: false })).data ?? [],
  });

  const setSubStatus = useMutation({
    mutationFn: async (vars: { id: string; status: "approved" | "rejected" }) => {
      if (vars.status === "rejected") {
        const { error } = await supabase.from("submissions").update({ status: "rejected" }).eq("id", vars.id);
        if (error) throw error;
        return;
      }
      return approveSub({ data: { submissionId: vars.id } });
    },
    onSuccess: (res) => {
      if (res && res.needsReview) {
        toast.warning("Approved but AI enrichment failed. Marked as 'Needs Review'.");
      } else {
        toast.success("Approved and enriched successfully!");
      }
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["tools"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => toast.error((e as Error).message),
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
        <Stat label="Pending submissions" value={stats.data?.pendingSubs} icon={Inbox} accent={!!stats.data?.pendingSubs} />
        <Stat label="Reviews" value={stats.data?.reviews} icon={MessageSquare} />
        <Stat label="Tool views" value={stats.data?.views} icon={Eye} />
        <Stat label="Outbound clicks" value={stats.data?.clicks} icon={MousePointerClick} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">Pending submissions</h2>
          <Link to="/admin/import" className="text-sm font-medium text-primary hover:underline">Bulk import →</Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">URL</th>
                  <th className="px-4 py-3 text-left font-semibold">Submitter</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.data?.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground"><a href={s.website_url} target="_blank" rel="noreferrer noopener" className="hover:underline">{s.website_url}</a></td>
                    <td className="px-4 py-3 text-muted-foreground">{s.submitter_email || "—"}</td>
                    <td className="flex gap-2 px-4 py-3">
                      <Button size="sm" onClick={() => setSubStatus.mutate({ id: s.id, status: "approved" })}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => setSubStatus.mutate({ id: s.id, status: "rejected" })}>Reject</Button>
                    </td>
                  </tr>
                ))}
                {(!pending.data || pending.data.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nothing pending 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number | undefined; icon: any; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${accent ? "border-primary/40 ring-4 ring-primary/10" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums">{value ?? "—"}</div>
    </div>
  );
}

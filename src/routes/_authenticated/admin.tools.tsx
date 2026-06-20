import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Star, BadgeCheck, Trash2, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { ToolEditor } from "@/components/admin/ToolEditor";

export const Route = createFileRoute("/_authenticated/admin/tools")({
  head: () => ({ meta: [{ title: "Tools — Admin" }] }),
  component: AdminToolsPage,
});

function AdminToolsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const tools = useQuery({
    queryKey: ["admin", "tools-list", status, search],
    queryFn: async () => {
      let q = supabase.from("tools").select("*, category:categories(name,slug)").order("created_at", { ascending: false }).limit(200);
      if (status !== "all") q = q.eq("status", status as any);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async (vars: { id: string; field: "featured" | "verified" | "sponsored"; value: boolean }) => {
      const { error } = await supabase.from("tools").update({ [vars.field]: vars.value } as any).eq("id", vars.id);
      if (error) throw error;
    },

    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tools-list"] }),
  });

  const setStatusMut = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => {
      const { error } = await supabase.from("tools").update({ status: vars.status as any }).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin", "tools-list"] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tools").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit, feature, verify, and publish tools.</p>
        </div>
        <Button onClick={() => setEditing("new")}><Plus className="mr-1 h-4 w-4" /> New tool</Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Flags</th>
                <th className="px-4 py-3 text-right font-semibold">Rating</th>
                <th className="px-4 py-3 text-right font-semibold">Views</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tools.data?.map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.logo_url && <img src={t.logo_url} alt="" className="h-6 w-6 rounded border border-border" onError={(e) => (e.currentTarget.style.display = "none")} />}
                      <div className="min-w-0">
                        <div className="truncate font-medium">{t.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{t.category?.name ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={t.status} onChange={(e) => setStatusMut.mutate({ id: t.id, status: e.target.value })}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                      <option value="draft">Draft</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <FlagBtn active={t.featured} onClick={() => toggle.mutate({ id: t.id, field: "featured", value: !t.featured })} title="Featured">
                        <Star className="h-3.5 w-3.5" />
                      </FlagBtn>
                      <FlagBtn active={t.verified} onClick={() => toggle.mutate({ id: t.id, field: "verified", value: !t.verified })} title="Verified">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </FlagBtn>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{Number(t.rating).toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.views}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link to="/tools/$slug" params={{ slug: t.slug }} target="_blank" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface" title="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setEditing(t.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${t.name}"?`)) del.mutate(t.id); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tools.data?.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No tools found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ToolEditor
          toolId={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["admin", "tools-list"] }); setEditing(null); }}
        />
      )}
    </div>
  );
}

function FlagBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-surface"
    }`}>
      {children}
    </button>
  );
}

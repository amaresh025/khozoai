import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/blog/")({
  head: () => ({ meta: [{ title: "Blog — Admin" }] }),
  component: AdminBlogList,
});

function AdminBlogList() {
  const qc = useQueryClient();
  const posts = useQuery({
    queryKey: ["admin", "blog-list"],
    queryFn: async () => (await supabase.from("blog_posts").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const togglePublish = useMutation({
    mutationFn: async (vars: { id: string; published: boolean }) => {
      const { error } = await supabase.from("blog_posts").update({
        published: vars.published,
        published_at: vars.published ? new Date().toISOString() : null,
      }).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "blog-list"] }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("blog_posts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "blog-list"] }); },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Write and publish blog posts.</p>
        </div>
        <Link to="/admin/blog/$id" params={{ id: "new" }}><Button><Plus className="mr-1 h-4 w-4" /> New post</Button></Link>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.data?.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3"><div className="font-medium">{p.title}</div><div className="text-xs text-muted-foreground">/{p.slug}</div></td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish.mutate({ id: p.id, published: !p.published })}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.published ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {p.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.published && (
                        <Link to="/blog/$slug" params={{ slug: p.slug }} target="_blank" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface"><Eye className="h-4 w-4" /></Link>
                      )}
                      <Link to="/admin/blog/$id" params={{ id: p.id }} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface"><Pencil className="h-4 w-4" /></Link>
                      <button onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.data?.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No posts yet. Create your first post.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

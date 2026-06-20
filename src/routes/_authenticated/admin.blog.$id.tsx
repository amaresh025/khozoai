import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/blog/$id")({
  head: () => ({ meta: [{ title: "Edit Post — Admin" }] }),
  component: BlogEditor,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function BlogEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", cover_url: "", category: "", tags: "", published: false,
  });

  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["admin", "blog", id],
    queryFn: async () => (await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle()).data,
  });

  useEffect(() => {
    if (existing.data) {
      const p: any = existing.data;
      setForm({
        title: p.title ?? "", slug: p.slug ?? "", excerpt: p.excerpt ?? "",
        content: p.content ?? "", cover_url: p.cover_url ?? "",
        category: p.category ?? "", tags: (p.tags ?? []).join(", "), published: !!p.published,
      });
    }
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title) throw new Error("Title required");
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || null,
        content: form.content || null,
        cover_url: form.cover_url || null,
        category: form.category || null,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        published: form.published,
        published_at: form.published ? (existing.data?.published_at ?? new Date().toISOString()) : null,
        author_id: user?.id ?? null,
      } as any;
      if (isNew) {
        const { data, error } = await supabase.from("blog_posts").insert(payload).select("id").single();
        if (error) throw error;
        return data.id as string;
      } else {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
        if (error) throw error;
        return id;
      }
    },
    onSuccess: (newId) => {
      toast.success(isNew ? "Post created" : "Saved");
      if (isNew && newId !== id) navigate({ to: "/admin/blog/$id", params: { id: newId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </Link>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">{isNew ? "New post" : "Edit post"}</h1>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 rounded border-border" />
            Published
          </label>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {isNew ? "Create" : "Save"}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
            placeholder="Post title"
            className="w-full rounded-md border border-border bg-background px-4 py-3 font-display text-2xl font-bold tracking-tight focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="Short excerpt for previews"
            rows={2}
            className="w-full rounded-md border border-border bg-background p-3 text-sm"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write your post in Markdown…"
            rows={22}
            className="w-full rounded-md border border-border bg-background p-4 font-mono text-sm leading-relaxed"
          />
        </div>
        <aside className="space-y-4">
          <Group label="Slug">
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </Group>
          <Group label="Category">
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Guides, News, Reviews…" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </Group>
          <Group label="Cover image URL">
            <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            {form.cover_url && <img src={form.cover_url} alt="" className="mt-2 w-full rounded-md border border-border" />}
          </Group>
          <Group label="Tags (comma separated)">
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </Group>
        </aside>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

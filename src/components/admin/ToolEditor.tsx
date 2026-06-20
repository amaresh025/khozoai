import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type FormState = {
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  website_url: string;
  affiliate_url: string;
  logo_url: string;
  cover_url: string;
  pricing: string;
  pricing_details: string;
  category_id: string;
  status: string;
  featured: boolean;
  verified: boolean;
  sponsored: boolean;
  pros: string;
  cons: string;
  platforms: string;
};

const empty: FormState = {
  name: "", slug: "", short_description: "", full_description: "", website_url: "",
  affiliate_url: "", logo_url: "", cover_url: "", pricing: "freemium", pricing_details: "",
  category_id: "", status: "approved", featured: false, verified: false, sponsored: false,
  pros: "", cons: "", platforms: "",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export function ToolEditor({ toolId, onClose, onSaved }: { toolId: string | null; onClose: () => void; onSaved: () => void }) {
  const isNew = toolId === null;
  const [form, setForm] = useState<FormState>(empty);

  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("id,name").order("name")).data ?? [] });
  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["admin", "tool", toolId],
    queryFn: async () => (await supabase.from("tools").select("*").eq("id", toolId!).maybeSingle()).data,
  });

  useEffect(() => {
    if (existing.data) {
      const t: any = existing.data;
      setForm({
        name: t.name ?? "",
        slug: t.slug ?? "",
        short_description: t.short_description ?? "",
        full_description: t.full_description ?? "",
        website_url: t.website_url ?? "",
        affiliate_url: t.affiliate_url ?? "",
        logo_url: t.logo_url ?? "",
        cover_url: t.cover_url ?? "",
        pricing: t.pricing ?? "freemium",
        pricing_details: t.pricing_details ?? "",
        category_id: t.category_id ?? "",
        status: t.status ?? "approved",
        featured: !!t.featured,
        verified: !!t.verified,
        sponsored: !!t.sponsored,
        pros: (t.pros ?? []).join("\n"),
        cons: (t.cons ?? []).join("\n"),
        platforms: (t.platforms ?? []).join(", "),
      });
    }
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.website_url) throw new Error("Name and website URL are required");
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        short_description: form.short_description,
        full_description: form.full_description || null,
        website_url: form.website_url,
        affiliate_url: form.affiliate_url || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
        pricing: form.pricing,
        pricing_details: form.pricing_details || null,
        category_id: form.category_id || null,
        status: form.status,
        featured: form.featured,
        verified: form.verified,
        sponsored: form.sponsored,
        pros: form.pros.split("\n").map((s) => s.trim()).filter(Boolean),
        cons: form.cons.split("\n").map((s) => s.trim()).filter(Boolean),
        platforms: form.platforms.split(",").map((s) => s.trim()).filter(Boolean),
      } as any;
      if (isNew) {
        const { error } = await supabase.from("tools").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tools").update(payload).eq("id", toolId!);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(isNew ? "Tool created" : "Tool updated"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-xl border border-border bg-background shadow-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-xl font-bold tracking-tight">{isNew ? "New tool" : "Edit tool"}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface"><X className="h-4 w-4" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="max-h-[80vh] space-y-4 overflow-y-auto px-6 py-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name *">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} className="input" />
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className="input" />
            </Field>
          </div>
          <Field label="Website URL *">
            <input required type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="input" />
          </Field>
          <Field label="Affiliate URL">
            <input type="url" value={form.affiliate_url} onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })} className="input" />
          </Field>
          <Field label="Short description">
            <input maxLength={200} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="input" />
          </Field>
          <Field label="Full description">
            <textarea rows={5} value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })} className="input min-h-[120px]" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Logo URL">
              <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="input" />
            </Field>
            <Field label="Cover URL">
              <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} className="input" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Category">
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
                <option value="">— None —</option>
                {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Pricing">
              <select value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value })} className="input">
                {["free","freemium","paid","subscription","one_time","contact"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
                {["draft","pending","approved","rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Pricing details">
            <input value={form.pricing_details} onChange={(e) => setForm({ ...form, pricing_details: e.target.value })} className="input" />
          </Field>
          <Field label="Platforms (comma separated)">
            <input value={form.platforms} onChange={(e) => setForm({ ...form, platforms: e.target.value })} placeholder="Web, iOS, Android, API" className="input" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Pros (one per line)">
              <textarea rows={4} value={form.pros} onChange={(e) => setForm({ ...form, pros: e.target.value })} className="input" />
            </Field>
            <Field label="Cons (one per line)">
              <textarea rows={4} value={form.cons} onChange={(e) => setForm({ ...form, cons: e.target.value })} className="input" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <Toggle label="Featured" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
            <Toggle label="Verified" checked={form.verified} onChange={(v) => setForm({ ...form, verified: v })} />
            <Toggle label="Sponsored" checked={form.sponsored} onChange={(v) => setForm({ ...form, sponsored: v })} />
          </div>

          <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-2 border-t border-border bg-background px-6 py-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {isNew ? "Create tool" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
      <style>{`.input{display:block;width:100%;height:38px;border:1px solid var(--color-border);background:var(--color-background);border-radius:6px;padding:0 10px;font-size:14px} textarea.input{height:auto;padding:8px 10px;line-height:1.4}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border" />
      {label}
    </label>
  );
}

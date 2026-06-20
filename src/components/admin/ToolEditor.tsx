import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { enrichUrl } from "@/lib/admin.functions";

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
  key_summary: string;
  secondary_categories: string[];
  use_cases: string[];
  compare_data: {
    coding_quality: string;
    writing_quality: string;
    research: string;
    image_generation: boolean;
    video_generation: boolean;
    voice: boolean;
    web_search: boolean;
    file_upload: boolean;
    api: boolean;
  };
  needs_review: boolean;
};

const empty: FormState = {
  name: "", slug: "", short_description: "", full_description: "", website_url: "",
  affiliate_url: "", logo_url: "", cover_url: "", pricing: "freemium", pricing_details: "",
  category_id: "", status: "approved", featured: false, verified: false, sponsored: false,
  pros: "", cons: "", platforms: "",
  key_summary: "",
  secondary_categories: [],
  use_cases: [],
  compare_data: {
    coding_quality: "Basic",
    writing_quality: "Basic",
    research: "Basic",
    image_generation: false,
    video_generation: false,
    voice: false,
    web_search: false,
    file_upload: false,
    api: false
  },
  needs_review: false
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export function ToolEditor({ toolId, onClose, onSaved }: { toolId: string | null; onClose: () => void; onSaved: () => void }) {
  const isNew = toolId === null;
  const [form, setForm] = useState<FormState>(empty);
  const [regenerating, setRegenerating] = useState(false);

  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("id,name").order("name")).data ?? [] });
  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["admin", "tool", toolId],
    queryFn: async () => (await supabase.from("tools").select("*").eq("id", toolId!).maybeSingle()).data,
  });

  const enrichFn = useServerFn(enrichUrl);

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
        key_summary: t.key_summary ?? "",
        secondary_categories: t.secondary_categories ?? [],
        use_cases: t.use_cases ?? [],
        compare_data: {
          coding_quality: t.compare_data?.coding_quality ?? "Basic",
          writing_quality: t.compare_data?.writing_quality ?? "Basic",
          research: t.compare_data?.research ?? "Basic",
          image_generation: !!t.compare_data?.image_generation,
          video_generation: !!t.compare_data?.video_generation,
          voice: !!t.compare_data?.voice,
          web_search: !!t.compare_data?.web_search,
          file_upload: !!t.compare_data?.file_upload,
          api: !!t.compare_data?.api,
        },
        needs_review: !!t.needs_review
      });
    }
  }, [existing.data]);

  const handleRegenerate = async () => {
    if (!form.website_url) return toast.error("Enter a website URL first");
    setRegenerating(true);
    try {
      const res = await enrichFn({ data: { url: form.website_url, name: form.name || undefined } });
      if (res.enriched) {
        const e = res.enriched;
        setForm((prev) => ({
          ...prev,
          name: res.name || prev.name,
          short_description: e.short_description ?? prev.short_description,
          full_description: e.full_description ?? prev.full_description,
          key_summary: e.key_summary ?? prev.key_summary,
          category_id: e.category_id ?? prev.category_id,
          secondary_categories: e.secondary_categories ?? prev.secondary_categories,
          pricing: e.pricing ?? prev.pricing,
          pricing_details: e.pricing_details ?? prev.pricing_details,
          pros: (e.pros ?? []).join("\n"),
          cons: (e.cons ?? []).join("\n"),
          platforms: (e.platforms ?? []).join(", "),
          use_cases: e.use_cases ?? prev.use_cases,
          compare_data: {
            coding_quality: e.compare_data?.coding_quality ?? prev.compare_data.coding_quality,
            writing_quality: e.compare_data?.writing_quality ?? prev.compare_data.writing_quality,
            research: e.compare_data?.research ?? prev.compare_data.research,
            image_generation: !!e.compare_data?.image_generation,
            video_generation: !!e.compare_data?.video_generation,
            voice: !!e.compare_data?.voice,
            web_search: !!e.compare_data?.web_search,
            file_upload: !!e.compare_data?.file_upload,
            api: !!e.compare_data?.api,
          },
          needs_review: false
        }));
        toast.success("AI Enrichment finished! Form fields populated.");
      } else {
        toast.error("AI returned empty data.");
      }
    } catch (err: any) {
      toast.error(`Enrichment failed: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

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
        key_summary: form.key_summary || null,
        secondary_categories: form.secondary_categories,
        use_cases: form.use_cases,
        compare_data: form.compare_data,
        needs_review: false,
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 sm:p-8 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-xl border border-border bg-background shadow-card-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-xl font-bold tracking-tight">{isNew ? "New tool" : "Edit tool"}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface"><X className="h-4 w-4" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="space-y-5 px-6 py-5 max-h-[75vh] overflow-y-auto"
        >
          {form.needs_review && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span><strong>Needs Review:</strong> AI enrichment failed. Please verify descriptions, categories, capabilities, and pricing below.</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs shrink-0"
                onClick={() => setForm(prev => ({ ...prev, needs_review: false }))}
              >
                Accept as reviewed
              </Button>
            </div>
          )}

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
            <textarea rows={4} value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })} className="input min-h-[100px]" />
          </Field>
          <Field label="Key Summary">
            <textarea rows={2} value={form.key_summary} onChange={(e) => setForm({ ...form, key_summary: e.target.value })} className="input min-h-[60px]" />
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
            <Field label="Primary Category">
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

          <Field label="Secondary Categories">
            <div className="grid grid-cols-2 gap-2 mt-1.5 p-3 rounded-lg border border-border bg-background/50 max-h-40 overflow-y-auto">
              {cats.data?.filter(c => c.id !== form.category_id).map((c) => {
                const isChecked = form.secondary_categories.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setForm({
                          ...form,
                          secondary_categories: isChecked
                            ? form.secondary_categories.filter((x) => x !== c.id)
                            : [...form.secondary_categories, c.id]
                        });
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </Field>

          <Field label="Best Use Cases">
            <div className="grid grid-cols-2 gap-2 mt-1.5 p-3 rounded-lg border border-border bg-background/50">
              {["Research", "Coding", "Content Writing", "SEO", "Marketing", "Automation", "Learning", "Design"].map((uc) => {
                const isChecked = form.use_cases.includes(uc);
                return (
                  <label key={uc} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setForm({
                          ...form,
                          use_cases: isChecked
                            ? form.use_cases.filter((x) => x !== uc)
                            : [...form.use_cases, uc]
                        });
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    {uc}
                  </label>
                );
              })}
            </div>
          </Field>

          <div className="rounded-xl border border-border bg-surface/50 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Structured Capability Metrics (Compare Page)</h3>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Coding Quality">
                <select
                  value={form.compare_data.coding_quality}
                  onChange={(e) => setForm({ ...form, compare_data: { ...form.compare_data, coding_quality: e.target.value } })}
                  className="input"
                >
                  {["Excellent", "Good", "Basic"].map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </Field>
              <Field label="Writing Quality">
                <select
                  value={form.compare_data.writing_quality}
                  onChange={(e) => setForm({ ...form, compare_data: { ...form.compare_data, writing_quality: e.target.value } })}
                  className="input"
                >
                  {["Excellent", "Good", "Basic"].map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </Field>
              <Field label="Research Capability">
                <select
                  value={form.compare_data.research}
                  onChange={(e) => setForm({ ...form, compare_data: { ...form.compare_data, research: e.target.value } })}
                  className="input"
                >
                  {["Excellent", "Good", "Basic"].map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Toggle
                label="Image Generation"
                checked={form.compare_data.image_generation}
                onChange={(v) => setForm({ ...form, compare_data: { ...form.compare_data, image_generation: v } })}
              />
              <Toggle
                label="Video Generation"
                checked={form.compare_data.video_generation}
                onChange={(v) => setForm({ ...form, compare_data: { ...form.compare_data, video_generation: v } })}
              />
              <Toggle
                label="Voice / Audio"
                checked={form.compare_data.voice}
                onChange={(v) => setForm({ ...form, compare_data: { ...form.compare_data, voice: v } })}
              />
              <Toggle
                label="Web Search"
                checked={form.compare_data.web_search}
                onChange={(v) => setForm({ ...form, compare_data: { ...form.compare_data, web_search: v } })}
              />
              <Toggle
                label="File Uploads"
                checked={form.compare_data.file_upload}
                onChange={(v) => setForm({ ...form, compare_data: { ...form.compare_data, file_upload: v } })}
              />
              <Toggle
                label="API Access"
                checked={form.compare_data.api}
                onChange={(v) => setForm({ ...form, compare_data: { ...form.compare_data, api: v } })}
              />
            </div>
          </div>

          <Field label="Platforms (comma separated)">
            <input value={form.platforms} onChange={(e) => setForm({ ...form, platforms: e.target.value })} placeholder="Web, iOS, Android, API Available" className="input" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Strengths (one per line)">
              <textarea rows={4} value={form.pros} onChange={(e) => setForm({ ...form, pros: e.target.value })} className="input" />
            </Field>
            <Field label="Limitations (one per line)">
              <textarea rows={4} value={form.cons} onChange={(e) => setForm({ ...form, cons: e.target.value })} className="input" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <Toggle label="Featured" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
            <Toggle label="Verified" checked={form.verified} onChange={(v) => setForm({ ...form, verified: v })} />
            <Toggle label="Sponsored" checked={form.sponsored} onChange={(v) => setForm({ ...form, sponsored: v })} />
          </div>

          <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-between gap-2 border-t border-border bg-background px-6 py-3 z-10">
            <Button type="button" variant="outline" onClick={handleRegenerate} disabled={regenerating || !form.website_url}>
              {regenerating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              Regenerate with AI
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {isNew ? "Create tool" : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
      <style>{`.input{display:block;width:100%;height:38px;border:1px solid var(--color-border);background:var(--color-background);border-radius:6px;padding:0 10px;font-size:14px;color:var(--color-foreground)} textarea.input{height:auto;padding:8px 10px;line-height:1.4}`}</style>
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
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border" />
      {label}
    </label>
  );
}

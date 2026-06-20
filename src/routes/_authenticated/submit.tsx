import { createFileRoute, Link, useNavigate, useSearch, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Q } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, CheckCircle2, Globe } from "lucide-react";
import { toast } from "sonner";
import { fetchToolMetadata } from "@/lib/submissions.functions";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  website_url: z.string().trim().url().max(500),
  short_description: z.string().trim().max(400).optional(),
  category_id: z.string().uuid().optional(),
  pricing: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({
    meta: [
      { title: "Submit a Tool — Khozoai" },
      { name: "description", content: "Submit your AI tool to the Khozoai directory. Official domains only." },
    ],
    links: [{ rel: "canonical", href: "/submit" }],
  }),
  component: SubmitPage,
});

function SubmitPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof fetchToolMetadata>> | null>(null);
  const [fetching, setFetching] = useState(false);
  const fetchMeta = useServerFn(fetchToolMetadata);

  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await Q.categories()).data ?? [] });

  const dupCheck = useMutation({
    mutationFn: async (url: string) => {
      const host = new URL(url).hostname.replace(/^www\./, "");
      const { data } = await supabase
        .from("tools")
        .select("id,name,slug")
        .or(`website_url.ilike.%${host}%`)
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  async function onValidate(e: React.FormEvent) {
    e.preventDefault();
    const url = (document.getElementById("url") as HTMLInputElement)?.value?.trim();
    if (!url) return toast.error("Enter a website URL first");
    setFetching(true);
    setMeta(null);
    try {
      const result = await fetchMeta({ data: { url } });
      if (!result.ok) {
        toast.error(result.error);
        setFetching(false);
        return;
      }
      const dup = await dupCheck.mutateAsync(url);
      if (dup) {
        toast.warning(`Duplicate: "${dup.name}" is already in the directory.`);
      }
      setMeta(result);
      // Autofill name/desc fields if empty
      const nameEl = document.getElementById("name") as HTMLInputElement;
      const descEl = document.getElementById("desc") as HTMLTextAreaElement;
      if (nameEl && !nameEl.value && result.title) nameEl.value = result.title;
      if (descEl && !descEl.value && result.description) descEl.value = result.description;
      toast.success("Fetched metadata from official site");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setFetching(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!meta || !meta.ok) {
      toast.error("Click 'Fetch metadata' first to validate the URL");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      website_url: String(fd.get("website_url") || ""),
      short_description: String(fd.get("short_description") || ""),
      category_id: (fd.get("category_id") as string) || undefined,
      pricing: (fd.get("pricing") as string) || "freemium",
      notes: String(fd.get("notes") || ""),
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Check the form");

    setLoading(true);

    try {
      const host = new URL(parsed.data.website_url).hostname.replace(/^www\./, "").toLowerCase();
      const slug = meta.suggested_slug || host.split(".")[0].replace(/[^a-z0-9-]/g, "-");
      const normalizedInputName = parsed.data.name.toLowerCase().replace(/[^a-z0-9]/g, "");

      // 1. Check existing tools
      const { data: tools } = await supabase
        .from("tools")
        .select("id, name, slug, website_url");

      if (tools) {
        for (const t of tools) {
          let tHost = "";
          try {
            tHost = new URL(t.website_url).hostname.replace(/^www\./, "").toLowerCase();
          } catch {
            tHost = t.website_url.toLowerCase();
          }
          const tSlug = t.slug;
          const normalizedTName = t.name.toLowerCase().replace(/[^a-z0-9]/g, "");

          if (normalizedTName === normalizedInputName) {
            toast.error(`Duplicate name: "${t.name}" is already in the directory.`);
            setLoading(false);
            return;
          }
          if (tSlug === slug) {
            toast.error(`Duplicate slug: A tool with slug "${tSlug}" already exists.`);
            setLoading(false);
            return;
          }
          if (tHost === host) {
            toast.error(`Duplicate domain: "${host}" is already registered.`);
            setLoading(false);
            return;
          }
          if (normalizedInputName.length > 3 && normalizedTName.length > 3 &&
              (normalizedInputName.includes(normalizedTName) || normalizedTName.includes(normalizedInputName))) {
            toast.error(`Duplicate: A very similar tool named "${t.name}" already exists.`);
            setLoading(false);
            return;
          }
        }
      }

      // 2. Check pending submissions
      const { data: submissions } = await supabase
        .from("submissions")
        .select("id, name, website_url")
        .eq("status", "pending");

      if (submissions) {
        for (const s of submissions) {
          let sHost = "";
          try {
            sHost = new URL(s.website_url).hostname.replace(/^www\./, "").toLowerCase();
          } catch {
            sHost = s.website_url.toLowerCase();
          }
          const normalizedSName = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");

          if (normalizedSName === normalizedInputName) {
            toast.error(`Duplicate name: "${s.name}" is already pending review.`);
            setLoading(false);
            return;
          }
          if (sHost === host) {
            toast.error(`Duplicate domain: "${host}" is already pending review.`);
            setLoading(false);
            return;
          }
          if (normalizedInputName.length > 3 && normalizedSName.length > 3 &&
              (normalizedInputName.includes(normalizedSName) || normalizedSName.includes(normalizedInputName))) {
            toast.error(`Duplicate: A very similar tool named "${s.name}" is already pending review.`);
            setLoading(false);
            return;
          }
        }
      }
    } catch (e: any) {
      toast.error(`Validation error: ${e.message}`);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("submissions").insert({
      ...parsed.data,
      submitter_id: user?.id,
      submitter_email: user?.email,
      notes: `${parsed.data.notes ?? ""}\n\nValidated metadata:\n- domain: ${meta.domain}\n- logo: ${meta.logo_url}\n- cover: ${meta.cover_url ?? "n/a"}`,
    } as never);
    setLoading(false);
    if (error) toast.error(error.message);
    else { setSent(true); toast.success("Submission received — we'll review it shortly."); }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h2 className="mt-4 font-display text-2xl font-bold">Thanks! 🎉</h2>
          <p className="mt-2 text-muted-foreground">We'll review your submission and notify you by email.</p>
          <Link to="/dashboard" className="mt-6 inline-block text-primary font-medium">Go to dashboard →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold">Submit a <span className="text-gradient">Tool</span></h1>
      <p className="mt-2 text-muted-foreground">Tell us about an AI tool. Editors review every submission. Only <strong>official domains</strong> accepted.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
        <Field label="Official website URL *">
          <div className="flex gap-2">
            <input id="url" required name="website_url" type="url" placeholder="https://yourdomain.com"
              className="input flex-1" maxLength={500} />
            <Button type="button" variant="outline" onClick={onValidate} disabled={fetching}>
              {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
              {fetching ? "Fetching…" : "Fetch metadata"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Hosted subdomains (vercel.app, netlify.app, github.io, etc.) are rejected.</p>
        </Field>

        {meta && meta.ok && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <img src={meta.logo_url ?? ""} alt="" className="h-12 w-12 rounded-lg border border-border bg-background object-contain p-1" />
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {meta.title ?? meta.domain}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {meta.domain}
                </div>
                {meta.description && <p className="mt-1.5 line-clamp-2 text-muted-foreground">{meta.description}</p>}
              </div>
            </div>
          </div>
        )}

        <Field label="Tool name *">
          <input id="name" required name="name" className="input" maxLength={120} />
        </Field>
        <Field label="Short description">
          <textarea id="desc" name="short_description" rows={2} className="input" maxLength={400} />
        </Field>
        <Field label="Category">
          <select name="category_id" className="input">
            <option value="">Choose…</option>
            {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Pricing">
          <select name="pricing" className="input" defaultValue="freemium">
            {["free", "freemium", "paid", "subscription", "one_time", "contact"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Notes for editors">
          <textarea name="notes" rows={3} className="input" maxLength={2000} />
        </Field>

        <Button type="submit" disabled={loading || !meta?.ok} className="w-full">
          {loading ? "Submitting…" : "Submit tool for review"}
        </Button>
      </form>

      <style>{`.input{width:100%;height:42px;border-radius:10px;background:var(--color-surface);border:1px solid var(--color-border);padding:0 12px;font-size:14px;color:var(--color-foreground)}textarea.input{height:auto;padding:10px 12px}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1">{label}</span>
      {children}
    </label>
  );
}

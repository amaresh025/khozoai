import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Link as LinkIcon, FileJson, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bulkImport, enrichUrl } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/import")({
  head: () => ({ meta: [{ title: "Bulk Import — Admin" }] }),
  component: ImportPage,
});

type ImportItem = { name: string; website_url: string };

function parseCsv(text: string): ImportItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const nameIdx = header.findIndex((h) => h === "name" || h === "title");
  const urlIdx = header.findIndex((h) => h === "website_url" || h === "url" || h === "website");
  if (nameIdx === -1 || urlIdx === -1) throw new Error("CSV must contain 'name' and 'website_url' columns");
  return lines.slice(1).map((line) => {
    // naive CSV split — supports plain values, optionally quoted
    const cols = line.match(/("([^"]*)"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, "").trim()) ?? [];
    return { name: cols[nameIdx] ?? "", website_url: cols[urlIdx] ?? "" };
  }).filter((r) => r.name && r.website_url);
}

function parseJson(text: string): ImportItem[] {
  const j = JSON.parse(text);
  const arr = Array.isArray(j) ? j : Array.isArray(j.items) ? j.items : Array.isArray(j.tools) ? j.tools : [];
  return arr.map((x: any) => ({
    name: String(x.name ?? x.title ?? ""),
    website_url: String(x.website_url ?? x.url ?? x.website ?? ""),
  })).filter((r: ImportItem) => r.name && r.website_url);
}

function ImportPage() {
  const [mode, setMode] = useState<"csv" | "json" | "url">("url");
  const [text, setText] = useState("");
  const [items, setItems] = useState<ImportItem[]>([]);
  const [enrich, setEnrich] = useState(true);
  const [results, setResults] = useState<{ name: string; url: string; status: string; message?: string; slug?: string }[]>([]);
  const [singleUrl, setSingleUrl] = useState("");
  const [singleName, setSingleName] = useState("");
  const [preview, setPreview] = useState<any>(null);

  const importFn = useServerFn(bulkImport);
  const enrichFn = useServerFn(enrichUrl);

  const runImport = useMutation({
    mutationFn: async () => {
      if (!items.length) throw new Error("No items to import");
      return importFn({ data: { items, enrich } });
    },
    onSuccess: (r) => {
      setResults(r.results);
      const imported = r.results.filter((x: any) => x.status === "imported").length;
      const dupes = r.results.filter((x: any) => x.status === "duplicate").length;
      const errs = r.results.filter((x: any) => x.status === "error").length;
      toast.success(`${imported} imported, ${dupes} duplicates, ${errs} errors`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runEnrichPreview = useMutation({
    mutationFn: async () => enrichFn({ data: { url: singleUrl, name: singleName || undefined } }),
    onSuccess: (r) => setPreview(r),
    onError: (e: Error) => toast.error(e.message),
  });

  const runSingleImport = useMutation({
    mutationFn: async () => importFn({ data: { items: [{ name: singleName || preview?.name || "Untitled", website_url: singleUrl }], enrich }}),
    onSuccess: (r) => {
      setResults(r.results);
      toast.success("Imported");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const t = String(reader.result ?? "");
      setText(t);
      try {
        const parsed = file.name.endsWith(".json") ? parseJson(t) : parseCsv(t);
        setItems(parsed);
        toast.success(`Parsed ${parsed.length} tools`);
      } catch (e: any) { toast.error(e.message); }
    };
    reader.readAsText(file);
  }

  function parseText() {
    try {
      const parsed = mode === "json" ? parseJson(text) : parseCsv(text);
      setItems(parsed);
      toast.success(`Parsed ${parsed.length} tools`);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Bulk Import</h1>
        <p className="mt-1 text-muted-foreground">
          Upload CSV/JSON, paste data, or import a single URL. AI enrichment auto-detects category, tags, descriptions, and pricing.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <ModeButton active={mode === "url"} onClick={() => setMode("url")} icon={LinkIcon}>Single URL</ModeButton>
        <ModeButton active={mode === "csv"} onClick={() => setMode("csv")} icon={FileSpreadsheet}>CSV</ModeButton>
        <ModeButton active={mode === "json"} onClick={() => setMode("json")} icon={FileJson}>JSON</ModeButton>

        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={enrich} onChange={(e) => setEnrich(e.target.checked)} className="h-4 w-4 rounded border-border" />
          <Sparkles className="h-4 w-4 text-primary" /> AI auto-enrich
        </label>
      </div>

      {mode === "url" ? (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <input
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              placeholder="Tool name (optional — autodetected)"
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
            <input
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => runEnrichPreview.mutate()} disabled={!singleUrl || runEnrichPreview.isPending} variant="outline">
              {runEnrichPreview.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              Fetch & preview
            </Button>
            <Button onClick={() => runSingleImport.mutate()} disabled={!singleUrl || runSingleImport.isPending}>
              {runSingleImport.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              Import
            </Button>
          </div>
          {preview && (
            <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">
              <div className="flex items-center gap-3">
                {preview.meta?.favicon && <img src={preview.meta.favicon} alt="" className="h-8 w-8 rounded border border-border bg-background" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{preview.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{preview.meta?.url}</div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs">
                <Field label="Short description">{preview.enriched?.short_description}</Field>
                <Field label="Pricing">{preview.enriched?.pricing}</Field>
                <Field label="Tags">{preview.enriched?.tags?.join(", ") || "—"}</Field>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">
              {mode === "csv" ? "CSV — header row required: name,website_url" : "JSON — array of { name, website_url }"}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-surface">
              <Upload className="h-4 w-4" /> Upload file
              <input
                type="file"
                accept={mode === "csv" ? ".csv,text/csv" : ".json,application/json"}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
              />
            </label>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={mode === "csv" ? "name,website_url\nChatGPT,https://chat.openai.com" : '[{"name":"ChatGPT","website_url":"https://chat.openai.com"}]'}
            className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={parseText}>Validate</Button>
            <Button onClick={() => runImport.mutate()} disabled={!items.length || runImport.isPending}>
              {runImport.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              Import {items.length || ""}
            </Button>
            {items.length > 0 && <span className="text-sm text-muted-foreground">{items.length} valid rows</span>}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">Preview ({items.length})</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">URL</th></tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{it.name}</td>
                      <td className="px-4 py-2 truncate text-muted-foreground">{it.website_url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">Results</h2>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                r.status === "imported" ? "border-emerald-200 bg-emerald-50" :
                r.status === "duplicate" ? "border-amber-200 bg-amber-50" :
                "border-rose-200 bg-rose-50"
              }`}>
                {r.status === "imported" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className={`h-4 w-4 ${r.status === "duplicate" ? "text-amber-600" : "text-rose-600"}`} />}
                <span className="font-medium">{r.name}</span>
                <span className="truncate text-muted-foreground">{r.url}</span>
                <span className="ml-auto text-xs uppercase tracking-wider">{r.status}{r.message ? ` · ${r.message}` : ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: any; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}>
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

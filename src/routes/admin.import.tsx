import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload,
  Link as LinkIcon,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Sparkles,
  SkipForward,
  RotateCw,
  CircleX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bulkImport, enrichUrl } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/import")({
  head: () => ({ meta: [{ title: "Bulk Import — Admin" }] }),
  component: ImportPage,
});

type ImportItem = {
  tool_name: string;
  website_url: string;
  tagline?: string;
  short_description: string;
  full_description?: string;
  category: string;
  sub_category?: string[];
  pricing?: string;
  pricing_details?: string;
  free_plan?: boolean;
  platforms?: string[];
  features?: string[];
  use_cases?: string[];
  best_for?: string[];
  capabilities?: string[];
  integrations?: string[];
  api_available?: boolean;
  browser_extension?: boolean;
  mobile_app?: boolean;
  languages?: string[];
  company_name?: string;
  logo_url?: string;
  hero_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  search_tags?: string[];
  featured?: boolean;
};

const COLUMN_MAP: Record<string, keyof ImportItem> = {
  tool_name: "tool_name",
  name: "tool_name",
  title: "tool_name",
  tool: "tool_name",
  website_url: "website_url",
  url: "website_url",
  website: "website_url",
  site_url: "website_url",
  link: "website_url",
  tagline: "tagline",
  short_description: "short_description",
  description: "short_description",
  summary: "short_description",
  desc: "short_description",
  full_description: "full_description",
  long_description: "full_description",
  category: "category",
  pricing: "pricing",
  price: "pricing",
  price_model: "pricing",
  pricing_details: "pricing_details",
  free_plan: "free_plan",
  platforms: "platforms",
  platform: "platforms",
  features: "features",
  feature: "features",
  use_cases: "use_cases",
  use_case: "use_cases",
  best_for: "best_for",
  capabilities: "capabilities",
  capability: "capabilities",
  integrations: "integrations",
  api_available: "api_available",
  browser_extension: "browser_extension",
  mobile_app: "mobile_app",
  languages: "languages",
  company_name: "company_name",
  company: "company_name",
  logo_url: "logo_url",
  logo: "logo_url",
  hero_image_url: "hero_image_url",
  cover_url: "hero_image_url",
  cover: "hero_image_url",
  seo_title: "seo_title",
  seo_description: "seo_description",
  search_tags: "search_tags",
  tags: "search_tags",
  featured: "featured",
};

const ARRAY_FIELDS = new Set<keyof ImportItem>([
  "sub_category", "platforms", "features", "use_cases", "best_for",
  "capabilities", "integrations", "languages", "search_tags"
]);

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): ImportItem[] {
  const lines = text.split(/\r?\n/);
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  if (nonEmptyLines.length < 2) return [];

  const header = parseCsvLine(nonEmptyLines[0]).map((h) =>
    h.toLowerCase().replace(/^"|"$/g, "").trim(),
  );

  const colIndexes: Record<string, number> = {};
  header.forEach((col, idx) => {
    const mapped = COLUMN_MAP[col];
    if (mapped) {
      colIndexes[mapped] = idx;
    }
  });

  const nameIdx = colIndexes.tool_name;
  const urlIdx = colIndexes.website_url;
  if (nameIdx === undefined || urlIdx === undefined) {
    throw new Error(
      "CSV must contain columns for name (tool_name) and website_url. " +
        "Examples: name, tool_name, website_url, url, website",
    );
  }

  return nonEmptyLines
    .slice(1)
    .map((line) => {
      const cols = parseCsvLine(line);
      const item: ImportItem = {
        tool_name: (cols[nameIdx] ?? "").trim(),
        website_url: (cols[urlIdx] ?? "").trim(),
        short_description: "",
        category: "Other",
      };
      for (const [field, idx] of Object.entries(colIndexes)) {
        if (field === "tool_name" || field === "website_url") continue;
        const val = (cols[idx] ?? "").trim();
        if (val) {
          if (ARRAY_FIELDS.has(field as any)) {
            (item as any)[field] = val.split(/[;|]/).map((s) => s.trim()).filter(Boolean);
          } else if (
            field === "free_plan" ||
            field === "api_available" ||
            field === "browser_extension" ||
            field === "mobile_app" ||
            field === "featured"
          ) {
            const v = val.toLowerCase().trim();
            (item as any)[field] = v === "true" || v === "1" || v === "yes";
          } else {
            (item as any)[field] = val;
          }
        }
      }
      return item;
    })
    .filter((r) => r.tool_name && r.website_url);
}

function parseJson(text: string): ImportItem[] {
  const j = JSON.parse(text);
  const arr = Array.isArray(j)
    ? j
    : Array.isArray(j.items)
      ? j.items
      : Array.isArray(j.tools)
        ? j.tools
        : [];

  const mapJsonKeys = (x: any): ImportItem => {
    const item: ImportItem = {
      tool_name: "",
      website_url: "",
      short_description: "",
      category: "Other",
    };
    for (const [rawKey, field] of Object.entries(COLUMN_MAP)) {
      const val = x[rawKey] ?? x[rawKey.replace(/_/g, "")] ?? undefined;
      if (val !== undefined && val !== null && val !== "") {
        if (ARRAY_FIELDS.has(field)) {
          if (Array.isArray(val)) {
            (item as any)[field] = val.map(String);
          } else {
            (item as any)[field] = String(val).split(/[;|]/).map((s) => s.trim()).filter(Boolean);
          }
        } else if (
          field === "free_plan" ||
          field === "api_available" ||
          field === "browser_extension" ||
          field === "mobile_app" ||
          field === "featured"
        ) {
          (item as any)[field] = !!val;
        } else {
          (item as any)[field] = String(val);
        }
      }
    }
    return item;
  };

  return arr.map(mapJsonKeys).filter((r: ImportItem) => r.tool_name && r.website_url);
}

type ResultItem = {
  name: string;
  url: string;
  status: string;
  message?: string;
};

function ImportPage() {
  const [mode, setMode] = useState<"csv" | "json" | "url">("url");
  const [text, setText] = useState("");
  const [items, setItems] = useState<ImportItem[]>([]);
  const [enrich, setEnrich] = useState(true);
  const [force, setForce] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [singleUrl, setSingleUrl] = useState("");
  const [singleName, setSingleName] = useState("");
  const [preview, setPreview] = useState<any>(null);

  const importFn = useServerFn(bulkImport);
  const enrichFn = useServerFn(enrichUrl);

  const runImport = useMutation({
    mutationFn: async () => {
      if (!items.length) throw new Error("No items to import");
      return importFn({ data: { items, enrich, force } });
    },
    onSuccess: (r) => {
      setResults(r.results);
      const imported = r.results.filter((x: any) => x.status === "imported").length;
      const updated = r.results.filter((x: any) => x.status === "updated").length;
      const skipped = r.results.filter((x: any) => x.status === "skipped").length;
      const failed = r.results.filter((x: any) => x.status === "error").length;
      const parts: string[] = [];
      if (imported) parts.push(`${imported} imported`);
      if (updated) parts.push(`${updated} updated`);
      if (skipped) parts.push(`${skipped} skipped`);
      if (failed) parts.push(`${failed} failed`);
      toast.success(parts.length ? parts.join(", ") : "No changes");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runEnrichPreview = useMutation({
    mutationFn: async () => enrichFn({ data: { url: singleUrl, name: singleName || undefined } }),
    onSuccess: (r) => setPreview(r),
    onError: (e: Error) => toast.error(e.message),
  });

  const runSingleImport = useMutation({
    mutationFn: async () =>
      importFn({
        data: {
          items: [{ tool_name: singleName || preview?.name || "Untitled", website_url: singleUrl, short_description: preview?.enriched?.short_description || "AI tool", category: preview?.enriched?.category || "Other" }],
          enrich,
          force,
        },
      }),
    onSuccess: (r) => {
      setResults(r.results);
      toast.success("Imported successfully");
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
      } catch (e: any) {
        toast.error(e.message);
      }
    };
    reader.readAsText(file);
  }

  function parseText() {
    try {
      const parsed = mode === "json" ? parseJson(text) : parseCsv(text);
      setItems(parsed);
      toast.success(`Parsed ${parsed.length} tools`);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Bulk Import</h1>
        <p className="mt-1 text-muted-foreground">
          Upload CSV/JSON, paste data, or import a single URL. AI enrichment auto-detects
          descriptions, categories, features, and pricing from the tool's website.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <ModeButton active={mode === "url"} onClick={() => setMode("url")} icon={LinkIcon}>
          Single URL
        </ModeButton>
        <ModeButton active={mode === "csv"} onClick={() => setMode("csv")} icon={FileSpreadsheet}>
          CSV
        </ModeButton>
        <ModeButton active={mode === "json"} onClick={() => setMode("json")} icon={FileJson}>
          JSON
        </ModeButton>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={enrich}
              onChange={(e) => setEnrich(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Sparkles className="h-4 w-4 text-primary" /> AI enrich
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <RotateCw className="h-4 w-4 text-orange-500" /> Force update
          </label>
        </div>
      </div>

      {mode === "url" ? (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <input
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              placeholder="Tool name (optional — autodetected)"
              className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => runEnrichPreview.mutate()}
              disabled={!singleUrl || runEnrichPreview.isPending}
              variant="outline"
            >
              {runEnrichPreview.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              Fetch & preview
            </Button>
            <Button
              onClick={() => runSingleImport.mutate()}
              disabled={!singleUrl || runSingleImport.isPending}
            >
              {runSingleImport.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1 h-4 w-4" />
              )}
              Import
            </Button>
          </div>
          {preview && (
            <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">
              <div className="flex items-center gap-3">
                {preview.meta?.favicon && (
                  <img
                    src={preview.meta.favicon}
                    alt=""
                    className="h-8 w-8 rounded border border-border bg-background object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{preview.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{preview.meta?.url}</div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs">
                <Field label="Short description">{preview.enriched?.short_description}</Field>
                <Field label="Category">{preview.enriched?.category}</Field>
                <Field label="Pricing">{preview.enriched?.pricing}</Field>
                <Field label="Search Tags">{preview.enriched?.search_tags?.join(", ") || "—"}</Field>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">
              {mode === "csv"
                ? "CSV — first row must be column headers"
                : "JSON — array of objects"}
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
            placeholder={
              mode === "csv"
                ? 'tool_name,website_url,short_description,category,pricing,search_tags,platforms\nChatGPT,https://chat.openai.com,AI chatbot for conversations,AI Chatbot,freemium,chatbot;assistant,Web'
                : '[{"tool_name":"ChatGPT","website_url":"https://chat.openai.com","short_description":"AI chatbot","category":"AI Chatbot","pricing":"freemium","search_tags":["chatbot"]}]'
            }
            className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={parseText}>
              Validate
            </Button>
            <Button
              onClick={() => runImport.mutate()}
              disabled={!items.length || runImport.isPending}
            >
              {runImport.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1 h-4 w-4" />
              )}
              Import {items.length || ""}
            </Button>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground">{items.length} valid rows</span>
            )}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            Preview ({items.length})
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">URL</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Pricing</th>
                    <th className="px-4 py-2 text-left">Search Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{it.tool_name}</td>
                      <td className="max-w-[200px] truncate px-4 py-2 text-muted-foreground">
                        {it.website_url}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {it.category || "Other"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{it.pricing || "—"}</td>
                      <td className="max-w-[150px] truncate px-4 py-2 text-muted-foreground">
                        {it.search_tags?.join(", ") || "—"}
                      </td>
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
          <div className="mb-3 flex flex-wrap gap-3 text-sm">
            {(() => {
              const imported = results.filter((r) => r.status === "imported").length;
              const updated = results.filter((r) => r.status === "updated").length;
              const skipped = results.filter((r) => r.status === "skipped").length;
              const failed = results.filter((r) => r.status === "error").length;
              return (
                <>
                  {imported > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {imported} imported
                    </span>
                  )}
                  {updated > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
                      <RotateCw className="h-3.5 w-3.5" /> {updated} updated
                    </span>
                  )}
                  {skipped > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                      <SkipForward className="h-3.5 w-3.5" /> {skipped} skipped
                    </span>
                  )}
                  {failed > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-700">
                      <CircleX className="h-3.5 w-3.5" /> {failed} failed
                    </span>
                  )}
                </>
              );
            })()}
          </div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                  r.status === "imported"
                    ? "border-emerald-200 bg-emerald-50"
                    : r.status === "updated"
                      ? "border-blue-200 bg-blue-50"
                      : r.status === "skipped"
                        ? "border-amber-200 bg-amber-50"
                        : "border-rose-200 bg-rose-50"
                }`}
              >
                {r.status === "imported" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : r.status === "updated" ? (
                  <RotateCw className="h-4 w-4 text-blue-600" />
                ) : r.status === "skipped" ? (
                  <SkipForward className="h-4 w-4 text-amber-600" />
                ) : (
                  <CircleX className="h-4 w-4 text-rose-600" />
                )}
                <span className="font-medium">{r.name}</span>
                <span className="truncate text-muted-foreground">{r.url}</span>
                <span className="ml-auto text-xs uppercase tracking-wider">
                  {r.status}
                  {r.message ? ` · ${r.message}` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-surface hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

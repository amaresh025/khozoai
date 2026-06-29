import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { enrichUrl, adminSaveTool, adminGetTool } from "@/lib/admin.functions";

type FormState = {
  tool_name: string;
  website_url: string;
  tagline: string;
  short_description: string;
  full_description: string;
  category: string;
  sub_category: string[];
  pricing: string;
  pricing_details: string;
  free_plan: boolean;
  platforms: string[];
  features: string[];
  use_cases: string[];
  best_for: string[];
  capabilities: string[];
  integrations: string[];
  api_available: boolean;
  browser_extension: boolean;
  mobile_app: boolean;
  languages: string[];
  company_name: string;
  logo_url: string;
  hero_image_url: string;
  seo_title: string;
  seo_description: string;
  search_tags: string[];
  featured: boolean;
  is_published: boolean;
  slug?: string;
};

const empty: FormState = {
  tool_name: "",
  website_url: "",
  tagline: "",
  short_description: "",
  full_description: "",
  category: "AI Coding",
  sub_category: [],
  pricing: "free",
  pricing_details: "",
  free_plan: true,
  platforms: ["Web"],
  features: [],
  use_cases: [],
  best_for: [],
  capabilities: [],
  integrations: [],
  api_available: false,
  browser_extension: false,
  mobile_app: false,
  languages: ["English"],
  company_name: "",
  logo_url: "",
  hero_image_url: "",
  seo_title: "",
  seo_description: "",
  search_tags: [],
  featured: false,
  is_published: true,
  slug: "",
};

const COMMON_CATEGORIES = [
  "AI Coding",
  "AI Writing",
  "AI Chatbot",
  "AI Research",
  "AI Search",
  "AI Image Generation",
  "AI Video Generation",
  "AI Voice Generation",
  "AI Music Generation",
  "AI Automation",
  "AI Productivity",
  "AI Design",
  "AI Data Analysis",
  "AI Translation",
  "AI Project Management",
  "Other",
];

function ArrayInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };
  const handleRemove = (item: string) => {
    onChange(value.filter((x) => x !== item));
  };
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
          className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button type="button" onClick={handleAdd} size="sm" variant="outline">
          Add
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 min-h-[28px]">
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20"
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemove(item)}
              className="text-primary hover:text-foreground font-bold ml-1"
            >
              &times;
            </button>
          </span>
        ))}
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground italic">None added yet</span>
        )}
      </div>
    </div>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/30 cursor-pointer select-none">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function ImageInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {value && (
        <div className="mt-2 flex items-center gap-3 p-2 rounded-lg border border-border bg-surface/30">
          <img
            src={value}
            alt="Preview"
            className="h-12 w-12 rounded object-contain border border-border bg-background"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="text-xs text-muted-foreground truncate">{value}</span>
        </div>
      )}
    </div>
  );
}

export function ToolEditor({
  toolId,
  onClose,
  onSaved,
}: {
  toolId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = toolId === null;
  const [form, setForm] = useState<FormState>(empty);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const qc = useQueryClient();
  const getToolFn = useServerFn(adminGetTool);
  const saveToolFn = useServerFn(adminSaveTool);
  const enrichFn = useServerFn(enrichUrl);

  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["admin", "tool", toolId],
    queryFn: async () => {
      const result = await getToolFn({ data: { id: toolId! } });
      return result ?? null;
    },
  });

  useEffect(() => {
    if (existing.data) {
      const t: any = existing.data;
      const loaded: FormState = {
        tool_name: t.tool_name ?? "",
        website_url: t.website_url ?? "",
        tagline: t.tagline ?? "",
        short_description: t.short_description ?? "",
        full_description: t.full_description ?? "",
        category: t.category ?? "AI Coding",
        sub_category: t.sub_category ?? [],
        pricing: t.pricing ?? "free",
        pricing_details: t.pricing_details ?? "",
        free_plan: !!t.free_plan,
        platforms: t.platforms ?? [],
        features: t.features ?? [],
        use_cases: t.use_cases ?? [],
        best_for: t.best_for ?? [],
        capabilities: t.capabilities ?? [],
        integrations: t.integrations ?? [],
        api_available: !!t.api_available,
        browser_extension: !!t.browser_extension,
        mobile_app: !!t.mobile_app,
        languages: t.languages ?? [],
        company_name: t.company_name ?? "",
        logo_url: t.logo_url ?? "",
        hero_image_url: t.hero_image_url ?? "",
        seo_title: t.seo_title ?? "",
        seo_description: t.seo_description ?? "",
        search_tags: t.search_tags ?? [],
        featured: !!t.featured,
        is_published: t.is_published !== false,
        slug: t.slug ?? "",
      };
      setForm(loaded);
      setInitialForm(loaded);
    } else if (isNew) {
      setForm(empty);
      setInitialForm(empty);
    }
  }, [existing.data, isNew]);

  const isDirty = () => {
    if (!initialForm) return false;
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  };

  const handleCloseAttempt = () => {
    if (isDirty() && confirm("You have unsaved changes. Are you sure you want to close?")) {
      onClose();
    } else if (!isDirty()) {
      onClose();
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.tool_name.trim()) errs.tool_name = "Tool name is required";
    if (!form.website_url.trim()) {
      errs.website_url = "Website URL is required";
    } else {
      try {
        new URL(form.website_url);
      } catch {
        errs.website_url = "Enter a valid website URL (with https://)";
      }
    }
    if (!form.category.trim()) errs.category = "Category is required";
    if (!form.short_description.trim()) errs.short_description = "Short description is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        updated_at: new Date().toISOString(),
      };
      await saveToolFn({ data: { id: isNew ? undefined : toolId!, payload } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["tools"] });
      toast.success(isNew ? "Tool created successfully" : "Tool updated successfully");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      save.mutate();
    } else {
      toast.error("Please fill in all required fields.");
    }
  };

  const handleEnrich = async () => {
    if (!form.website_url) return toast.error("Enter a website URL first");
    setEnriching(true);
    try {
      const res = await enrichFn({ data: { url: form.website_url, name: form.tool_name || undefined } });
      if (res.enriched) {
        const e = res.enriched;
        setForm((prev) => ({
          ...prev,
          tool_name: res.name || e.company_name || prev.tool_name,
          tagline: e.tagline ?? prev.tagline,
          short_description: e.short_description ?? prev.short_description,
          full_description: e.full_description ?? prev.full_description,
          category: e.category ?? prev.category,
          sub_category: e.sub_category ?? prev.sub_category,
          pricing: e.pricing ?? prev.pricing,
          pricing_details: e.pricing_details ?? prev.pricing_details,
          free_plan: e.free_plan !== undefined ? e.free_plan : prev.free_plan,
          platforms: e.platforms ?? prev.platforms,
          features: e.features ?? prev.features,
          use_cases: e.use_cases ?? prev.use_cases,
          best_for: e.best_for ?? prev.best_for,
          capabilities: e.capabilities ?? prev.capabilities,
          integrations: e.integrations ?? prev.integrations,
          api_available: e.api_available !== undefined ? e.api_available : prev.api_available,
          browser_extension: e.browser_extension !== undefined ? e.browser_extension : prev.browser_extension,
          mobile_app: e.mobile_app !== undefined ? e.mobile_app : prev.mobile_app,
          languages: e.languages ?? prev.languages,
          company_name: e.company_name ?? prev.company_name,
          seo_title: e.seo_title ?? prev.seo_title,
          seo_description: e.seo_description ?? prev.seo_description,
          search_tags: e.search_tags ?? prev.search_tags,
          logo_url: res.meta?.favicon || prev.logo_url,
          hero_image_url: res.meta?.ogImage || prev.hero_image_url,
        }));
        toast.success("AI enrichment retrieved and populated!");
      }
    } catch (err: any) {
      toast.error(`Scraping failed: ${err.message}`);
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/45 p-4 sm:p-6 overflow-y-auto backdrop-blur-sm"
      onClick={handleCloseAttempt}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border border-border bg-background shadow-card-lg my-4 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface/30">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              {isNew ? "Create AI Tool" : `Edit Tool: ${form.tool_name || "Details"}`}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Redesigned around the unified production schema.
            </p>
          </div>
          <button
            onClick={handleCloseAttempt}
            className="rounded-lg p-2 hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form Scrollable area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* AI Scraper Integrator */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-500" /> AI Autocomplete
              </h4>
              <p className="text-xs text-muted-foreground">
                Enter the official website URL below, then click to scrape and auto-fill metadata with Gemini AI.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleEnrich}
              disabled={enriching || !form.website_url}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs shrink-0 self-start sm:self-center"
            >
              {enriching ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Scraping...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> Scrape Site & Autocomplete
                </>
              )}
            </Button>
          </div>

          {/* Section 1 — Identification & URLs */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              1. Basic Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tool Name *
                </span>
                <input
                  required
                  value={form.tool_name}
                  onChange={(e) => setForm({ ...form, tool_name: e.target.value })}
                  className={`input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    errors.tool_name ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  placeholder="e.g. Cursor"
                />
                {errors.tool_name && <p className="text-[11px] text-destructive">{errors.tool_name}</p>}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Official Website URL *
                </span>
                <input
                  required
                  type="url"
                  value={form.website_url}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  className={`input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    errors.website_url ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  placeholder="https://cursor.com"
                />
                {errors.website_url && (
                  <p className="text-[11px] text-destructive">{errors.website_url}</p>
                )}
              </div>
            </div>

            {!isNew && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Slug (Auto-generated URL identifier)
                </span>
                <input
                  readOnly
                  disabled
                  value={form.slug}
                  className="input-style h-10 w-full rounded-md border border-border bg-muted/40 px-3 text-sm cursor-not-allowed"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Company Name
                </span>
                <input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. Anysphere"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Primary Category *
                </span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2 — Descriptions & Tagline */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              2. Descriptions & Tagline
            </h3>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tagline
              </span>
              <input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="A brief tagline description"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Short Description *
              </span>
              <textarea
                required
                rows={2}
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                className="input-style w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Brief summary used in listings (limit 500 chars)"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Full Description
              </span>
              <textarea
                rows={5}
                value={form.full_description}
                onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                className="input-style w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Detailed explanation of features, tools, and background..."
              />
            </div>
          </div>

          {/* Section 3 — Pricing */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              3. Pricing Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pricing Model
                </span>
                <select
                  value={form.pricing || "free"}
                  onChange={(e) => setForm({ ...form, pricing: e.target.value })}
                  className="input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="free">Free</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">Paid</option>
                  <option value="subscription">Subscription</option>
                  <option value="contact">Contact Sales</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pricing Description / Extra Details
                </span>
                <input
                  value={form.pricing_details}
                  onChange={(e) => setForm({ ...form, pricing_details: e.target.value })}
                  className="input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. Free tier available, pro plans start at $20/mo"
                />
              </div>
            </div>
          </div>

          {/* Section 4 — Array Lists */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              4. Features & Taxonomy (Arrays)
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <ArrayInput
                label="Capabilities"
                value={form.capabilities}
                onChange={(val) => setForm({ ...form, capabilities: val })}
                placeholder="e.g. AI Coding, AI Writing"
              />
              <ArrayInput
                label="Search Tags"
                value={form.search_tags}
                onChange={(val) => setForm({ ...form, search_tags: val })}
                placeholder="e.g. agentic, code editor"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ArrayInput
                label="Features"
                value={form.features}
                onChange={(val) => setForm({ ...form, features: val })}
                placeholder="e.g. Autocomplete tab, Chat pane"
              />
              <ArrayInput
                label="Use Cases"
                value={form.use_cases}
                onChange={(val) => setForm({ ...form, use_cases: val })}
                placeholder="e.g. Coding automation, Studying"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ArrayInput
                label="Best For"
                value={form.best_for}
                onChange={(val) => setForm({ ...form, best_for: val })}
                placeholder="e.g. Developers, Startups"
              />
              <ArrayInput
                label="Integrations"
                value={form.integrations}
                onChange={(val) => setForm({ ...form, integrations: val })}
                placeholder="e.g. GitHub, Slack"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <ArrayInput
                label="Sub Categories"
                value={form.sub_category}
                onChange={(val) => setForm({ ...form, sub_category: val })}
                placeholder="e.g. Editor, CLI"
              />
              <ArrayInput
                label="Platforms"
                value={form.platforms}
                onChange={(val) => setForm({ ...form, platforms: val })}
                placeholder="e.g. Web, Mac, Windows"
              />
              <ArrayInput
                label="Languages"
                value={form.languages}
                onChange={(val) => setForm({ ...form, languages: val })}
                placeholder="e.g. English, French"
              />
            </div>
          </div>

          {/* Section 5 — Boolean Toggle Switches */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              5. Options & Status (Toggles)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <ToggleSwitch
                label="Free Plan Available"
                checked={form.free_plan}
                onChange={(val) => setForm({ ...form, free_plan: val })}
              />
              <ToggleSwitch
                label="API Available"
                checked={form.api_available}
                onChange={(val) => setForm({ ...form, api_available: val })}
              />
              <ToggleSwitch
                label="Browser Extension"
                checked={form.browser_extension}
                onChange={(val) => setForm({ ...form, browser_extension: val })}
              />
              <ToggleSwitch
                label="Mobile App Available"
                checked={form.mobile_app}
                onChange={(val) => setForm({ ...form, mobile_app: val })}
              />
              <ToggleSwitch
                label="Featured Tool"
                checked={form.featured}
                onChange={(val) => setForm({ ...form, featured: val })}
              />
              <ToggleSwitch
                label="Is Published"
                checked={form.is_published}
                onChange={(val) => setForm({ ...form, is_published: val })}
              />
            </div>
          </div>

          {/* Section 6 — Media Previews */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              6. Media Assets
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageInput
                label="Logo Image URL"
                value={form.logo_url}
                onChange={(val) => setForm({ ...form, logo_url: val })}
                placeholder="e.g. https://domain.com/logo.png"
              />
              <ImageInput
                label="Hero Image URL (Cover)"
                value={form.hero_image_url}
                onChange={(val) => setForm({ ...form, hero_image_url: val })}
                placeholder="e.g. https://domain.com/cover.jpg"
              />
            </div>
          </div>

          {/* Section 7 — SEO Fields */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              7. SEO Metadata (Editable)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  SEO Meta Title
                </span>
                <input
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  className="input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. Cursor AI - Best Code Assistant"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  SEO Meta Description
                </span>
                <input
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  className="input-style h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Search engine snippet text..."
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-surface/30">
          <Button type="button" variant="outline" onClick={handleCloseAttempt}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={save.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {save.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

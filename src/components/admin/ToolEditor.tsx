import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Loader2,
  Sparkles,
  AlertTriangle,
  Globe,
  Tag,
  Settings,
  DollarSign,
  FileText,
  BadgeCheck,
  Eye,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  enrichUrl,
  adminSaveTool,
  adminGetTool,
  adminListCategories,
} from "@/lib/admin.functions";
import { CAPABILITY_TAXONOMY, USE_CASE_TAXONOMY, INDUSTRY_TAXONOMY } from "@/lib/queries";

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
  capabilities: string[];
  industries: string[];
  best_for: string;
  not_good_for: string;
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
    browser_extension: boolean;
    mobile_app: boolean;
  };
  needs_review: boolean;
  // New AI agent integration / metadata fields
  source_url: string;
  import_source: string;
  ai_generated: boolean;
  ai_last_updated: string | null;
  last_verified: string | null;
  manually_edited: boolean;
  import_status: string;
  // New SEO fields
  seo_title: string;
  seo_description: string;
  seo_image: string;
  // Custom textareas for nested relations
  features: string;
  tags: string;
};

const empty: FormState = {
  name: "",
  slug: "",
  short_description: "",
  full_description: "",
  website_url: "",
  affiliate_url: "",
  logo_url: "",
  cover_url: "",
  pricing: "freemium",
  pricing_details: "",
  category_id: "",
  status: "approved",
  featured: false,
  verified: false,
  sponsored: false,
  pros: "",
  cons: "",
  platforms: "Web",
  key_summary: "",
  secondary_categories: [],
  use_cases: [],
  capabilities: [],
  industries: [],
  best_for: "",
  not_good_for: "",
  compare_data: {
    coding_quality: "Basic",
    writing_quality: "Basic",
    research: "Basic",
    image_generation: false,
    video_generation: false,
    voice: false,
    web_search: false,
    file_upload: false,
    api: false,
    browser_extension: false,
    mobile_app: false,
  },
  needs_review: false,
  source_url: "",
  import_source: "",
  ai_generated: false,
  ai_last_updated: null,
  last_verified: null,
  manually_edited: false,
  import_status: "",
  seo_title: "",
  seo_description: "",
  seo_image: "",
  features: "",
  tags: "",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function isValidUrl(str: string) {
  if (!str) return true; // Optional fields are valid if empty
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
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
  const [regenerating, setRegenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const qc = useQueryClient();

  const listCatsFn = useServerFn(adminListCategories);
  const getToolFn = useServerFn(adminGetTool);
  const saveToolFn = useServerFn(adminSaveTool);
  const enrichFn = useServerFn(enrichUrl);

  const cats = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const result = await listCatsFn({});
      return result ?? [];
    },
  });

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
        capabilities: t.capabilities ?? [],
        industries: t.industries ?? [],
        best_for: (t.best_for ?? []).join("\n"),
        not_good_for: (t.not_good_for ?? []).join("\n"),
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
          browser_extension: !!t.compare_data?.browser_extension,
          mobile_app: !!t.compare_data?.mobile_app,
        },
        needs_review: !!t.needs_review,
        source_url: t.source_url ?? "",
        import_source: t.import_source ?? "",
        ai_generated: !!t.ai_generated,
        ai_last_updated: t.ai_last_updated ?? null,
        last_verified: t.last_verified ?? null,
        manually_edited: !!t.manually_edited,
        import_status: t.import_status ?? "",
        seo_title: t.seo_title ?? "",
        seo_description: t.seo_description ?? "",
        seo_image: t.seo_image ?? "",
        features: (t.tool_features ?? []).map((f: any) => f.feature).join("\n"),
        tags: (t.tool_tags ?? []).map((tg: any) => tg.tag).join(", "),
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
    if (isDirty()) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Tool name is required";
    if (!form.website_url.trim()) {
      errs.website_url = "Website URL is required";
    } else if (!isValidUrl(form.website_url)) {
      errs.website_url = "Enter a valid URL (including https://)";
    }
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) {
      errs.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    }
    if (form.affiliate_url && !isValidUrl(form.affiliate_url)) {
      errs.affiliate_url = "Enter a valid URL";
    }
    if (form.logo_url && !isValidUrl(form.logo_url)) {
      errs.logo_url = "Enter a valid URL";
    }
    if (form.cover_url && !isValidUrl(form.cover_url)) {
      errs.cover_url = "Enter a valid URL";
    }
    if (form.seo_image && !isValidUrl(form.seo_image)) {
      errs.seo_image = "Enter a valid URL";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please resolve the validation errors before saving.");
      return false;
    }
    return true;
  };

  const save = useMutation({
    mutationFn: async () => {
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
        pros: form.pros
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        cons: form.cons
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        platforms: form.platforms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        key_summary: form.key_summary || null,
        secondary_categories: form.secondary_categories,
        use_cases: form.use_cases,
        capabilities: form.capabilities,
        industries: form.industries,
        best_for: form.best_for
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        not_good_for: form.not_good_for
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        compare_data: form.compare_data,
        needs_review: form.needs_review,
        source_url: form.source_url || null,
        import_source: form.import_source || null,
        ai_generated: form.ai_generated,
        ai_last_updated: form.ai_last_updated,
        last_verified: new Date().toISOString(), // automatically set when saved
        manually_edited: true, // set manually edited to true when saved via this admin form
        import_status: form.import_status || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        seo_image: form.seo_image || null,
        // Nested updates handled server side
        features: form.features
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        tags: form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await saveToolFn({ data: { id: isNew ? undefined : toolId!, payload } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success(isNew ? "Tool created successfully" : "Tool updated successfully");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      save.mutate();
    }
  };

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
          capabilities: e.capabilities ?? prev.capabilities,
          industries: e.industries ?? prev.industries,
          best_for: (e.best_for ?? []).join("\n"),
          not_good_for: (e.not_good_for ?? []).join("\n"),
          features: (e.features ?? []).join("\n"),
          tags: (e.tags ?? []).join(", "),
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
            browser_extension: !!e.compare_data?.browser_extension,
            mobile_app: !!e.compare_data?.mobile_app,
          },
          needs_review: false,
          ai_generated: true,
          ai_last_updated: new Date().toISOString(),
          import_source: "lovable_ai_enrichment",
          import_status: "enriched",
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

  const showComingSoon = (btnName: string) => {
    toast.info(`${btnName}: Coming Soon`);
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
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {isNew ? "New Tool Structure" : `Edit: ${form.name || "Tool Details"}`}
              {!isNew && (
                <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full border border-border bg-background">
                  {form.status}
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ready for AI Generation integration upgrades.
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
        {!isPreviewMode ? (
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {form.needs_review && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <span>
                    <strong>Attention Needed:</strong> AI generation completed but requires review.
                    Check basic fields, descriptions, and tags.
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs shrink-0 bg-background"
                  onClick={() => setForm((prev) => ({ ...prev, needs_review: false }))}
                >
                  Clear Review Flag
                </Button>
              </div>
            )}

            {/* SECTION 0 — AI Import (Disabled placeholders) */}
            <div className="rounded-2xl border-2 border-dashed border-purple-500/20 bg-purple-500/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-600 dark:text-purple-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl border-l border-b border-purple-500/20">
                AI Import — Coming Soon
              </div>
              <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-purple-500" /> AI-Powered Import
              </h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xl">
                Ready for AI Agent Integration. In the future, this section will allow typing a URL to completely auto-fill pricing, categories, capabilities, platforms, and descriptions.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Import Source URL</span>
                  <input
                    disabled
                    type="url"
                    placeholder="https://example.com"
                    className="w-full h-10 px-3 border border-border rounded-lg bg-surface/50 text-muted-foreground cursor-not-allowed text-sm"
                  />
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    onClick={() => showComingSoon("Generate From Website")}
                    className="h-10 border-purple-500/25 text-purple-600 dark:text-purple-300 hover:bg-purple-500/5 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    Generate From Website
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    onClick={() => showComingSoon("Refresh AI Data")}
                    className="h-10 text-xs"
                  >
                    Refresh AI Data
                  </Button>
                  <label className="flex items-center gap-2 cursor-not-allowed select-none text-xs text-muted-foreground h-10">
                    <input
                      disabled
                      type="checkbox"
                      className="h-4 w-4 rounded border-border cursor-not-allowed"
                    />
                    Force Update
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 1 — Basic Information */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">1</span>
                Basic Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tool Name *</span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        slug: form.slug || slugify(e.target.value),
                      })
                    }
                    className={`input-style ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    placeholder="e.g. Cursor"
                  />
                  {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slug</span>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                    className={`input-style ${errors.slug ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    placeholder="e.g. cursor-ai"
                  />
                  {errors.slug && <p className="text-[11px] text-destructive">{errors.slug}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Official Website URL *</span>
                <input
                  required
                  type="url"
                  value={form.website_url}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  className={`input-style ${errors.website_url ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="https://example.com"
                />
                {errors.website_url && <p className="text-[11px] text-destructive">{errors.website_url}</p>}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Affiliate Website URL</span>
                <input
                  type="url"
                  value={form.affiliate_url}
                  onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })}
                  className={`input-style ${errors.affiliate_url ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="https://partner.com/ref-code"
                />
                {errors.affiliate_url && <p className="text-[11px] text-destructive">{errors.affiliate_url}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Logo URL</span>
                  <input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    className={`input-style ${errors.logo_url ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    placeholder="https://example.com/logo.png"
                  />
                  {errors.logo_url && <p className="text-[11px] text-destructive">{errors.logo_url}</p>}
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hero Image URL (Cover)</span>
                  <input
                    value={form.cover_url}
                    onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                    className={`input-style ${errors.cover_url ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    placeholder="https://example.com/hero.png"
                  />
                  {errors.cover_url && <p className="text-[11px] text-destructive">{errors.cover_url}</p>}
                </div>
              </div>
            </div>

            {/* SECTION 2 — AI Content */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">2</span>
                AI Content & Summaries
              </h3>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">One-line Summary *</span>
                  <span className={`text-[10px] tabular-nums ${form.short_description.length > 200 ? "text-destructive" : "text-muted-foreground"}`}>
                    {form.short_description.length}/200
                  </span>
                </div>
                <input
                  required
                  maxLength={250}
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  className="input-style"
                  placeholder="e.g. Next-generation AI code editor built on VS Code."
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Short Description (Key Summary)</span>
                  <span className={`text-[10px] tabular-nums ${form.key_summary.length > 1000 ? "text-destructive" : "text-muted-foreground"}`}>
                    {form.key_summary.length}/1000
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={1100}
                  value={form.key_summary}
                  onChange={(e) => setForm({ ...form, key_summary: e.target.value })}
                  className="input-style min-h-[60px]"
                  placeholder="2-3 sentence summary explaining the tool's core value proposition..."
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Description</span>
                  <span className={`text-[10px] tabular-nums ${form.full_description.length > 3000 ? "text-destructive" : "text-muted-foreground"}`}>
                    {form.full_description.length}/3000
                  </span>
                </div>
                <textarea
                  rows={5}
                  maxLength={3200}
                  value={form.full_description}
                  onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                  className="input-style min-h-[120px]"
                  placeholder="Provide a detailed description of features, capabilities, limits, models used..."
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Features (One per line)</span>
                <textarea
                  rows={3}
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="input-style min-h-[80px]"
                  placeholder="AI Autocomplete&#10;In-chat terminal editing&#10;Custom model selection"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Best For (One per line)</span>
                  <textarea
                    rows={3}
                    value={form.best_for}
                    onChange={(e) => setForm({ ...form, best_for: e.target.value })}
                    className="input-style min-h-[80px]"
                    placeholder="Software engineers&#10;Large repositories&#10;Fast prototyping"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Not Good For (One per line)</span>
                  <textarea
                    rows={3}
                    value={form.not_good_for}
                    onChange={(e) => setForm({ ...form, not_good_for: e.target.value })}
                    className="input-style min-h-[80px]"
                    placeholder="Non-coders&#10;Offline programming"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Best Use Cases</span>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-border bg-surface/20 max-h-48 overflow-y-auto">
                  {USE_CASE_TAXONOMY.map((uc) => {
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
                                : [...form.use_cases, uc],
                            });
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        {uc}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3 — Classification */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">3</span>
                Classification & Taxonomy
              </h3>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Primary Category</span>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="input-style bg-background"
                >
                  <option value="">— Select Category —</option>
                  {cats.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Subcategories / Secondary Categories</span>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-border bg-surface/20 max-h-40 overflow-y-auto">
                  {cats.data
                    ?.filter((c) => c.id !== form.category_id)
                    .map((c) => {
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
                                  : [...form.secondary_categories, c.id],
                              });
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          {c.name}
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Capabilities (Taxonomy Tags)</span>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-border bg-surface/20 max-h-48 overflow-y-auto">
                  {CAPABILITY_TAXONOMY.map((cap) => {
                    const isChecked = form.capabilities.includes(cap);
                    return (
                      <label key={cap} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setForm({
                              ...form,
                              capabilities: isChecked
                                ? form.capabilities.filter((x) => x !== cap)
                                : [...form.capabilities, cap],
                            });
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        {cap}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industries</span>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-border bg-surface/20 max-h-40 overflow-y-auto">
                  {INDUSTRY_TAXONOMY.map((ind) => {
                    const isChecked = form.industries.includes(ind);
                    return (
                      <label key={ind} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setForm({
                              ...form,
                              industries: isChecked
                                ? form.industries.filter((x) => x !== ind)
                                : [...form.industries, ind],
                            });
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        {ind}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Search Tags (Comma separated)</span>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="input-style"
                  placeholder="e.g. editor, coding, dev-tools, agent"
                />
              </div>
            </div>

            {/* SECTION 4 — Pricing & Platform */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">4</span>
                Pricing & Platform Options
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing Model</span>
                  <select
                    value={form.pricing}
                    onChange={(e) => setForm({ ...form, pricing: e.target.value })}
                    className="input-style bg-background"
                  >
                    {["free", "freemium", "paid", "subscription", "one_time", "contact"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing Details (Info/Limits)</span>
                  <input
                    value={form.pricing_details}
                    onChange={(e) => setForm({ ...form, pricing_details: e.target.value })}
                    className="input-style"
                    placeholder="e.g. Free plan has 50 requests/mo. Pro at $20/mo."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supported Platforms (Comma separated)</span>
                <input
                  value={form.platforms}
                  onChange={(e) => setForm({ ...form, platforms: e.target.value })}
                  placeholder="Web, Windows, Mac, iOS, Android"
                  className="input-style"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <Toggle
                  label="API Available"
                  checked={form.compare_data.api}
                  onChange={(v) =>
                    setForm({ ...form, compare_data: { ...form.compare_data, api: v } })
                  }
                />
                <Toggle
                  label="Browser Extension"
                  checked={form.compare_data.browser_extension}
                  onChange={(v) =>
                    setForm({ ...form, compare_data: { ...form.compare_data, browser_extension: v } })
                  }
                />
                <Toggle
                  label="Mobile App"
                  checked={form.compare_data.mobile_app}
                  onChange={(v) =>
                    setForm({ ...form, compare_data: { ...form.compare_data, mobile_app: v } })
                  }
                />
              </div>

              <div className="rounded-lg border border-border bg-surface/30 p-4 mt-2 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Structured Metrics (Compare Dashboard)
                </span>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Coding Quality</span>
                    <select
                      value={form.compare_data.coding_quality}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          compare_data: { ...form.compare_data, coding_quality: e.target.value },
                        })
                      }
                      className="input-style text-xs h-8 bg-background"
                    >
                      {["Excellent", "Good", "Basic"].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Writing Quality</span>
                    <select
                      value={form.compare_data.writing_quality}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          compare_data: { ...form.compare_data, writing_quality: e.target.value },
                        })
                      }
                      className="input-style text-xs h-8 bg-background"
                    >
                      {["Excellent", "Good", "Basic"].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Research Quality</span>
                    <select
                      value={form.compare_data.research}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          compare_data: { ...form.compare_data, research: e.target.value },
                        })
                      }
                      className="input-style text-xs h-8 bg-background"
                    >
                      {["Excellent", "Good", "Basic"].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 pt-1">
                  <Toggle
                    label="Image Gen"
                    checked={form.compare_data.image_generation}
                    onChange={(v) =>
                      setForm({ ...form, compare_data: { ...form.compare_data, image_generation: v } })
                    }
                  />
                  <Toggle
                    label="Video Gen"
                    checked={form.compare_data.video_generation}
                    onChange={(v) =>
                      setForm({ ...form, compare_data: { ...form.compare_data, video_generation: v } })
                    }
                  />
                  <Toggle
                    label="Voice/Audio"
                    checked={form.compare_data.voice}
                    onChange={(v) =>
                      setForm({ ...form, compare_data: { ...form.compare_data, voice: v } })
                    }
                  />
                  <Toggle
                    label="Web Search"
                    checked={form.compare_data.web_search}
                    onChange={(v) =>
                      setForm({ ...form, compare_data: { ...form.compare_data, web_search: v } })
                    }
                  />
                  <Toggle
                    label="File Upload"
                    checked={form.compare_data.file_upload}
                    onChange={(v) =>
                      setForm({ ...form, compare_data: { ...form.compare_data, file_upload: v } })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Strengths (One per line)</span>
                  <textarea
                    rows={3}
                    value={form.pros}
                    onChange={(e) => setForm({ ...form, pros: e.target.value })}
                    className="input-style min-h-[80px]"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Limitations (One per line)</span>
                  <textarea
                    rows={3}
                    value={form.cons}
                    onChange={(e) => setForm({ ...form, cons: e.target.value })}
                    className="input-style min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5 — SEO */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">5</span>
                Search Engine Optimization (SEO)
              </h3>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SEO Title</span>
                <input
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  className="input-style"
                  placeholder="e.g. Cursor AI Code Editor Review, Features, Pricing"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meta Description</span>
                <textarea
                  rows={2}
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  className="input-style min-h-[60px]"
                  placeholder="Write a custom description optimized for Google search results..."
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">OG Image URL (Social Share Image)</span>
                <input
                  value={form.seo_image}
                  onChange={(e) => setForm({ ...form, seo_image: e.target.value })}
                  className="input-style"
                  placeholder="https://example.com/social-preview.png"
                />
              </div>
            </div>

            {/* SECTION 6 — Publishing & Flags */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">6</span>
                Publishing & Status
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="input-style bg-background"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved / Published</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                  {!isNew && (
                    <span className="text-xs text-muted-foreground mb-2">
                      <strong>Last Updated: </strong>
                      {existing.data?.updated_at
                        ? new Date(existing.data.updated_at).toLocaleString()
                        : "Never"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Toggle
                  label="Featured (Highlight on top)"
                  checked={form.featured}
                  onChange={(v) => setForm({ ...form, featured: v })}
                />
                <Toggle
                  label="Verified (Official Badge)"
                  checked={form.verified}
                  onChange={(v) => setForm({ ...form, verified: v })}
                />
                <Toggle
                  label="Sponsored (Paid Promo)"
                  checked={form.sponsored}
                  onChange={(v) => setForm({ ...form, sponsored: v })}
                />
              </div>
            </div>

            {/* INTERNAL SYSTEM METADATA (Collapsible Section for AI prep) */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMetadata(!showMetadata)}
                className="w-full px-5 py-3 flex items-center justify-between bg-surface/20 border-b border-border text-sm font-semibold text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Internal AI Agent Metadata (Hidden from Public Website)
                </span>
                {showMetadata ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {showMetadata && (
                <div className="p-5 space-y-4 bg-background">
                  <div className="rounded border border-border bg-muted/20 p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      These metadata parameters are preserved internally for scheduling automated scrape/crawl tasks, tracking content provenance, and updating indexes automatically via background AI workflows.
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Source Crawler URL</span>
                      <input
                        value={form.source_url}
                        onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                        className="input-style text-xs h-9"
                        placeholder="https://crawl-source.com/tool-slug"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Import Source Identifier</span>
                      <input
                        value={form.import_source}
                        onChange={(e) => setForm({ ...form, import_source: e.target.value })}
                        className="input-style text-xs h-9"
                        placeholder="e.g. bulk_import_csv, extension_scan"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">AI Generation Status / Flag</span>
                      <select
                        value={form.import_status}
                        onChange={(e) => setForm({ ...form, import_status: e.target.value })}
                        className="input-style text-xs h-9 bg-background"
                      >
                        <option value="">— None —</option>
                        <option value="pending">Pending Enrichment</option>
                        <option value="enriched">AI Enriched</option>
                        <option value="failed">Enrichment Failed</option>
                        <option value="verified">Manually Verified</option>
                      </select>
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <div className="flex flex-wrap gap-4 py-2">
                        <Toggle
                          label="Mark as AI Generated"
                          checked={form.ai_generated}
                          onChange={(v) => setForm({ ...form, ai_generated: v })}
                        />
                        <Toggle
                          label="Manually Edited"
                          checked={form.manually_edited}
                          onChange={(v) => setForm({ ...form, manually_edited: v })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                    <div>
                      <strong>AI Last Updated:</strong>{" "}
                      {form.ai_last_updated ? new Date(form.ai_last_updated).toLocaleString() : "Never"}
                    </div>
                    <div>
                      <strong>Last Verified:</strong>{" "}
                      {form.last_verified ? new Date(form.last_verified).toLocaleString() : "Never"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        ) : (
          /* PREVIEW MODE CONTENT */
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-surface/5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary flex items-center justify-between">
              <span className="font-medium flex items-center gap-2">
                <Eye className="h-5 w-5" /> Previewing all edited data structure. Ensure values look correct.
              </span>
              <Button size="sm" onClick={() => setIsPreviewMode(false)}>
                Back to Edit
              </Button>
            </div>

            {/* Structured Preview Sheet */}
            <div className="grid gap-6">
              {/* Basic & Publishing Preview */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Basic & SEO Metadata</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tool Name:</span>{" "}
                      <strong className="text-foreground">{form.name || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Slug:</span> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{form.slug || "—"}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Website:</span>{" "}
                      <a href={form.website_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {form.website_url || "—"}
                      </a>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SEO Title:</span>{" "}
                      <span className="text-foreground">{form.seo_title || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SEO Meta Description:</span>{" "}
                      <p className="text-xs text-foreground mt-1 bg-muted/40 p-2 rounded">{form.seo_description || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pricing & Platform</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Pricing:</span>{" "}
                      <span className="capitalize px-2 py-0.5 rounded bg-surface border border-border font-medium text-xs">
                        {form.pricing}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pricing Details:</span>{" "}
                      <span className="text-foreground">{form.pricing_details || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Platforms:</span>{" "}
                      <span className="text-foreground">{form.platforms || "—"}</span>
                    </div>
                    <div className="flex gap-4 pt-1">
                      <div className="flex items-center gap-1">
                        {form.compare_data.api ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                        <span className="text-xs">API</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {form.compare_data.browser_extension ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                        <span className="text-xs">Browser Extension</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {form.compare_data.mobile_app ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                        <span className="text-xs">Mobile App</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descriptions & AI content */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Content Summary</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block">One-line Summary:</span>
                    <p className="text-foreground bg-muted/20 p-2 rounded mt-1 font-medium">{form.short_description || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block">Short Description:</span>
                    <p className="text-foreground bg-muted/20 p-2 rounded mt-1 text-xs">{form.key_summary || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block">Full Description:</span>
                    <p className="text-foreground bg-muted/20 p-3 rounded mt-1 text-xs whitespace-pre-wrap leading-relaxed">
                      {form.full_description || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Classification & Taxonomy */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Classification & Tags</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Primary Category:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {cats.data?.find((c) => c.id === form.category_id)?.name || "—"}
                    </span>
                  </div>
                  {form.secondary_categories.length > 0 && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Secondary Categories:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {form.secondary_categories.map((scid) => (
                          <span key={scid} className="text-xs bg-muted px-2 py-0.5 rounded border border-border">
                            {cats.data?.find((c) => c.id === scid)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {form.capabilities.length > 0 && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Capabilities:</span>
                      <div className="flex flex-wrap gap-1">
                        {form.capabilities.map((cap) => (
                          <span key={cap} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {form.tags && (
                    <div>
                      <span className="text-muted-foreground">Tags:</span>{" "}
                      <span className="text-foreground">{form.tags}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Metadata */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-2 text-xs">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Internal AI Audit Metadata</h4>
                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <div>
                    <span className="text-muted-foreground">Crawler Source URL:</span> {form.source_url || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Import Source ID:</span> {form.import_source || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">AI Generated:</span> {form.ai_generated ? "True" : "False"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Crawl/Import Status:</span> {form.import_status || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Footer */}
        <div className="sticky bottom-0 border-t border-border bg-background px-6 py-4 flex flex-wrap justify-between items-center gap-4 bg-surface/30">
          <div>
            {!isPreviewMode ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRegenerate}
                disabled={regenerating || !form.website_url}
                className="h-10 hover:bg-surface/50 border-purple-500/30 text-purple-600 dark:text-purple-300 gap-1.5"
              >
                {regenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                ) : (
                  <Sparkles className="h-4 w-4 text-purple-500" />
                )}
                AI Auto-Generate
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setIsPreviewMode(false)} className="gap-1">
                Back to Edit
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleCloseAttempt}>
              Cancel
            </Button>
            {!isPreviewMode && (
              <Button type="button" variant="outline" onClick={() => validate() && setIsPreviewMode(true)}>
                <Eye className="mr-1.5 h-4 w-4 text-muted-foreground" /> Preview Changes
              </Button>
            )}
            <Button
              type="button"
              onClick={handleFormSubmit}
              disabled={save.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isNew ? "Create Tool Structure" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .input-style {
          display: block;
          width: 100%;
          height: 40px;
          border: 1px solid var(--color-border);
          background: var(--color-background);
          border-radius: 8px;
          padding: 0 12px;
          font-size: 14px;
          color: var(--color-foreground);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .input-style:focus-visible {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-ring);
        }
        textarea.input-style {
          height: auto;
          padding: 10px 12px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm select-none hover:opacity-90">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border"
      />
      <span className="text-foreground font-medium text-xs">{label}</span>
    </label>
  );
}

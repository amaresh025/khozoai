import { supabase } from "@/integrations/supabase/client";

export type Tool = {
  id: string;
  tool_name: string;
  website_url: string;
  tagline: string | null;
  short_description: string;
  full_description: string | null;
  category: string;
  sub_category: string[] | null;
  pricing: string | null;
  pricing_details: string | null;
  free_plan: boolean | null;
  platforms: string[] | null;
  features: string[] | null;
  use_cases: string[] | null;
  best_for: string[] | null;
  capabilities: string[] | null;
  integrations: string[] | null;
  api_available: boolean | null;
  browser_extension: boolean | null;
  mobile_app: boolean | null;
  languages: string[] | null;
  company_name: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  search_tags: string[] | null;
  featured: boolean | null;
  created_at: string;
  updated_at: string;
  slug: string;
  is_published: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
};

export type DynamicCategory = {
  capability: string;
  tool_count: number;
};

export type DynamicUseCase = {
  use_case: string;
  tool_count: number;
};

export const CAPABILITY_TAXONOMY = [
  "AI Chatbot",
  "AI Writing",
  "AI Coding",
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
  "AI Presentation Creation",
  "AI Resume Building",
  "AI 3D Modeling",
  "AI Education",
  "AI Email",
  "AI SEO",
  "AI Social Media",
  "AI Security",
  "AI Agent",
  "AI Accessibility",
  "AI Accounting",
  "AI Legal",
  "AI Healthcare",
  "AI Customer Support",
  "AI Sales",
  "AI HR",
  "AI Project Management",
] as const;

export const USE_CASE_TAXONOMY = [
  "Blog Writing",
  "SEO",
  "Programming",
  "Code Review",
  "Studying",
  "Marketing",
  "Customer Support",
  "Social Media",
  "Sales",
  "Research",
  "Video Editing",
  "Content Creation",
  "Data Analysis",
  "Design",
  "Automation",
  "Learning",
  "Customer Service",
  "Project Management",
  "Resume Building",
  "Email Management",
  "Image Editing",
  "Voice Over",
  "Music Production",
  "3D Modeling",
  "Translation",
  "Transcription",
  "Summarization",
  "Copywriting",
  "Ad Campaign",
  "Market Research",
  "Competitor Analysis",
  "Lead Generation",
  "Meeting Notes",
  "Brainstorming",
  "Document Processing",
  "Data Entry",
  "Scheduling",
  "Personal Assistant",
  "Web Scraping",
  "API Integration",
] as const;

const baseToolSelect = "*";
const baseToolSelectLight =
  "id, tool_name, website_url, tagline, short_description, logo_url, pricing, featured, category, slug, is_published";

export const Q = {
  categories: () => supabase.from("categories").select("*").order("sort_order"),
  categoryBySlug: (slug: string) =>
    supabase.from("categories").select("*").eq("slug", slug).maybeSingle(),
  tools: async (opts?: {
    category?: string;
    categoryIds?: string[];
    featured?: boolean;
    limit?: number;
    search?: string;
    pricing?: string;
    capabilities?: string[];
    useCases?: string[];
  }): Promise<{ data: Tool[] | null; error: any }> => {
    const selectStr = opts?.search ? baseToolSelect : baseToolSelectLight;
    let q = supabase.from("tools").select(selectStr).eq("is_published", true);

    if (opts?.categoryIds && opts.categoryIds.length > 0) {
      q = q.in("category", opts.categoryIds);
    } else if (opts?.category) {
      q = q.eq("category", opts.category);
    }

    if (opts?.featured) q = q.eq("featured", true);
    if (opts?.pricing) q = q.eq("pricing", opts.pricing);

    if (opts?.capabilities && opts.capabilities.length > 0) {
      q = q.overlaps("capabilities", opts.capabilities);
    }
    if (opts?.useCases && opts.useCases.length > 0) {
      q = q.overlaps("use_cases", opts.useCases);
    }

    if (!opts?.search) {
      q = q.order("created_at", { ascending: false });
      if (opts?.limit) q = q.limit(opts.limit);

      const res = await q;
      return { data: res.data as unknown as Tool[] | null, error: res.error };
    }

    const res = await q;
    if (res.error || !res.data) {
      return { data: null, error: res.error };
    }

    const searchLower = opts.search.toLowerCase().trim();
    const searchKeywords = searchLower.split(/\s+/).filter(Boolean);

    if (searchKeywords.length === 0) {
      let sorted = [...res.data] as unknown as Tool[];
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (opts?.limit) sorted = sorted.slice(0, opts.limit);
      return { data: sorted, error: null };
    }

    const scoredTools = res.data.map((tool: any) => {
      let score = 0;
      const nameLower = (tool.tool_name || "").toLowerCase();
      const taglineLower = (tool.tagline || "").toLowerCase();
      const shortDescLower = (tool.short_description || "").toLowerCase();
      const fullDescLower = (tool.full_description || "").toLowerCase();
      const categoryLower = (tool.category || "").toLowerCase();

      if (nameLower === searchLower) {
        score += 1000;
      } else if (nameLower.startsWith(searchLower)) {
        score += 500;
      }

      const nameWords = nameLower.split(/\s+/).filter(Boolean);
      const nameWordStarts = nameWords.some((w: string) => w.startsWith(searchLower));
      if (nameWordStarts) {
        score += 300;
      }

      if (nameLower.includes(searchLower)) {
        score += 100;
      }

      let keywordNameMatches = 0;
      searchKeywords.forEach((keyword) => {
        if (nameWords.includes(keyword)) {
          keywordNameMatches += 1;
        } else if (nameLower.includes(keyword)) {
          keywordNameMatches += 0.5;
        }
      });
      score += keywordNameMatches * 150;

      if (taglineLower.includes(searchLower) || shortDescLower.includes(searchLower) || fullDescLower.includes(searchLower)) {
        score += 50;
      }

      let keywordDescMatches = 0;
      searchKeywords.forEach((keyword) => {
        if (taglineLower.includes(keyword) || shortDescLower.includes(keyword) || fullDescLower.includes(keyword)) {
          keywordDescMatches += 1;
        }
      });
      score += keywordDescMatches * 20;

      const arraysToSearch = [
        tool.search_tags || [],
        tool.sub_category || [],
        tool.capabilities || []
      ];
      
      arraysToSearch.forEach((arr) => {
        arr.forEach((val: string) => {
          const valLower = val.toLowerCase();
          if (valLower === searchLower) {
            score += 100;
          } else if (valLower.includes(searchLower)) {
            score += 30;
          }
          searchKeywords.forEach((kw) => {
            if (valLower.includes(kw)) {
              score += 10;
            }
          });
        });
      });

      return { tool: tool as Tool, score };
    });

    const filteredScored = scoredTools.filter((item) => item.score > 0);

    filteredScored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.tool.created_at).getTime() - new Date(a.tool.created_at).getTime();
    });

    let finalTools = filteredScored.map((item) => item.tool);
    if (opts?.limit) {
      finalTools = finalTools.slice(0, opts.limit);
    }

    return { data: finalTools, error: null };
  },
  toolsByCapability: (
    capability: string,
    opts?: { limit?: number },
  ) => {
    let q = supabase
      .from("tools")
      .select(baseToolSelect)
      .eq("is_published", true)
      .contains("capabilities", [capability])
      .order("created_at", { ascending: false });

    if (opts?.limit) q = q.limit(opts.limit);
    return q;
  },
  toolsByUseCase: (
    useCase: string,
    opts?: { limit?: number },
  ) => {
    let q = supabase
      .from("tools")
      .select(baseToolSelect)
      .eq("is_published", true)
      .contains("use_cases", [useCase])
      .order("created_at", { ascending: false });

    if (opts?.limit) q = q.limit(opts.limit);
    return q;
  },
  dynamicCategories: async (): Promise<DynamicCategory[]> => {
    const { data } = await supabase.rpc("dynamic_categories");
    return (data as DynamicCategory[]) ?? [];
  },
  dynamicUseCases: async (): Promise<DynamicUseCase[]> => {
    const { data } = await supabase.rpc("dynamic_use_cases");
    return (data as DynamicUseCase[]) ?? [];
  },
  toolBySlug: (slug: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let q = supabase.from("tools").select("*");
    if (isUuid) {
      q = q.eq("id", slug);
    } else {
      q = q.eq("slug", slug);
    }
    return q.eq("is_published", true).maybeSingle();
  },
  reviews: (toolId: string) =>
    supabase
      .from("reviews")
      .select("*")
      .eq("tool_id", toolId)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),

  comparisonBySlug: (slug: string) =>
    supabase.from("tool_comparisons").select("*").eq("slug", slug).maybeSingle(),
  comparisons: () =>
    supabase.from("tool_comparisons").select("*").order("created_at", { ascending: false }),
};

export async function logEvent(
  eventType: string,
  metadata: Record<string, unknown> = {},
  toolId?: string,
) {
  try {
    await supabase.from("analytics_events").insert({
      event_type: eventType,
      tool_id: toolId ?? null,
      metadata: metadata as never,
    });
  } catch {
    /* swallow */
  }
}

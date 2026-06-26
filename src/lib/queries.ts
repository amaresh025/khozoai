import { supabase } from "@/integrations/supabase/client";

export type Tool = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website_url: string;
  affiliate_url: string | null;
  pricing: string;
  pricing_details: string | null;
  category_id: string | null;
  rating: number;
  review_count: number;
  featured: boolean;
  sponsored: boolean;
  verified: boolean;
  status: string;
  views: number;
  clicks: number;
  pros: string[] | null;
  cons: string[] | null;
  platforms: string[] | null;
  published_at: string | null;
  created_at: string;
  category?: Category | null;
  key_summary: string | null;
  secondary_categories: string[] | null;
  use_cases: string[] | null;
  compare_data: Record<string, any> | null;
  needs_review: boolean;
  capabilities?: string[] | null;
  industries?: string[] | null;
  best_for?: string[] | null;
  not_good_for?: string[] | null;
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

export type DynamicIndustry = {
  industry: string;
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

export const INDUSTRY_TAXONOMY = [
  "Education",
  "Finance",
  "Healthcare",
  "Legal",
  "HR",
  "Gaming",
  "Cybersecurity",
  "Ecommerce",
  "Marketing",
  "Real Estate",
  "Media",
  "Transportation",
  "Manufacturing",
  "Agriculture",
  "Government",
  "Nonprofit",
  "Technology",
  "Retail",
  "Insurance",
  "Telecommunications",
  "Energy",
  "Entertainment",
  "Construction",
  "Hospitality",
  "Automotive",
] as const;

const baseToolSelect = "*, category:categories(*)";

export const Q = {
  categories: () => supabase.from("categories").select("*").order("sort_order"),
  categoryBySlug: (slug: string) =>
    supabase.from("categories").select("*").eq("slug", slug).maybeSingle(),
  tools: async (opts?: {
    categoryId?: string;
    categoryIds?: string[];
    featured?: boolean;
    sponsored?: boolean;
    sort?: "rating" | "views" | "newest";
    limit?: number;
    search?: string;
    pricing?: string;
    capabilities?: string[];
    industries?: string[];
    useCases?: string[];
  }): Promise<{ data: Tool[] | null; error: any }> => {
    let q = supabase.from("tools").select(baseToolSelect).eq("status", "approved");

    if (opts?.categoryIds && opts.categoryIds.length > 0) {
      q = q.in("category_id", opts.categoryIds);
    } else if (opts?.categoryId) {
      q = q.eq("category_id", opts.categoryId);
    }

    if (opts?.featured) q = q.eq("featured", true);
    if (opts?.sponsored) q = q.eq("sponsored", true);
    if (opts?.pricing) q = q.eq("pricing", opts.pricing as any);

    if (opts?.capabilities && opts.capabilities.length > 0) {
      q = q.overlaps("capabilities", opts.capabilities);
    }
    if (opts?.industries && opts.industries.length > 0) {
      q = q.overlaps("industries", opts.industries);
    }
    if (opts?.useCases && opts.useCases.length > 0) {
      q = q.overlaps("use_cases", opts.useCases);
    }

    if (!opts?.search) {
      if (opts?.sort === "rating") q = q.order("rating", { ascending: false });
      else if (opts?.sort === "views") q = q.order("views", { ascending: false });
      else q = q.order("created_at", { ascending: false });

      if (opts?.limit) q = q.limit(opts.limit);

      const res = await q;
      return { data: res.data as Tool[] | null, error: res.error };
    }

    const res = await q;
    if (res.error || !res.data) {
      return { data: null, error: res.error };
    }

    const searchLower = opts.search.toLowerCase().trim();
    const searchKeywords = searchLower.split(/\s+/).filter(Boolean);

    if (searchKeywords.length === 0) {
      let sorted = [...res.data] as Tool[];
      if (opts?.sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
      else if (opts?.sort === "views") sorted.sort((a, b) => b.views - a.views);
      else
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (opts?.limit) sorted = sorted.slice(0, opts.limit);
      return { data: sorted, error: null };
    }

    const scoredTools = res.data.map((tool: any) => {
      let score = 0;
      const nameLower = (tool.name || "").toLowerCase();
      const shortDescLower = (tool.short_description || "").toLowerCase();
      const fullDescLower = (tool.full_description || "").toLowerCase();

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

      if (shortDescLower.includes(searchLower) || fullDescLower.includes(searchLower)) {
        score += 50;
      }

      let keywordDescMatches = 0;
      searchKeywords.forEach((keyword) => {
        if (shortDescLower.includes(keyword) || fullDescLower.includes(keyword)) {
          keywordDescMatches += 1;
        }
      });
      score += keywordDescMatches * 20;

      if (score > 0) {
        score += (tool.rating || 0) * 5;
        score += Math.min(tool.views || 0, 1000) * 0.1;
      }

      return { tool: tool as Tool, score };
    });

    const filteredScored = scoredTools.filter((item) => item.score > 0);

    filteredScored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (opts?.sort === "rating") {
        return b.tool.rating - a.tool.rating;
      }
      if (opts?.sort === "views") {
        return b.tool.views - a.tool.views;
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
    opts?: { sort?: "rating" | "views" | "newest"; limit?: number },
  ) => {
    let q = supabase
      .from("tools")
      .select(baseToolSelect)
      .eq("status", "approved")
      .contains("capabilities", [capability]);

    if (opts?.sort === "rating") q = q.order("rating", { ascending: false });
    else if (opts?.sort === "views") q = q.order("views", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    if (opts?.limit) q = q.limit(opts.limit);
    return q;
  },
  toolsByUseCase: (
    useCase: string,
    opts?: { sort?: "rating" | "views" | "newest"; limit?: number },
  ) => {
    let q = supabase
      .from("tools")
      .select(baseToolSelect)
      .eq("status", "approved")
      .contains("use_cases", [useCase]);

    if (opts?.sort === "rating") q = q.order("rating", { ascending: false });
    else if (opts?.sort === "views") q = q.order("views", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    if (opts?.limit) q = q.limit(opts.limit);
    return q;
  },
  toolsByIndustry: (
    industry: string,
    opts?: { sort?: "rating" | "views" | "newest"; limit?: number },
  ) => {
    let q = supabase
      .from("tools")
      .select(baseToolSelect)
      .eq("status", "approved")
      .contains("industries", [industry]);

    if (opts?.sort === "rating") q = q.order("rating", { ascending: false });
    else if (opts?.sort === "views") q = q.order("views", { ascending: false });
    else q = q.order("created_at", { ascending: false });

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
  dynamicIndustries: async (): Promise<DynamicIndustry[]> => {
    const { data } = await supabase.rpc("dynamic_industries");
    return (data as DynamicIndustry[]) ?? [];
  },
  toolBySlug: (slug: string) =>
    supabase.from("tools").select(baseToolSelect).eq("slug", slug).maybeSingle(),
  toolFeatures: (toolId: string) =>
    supabase.from("tool_features").select("*").eq("tool_id", toolId).order("sort_order"),
  toolTags: (toolId: string) => supabase.from("tool_tags").select("*").eq("tool_id", toolId),
  toolScreenshots: (toolId: string) =>
    supabase.from("tool_screenshots").select("*").eq("tool_id", toolId).order("sort_order"),
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

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

export type PromptTemplate = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  prompt: string;
  use_case: string | null;
  category: string | null;
  model: string | null;
  tags: string[] | null;
  uses: number;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[] | null;
  published: boolean;
  published_at: string | null;
};

const baseToolSelect = "*, category:categories(*)";

export const Q = {
  categories: () =>
    supabase.from("categories").select("*").order("sort_order"),
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
  }): Promise<{ data: Tool[] | null; error: any }> => {
    let q = supabase
      .from("tools")
      .select(baseToolSelect)
      .eq("status", "approved");

    if (opts?.categoryIds && opts.categoryIds.length > 0) {
      q = q.in("category_id", opts.categoryIds);
    } else if (opts?.categoryId) {
      q = q.eq("category_id", opts.categoryId);
    }

    if (opts?.featured) q = q.eq("featured", true);
    if (opts?.sponsored) q = q.eq("sponsored", true);
    if (opts?.pricing) q = q.eq("pricing", opts.pricing as any);

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
      else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
      const nameWordStarts = nameWords.some(w => w.startsWith(searchLower));
      if (nameWordStarts) {
        score += 300;
      }
      
      if (nameLower.includes(searchLower)) {
        score += 100;
      }

      let keywordNameMatches = 0;
      searchKeywords.forEach(keyword => {
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
      searchKeywords.forEach(keyword => {
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

    let filteredScored = scoredTools.filter(item => item.score > 0);

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

    let finalTools = filteredScored.map(item => item.tool);
    if (opts?.limit) {
      finalTools = finalTools.slice(0, opts.limit);
    }

    return { data: finalTools, error: null };
  },
  toolBySlug: (slug: string) =>
    supabase.from("tools").select(baseToolSelect).eq("slug", slug).maybeSingle(),
  toolFeatures: (toolId: string) =>
    supabase.from("tool_features").select("*").eq("tool_id", toolId).order("sort_order"),
  toolTags: (toolId: string) =>
    supabase.from("tool_tags").select("*").eq("tool_id", toolId),
  toolScreenshots: (toolId: string) =>
    supabase.from("tool_screenshots").select("*").eq("tool_id", toolId).order("sort_order"),
  reviews: (toolId: string) =>
    supabase
      .from("reviews")
      .select("*")
      .eq("tool_id", toolId)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  prompts: (opts?: { category?: string; search?: string; limit?: number }) => {
    let q = supabase.from("prompt_templates").select("*").order("created_at", { ascending: false });
    if (opts?.category) q = q.eq("category", opts.category);
    if (opts?.search) q = q.or(`title.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
    if (opts?.limit) q = q.limit(opts.limit);
    return q;
  },
  promptBySlug: (slug: string) =>
    supabase.from("prompt_templates").select("*").eq("slug", slug).maybeSingle(),
  blogPosts: (opts?: { limit?: number; category?: string }) => {
    let q = supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (opts?.category) q = q.eq("category", opts.category);
    if (opts?.limit) q = q.limit(opts.limit);
    return q;
  },
  blogPostBySlug: (slug: string) =>
    supabase.from("blog_posts").select("*").eq("slug", slug).eq("published", true).maybeSingle(),
  comparisonBySlug: (slug: string) =>
    supabase.from("tool_comparisons").select("*").eq("slug", slug).maybeSingle(),
  comparisons: () =>
    supabase.from("tool_comparisons").select("*").order("created_at", { ascending: false }),
};

export async function logEvent(eventType: string, metadata: Record<string, unknown> = {}, toolId?: string) {
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

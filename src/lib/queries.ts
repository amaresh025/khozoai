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
  tools: (opts?: {
    categoryId?: string;
    featured?: boolean;
    sponsored?: boolean;
    sort?: "rating" | "views" | "newest";
    limit?: number;
    search?: string;
    pricing?: string;
  }) => {
    let q = supabase
      .from("tools")
      .select(baseToolSelect)
      .eq("status", "approved");
    if (opts?.categoryId) q = q.eq("category_id", opts.categoryId);
    if (opts?.featured) q = q.eq("featured", true);
    if (opts?.sponsored) q = q.eq("sponsored", true);
    if (opts?.pricing) q = q.eq("pricing", opts.pricing as never);
    if (opts?.search)
      q = q.or(
        `name.ilike.%${opts.search}%,short_description.ilike.%${opts.search}%`,
      );
    if (opts?.sort === "rating") q = q.order("rating", { ascending: false });
    else if (opts?.sort === "views") q = q.order("views", { ascending: false });
    else q = q.order("created_at", { ascending: false });
    if (opts?.limit) q = q.limit(opts.limit);
    return q;
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

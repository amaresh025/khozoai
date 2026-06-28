import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function cleanHtmlToText(html: string): string {
  if (!html) return "";
  let clean = html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");
  clean = clean.replace(/<[^>]+>/g, " ");
  clean = clean
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  return clean.replace(/\s+/g, " ").trim().slice(0, 10000);
}

function pickMeta(html: string, names: string[]) {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2?.[1]) return m2[1].trim();
  }
  return null;
}

function splitCsvValue(val: string): string[] {
  if (!val) return [];
  return val
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchSiteMetadata(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  let html = "";
  try {
    const r = await fetch(parsed.toString(), {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AIToolsHubBot/1.0)",
        accept: "text/html,*/*",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    html = (await r.text()).slice(0, 250_000);
  } catch (e: any) {
    return {
      url: parsed.toString(),
      hostname: parsed.hostname,
      reachable: false,
      error: e?.message ?? "fetch failed",
      title: null,
      description: null,
      ogImage: null,
      favicon: null,
      bodyText: "",
    };
  }
  const title =
    pickMeta(html, ["og:title", "twitter:title"]) ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    parsed.hostname;
  const description = pickMeta(html, ["description", "og:description", "twitter:description"]);
  const ogImage = pickMeta(html, ["og:image", "twitter:image"]);
  const favicon = (() => {
    const m = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
    if (m?.[1]) {
      try {
        return new URL(m[1], parsed).toString();
      } catch {
        return null;
      }
    }
    return `${parsed.origin}/favicon.ico`;
  })();

  const bodyText = cleanHtmlToText(html);

  return {
    url: parsed.toString(),
    hostname: parsed.hostname,
    reachable: true,
    title: title?.slice(0, 200) ?? null,
    description: description?.slice(0, 500) ?? null,
    ogImage,
    favicon,
    bodyText,
  };
}

async function enrichWithAI(input: {
  name: string;
  url: string;
  rawTitle: string | null;
  rawDescription: string | null;
  bodyText?: string | null;
  categories: { id: string; name: string }[];
}) {
  const key = process.env.LOVABLE_API_KEY;

  const fallback = {
    short_description: input.rawDescription?.slice(0, 120) ?? "",
    full_description: input.rawDescription ?? "",
    key_summary: "",
    category_id: null as string | null,
    secondary_categories: [] as string[],
    tags: [] as string[],
    pricing: null as string | null,
    pricing_details: null as string | null,
    features: [] as string[],
    pros: [] as string[],
    cons: [] as string[],
    platforms: [] as string[],
    use_cases: [] as string[],
    capabilities: [] as string[],
    industries: [] as string[],
    best_for: [] as string[],
    not_good_for: [] as string[],
    ai_model: null as string | null,
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
    },
  };

  if (!key) return fallback;

  const categoryList = input.categories.map((c) => `- ${c.id} :: ${c.name}`).join("\n");
  const prompt = `You are an editor for an AI tools directory. Summarize the website content into a clean, factual profile.

Tool name: ${input.name}
Website: ${input.url}
Page title: ${input.rawTitle ?? ""}
Meta description: ${input.rawDescription ?? ""}
Page content:
${input.bodyText ?? ""}

Available categories (pick primary category_id, and secondary_categories IDs):
${categoryList}

CAPABILITIES (pick all that apply):
AI Chatbot, AI Writing, AI Coding, AI Research, AI Search, AI Image Generation, AI Video Generation, AI Voice Generation, AI Music Generation, AI Automation, AI Productivity, AI Design, AI Data Analysis, AI Translation, AI Presentation Creation, AI Resume Building, AI 3D Modeling, AI Education, AI Email, AI SEO, AI Social Media, AI Security, AI Agent, AI Accessibility, AI Accounting, AI Legal, AI Healthcare, AI Customer Support, AI Sales, AI HR, AI Project Management

USE CASES (pick all that apply):
Blog Writing, SEO, Programming, Code Review, Studying, Marketing, Customer Support, Social Media, Sales, Research, Video Editing, Content Creation, Data Analysis, Design, Automation, Learning, Customer Service, Project Management, Resume Building, Email Management, Image Editing, Voice Over, Music Production, 3D Modeling, Translation, Transcription, Summarization, Copywriting, Ad Campaign, Market Research, Competitor Analysis, Lead Generation, Meeting Notes, Brainstorming, Document Processing, Data Entry, Scheduling, Personal Assistant, Web Scraping, API Integration

INDUSTRIES (pick all that apply):
Education, Finance, Healthcare, Legal, HR, Gaming, Cybersecurity, Ecommerce, Marketing, Real Estate, Media, Transportation, Manufacturing, Agriculture, Government, Nonprofit, Technology, Retail, Insurance, Telecommunications, Energy, Entertainment, Construction, Hospitality, Automotive

Return ONLY valid JSON. No markdown. No explanations. Use these rules:

- short_description: 60-120 words. One paragraph. Describe what the tool does factually. No marketing language, no hype words like "revolutionary", "cutting-edge", "game-changer". Write like a human editor would. Focus on features visible on the website.
- full_description: 300-800 characters. Extended but still concise. No repeated sentences.
- features: 4-8 specific features mentioned on the site. Short phrases. Not generic.
- tags: 3-5 specific lowercase tags describing the tool. Avoid "ai", "tool".
- pricing: Set to observed pricing model ("free", "freemium", "paid", "subscription", "contact") or null if unknown.
- pricing_details: Observed pricing info or null.
- ai_model: Name of the AI model used (e.g. "GPT-4", "Claude 3", "Gemini") or null if not mentioned.
- platforms: Observed platforms from: Web, Windows, Mac, Android, iOS, API, Browser Extension, Desktop App.
- Do not invent information. Leave fields empty or null if not found on the site.

{
  "short_description": "factual 60-120 word description",
  "full_description": "extended description 300-800 chars",
  "key_summary": "2-3 sentence overview",
  "category_id": "uuid or null",
  "secondary_categories": ["uuid or empty"],
  "tags": ["3-5 specific tags"],
  "pricing": "free|freemium|paid|subscription|contact",
  "pricing_details": "observed pricing or null",
  "features": ["4-8 specific features"],
  "pros": ["2-4 strengths"],
  "cons": ["1-3 limitations or empty"],
  "platforms": ["observed platforms"],
  "use_cases": ["all matching use cases"],
  "capabilities": ["all matching capabilities"],
  "industries": ["all matching industries"],
  "best_for": ["2-3 specific scenarios"],
  "not_good_for": ["1-2 limitations or empty"],
  "ai_model": "model name or null",
  "compare_data": {
    "coding_quality": "Excellent|Good|Basic",
    "writing_quality": "Excellent|Good|Basic",
    "research": "Excellent|Good|Basic",
    "image_generation": true,
    "video_generation": true,
    "voice": true,
    "web_search": true,
    "file_upload": true,
    "api": true
  }
}`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a precise JSON-only assistant. Return ONLY valid JSON, no prose, no markdown fences.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) throw new Error(`AI gateway HTTP ${r.status}`);
    const json = await r.json();
    const text = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);

    return {
      short_description: String(parsed.short_description ?? "").slice(0, 500),
      full_description: String(parsed.full_description ?? "").slice(0, 3000),
      key_summary: String(parsed.key_summary ?? "").slice(0, 1000),
      category_id:
        typeof parsed.category_id === "string" && parsed.category_id.length === 36
          ? parsed.category_id
          : null,
      secondary_categories: Array.isArray(parsed.secondary_categories)
        ? parsed.secondary_categories.filter((x: any) => typeof x === "string" && x.length === 36)
        : [],
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.slice(0, 8).map((t: any) => String(t).toLowerCase().slice(0, 32))
        : [],
      pricing: ["free", "freemium", "paid", "subscription", "contact"].includes(parsed.pricing)
        ? parsed.pricing
        : null,
      pricing_details: parsed.pricing_details ? String(parsed.pricing_details).slice(0, 500) : null,
      features: Array.isArray(parsed.features)
        ? parsed.features.map((f: any) => String(f).slice(0, 100))
        : [],
      pros: Array.isArray(parsed.pros) ? parsed.pros.map((p: any) => String(p).slice(0, 200)) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.map((c: any) => String(c).slice(0, 200)) : [],
      platforms: Array.isArray(parsed.platforms)
        ? parsed.platforms.map((pl: any) => String(pl).slice(0, 100))
        : [],
      use_cases: Array.isArray(parsed.use_cases)
        ? parsed.use_cases.map((uc: any) => String(uc).slice(0, 100))
        : [],
      capabilities: Array.isArray(parsed.capabilities)
        ? parsed.capabilities.map((c: any) => String(c).slice(0, 60))
        : [],
      industries: Array.isArray(parsed.industries)
        ? parsed.industries.map((i: any) => String(i).slice(0, 60))
        : [],
      best_for: Array.isArray(parsed.best_for)
        ? parsed.best_for.map((b: any) => String(b).slice(0, 150))
        : [],
      not_good_for: Array.isArray(parsed.not_good_for)
        ? parsed.not_good_for.map((n: any) => String(n).slice(0, 150))
        : [],
      ai_model: typeof parsed.ai_model === "string" && parsed.ai_model.trim()
        ? parsed.ai_model.trim().slice(0, 100)
        : null,
      compare_data:
        parsed.compare_data && typeof parsed.compare_data === "object"
          ? {
              coding_quality: ["Excellent", "Good", "Basic"].includes(
                parsed.compare_data.coding_quality,
              )
                ? parsed.compare_data.coding_quality
                : "Basic",
              writing_quality: ["Excellent", "Good", "Basic"].includes(
                parsed.compare_data.writing_quality,
              )
                ? parsed.compare_data.writing_quality
                : "Basic",
              research: ["Excellent", "Good", "Basic"].includes(parsed.compare_data.research)
                ? parsed.compare_data.research
                : "Basic",
              image_generation: !!parsed.compare_data.image_generation,
              video_generation: !!parsed.compare_data.video_generation,
              voice: !!parsed.compare_data.voice,
              web_search: !!parsed.compare_data.web_search,
              file_upload: !!parsed.compare_data.file_upload,
              api: !!parsed.compare_data.api,
              ...(parsed.ai_model ? { ai_model: String(parsed.ai_model).slice(0, 100) } : {}),
            }
          : fallback.compare_data,
    };
  } catch (e) {
    console.error("AI enrichment failed", e);
    return fallback;
  }
}

/* ============================================================
   Admin CRUD server functions — use supabaseAdmin to bypass
   broken RLS policies (has_role was dropped, taking all
   admin policies with it).  These are only reachable from the
   admin UI which already validates admin credentials.
   ============================================================ */

export const adminListTools = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ status: z.string().optional(), search: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("tools")
      .select("*, category:categories(name,slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    const { data: tools, error } = await q;
    if (error) throw new Error(error.message);
    return tools ?? [];
  });

export const adminGetTool = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: tool, error } = await supabaseAdmin
      .from("tools")
      .select("*, tool_features(*), tool_tags(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return tool;
  });

export const adminListCategories = createServerFn({ method: "POST" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id,name")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const adminSaveTool = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().optional(),
        payload: z.record(z.any()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { id, payload } = data;
    const { features, tags, ...toolPayload } = payload;

    let targetId: string;
    if (id) {
      const { error } = await supabaseAdmin.from("tools").update(toolPayload as any).eq("id", id);
      if (error) throw new Error(error.message);
      targetId = id;
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("tools")
        .insert(toolPayload as any)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      targetId = inserted.id;
    }

    // Save features if provided
    if (Array.isArray(features)) {
      await supabaseAdmin.from("tool_features").delete().eq("tool_id", targetId);
      if (features.length > 0) {
        const { error } = await supabaseAdmin.from("tool_features").insert(
          features.map((feature: string, idx: number) => ({
            tool_id: targetId,
            feature: feature.trim(),
            sort_order: idx + 1,
          })),
        );
        if (error) throw new Error(error.message);
      }
    }

    // Save tags if provided
    if (Array.isArray(tags)) {
      await supabaseAdmin.from("tool_tags").delete().eq("tool_id", targetId);
      if (tags.length > 0) {
        const uniqueTags = Array.from(new Set(tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)));
        if (uniqueTags.length > 0) {
          const { error } = await supabaseAdmin.from("tool_tags").insert(
            uniqueTags.map((tag: string) => ({
              tool_id: targetId,
              tag,
            })),
          );
          if (error) throw new Error(error.message);
        }
      }
    }

    return { success: true, id: targetId };
  });

export const adminDeleteTool = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("tools").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminToggleField = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string(),
        field: z.enum(["featured", "verified", "sponsored"]),
        value: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("tools")
      .update({ [data.field]: data.value } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ id: z.string(), status: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("tools")
      .update({ status: data.status } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

/* ============================================================
   Public server functions
   ============================================================ */

export const enrichUrl = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ url: z.string().url(), name: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const meta = await fetchSiteMetadata(data.url);
    const name = (data.name ?? meta.title ?? meta.hostname ?? "").trim();
    const { data: cats } = await supabaseAdmin.from("categories").select("id,name");
    const enriched = await enrichWithAI({
      name,
      url: meta.url,
      rawTitle: meta.title,
      rawDescription: meta.description,
      bodyText: meta.bodyText,
      categories: cats ?? [],
    });
    return { meta, name, enriched };
  });

const importItemSchema = z.object({
  name: z.string().min(1).max(200),
  website_url: z.string().url(),
  short_description: z.string().max(500).optional(),
  full_description: z.string().max(3000).optional(),
  pricing: z.string().max(50).optional(),
  pricing_details: z.string().max(500).optional(),
  category: z.string().max(200).optional(),
  tags: z.string().max(1000).optional(),
  platforms: z.string().max(500).optional(),
  features: z.string().max(2000).optional(),
  pros: z.string().max(2000).optional(),
  cons: z.string().max(2000).optional(),
  use_cases: z.string().max(1000).optional(),
  capabilities: z.string().max(1000).optional(),
  industries: z.string().max(1000).optional(),
  best_for: z.string().max(1000).optional(),
  not_good_for: z.string().max(1000).optional(),
  logo_url: z.string().max(500).optional(),
  cover_url: z.string().max(500).optional(),
  affiliate_url: z.string().max(500).optional(),
  rating: z.string().max(10).optional(),
  status: z.string().max(20).optional(),
  featured: z.string().max(10).optional(),
  verified: z.string().max(10).optional(),
  sponsored: z.string().max(10).optional(),
  ai_model: z.string().max(100).optional(),
});

function buildToolPayload(
  item: z.infer<typeof importItemSchema>,
  meta: Awaited<ReturnType<typeof fetchSiteMetadata>>,
  enriched: Awaited<ReturnType<typeof enrichWithAI>>,
  categoryNameToId: Record<string, string>,
) {
  const slug = slugify(item.name);

  const parseBool = (val: string | undefined): boolean | undefined => {
    if (!val) return undefined;
    const v = val.toLowerCase().trim();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
    return undefined;
  };

  const category_id = item.category
    ? (categoryNameToId[item.category.toLowerCase().trim()] ?? enriched.category_id)
    : enriched.category_id;

  const csvFeatures = item.features ? splitCsvValue(item.features) : null;
  const csvPros = item.pros ? splitCsvValue(item.pros) : null;
  const csvCons = item.cons ? splitCsvValue(item.cons) : null;
  const csvTags = item.tags ? splitCsvValue(item.tags) : null;
  const csvPlatforms = item.platforms ? splitCsvValue(item.platforms) : null;
  const csvUseCases = item.use_cases ? splitCsvValue(item.use_cases) : null;
  const csvCapabilities = item.capabilities ? splitCsvValue(item.capabilities) : null;
  const csvIndustries = item.industries ? splitCsvValue(item.industries) : null;
  const csvBestFor = item.best_for ? splitCsvValue(item.best_for) : null;
  const csvNotGoodFor = item.not_good_for ? splitCsvValue(item.not_good_for) : null;

  const featuresList: string[] = csvFeatures || enriched.features;
  const tagsList: string[] = csvTags || enriched.tags;

  const toolData: Record<string, any> = {
    name: item.name,
    slug,
    short_description:
      item.short_description ||
      enriched.short_description ||
      `${item.name} — AI tool`,
    full_description: item.full_description || enriched.full_description || null,
    key_summary: enriched.key_summary || null,
    website_url: meta.url,
    logo_url: item.logo_url || meta.favicon || null,
    cover_url: item.cover_url || (meta as any).ogImage || null,
    affiliate_url: item.affiliate_url || null,
    pricing: item.pricing || enriched.pricing || "freemium",
    pricing_details: item.pricing_details || enriched.pricing_details || null,
    category_id: category_id || null,
    secondary_categories: enriched.secondary_categories,
    pros: csvPros || enriched.pros,
    cons: csvCons || enriched.cons,
    platforms: csvPlatforms || enriched.platforms,
    use_cases: csvUseCases || enriched.use_cases,
    capabilities: csvCapabilities || enriched.capabilities,
    industries: csvIndustries || enriched.industries,
    best_for: csvBestFor || enriched.best_for,
    not_good_for: csvNotGoodFor || enriched.not_good_for,
    compare_data: {
      ...enriched.compare_data,
      ...(item.ai_model ? { ai_model: item.ai_model } : {}),
      ...(enriched.ai_model && !item.ai_model ? { ai_model: enriched.ai_model } : {}),
    },
    rating: item.rating ? parseFloat(item.rating) || 0 : 0,
    status: (item.status || "pending") as any,
    featured: parseBool(item.featured) ?? false,
    verified: parseBool(item.verified) ?? false,
    sponsored: parseBool(item.sponsored) ?? false,
  };

  return { toolData, featuresList, tagsList };
}

export const bulkImport = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        items: z.array(importItemSchema).min(1).max(50),
        enrich: z.boolean().default(true),
        force: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: cats } = await supabaseAdmin.from("categories").select("id,name");
    const categoryNameToId: Record<string, string> = {};
    for (const c of cats ?? []) {
      categoryNameToId[c.name.toLowerCase()] = c.id;
    }

    const { data: allTools } = await supabaseAdmin
      .from("tools")
      .select("id, name, slug, website_url, short_description, full_description, pricing, pricing_details, category_id, pros, cons, platforms, use_cases, capabilities, industries, best_for, not_good_for, logo_url, cover_url, affiliate_url, compare_data, status, featured, verified, sponsored, key_summary, secondary_categories");

    const results: Array<{
      name: string;
      url: string;
      status: "imported" | "updated" | "skipped" | "error";
      message?: string;
      slug?: string;
      toolId?: string;
    }> = [];

    const localTools = allTools ? [...allTools] : [];

    for (const item of data.items) {
      try {
        const meta = await fetchSiteMetadata(item.website_url);
        const host = new URL(meta.url).hostname.replace(/^www\./, "").toLowerCase();
        const slug = slugify(item.name);
        const normalizedInputName = item.name.toLowerCase().replace(/[^a-z0-9]/g, "");

        const existing = localTools.find((t: any) => {
          let tHost = "";
          try {
            tHost = new URL(t.website_url).hostname.replace(/^www\./, "").toLowerCase();
          } catch {
            tHost = t.website_url.toLowerCase();
          }
          const tSlug = t.slug;
          const normalizedTName = t.name.toLowerCase().replace(/[^a-z0-9]/g, "");

          if (normalizedTName === normalizedInputName) return true;
          if (tSlug === slug) return true;
          if (tHost === host) return true;
          if (
            normalizedInputName.length > 3 &&
            normalizedTName.length > 3 &&
            (normalizedInputName.includes(normalizedTName) ||
              normalizedTName.includes(normalizedInputName))
          ) {
            return true;
          }
          return false;
        });

        if (existing) {
          if (data.force) {
            let enriched;
            let needsReview = false;
            try {
              if (data.enrich) {
                enriched = await enrichWithAI({
                  name: item.name,
                  url: meta.url,
                  rawTitle: meta.title,
                  rawDescription: meta.description,
                  bodyText: meta.bodyText,
                  categories: cats ?? [],
                });
              } else {
                throw new Error("Enrichment skipped");
              }
            } catch {
              needsReview = true;
              enriched = {
                short_description: meta.description?.slice(0, 120) ?? "",
                full_description: meta.description ?? "",
                key_summary: "",
                category_id: null as string | null,
                secondary_categories: [] as string[],
                tags: [] as string[],
                pricing: null as string | null,
                pricing_details: null as string | null,
                features: [] as string[],
                pros: [] as string[],
                cons: [] as string[],
                platforms: [] as string[],
                use_cases: [] as string[],
                capabilities: [] as string[],
                industries: [] as string[],
                best_for: [] as string[],
                not_good_for: [] as string[],
                ai_model: null as string | null,
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
                },
              };
            }

            const { toolData, featuresList, tagsList } = buildToolPayload(item, meta, enriched, categoryNameToId);

            const updatePayload = {
              ...toolData,
              needs_review: needsReview,
              updated_at: new Date().toISOString(),
            };

            const { error } = await supabaseAdmin
              .from("tools")
              .update(updatePayload as any)
              .eq("id", (existing as any).id);

            if (error) throw error;

            if (featuresList?.length) {
              await supabaseAdmin.from("tool_features").delete().eq("tool_id", (existing as any).id);
              await supabaseAdmin.from("tool_features").insert(
                featuresList.map((feature: string, idx: number) => ({
                  tool_id: (existing as any).id,
                  feature,
                  sort_order: idx + 1,
                })),
              );
            }

            if (tagsList?.length) {
              await supabaseAdmin.from("tool_tags").delete().eq("tool_id", (existing as any).id);
              await supabaseAdmin
                .from("tool_tags")
                .insert(tagsList.map((tag: string) => ({ tool_id: (existing as any).id, tag })));
            }

            results.push({
              name: item.name,
              url: item.website_url,
              status: "updated",
              slug: (existing as any).slug,
              toolId: (existing as any).id,
            });
          } else {
            let enriched;
            let needsReview = false;
            try {
              if (data.enrich) {
                enriched = await enrichWithAI({
                  name: item.name,
                  url: meta.url,
                  rawTitle: meta.title,
                  rawDescription: meta.description,
                  bodyText: meta.bodyText,
                  categories: cats ?? [],
                });
              } else {
                throw new Error("Enrichment skipped");
              }
            } catch {
              needsReview = true;
              enriched = {
                short_description: meta.description?.slice(0, 120) ?? "",
                full_description: meta.description ?? "",
                key_summary: "",
                category_id: null as string | null,
                secondary_categories: [] as string[],
                tags: [] as string[],
                pricing: null as string | null,
                pricing_details: null as string | null,
                features: [] as string[],
                pros: [] as string[],
                cons: [] as string[],
                platforms: [] as string[],
                use_cases: [] as string[],
                capabilities: [] as string[],
                industries: [] as string[],
                best_for: [] as string[],
                not_good_for: [] as string[],
                ai_model: null as string | null,
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
                },
              };
            }

            const { toolData, featuresList, tagsList } = buildToolPayload(item, meta, enriched, categoryNameToId);
            const existingTool = existing as any;
            const updates: Record<string, any> = {};
            let hasUpdates = false;

            const scalarFields = [
              "short_description", "full_description", "pricing", "pricing_details",
              "category_id", "logo_url", "cover_url", "affiliate_url", "key_summary",
            ];

            for (const field of scalarFields) {
              if (
                (existingTool[field] === null ||
                  existingTool[field] === undefined ||
                  existingTool[field] === "") &&
                toolData[field] !== null &&
                toolData[field] !== undefined &&
                toolData[field] !== ""
              ) {
                updates[field] = toolData[field];
                hasUpdates = true;
              }
            }

            const arrayFields = [
              "pros", "cons", "platforms", "use_cases", "capabilities",
              "industries", "best_for", "not_good_for", "secondary_categories",
            ];

            for (const field of arrayFields) {
              const existingArr = existingTool[field];
              const newVal = toolData[field];
              if (
                (!existingArr || existingArr.length === 0) &&
                newVal &&
                Array.isArray(newVal) &&
                newVal.length > 0
              ) {
                updates[field] = newVal;
                hasUpdates = true;
              }
            }

            if (
              !existingTool.compare_data ||
              Object.keys(existingTool.compare_data).length === 0
            ) {
              updates.compare_data = toolData.compare_data;
              hasUpdates = true;
            }

            if (hasUpdates) {
              updates.needs_review = needsReview || existingTool.needs_review || false;
              updates.updated_at = new Date().toISOString();

              const { error } = await supabaseAdmin
                .from("tools")
                .update(updates as any)
                .eq("id", existingTool.id);

              if (error) throw error;

              if (featuresList?.length) {
                await supabaseAdmin.from("tool_features").delete().eq("tool_id", existingTool.id);
                await supabaseAdmin.from("tool_features").insert(
                  featuresList.map((feature: string, idx: number) => ({
                    tool_id: existingTool.id,
                    feature,
                    sort_order: idx + 1,
                  })),
                );
              }

              if (tagsList?.length) {
                await supabaseAdmin.from("tool_tags").delete().eq("tool_id", existingTool.id);
                await supabaseAdmin
                  .from("tool_tags")
                  .insert(tagsList.map((tag: string) => ({ tool_id: existingTool.id, tag })));
              }

              results.push({
                name: item.name,
                url: item.website_url,
                status: "updated",
                slug: existingTool.slug,
                toolId: existingTool.id,
              });
            } else {
              results.push({
                name: item.name,
                url: item.website_url,
                status: "skipped",
                message: "Already exists, no missing fields to fill",
                slug: existingTool.slug,
              });
            }
          }
          continue;
        }

        let enriched;
        let needsReview = false;
        try {
          if (data.enrich) {
            enriched = await enrichWithAI({
              name: item.name,
              url: meta.url,
              rawTitle: meta.title,
              rawDescription: meta.description,
              bodyText: meta.bodyText,
              categories: cats ?? [],
            });
          } else {
            throw new Error("Enrichment skipped");
          }
        } catch {
          needsReview = true;
          enriched = {
            short_description: meta.description?.slice(0, 120) ?? "",
            full_description: meta.description ?? "",
            key_summary: "",
            category_id: null as string | null,
            secondary_categories: [] as string[],
            tags: [] as string[],
            pricing: null as string | null,
            pricing_details: null as string | null,
            features: [] as string[],
            pros: [] as string[],
            cons: [] as string[],
            platforms: [] as string[],
            use_cases: [] as string[],
            capabilities: [] as string[],
            industries: [] as string[],
            best_for: [] as string[],
            not_good_for: [] as string[],
            ai_model: null as string | null,
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
            },
          };
        }

        const { toolData, featuresList, tagsList } = buildToolPayload(item, meta, enriched, categoryNameToId);

        const { data: inserted, error } = await supabaseAdmin
          .from("tools")
          .insert({
            ...toolData,
            short_description: toolData.short_description || `${item.name} — AI tool`,
            needs_review: needsReview,
            submitted_by: null,
          } as any)
          .select("id,slug")
          .single();

        if (error) throw error;

        localTools.push({
          id: inserted.id,
          name: item.name,
          slug: inserted.slug,
          website_url: meta.url,
        } as any);

        if (featuresList?.length) {
          await supabaseAdmin.from("tool_features").insert(
            featuresList.map((feature: string, idx: number) => ({
              tool_id: inserted.id,
              feature,
              sort_order: idx + 1,
            })),
          );
        }

        if (tagsList?.length) {
          await supabaseAdmin
            .from("tool_tags")
            .insert(tagsList.map((tag: string) => ({ tool_id: inserted.id, tag })));
        }

        results.push({
          name: item.name,
          url: item.website_url,
          status: "imported",
          message: needsReview ? "Needs Review" : undefined,
          slug: inserted.slug,
          toolId: inserted.id,
        });
      } catch (e: any) {
        results.push({
          name: item.name,
          url: item.website_url,
          status: "error",
          message: e?.message ?? "import failed",
        });
      }
    }

    return { results };
  });

export const dataQualityScan = createServerFn({ method: "POST" }).handler(async () => {
  const { data: tools } = await supabaseAdmin
    .from("tools")
    .select("id,slug,name,website_url,logo_url,short_description,category_id,status");
  const issues: Array<{ toolId: string; slug: string; name: string; problems: string[] }> = [];
  const bySlug = new Map<string, number>();
  const byUrl = new Map<string, number>();
  for (const t of tools ?? []) {
    bySlug.set(t.slug, (bySlug.get(t.slug) ?? 0) + 1);
    byUrl.set(t.website_url, (byUrl.get(t.website_url) ?? 0) + 1);
  }
  for (const t of tools ?? []) {
    const problems: string[] = [];
    if (!t.logo_url) problems.push("Missing logo");
    if (!t.category_id) problems.push("Missing category");
    if (!t.short_description || t.short_description.length < 30)
      problems.push("Short description too brief");
    if ((bySlug.get(t.slug) ?? 0) > 1) problems.push("Duplicate slug");
    if ((byUrl.get(t.website_url) ?? 0) > 1) problems.push("Duplicate URL");
    if (problems.length) issues.push({ toolId: t.id, slug: t.slug, name: t.name, problems });
  }
  return { totalTools: tools?.length ?? 0, issueCount: issues.length, issues };
});

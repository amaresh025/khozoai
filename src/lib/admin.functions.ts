import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
}) {
  const key = process.env.LOVABLE_API_KEY;

  const fallback = {
    tagline: input.rawTitle ?? "",
    short_description: input.rawDescription?.slice(0, 120) ?? "",
    full_description: input.rawDescription ?? "",
    category: "Other",
    sub_category: [] as string[],
    pricing: "freemium",
    pricing_details: null as string | null,
    free_plan: false,
    platforms: [] as string[],
    features: [] as string[],
    use_cases: [] as string[],
    best_for: [] as string[],
    capabilities: [] as string[],
    integrations: [] as string[],
    api_available: false,
    browser_extension: false,
    mobile_app: false,
    languages: [] as string[],
    company_name: input.name,
    seo_title: input.rawTitle ?? input.name,
    seo_description: input.rawDescription ?? "",
    search_tags: [] as string[],
  };

  if (!key) return fallback;

  const prompt = `You are an editor for an AI tools directory. Summarize the website content into a clean, factual profile.

Tool name: ${input.name}
Website: ${input.url}
Page title: ${input.rawTitle ?? ""}
Meta description: ${input.rawDescription ?? ""}
Page content:
${input.bodyText ?? ""}

CAPABILITIES (pick all that apply):
AI Chatbot, AI Writing, AI Coding, AI Research, AI Search, AI Image Generation, AI Video Generation, AI Voice Generation, AI Music Generation, AI Automation, AI Productivity, AI Design, AI Data Analysis, AI Translation, AI Presentation Creation, AI Resume Building, AI 3D Modeling, AI Education, AI Email, AI SEO, AI Social Media, AI Security, AI Agent, AI Accessibility, AI Accounting, AI Legal, AI Healthcare, AI Customer Support, AI Sales, AI HR, AI Project Management

USE CASES (pick all that apply):
Blog Writing, SEO, Programming, Code Review, Studying, Marketing, Customer Support, Social Media, Sales, Research, Video Editing, Content Creation, Data Analysis, Design, Automation, Learning, Customer Service, Project Management, Resume Building, Email Management, Image Editing, Voice Over, Music Production, 3D Modeling, Translation, Transcription, Summarization, Copywriting, Ad Campaign, Market Research, Competitor Analysis, Lead Generation, Meeting Notes, Brainstorming, Document Processing, Data Entry, Scheduling, Personal Assistant, Web Scraping, API Integration

Return ONLY valid JSON. No markdown. No explanations. Use these rules:

- short_description: 60-120 words. One paragraph. Describe what the tool does factually. No marketing language, no hype words like "revolutionary", "cutting-edge". Write like a human editor would.
- full_description: 300-800 characters. Extended but still concise.
- tagline: A brief 1-sentence tagline describing the tool.
- features: 4-8 specific features mentioned on the site.
- pricing: Set to observed pricing model ("free", "freemium", "paid", "subscription", "contact") or null if unknown.
- pricing_details: Observed pricing info or null.
- free_plan: boolean, whether there is any free plan/tier available.
- platforms: Observed platforms from: Web, Windows, Mac, Android, iOS, API, Browser Extension, Desktop App.
- sub_category: 1-3 sub-categories of the tool.
- search_tags: 3-5 specific lowercase tags describing the tool.
- api_available, browser_extension, mobile_app: booleans based on availability on site.
- languages: Languages supported (e.g. ["English", "Spanish"] or empty).
- company_name: Name of the company.

{
  "tagline": "Brief 1-sentence tagline",
  "short_description": "factual 60-120 word description",
  "full_description": "extended description 300-800 chars",
  "category": "Primary Category (e.g. AI Coding, AI Writing, AI Design)",
  "sub_category": ["sub category 1", "sub category 2"],
  "pricing": "free|freemium|paid|subscription|contact",
  "pricing_details": "observed pricing or null",
  "free_plan": true|false,
  "platforms": ["Web", "Mac"],
  "features": ["Feature 1", "Feature 2"],
  "use_cases": ["all matching use cases"],
  "best_for": ["user scenario 1", "user scenario 2"],
  "capabilities": ["all matching capabilities"],
  "integrations": ["GitHub", "Slack"],
  "api_available": true|false,
  "browser_extension": true|false,
  "mobile_app": true|false,
  "languages": ["English"],
  "company_name": "company",
  "seo_title": "SEO title",
  "seo_description": "SEO description",
  "search_tags": ["tag1", "tag2"]
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
      tagline: String(parsed.tagline ?? "").slice(0, 200),
      short_description: String(parsed.short_description ?? "").slice(0, 500),
      full_description: String(parsed.full_description ?? "").slice(0, 3000),
      category: String(parsed.category ?? "Other").slice(0, 100),
      sub_category: Array.isArray(parsed.sub_category) ? parsed.sub_category.map(String) : [],
      pricing: String(parsed.pricing ?? "freemium").slice(0, 50),
      pricing_details: parsed.pricing_details ? String(parsed.pricing_details).slice(0, 500) : null,
      free_plan: !!parsed.free_plan,
      platforms: Array.isArray(parsed.platforms) ? parsed.platforms.map(String) : [],
      features: Array.isArray(parsed.features) ? parsed.features.map(String) : [],
      use_cases: Array.isArray(parsed.use_cases) ? parsed.use_cases.map(String) : [],
      best_for: Array.isArray(parsed.best_for) ? parsed.best_for.map(String) : [],
      capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities.map(String) : [],
      integrations: Array.isArray(parsed.integrations) ? parsed.integrations.map(String) : [],
      api_available: !!parsed.api_available,
      browser_extension: !!parsed.browser_extension,
      mobile_app: !!parsed.mobile_app,
      languages: Array.isArray(parsed.languages) ? parsed.languages.map(String) : [],
      company_name: parsed.company_name ? String(parsed.company_name).slice(0, 200) : input.name,
      seo_title: parsed.seo_title ? String(parsed.seo_title).slice(0, 200) : input.name,
      seo_description: parsed.seo_description ? String(parsed.seo_description).slice(0, 500) : "",
      search_tags: Array.isArray(parsed.search_tags) ? parsed.search_tags.map(String) : [],
    };
  } catch (e) {
    console.error("AI enrichment failed", e);
    return fallback;
  }
}

/* ============================================================
   Admin CRUD server functions
   ============================================================ */

export const adminListTools = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ status: z.string().optional(), search: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("tools")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.search) q = q.ilike("tool_name", `%${data.search}%`);
    const { data: tools, error } = await q;
    if (error) throw new Error(error.message);
    return tools ?? [];
  });

export const adminGetTool = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: tool, error } = await supabaseAdmin
      .from("tools")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return tool;
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

    let targetId: string;
    if (id) {
      const { error } = await supabaseAdmin.from("tools").update(payload as any).eq("id", id);
      if (error) throw new Error(error.message);
      targetId = id;
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("tools")
        .insert(payload as any)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      targetId = inserted.id;
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
        field: z.enum(["featured", "free_plan", "api_available", "browser_extension", "mobile_app", "is_published"]),
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

/* ============================================================
   Public server functions
   ============================================================ */

export const enrichUrl = createServerFn({ method: "POST" })
  .validator((d) => z.object({ url: z.string().url(), name: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const meta = await fetchSiteMetadata(data.url);
    const name = (data.name ?? meta.title ?? meta.hostname ?? "").trim();
    const enriched = await enrichWithAI({
      name,
      url: meta.url,
      rawTitle: meta.title,
      rawDescription: meta.description,
      bodyText: meta.bodyText,
    });
    return { meta, name, enriched };
  });

const importItemSchema = z.object({
  tool_name: z.string().min(1).max(200),
  website_url: z.string().url(),
  tagline: z.string().max(200).optional(),
  short_description: z.string().min(1).max(500),
  full_description: z.string().max(3000).optional(),
  category: z.string().min(1).max(100),
  sub_category: z.array(z.string()).optional(),
  pricing: z.string().max(50).optional(),
  pricing_details: z.string().max(500).optional(),
  free_plan: z.boolean().optional(),
  platforms: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  use_cases: z.array(z.string()).optional(),
  best_for: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  integrations: z.array(z.string()).optional(),
  api_available: z.boolean().optional(),
  browser_extension: z.boolean().optional(),
  mobile_app: z.boolean().optional(),
  languages: z.array(z.string()).optional(),
  company_name: z.string().max(200).optional(),
  logo_url: z.string().max(500).optional(),
  hero_image_url: z.string().max(500).optional(),
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(500).optional(),
  search_tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  slug: z.string().optional(),
  is_published: z.boolean().optional(),
});

function buildToolPayload(
  item: z.infer<typeof importItemSchema> & Record<string, any>,
  meta: Awaited<ReturnType<typeof fetchSiteMetadata>>,
  enriched: Awaited<ReturnType<typeof enrichWithAI>>,
) {
  const toolData: Record<string, any> = {
    tool_name: item.tool_name || item.name || enriched.company_name,
    website_url: meta.url,
    tagline: item.tagline || enriched.tagline || meta.title || null,
    short_description: item.short_description || enriched.short_description || `${item.tool_name} — AI tool`,
    full_description: item.full_description || enriched.full_description || null,
    category: item.category || enriched.category || "Other",
    sub_category: item.sub_category || enriched.sub_category || [],
    pricing: item.pricing || enriched.pricing || "freemium",
    pricing_details: item.pricing_details || enriched.pricing_details || null,
    free_plan: item.free_plan !== undefined ? item.free_plan : enriched.free_plan,
    platforms: item.platforms || enriched.platforms || [],
    features: item.features || enriched.features || [],
    use_cases: item.use_cases || enriched.use_cases || [],
    best_for: item.best_for || enriched.best_for || [],
    capabilities: item.capabilities || enriched.capabilities || [],
    integrations: item.integrations || enriched.integrations || [],
    api_available: item.api_available !== undefined ? item.api_available : enriched.api_available,
    browser_extension: item.browser_extension !== undefined ? item.browser_extension : enriched.browser_extension,
    mobile_app: item.mobile_app !== undefined ? item.mobile_app : enriched.mobile_app,
    languages: item.languages || enriched.languages || [],
    company_name: item.company_name || enriched.company_name || null,
    logo_url: item.logo_url || meta.favicon || null,
    hero_image_url: item.hero_image_url || item.cover_url || meta.ogImage || null,
    seo_title: item.seo_title || enriched.seo_title || meta.title || null,
    seo_description: item.seo_description || enriched.seo_description || meta.description || null,
    search_tags: item.search_tags || item.tags || enriched.search_tags || [],
    featured: item.featured !== undefined ? item.featured : false,
    slug: item.slug || undefined,
    is_published: item.is_published !== undefined ? item.is_published : true,
  };

  return toolData;
}

export const bulkImport = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        items: z.array(z.any()).min(1).max(50),
        enrich: z.boolean().default(true),
        force: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: allTools } = await supabaseAdmin
      .from("tools")
      .select("id, tool_name, website_url");

    const results: Array<{
      name: string;
      url: string;
      status: "imported" | "updated" | "skipped" | "error";
      message?: string;
      toolId?: string;
    }> = [];

    const localTools = allTools ? [...allTools] : [];

    for (const rawItem of data.items) {
      try {
        const item = rawItem as any;
        const meta = await fetchSiteMetadata(item.website_url);
        const host = new URL(meta.url).hostname.replace(/^www\./, "").toLowerCase();
        const normalizedInputName = (item.tool_name || item.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const existing = localTools.find((t: any) => {
          let tHost = "";
          try {
            tHost = new URL(t.website_url).hostname.replace(/^www\./, "").toLowerCase();
          } catch {
            tHost = t.website_url.toLowerCase();
          }
          const normalizedTName = t.tool_name.toLowerCase().replace(/[^a-z0-9]/g, "");

          if (normalizedTName === normalizedInputName) return true;
          if (tHost === host) return true;
          return false;
        });

        if (existing) {
          if (data.force) {
            let enriched;
            try {
              if (data.enrich) {
                enriched = await enrichWithAI({
                  name: item.tool_name || item.name || "Untitled",
                  url: meta.url,
                  rawTitle: meta.title,
                  rawDescription: meta.description,
                  bodyText: meta.bodyText,
                });
              } else {
                throw new Error("Enrichment skipped");
              }
            } catch {
              enriched = {
                tagline: meta.title || "",
                short_description: meta.description?.slice(0, 120) ?? "",
                full_description: meta.description ?? "",
                category: "Other",
                sub_category: [],
                pricing: "freemium",
                pricing_details: null,
                free_plan: false,
                platforms: [],
                features: [],
                use_cases: [],
                best_for: [],
                capabilities: [],
                integrations: [],
                api_available: false,
                browser_extension: false,
                mobile_app: false,
                languages: [],
                company_name: item.tool_name || item.name || "Untitled",
                seo_title: meta.title || "",
                seo_description: meta.description || "",
                search_tags: [],
              };
            }

            const toolData = buildToolPayload(item, meta, enriched);
            const { error } = await supabaseAdmin
              .from("tools")
              .update(toolData as any)
              .eq("id", (existing as any).id);

            if (error) throw error;

            results.push({
              name: toolData.tool_name,
              url: item.website_url,
              status: "updated",
              toolId: (existing as any).id,
            });
          } else {
            results.push({
              name: item.tool_name || item.name || "Untitled",
              url: item.website_url,
              status: "skipped",
              message: "Already exists",
            });
          }
          continue;
        }

        let enriched;
        try {
          if (data.enrich) {
            enriched = await enrichWithAI({
              name: item.tool_name || item.name || "Untitled",
              url: meta.url,
              rawTitle: meta.title,
              rawDescription: meta.description,
              bodyText: meta.bodyText,
            });
          } else {
            throw new Error("Enrichment skipped");
          }
        } catch {
          enriched = {
            tagline: meta.title || "",
            short_description: meta.description?.slice(0, 120) ?? "",
            full_description: meta.description ?? "",
            category: "Other",
            sub_category: [],
            pricing: "freemium",
            pricing_details: null,
            free_plan: false,
            platforms: [],
            features: [],
            use_cases: [],
            best_for: [],
            capabilities: [],
            integrations: [],
            api_available: false,
            browser_extension: false,
            mobile_app: false,
            languages: [],
            company_name: item.tool_name || item.name || "Untitled",
            seo_title: meta.title || "",
            seo_description: meta.description || "",
            search_tags: [],
          };
        }

        const toolData = buildToolPayload(item, meta, enriched);

        const { data: inserted, error } = await supabaseAdmin
          .from("tools")
          .insert(toolData as any)
          .select("id")
          .single();

        if (error) throw error;

        localTools.push({
          id: inserted.id,
          tool_name: toolData.tool_name,
          website_url: meta.url,
        } as any);

        results.push({
          name: toolData.tool_name,
          url: item.website_url,
          status: "imported",
          toolId: inserted.id,
        });
      } catch (e: any) {
        results.push({
          name: rawItem.tool_name || rawItem.name || "Untitled",
          url: rawItem.website_url || "",
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
    .select("id,tool_name,website_url,logo_url,short_description,category");
  const issues: Array<{ toolId: string; name: string; problems: string[] }> = [];
  const byUrl = new Map<string, number>();
  for (const t of tools ?? []) {
    byUrl.set(t.website_url, (byUrl.get(t.website_url) ?? 0) + 1);
  }
  for (const t of tools ?? []) {
    const problems: string[] = [];
    if (!t.logo_url) problems.push("Missing logo");
    if (!t.category) problems.push("Missing category");
    if (!t.short_description || t.short_description.length < 30)
      problems.push("Short description too brief");
    if ((byUrl.get(t.website_url) ?? 0) > 1) problems.push("Duplicate URL");
    if (problems.length) issues.push({ toolId: t.id, name: t.tool_name, problems });
  }
  return { totalTools: tools?.length ?? 0, issueCount: issues.length, issues };
});

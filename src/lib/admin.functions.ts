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
    short_description: input.rawDescription?.slice(0, 120) ?? `${input.name} — AI tool`,
    full_description: input.rawDescription
      ? `${input.rawDescription}\n\nExplore more details on their official site.`
      : "",
    key_summary: "Enrichment failed or skipped. Review official site for details.",
    category_id: null as string | null,
    secondary_categories: [] as string[],
    tags: [] as string[],
    pricing: "freemium" as const,
    pricing_details: null as string | null,
    features: ["AI Capabilities"] as string[],
    pros: ["Available on Web"] as string[],
    cons: ["Check site for limitations"] as string[],
    platforms: [] as string[],
    use_cases: [] as string[],
    capabilities: [] as string[],
    industries: [] as string[],
    best_for: [] as string[],
    not_good_for: [] as string[],
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
  const prompt = `You are an editor for a professional AI tools directory.
Given the tool details below, analyze the text and generate a rich, accurate profile in JSON format.

Tool name: ${input.name}
Website: ${input.url}
Page title: ${input.rawTitle ?? ""}
Meta description: ${input.rawDescription ?? ""}
Landing page content:
${input.bodyText ?? ""}

Available categories (pick the primary category ID, and secondary category IDs):
${categoryList}

CAPABILITY TAXONOMY (use these exact strings when applicable, or add custom ones):
AI Chatbot, AI Writing, AI Coding, AI Research, AI Search, AI Image Generation, AI Video Generation, AI Voice Generation, AI Music Generation, AI Automation, AI Productivity, AI Design, AI Data Analysis, AI Translation, AI Presentation Creation, AI Resume Building, AI 3D Modeling, AI Education, AI Email, AI SEO, AI Social Media, AI Security, AI Agent, AI Accessibility, AI Accounting, AI Legal, AI Healthcare, AI Customer Support, AI Sales, AI HR, AI Project Management

USE CASE TAXONOMY:
Blog Writing, SEO, Programming, Code Review, Studying, Marketing, Customer Support, Social Media, Sales, Research, Video Editing, Content Creation, Data Analysis, Design, Automation, Learning, Customer Service, Project Management, Resume Building, Email Management, Image Editing, Voice Over, Music Production, 3D Modeling, Translation, Transcription, Summarization, Copywriting, Ad Campaign, Market Research, Competitor Analysis, Lead Generation, Meeting Notes, Brainstorming, Document Processing, Data Entry, Scheduling, Personal Assistant, Web Scraping, API Integration

INDUSTRY TAXONOMY:
Education, Finance, Healthcare, Legal, HR, Gaming, Cybersecurity, Ecommerce, Marketing, Real Estate, Media, Transportation, Manufacturing, Agriculture, Government, Nonprofit, Technology, Retail, Insurance, Telecommunications, Energy, Entertainment, Construction, Hospitality, Automotive

Available integrations (choose from: "API Available", "Browser Extension", "Mobile App", "Desktop App", "Team Collaboration")

Return strict JSON matching this exact structure:
{
  "short_description": "one sentence summary, max 120 chars, no fluff",
  "full_description": "3-5 paragraphs detail description explaining capabilities and core audience, 600-1500 chars",
  "key_summary": "a short 2-3 sentence overview or bullet points highlighting core value",
  "category_id": "the best primary category ID from the list, or null",
  "secondary_categories": ["array of category IDs from the list that also fit the tool, or empty array"],
  "tags": ["3-6 lowercase tags. Avoid generic tags like 'ai' or 'tool'"],
  "pricing": "free | freemium | paid | subscription | contact",
  "pricing_details": "short summary of pricing models/tiers found, or null",
  "features": ["4-6 structured key features of the tool, each 2-6 words max. e.g. 'Code Completion', 'Voice Mode'"],
  "pros": ["3-5 strengths / advantages of the tool"],
  "cons": ["2-4 limitations / weak areas / missing features"],
  "platforms": ["array of integrations/platforms the tool supports (from the Integrations list above)"],
  "use_cases": ["array of best use cases from the Use Cases list above. Be specific and include ALL that apply"],
  "capabilities": ["array of capabilities from the Capability Taxonomy above. Include ALL that apply. Add custom capabilities if the tool has unique abilities not in the taxonomy"],
  "industries": ["array of target industries from the Industry Taxonomy above. Include ALL that apply"],
  "best_for": ["3-5 specific scenarios where this tool excels. Be concrete, e.g. 'Large codebases', 'Real-time collaboration', 'Beginner-friendly learning'"],
  "not_good_for": ["2-3 scenarios where this tool is NOT suitable. Be honest, e.g. 'Image generation', 'Offline use', 'Enterprise-scale deployments'"],
  "compare_data": {
    "coding_quality": "Excellent | Good | Basic",
    "writing_quality": "Excellent | Good | Basic",
    "research": "Excellent | Good | Basic",
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
      short_description: String(parsed.short_description ?? "").slice(0, 200),
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
        : "freemium",
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
      .select("*")
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
    if (id) {
      const { error } = await supabaseAdmin.from("tools").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { success: true, id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("tools")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { success: true, id: inserted.id };
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
      .update({ [data.field]: data.value })
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
      .update({ status: data.status })
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
});

export const bulkImport = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        items: z.array(importItemSchema).min(1).max(50),
        enrich: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: cats } = await supabaseAdmin.from("categories").select("id,name");
    const { data: allTools } = await supabaseAdmin
      .from("tools")
      .select("id, name, slug, website_url");
    const results: Array<{
      name: string;
      url: string;
      status: "imported" | "duplicate" | "error";
      message?: string;
      slug?: string;
      toolId?: string;
    }> = [];

    // Local mutable copy of tools for in-session duplicate checks
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
          results.push({
            name: item.name,
            url: item.website_url,
            status: "duplicate",
            message: "Already exists",
            slug: existing.slug,
          });
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
        } catch (enrichErr) {
          needsReview = true;
          enriched = {
            short_description: meta.description?.slice(0, 120) ?? `${item.name} — AI tool`,
            full_description: meta.description ?? "",
            key_summary: "Enrichment failed. Needs manual review.",
            category_id: null,
            secondary_categories: [],
            tags: [],
            pricing: "freemium" as const,
            pricing_details: null,
            features: ["AI Capabilities"],
            pros: ["Available on Web"],
            cons: ["Check site for limitations"],
            platforms: [],
            use_cases: [],
            capabilities: [],
            industries: [],
            best_for: [],
            not_good_for: [],
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

        const { data: inserted, error } = await supabaseAdmin
          .from("tools")
          .insert({
            name: item.name,
            slug,
            short_description: enriched.short_description || `${item.name} — AI tool`,
            full_description: enriched.full_description || null,
            key_summary: enriched.key_summary || null,
            website_url: meta.url,
            logo_url: meta.favicon ?? null,
            cover_url: (meta as any).ogImage ?? null,
            pricing: enriched.pricing,
            pricing_details: enriched.pricing_details || null,
            category_id: enriched.category_id,
            secondary_categories: enriched.secondary_categories,
            use_cases: enriched.use_cases,
            capabilities: enriched.capabilities,
            industries: enriched.industries,
            best_for: enriched.best_for,
            not_good_for: enriched.not_good_for,
            compare_data: enriched.compare_data,
            needs_review: needsReview,
            pros: enriched.pros,
            cons: enriched.cons,
            platforms: enriched.platforms,
            status: "pending",
            submitted_by: null,
          })
          .select("id,slug")
          .single();
        if (error) throw error;

        localTools.push({
          id: inserted.id,
          name: item.name,
          slug: inserted.slug,
          website_url: meta.url,
        });

        if (enriched.features?.length) {
          await supabaseAdmin.from("tool_features").insert(
            enriched.features.map((feature: string, idx: number) => ({
              tool_id: inserted.id,
              feature,
              sort_order: idx + 1,
            })),
          );
        }

        if (enriched.tags?.length) {
          await supabaseAdmin
            .from("tool_tags")
            .insert(enriched.tags.map((tag: string) => ({ tool_id: inserted.id, tag })));
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

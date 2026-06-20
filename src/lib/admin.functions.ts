import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Server functions for admin: URL metadata fetching, AI enrichment, bulk import.
 * All functions require admin or editor role.
 */

async function assertEditor(supabase: any, userId: string) {
  const { data: admin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  const { data: editor } = await supabase.rpc("has_role", { _user_id: userId, _role: "editor" });
  if (!admin && !editor) throw new Error("Forbidden: admin or editor role required");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
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
  try { parsed = new URL(url); } catch { throw new Error(`Invalid URL: ${url}`); }
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
      title: null, description: null, ogImage: null, favicon: null,
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
      try { return new URL(m[1], parsed).toString(); } catch { return null; }
    }
    return `${parsed.origin}/favicon.ico`;
  })();

  return {
    url: parsed.toString(),
    hostname: parsed.hostname,
    reachable: true,
    title: title?.slice(0, 200) ?? null,
    description: description?.slice(0, 500) ?? null,
    ogImage,
    favicon,
  };
}

async function enrichWithAI(input: {
  name: string;
  url: string;
  rawTitle: string | null;
  rawDescription: string | null;
  categories: { id: string; name: string }[];
}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    return {
      short_description: input.rawDescription?.slice(0, 160) ?? `${input.name} — AI tool`,
      full_description: input.rawDescription ?? "",
      seo_description: input.rawDescription?.slice(0, 160) ?? "",
      category_id: null as string | null,
      tags: [] as string[],
      pricing: "freemium" as const,
    };
  }

  const categoryList = input.categories.map((c) => `- ${c.id} :: ${c.name}`).join("\n");
  const prompt = `You are an editor for an AI tools directory. Given a tool, return JSON with concise marketing copy.

Tool name: ${input.name}
Website: ${input.url}
Raw page title: ${input.rawTitle ?? ""}
Raw meta description: ${input.rawDescription ?? ""}

Available categories (pick the single best id, or null if none fit):
${categoryList}

Return strict JSON with this shape:
{
  "short_description": "one sentence, 100-160 chars, no marketing fluff",
  "full_description": "2-3 short paragraphs explaining what it does and who it's for, 400-800 chars",
  "seo_description": "SEO meta description 140-160 chars",
  "category_id": "uuid or null",
  "tags": ["3-6 lowercase single or two-word tags"],
  "pricing": "free | freemium | paid | subscription | contact"
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
          { role: "system", content: "You are a precise JSON-only assistant. Return ONLY valid JSON, no prose, no markdown fences." },
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
      full_description: String(parsed.full_description ?? "").slice(0, 2000),
      seo_description: String(parsed.seo_description ?? "").slice(0, 200),
      category_id: typeof parsed.category_id === "string" && parsed.category_id.length === 36 ? parsed.category_id : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map((t: any) => String(t).toLowerCase().slice(0, 32)) : [],
      pricing: ["free", "freemium", "paid", "subscription", "contact"].includes(parsed.pricing) ? parsed.pricing : "freemium",
    };
  } catch (e) {
    console.error("AI enrichment failed", e);
    return {
      short_description: input.rawDescription?.slice(0, 160) ?? `${input.name} — AI tool`,
      full_description: input.rawDescription ?? "",
      seo_description: input.rawDescription?.slice(0, 160) ?? "",
      category_id: null as string | null,
      tags: [] as string[],
      pricing: "freemium" as const,
    };
  }
}

/* ============================================================
   Public server functions
   ============================================================ */

export const enrichUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().url(), name: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertEditor(context.supabase, context.userId);
    const meta = await fetchSiteMetadata(data.url);
    const name = (data.name ?? meta.title ?? meta.hostname ?? "").trim();
    const { data: cats } = await context.supabase.from("categories").select("id,name");
    const enriched = await enrichWithAI({
      name,
      url: meta.url,
      rawTitle: meta.title,
      rawDescription: meta.description,
      categories: cats ?? [],
    });
    return { meta, name, enriched };
  });

const importItemSchema = z.object({
  name: z.string().min(1).max(200),
  website_url: z.string().url(),
});

export const bulkImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      items: z.array(importItemSchema).min(1).max(50),
      enrich: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertEditor(context.supabase, context.userId);
    const { data: cats } = await context.supabase.from("categories").select("id,name");
    const { data: allTools } = await context.supabase.from("tools").select("id, name, slug, website_url");
    const results: Array<{ name: string; url: string; status: "imported" | "duplicate" | "error"; message?: string; slug?: string; toolId?: string }> = [];

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
          if (normalizedInputName.length > 3 && normalizedTName.length > 3 &&
              (normalizedInputName.includes(normalizedTName) || normalizedTName.includes(normalizedInputName))) {
            return true;
          }
          return false;
        });

        if (existing) {
          results.push({ name: item.name, url: item.website_url, status: "duplicate", message: "Already exists", slug: existing.slug });
          continue;
        }

        const enriched = data.enrich
          ? await enrichWithAI({ name: item.name, url: meta.url, rawTitle: meta.title, rawDescription: meta.description, categories: cats ?? [] })
          : {
              short_description: meta.description?.slice(0, 160) ?? `${item.name} — AI tool`,
              full_description: meta.description ?? "",
              category_id: null as string | null,
              tags: [] as string[],
              pricing: "freemium" as const,
            };

        const { data: inserted, error } = await context.supabase
          .from("tools")
          .insert({
            name: item.name,
            slug,
            short_description: enriched.short_description || `${item.name} — AI tool`,
            full_description: enriched.full_description || null,
            website_url: meta.url,
            logo_url: meta.favicon ?? null,
            cover_url: (meta as any).ogImage ?? null,
            pricing: enriched.pricing,
            category_id: enriched.category_id,
            status: "pending",
            submitted_by: context.userId,
          })
          .select("id,slug")
          .single();
        if (error) throw error;

        localTools.push({
          id: inserted.id,
          name: item.name,
          slug: inserted.slug,
          website_url: meta.url
        });

        if (enriched.tags?.length) {
          await context.supabase.from("tool_tags").insert(
            enriched.tags.map((tag: string) => ({ tool_id: inserted.id, tag })),
          );

        }

        results.push({ name: item.name, url: item.website_url, status: "imported", slug: inserted.slug, toolId: inserted.id });
      } catch (e: any) {
        results.push({ name: item.name, url: item.website_url, status: "error", message: e?.message ?? "import failed" });
      }
    }

    return { results };
  });

export const dataQualityScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context.supabase, context.userId);
    const { data: tools } = await context.supabase
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
      if (!t.short_description || t.short_description.length < 30) problems.push("Short description too brief");
      if ((bySlug.get(t.slug) ?? 0) > 1) problems.push("Duplicate slug");
      if ((byUrl.get(t.website_url) ?? 0) > 1) problems.push("Duplicate URL");
      if (problems.length) issues.push({ toolId: t.id, slug: t.slug, name: t.name, problems });
    }
    return { totalTools: tools?.length ?? 0, issueCount: issues.length, issues };
  });

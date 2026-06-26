import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;

        const staticEntries = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/tools", changefreq: "daily", priority: "0.9" },
          { path: "/categories", changefreq: "weekly", priority: "0.8" },
          { path: "/compare", changefreq: "weekly", priority: "0.7" },
          { path: "/about", changefreq: "monthly", priority: "0.4" },
          { path: "/contact", changefreq: "monthly", priority: "0.4" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
        ];

        let dynamicEntries: { path: string; changefreq: string; priority: string }[] = [];
        try {
          const [tools, cats, comps] = await Promise.all([
            supabaseAdmin.from("tools").select("slug").eq("status", "approved"),
            supabaseAdmin.from("categories").select("slug"),
            supabaseAdmin.from("tool_comparisons").select("slug"),
          ]);
          dynamicEntries = [
            ...(tools.data ?? []).map((r) => ({
              path: `/tools/${r.slug}`,
              changefreq: "weekly",
              priority: "0.7",
            })),
            ...(cats.data ?? []).map((r) => ({
              path: `/category/${r.slug}`,
              changefreq: "weekly",
              priority: "0.7",
            })),
            ...(comps.data ?? []).map((r) => ({
              path: `/compare/${r.slug}`,
              changefreq: "monthly",
              priority: "0.6",
            })),
          ];
        } catch (e) {
          console.error("sitemap dynamic entries failed", e);
        }

        const all = [...staticEntries, ...dynamicEntries];
        const urls = all.map((e) =>
          [
            `  <url>`,
            `    <loc>${origin}${e.path}</loc>`,
            `    <changefreq>${e.changefreq}</changefreq>`,
            `    <priority>${e.priority}</priority>`,
            `  </url>`,
          ].join("\n"),
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});

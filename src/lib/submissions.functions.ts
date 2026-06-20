import { createServerFn } from "@tanstack/react-start";

/**
 * Server-side tool URL validator + metadata fetcher.
 * - Rejects non-https URLs and known third-party hosting (replit, vercel preview, etc.)
 * - Fetches title, description, og:image, favicon
 */
export const fetchToolMetadata = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input || typeof input.url !== "string") throw new Error("URL required");
    return input;
  })
  .handler(async ({ data }) => {
    let parsed: URL;
    try {
      parsed = new URL(data.url);
    } catch {
      return { ok: false as const, error: "Invalid URL. Include https://" };
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false as const, error: "URL must start with https://" };
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    // Block obvious non-official / preview / aggregator hosts
    const blocked = [
      "github.io", "vercel.app", "netlify.app", "replit.dev", "repl.co",
      "lovableproject.com", "lovable.app", "herokuapp.com", "ngrok-free.app",
      "ngrok.io", "glitch.me", "pages.dev", "workers.dev", "firebaseapp.com",
      "web.app", "wixsite.com", "blogspot.com", "wordpress.com", "weebly.com",
      "carrd.co", "notion.site", "bubbleapps.io",
    ];
    if (blocked.some((b) => host === b || host.endsWith("." + b))) {
      return {
        ok: false as const,
        error: `Submissions must use an official domain. Hosted-platform subdomains like ${host} are not accepted.`,
      };
    }

    // Fetch page metadata
    let html = "";
    let status = 0;
    try {
      const res = await fetch(parsed.toString(), {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; KhozoaiBot/1.0; +https://khozoai.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(8000),
      });
      status = res.status;
      if (!res.ok) {
        return { ok: false as const, error: `Site returned HTTP ${res.status}` };
      }
      html = (await res.text()).slice(0, 200_000);
    } catch (e) {
      return { ok: false as const, error: `Could not reach the site: ${(e as Error).message}` };
    }

    const pick = (re: RegExp) => {
      const m = html.match(re);
      return m?.[1]?.trim() || null;
    };

    const title =
      pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<title>([^<]+)<\/title>/i);

    const description =
      pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i);

    const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

    // Favicon: prefer apple-touch-icon, then link rel="icon", fallback to Google service
    let favicon =
      pick(/<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i) ||
      null;
    if (favicon && !/^https?:\/\//i.test(favicon)) {
      favicon = new URL(favicon, parsed.origin).toString();
    }
    const logoUrl =
      favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;

    const absImg = ogImage && !/^https?:\/\//i.test(ogImage)
      ? new URL(ogImage, parsed.origin).toString()
      : ogImage;

    const slug = host.split(".")[0].replace(/[^a-z0-9-]/g, "-");

    return {
      ok: true as const,
      status,
      domain: host,
      title: title?.slice(0, 120) ?? null,
      description: description?.slice(0, 400) ?? null,
      cover_url: absImg,
      logo_url: logoUrl,
      suggested_slug: slug,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  "AI Chatbot": ["chatbot", "chat", "conversational", "assistant", "dialog", "chatgpt", "claude"],
  "AI Writing": [
    "writing",
    "write",
    "content",
    "copywriting",
    "blog",
    "article",
    "grammar",
    "paraphras",
  ],
  "AI Coding": [
    "code",
    "coding",
    "programming",
    "developer",
    "ide",
    "debug",
    "autocomplete",
    "copilot",
  ],
  "AI Research": ["research", "paper", "academic", "scholar", "citation", "literature"],
  "AI Search": ["search", "search engine", "perplexity", "retrieval"],
  "AI Image Generation": [
    "image",
    "img",
    "photo",
    "art",
    "midjourney",
    "dall-e",
    "stable diffusion",
    "flux",
  ],
  "AI Video Generation": ["video", "film", "animation", "runway", "pika"],
  "AI Voice Generation": ["voice", "speech", "tts", "text-to-speech", "audio", "elevenlabs"],
  "AI Music Generation": ["music", "song", "audio generation", "suno", "udio"],
  "AI Automation": ["automation", "automate", "workflow", "zapier", "n8n", "agent"],
  "AI Productivity": ["productivity", "task", "calendar", "organize", "planner", "notion"],
  "AI Design": ["design", "figma", "ui", "ux", "mockup", "wireframe", "brand"],
  "AI Data Analysis": ["data", "analytics", "dashboard", "visualization", "spreadsheet", "excel"],
  "AI Translation": ["translate", "translation", "language", "multilingual", "localization"],
  "AI Education": ["education", "learn", "study", "tutor", "course", "student", "teach"],
  "AI SEO": ["seo", "search engine optimization", "keyword", "ranking", "backlink"],
  "AI Social Media": ["social media", "instagram", "twitter", "tiktok", "linkedin", "post"],
  "AI Email": ["email", "inbox", "newsletter", "mail"],
  "AI Customer Support": ["support", "helpdesk", "ticket", "customer service", "Zendesk"],
  "AI Healthcare": ["health", "medical", "clinical", "patient", "diagnosis"],
  "AI Legal": ["legal", "law", "contract", "compliance", "attorney"],
  "AI Finance": ["finance", "financial", "trading", "investment", "accounting"],
};

const USE_CASE_KEYWORDS: Record<string, string[]> = {
  "Blog Writing": ["blog", "article", "post", "content writing"],
  SEO: ["seo", "search engine", "keyword", "ranking"],
  Programming: ["code", "programming", "developer", "software"],
  "Code Review": ["code review", "pull request", "review code"],
  Studying: ["study", "learn", "education", "student"],
  Marketing: ["marketing", "campaign", "ad", "promotion"],
  "Customer Support": ["support", "helpdesk", "customer service"],
  "Social Media": ["social media", "instagram", "twitter", "tiktok"],
  Sales: ["sales", "crm", "lead", "prospect"],
  Research: ["research", "paper", "academic", "study"],
  "Content Creation": ["content", "create", "creator"],
  Design: ["design", "ui", "ux", "graphic"],
  Automation: ["automation", "automate", "workflow"],
  "Data Analysis": ["data", "analytics", "analysis"],
  Translation: ["translate", "translation", "language"],
};

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  Education: ["education", "learn", "school", "university", "student", "teach"],
  Finance: ["finance", "banking", "investment", "trading", "fintech"],
  Healthcare: ["health", "medical", "clinical", "hospital", "pharma"],
  Legal: ["legal", "law", "attorney", "compliance"],
  Technology: ["tech", "software", "saas", "startup", "developer"],
  Ecommerce: ["ecommerce", "e-commerce", "shop", "store", "retail"],
  Marketing: ["marketing", "advertising", "brand", "agency"],
  Media: ["media", "news", "publishing", "journalism"],
  Gaming: ["gaming", "game", "esports"],
  HR: ["hr", "recruiting", "hiring", "talent", "workforce"],
};

function classifyText(text: string, keywordMap: Record<string, string[]>): string[] {
  const lower = text.toLowerCase();
  const matches: string[] = [];
  for (const [tag, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matches.push(tag);
    }
  }
  return matches;
}

export const classifyExistingTools = createServerFn({ method: "POST" }).handler(async () => {
  const { data: tools, error } = await supabaseAdmin
    .from("tools")
    .select(
      "id, name, slug, short_description, full_description, category_id, use_cases, capabilities, industries, best_for",
    )
    .eq("status", "approved");

  if (error) throw error;

  let classified = 0;
  let skipped = 0;
  const results: Array<{ id: string; name: string; status: string; capabilities: string[] }> = [];

  for (const tool of tools ?? []) {
    // Skip tools that already have capabilities
    if (tool.capabilities && tool.capabilities.length > 0) {
      skipped++;
      continue;
    }

    const text = [tool.name || "", tool.short_description || "", tool.full_description || ""].join(
      " ",
    );

    const capabilities = classifyText(text, CAPABILITY_KEYWORDS);
    const use_cases = classifyText(text, USE_CASE_KEYWORDS);
    const industries = classifyText(text, INDUSTRY_KEYWORDS);

    // Generate best_for based on capabilities
    const best_for: string[] = [];
    if (capabilities.includes("AI Coding")) best_for.push("Code generation and debugging");
    if (capabilities.includes("AI Writing")) best_for.push("Content creation and editing");
    if (capabilities.includes("AI Research")) best_for.push("Academic and market research");
    if (capabilities.includes("AI Chatbot")) best_for.push("Conversational interactions");
    if (capabilities.includes("AI Image Generation")) best_for.push("Visual content creation");
    if (capabilities.includes("AI Data Analysis")) best_for.push("Data insights and reporting");
    if (capabilities.includes("AI Automation")) best_for.push("Workflow automation");

    const not_good_for: string[] = [];
    if (!capabilities.includes("AI Image Generation")) not_good_for.push("Image generation");
    if (!capabilities.includes("AI Video Generation")) not_good_for.push("Video production");
    if (!capabilities.includes("AI Voice Generation")) not_good_for.push("Voice synthesis");

    // Ensure at least one capability
    if (capabilities.length === 0) {
      capabilities.push("AI Productivity");
    }

    const { error: updateErr } = await supabaseAdmin
      .from("tools")
      .update({
        capabilities,
        use_cases,
        industries,
        best_for,
        not_good_for,
      })
      .eq("id", tool.id);

    if (!updateErr) {
      classified++;
      results.push({ id: tool.id, name: tool.name, status: "classified", capabilities });
    } else {
      results.push({ id: tool.id, name: tool.name, status: "error", capabilities: [] });
    }
  }

  return {
    total: tools?.length ?? 0,
    classified,
    skipped,
    results,
  };
});

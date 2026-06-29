import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Client } = pg;

async function run() {
  const client = new Client({
    host: "aws-1-ap-northeast-1.pooler.supabase.com",
    port: 6543,
    user: "postgres.lrkfksnlldcymtkziuqp",
    password: process.env.DB_PASS,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    // Drop referencing constraints first
    console.log("Dropping old foreign key constraints...");
    await client.query("ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_tool_id_fkey;");
    await client.query("ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_tool_id_fkey;");
    await client.query("ALTER TABLE public.tool_comparisons DROP CONSTRAINT IF EXISTS tool_comparisons_tool_a_id_fkey;");
    await client.query("ALTER TABLE public.tool_comparisons DROP CONSTRAINT IF EXISTS tool_comparisons_tool_b_id_fkey;");

    // Drop old tools table
    console.log("Dropping old tools table...");
    await client.query("DROP TABLE IF EXISTS public.tools CASCADE;");

    // Recreate tools table with new schema
    console.log("Creating new tools table...");
    await client.query(`
      CREATE TABLE public.tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tool_name TEXT NOT NULL,
        website_url TEXT NOT NULL UNIQUE,
        tagline TEXT,
        short_description TEXT NOT NULL,
        full_description TEXT,
        category TEXT NOT NULL,
        sub_category TEXT[] DEFAULT '{}',
        pricing TEXT,
        pricing_details TEXT,
        free_plan BOOLEAN DEFAULT FALSE,
        platforms TEXT[] DEFAULT '{}',
        features TEXT[] DEFAULT '{}',
        use_cases TEXT[] DEFAULT '{}',
        best_for TEXT[] DEFAULT '{}',
        capabilities TEXT[] DEFAULT '{}',
        integrations TEXT[] DEFAULT '{}',
        api_available BOOLEAN DEFAULT FALSE,
        browser_extension BOOLEAN DEFAULT FALSE,
        mobile_app BOOLEAN DEFAULT FALSE,
        languages TEXT[] DEFAULT '{}',
        company_name TEXT,
        logo_url TEXT,
        hero_image_url TEXT,
        seo_title TEXT,
        seo_description TEXT,
        search_tags TEXT[] DEFAULT '{}',
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    // Enable RLS
    console.log("Enabling RLS...");
    await client.query("ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;");

    // RLS Policies
    console.log("Creating RLS policies...");
    await client.query(`
      CREATE POLICY "Public read tools" ON public.tools
        FOR SELECT USING (true);
    `);
    await client.query(`
      CREATE POLICY "Admin manage tools" ON public.tools
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
    `);

    // Grants
    console.log("Granting table permissions...");
    await client.query("GRANT SELECT ON public.tools TO anon, authenticated;");
    await client.query("GRANT INSERT, UPDATE, DELETE ON public.tools TO authenticated;");
    await client.query("GRANT ALL ON public.tools TO service_role;");

    // Insert Cursor tool FIRST
    console.log("Inserting Cursor tool...");
    const insertSql = `
      INSERT INTO public.tools (
        id, tool_name, website_url, tagline, short_description, full_description,
        category, sub_category, pricing, pricing_details, free_plan, platforms,
        features, use_cases, best_for, capabilities, integrations, api_available,
        browser_extension, mobile_app, languages, company_name, logo_url,
        hero_image_url, seo_title, seo_description, search_tags, featured
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
      );
    `;
    await client.query(insertSql, [
      '339e76cf-1673-4092-9052-b5fdf28d2de8',
      'Cursor',
      'https://cursor.com/',
      'Cursor is your coding agent for building ambitious software.',
      'Cursor is an AI coding agent designed to accelerate software development by providing intelligent assistance, enabling autonomous agents, and deeply understanding codebases. It offers a powerful environment for building ambitious software.',
      'Cursor is an advanced AI coding agent that transforms software creation. It features AI-powered autocomplete, autonomous agents that can build, test, and demo features end-to-end, and a comprehensive understanding of entire codebases through secure indexing and semantic search. Developers can choose from cutting-edge models like OpenAI, Anthropic, Gemini, xAI, and Cursor\'s own. The tool integrates seamlessly into workflows via desktop, CLI, Slack, GitHub, and other development environments, empowering teams to accelerate development securely and at scale.',
      'AI Code Assistant',
      [],
      'free',
      null,
      true,
      ['Linux'],
      ['AI-powered Autocomplete (Tab model)', 'Autonomous Agentic Development', 'Multi-agent Collaboration', 'Complete Codebase Understanding with semantic search', 'Integration with leading LLMs (OpenAI, Anthropic, Gemini, xAI, Cursor\'s own)', 'Integrated Desktop and CLI interfaces', 'Seamless integration with Slack, GitHub, and Terminal', 'Intelligent Code Navigation', 'Mission Control Interface for window management'],
      ['Accelerating software development workflows', 'Automating code generation and task execution', 'Analyzing codebase usage patterns', 'Building interactive dashboards and features', 'Streamlining pull request reviews', 'Identifying and fixing bugs', 'Managing cloud environments and deployments'],
      ['Software development teams', 'Individual engineers and programmers', 'Enterprises requiring secure, scalable development', 'Researchers and technologists focused on advanced software creation', 'Teams adopting agentic development methodologies'],
      ['AI Coding'],
      ['Slack', 'GitHub', 'OpenAI', 'Anthropic', 'Gemini', 'xAI', 'Snowflake', 'Vercel'],
      true,
      false,
      false,
      [],
      'Cursor',
      'https://cursor.com/marketing-static/_next/image?url=%2Fmarketing-static%2Ficon-192x192.png&w=64&q=70',
      'https://cursor.com/marketing-static/_next/image?url=https%3A%2F%2Fptht05hbb1ssoooe.public.blob.vercel-storage.com%2Fassets%2Fmisc%2Fasset-cc24ca462279ca23250c.jpg&w=3840&q=70',
      'Cursor: Your Coding Agent for Ambitious Software Development',
      'Cursor is an AI coding agent that empowers developers to build ambitious software by automating tasks, providing intelligent assistance, understanding entire codebases, and integrating with leading AI models and development tools.',
      ['AI Code Assistant', 'Coding Agent', 'Software Development', 'Code Generation', 'Code Autocomplete', 'Developer Tools', 'LLM Integration', 'Agentic AI', 'Codebase Understanding', 'Enterprise Software'],
      true
    ]);

    // Clean up orphaned records in other tables
    console.log("Cleaning up orphaned records in other tables...");
    await client.query("UPDATE public.analytics_events SET tool_id = NULL WHERE tool_id NOT IN (SELECT id FROM public.tools);");
    await client.query("DELETE FROM public.reviews WHERE tool_id NOT IN (SELECT id FROM public.tools);");
    await client.query("DELETE FROM public.tool_comparisons WHERE tool_a_id NOT IN (SELECT id FROM public.tools) OR tool_b_id NOT IN (SELECT id FROM public.tools);");

    // Re-create foreign key constraints LATER
    console.log("Restoring foreign key constraints...");
    await client.query(`
      ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_tool_id_fkey 
        FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE SET NULL;
    `);
    await client.query(`
      ALTER TABLE public.reviews ADD CONSTRAINT reviews_tool_id_fkey 
        FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;
    `);
    await client.query(`
      ALTER TABLE public.tool_comparisons ADD CONSTRAINT tool_comparisons_tool_a_id_fkey 
        FOREIGN KEY (tool_a_id) REFERENCES public.tools(id) ON DELETE CASCADE;
    `);
    await client.query(`
      ALTER TABLE public.tool_comparisons ADD CONSTRAINT tool_comparisons_tool_b_id_fkey 
        FOREIGN KEY (tool_b_id) REFERENCES public.tools(id) ON DELETE CASCADE;
    `);

    // Re-create indexes
    console.log("Creating indexes...");
    await client.query("CREATE INDEX IF NOT EXISTS tools_tool_name_idx ON public.tools(tool_name);");
    await client.query("CREATE INDEX IF NOT EXISTS tools_category_idx ON public.tools(category);");
    await client.query("CREATE INDEX IF NOT EXISTS tools_featured_idx ON public.tools(featured) WHERE featured = true;");
    await client.query("CREATE INDEX IF NOT EXISTS tools_capabilities_idx ON public.tools USING GIN (capabilities);");
    await client.query("CREATE INDEX IF NOT EXISTS tools_sub_category_idx ON public.tools USING GIN (sub_category);");
    await client.query("CREATE INDEX IF NOT EXISTS tools_search_tags_idx ON public.tools USING GIN (search_tags);");

    console.log("Database updated successfully.");
    await client.end();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();

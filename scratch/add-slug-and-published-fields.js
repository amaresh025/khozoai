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

    console.log("Adding slug and is_published columns...");
    await client.query("ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS slug TEXT;");
    await client.query("ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;");

    console.log("Creating or replacing slug generator function and trigger...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.generate_tool_slug()
      RETURNS TRIGGER AS $$
      DECLARE
        base_slug TEXT;
        temp_slug TEXT;
        counter INTEGER := 1;
      BEGIN
        -- Compute slug if it's not set or name has changed
        IF TG_OP = 'INSERT' OR OLD.slug IS NULL OR NEW.tool_name <> OLD.tool_name OR NEW.slug IS NULL OR NEW.slug = '' THEN
          base_slug := lower(regexp_replace(NEW.tool_name, '[^a-zA-Z0-9\s-]', '', 'g'));
          base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
          base_slug := regexp_replace(base_slug, '-+', '-', 'g');
          base_slug := trim(both '-' from base_slug);
          IF base_slug = '' THEN
            base_slug := 'tool';
          END IF;
        ELSE
          base_slug := NEW.slug;
        END IF;

        temp_slug := base_slug;

        -- Loop to find unique slug
        LOOP
          IF NOT EXISTS (
            SELECT 1 FROM public.tools 
            WHERE slug = temp_slug AND id <> NEW.id
          ) THEN
            NEW.slug := temp_slug;
            EXIT;
          END IF;
          counter := counter + 1;
          temp_slug := base_slug || '-' || counter;
        END LOOP;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_generate_tool_slug ON public.tools;
      CREATE TRIGGER trg_generate_tool_slug
        BEFORE INSERT OR UPDATE ON public.tools
        FOR EACH ROW
        EXECUTE FUNCTION public.generate_tool_slug();
    `);

    console.log("Populating existing slugs...");
    await client.query("UPDATE public.tools SET tool_name = tool_name WHERE slug IS NULL;");

    console.log("Adding NOT NULL and UNIQUE constraints to slug...");
    await client.query("ALTER TABLE public.tools ALTER COLUMN slug SET NOT NULL;");
    await client.query("ALTER TABLE public.tools DROP CONSTRAINT IF EXISTS tools_slug_unique;");
    await client.query("ALTER TABLE public.tools ADD CONSTRAINT tools_slug_unique UNIQUE (slug);");

    console.log("Database schema updated successfully.");
    await client.end();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();

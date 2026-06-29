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

    console.log("Creating public.dynamic_categories function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.dynamic_categories()
      RETURNS TABLE(capability TEXT, tool_count BIGINT)
      LANGUAGE SQL STABLE
      AS $$
        SELECT unnest(capabilities) AS capability, COUNT(*) AS tool_count
        FROM public.tools
        WHERE capabilities IS NOT NULL AND array_length(capabilities, 1) > 0
        GROUP BY capability
        ORDER BY tool_count DESC;
      $$;
    `);

    console.log("Creating public.dynamic_use_cases function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.dynamic_use_cases()
      RETURNS TABLE(use_case TEXT, tool_count BIGINT)
      LANGUAGE SQL STABLE
      AS $$
        SELECT unnest(use_cases) AS use_case, COUNT(*) AS tool_count
        FROM public.tools
        WHERE use_cases IS NOT NULL AND array_length(use_cases, 1) > 0
        GROUP BY use_case
        ORDER BY tool_count DESC;
      $$;
    `);

    console.log("Granting execute permissions...");
    await client.query("GRANT EXECUTE ON FUNCTION public.dynamic_categories() TO anon, authenticated;");
    await client.query("GRANT EXECUTE ON FUNCTION public.dynamic_use_cases() TO anon, authenticated;");

    console.log("Database functions created successfully.");
    await client.end();
  } catch (err) {
    console.error("Failed to create database functions:", err);
    process.exit(1);
  }
}

run();

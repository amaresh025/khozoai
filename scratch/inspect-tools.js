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
    const res = await client.query("SELECT id, tool_name, slug, is_published FROM public.tools;");
    console.log("Tools in database:", res.rows);
    await client.end();
  } catch (err) {
    console.error(err);
  }
}

run();

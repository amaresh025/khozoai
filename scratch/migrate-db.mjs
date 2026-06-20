import pg from 'pg';
import fs from 'fs';

// Connection details derived from .env
const connectionString = "postgresql://postgres:Khozoai7525@@db.lrkfksnlldcymtkziuqp.supabase.co:5432/postgres";

async function main() {
  const client = new pg.Client({ connectionString });
  console.log("Connecting to Supabase database...");
  await client.connect();
  console.log("Connected successfully! Running SQL migration...");
  
  const sql = fs.readFileSync('supabase/migrations/20260620175020_tool_enrichment.sql', 'utf8');
  await client.query(sql);
  
  console.log("Migration executed successfully!");
  await client.end();
}

main().catch((err) => {
  console.error("Migration execution failed:", err);
  process.exit(1);
});

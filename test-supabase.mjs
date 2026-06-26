import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.SUPABASE_URL || "https://lrkfksnlldcymtkziuqp.supabase.co";
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2Zrc25sbGRjeW10a3ppdXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTQxMzUsImV4cCI6MjA5NzQ5MDEzNX0.U07eFqulflRe3tjcJaG2OCZtslyfJK_AMB0nqgz55o4";

const supabase = createClient(url, key);

async function test() {
  console.log("Testing Supabase connection...");

  // ---- Schema discovery (best-effort) ----
  // Supabase-js doesn't provide a universal "list tables" query.
  // We'll try a couple approaches; if they fail, we'll fall back to checking expected tables directly.
  try {
    const { data: pgTables, error: pgTablesError } = await supabase
      .from("pg_tables")
      .select("*")
      .limit(10);

    if (pgTablesError) {
      console.warn("Schema discovery via pg_tables failed:", pgTablesError.message);
    } else {
      console.log("Schema discovery via pg_tables (sample):", pgTables);
    }
  } catch (e) {
    console.warn("Schema discovery via pg_tables exception:", e?.message || e);
  }

  const targetTables = ["categories", "tools", "tool_comparisons"];

  // Supabase-js doesn't provide a built-in "list tables" query; so we attempt
  // by calling each table with `select` and report the exact missing-table error.
  console.log("Running table checks for expected tables:", targetTables);

  // Test categories
  const { data: categories, error: catError } = await supabase.from("categories").select("*");
  if (catError) console.error("Categories error:", catError.message);
  else console.log("Categories:", categories?.length || 0, "found");

  // Test tools
  const { data: tools, error: toolsError } = await supabase
    .from("tools")
    .select("*")
    .eq("status", "approved");
  if (toolsError) console.error("Tools error:", toolsError.message);
  else console.log("Approved tools:", tools?.length || 0, "found");

  // Test comparisons
  const { data: comparisons, error: compError } = await supabase
    .from("tool_comparisons")
    .select("*");
  if (compError) console.error("Comparisons error:", compError.message);
  else console.log("Comparisons:", comparisons?.length || 0, "found");
}

test().catch(console.error);

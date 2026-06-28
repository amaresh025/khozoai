import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function main() {
  const connectionString = `postgresql://postgres:${process.env.DB_PASS}@db.${process.env.SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`;
  console.log("Connecting to:", `postgresql://postgres:***@db.${process.env.SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`);
  
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'tools'
    `);
    
    console.log("Current columns of 'tools' table:");
    res.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
  } catch (err) {
    console.error("Connection or query error:", err);
  } finally {
    await client.end();
  }
}

main();

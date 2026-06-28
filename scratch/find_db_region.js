import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const project = process.env.SUPABASE_PROJECT_ID || "lrkfksnlldcymtkziuqp";
const password = process.env.DB_PASS || "Khozoai7525@";

const regions = [
  'ap-southeast-1', // Singapore
  'us-east-1',      // N. Virginia
  'ap-south-1',     // Mumbai
  'us-west-2',      // Oregon
  'eu-west-1',      // Ireland
  'sa-east-1',      // São Paulo
  'eu-central-1',   // Frankfurt
  'ap-northeast-1', // Tokyo
  'us-east-2',      // Ohio
  'us-west-1',      // N. California
];

async function tryRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`Trying region ${region} (${host})...`);
  const client = new Client({
    host,
    port: 6543,
    user: `postgres.${project}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`SUCCESS: Connected to ${region}!`);
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed for ${region}:`, err.message);
    return false;
  }
}

async function main() {
  for (const region of regions) {
    const ok = await tryRegion(region);
    if (ok) {
      console.log(`\nFound correct region: ${region}`);
      break;
    }
  }
}

main();

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const project = process.env.SUPABASE_PROJECT_ID || "lrkfksnlldcymtkziuqp";
const password = process.env.DB_PASS || "Khozoai7525@";

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3', 'ap-south-1',
  'ca-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'sa-east-1', 'me-central-1'
];

async function tryRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new Client({
    host,
    port: 6543,
    user: `postgres.${project}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000,
  });

  try {
    await client.connect();
    console.log(`\nSUCCESS: Connected to region ${region}!`);
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('tenant/user')) {
      // tenant not in this region
    } else {
      console.log(`Failed for ${region} with:`, err.message);
    }
    return false;
  }
}

async function main() {
  console.log(`Scanning all regions for project: ${project}`);
  for (const region of regions) {
    const ok = await tryRegion(region);
    if (ok) {
      console.log(`Found region: ${region}`);
      break;
    }
  }
}

main();

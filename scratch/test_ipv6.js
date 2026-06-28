import pg from 'pg';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function lookupHost() {
  return new Promise((resolve, reject) => {
    dns.lookup('db.lrkfksnlldcymtkziuqp.supabase.co', { family: 6 }, (err, address, family) => {
      if (err) reject(err);
      else resolve(address);
    });
  });
}

async function main() {
  try {
    console.log("Resolving host via dns.lookup family: 6...");
    const ip = await lookupHost();
    console.log("Resolved IP:", ip);

    const client = new Client({
      host: 'db.lrkfksnlldcymtkziuqp.supabase.co',
      port: 5432,
      user: 'postgres',
      password: process.env.DB_PASS,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    console.log("Connecting directly using pg...");
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT version();');
    console.log('DB Version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

main();

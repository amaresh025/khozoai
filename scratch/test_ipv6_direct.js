import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function main() {
  try {
    const ip = '2406:da14:25a:5801:9653:f95a:8f58:10ac';
    console.log("Connecting directly to IPv6 address:", ip);

    const client = new Client({
      host: ip,
      port: 5432,
      user: 'postgres',
      password: process.env.DB_PASS,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log("Connected successfully to IPv6 address!");
    const res = await client.query('SELECT version();');
    console.log('DB Version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error("Direct IPv6 connection error:", err);
  }
}

main();

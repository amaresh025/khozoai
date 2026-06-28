import dns from 'dns/promises';

async function main() {
  try {
    const host = 'db.lrkfksnlldcymtkziuqp.supabase.co';
    const ip = '2406:da14:25a:5801:9653:f95a:8f58:10ac';
    const hostnames = await dns.reverse(ip);
    console.log('Hostnames for', ip, ':', hostnames);
  } catch (err) {
    console.error('Reverse lookup error:', err);
  }
}

main();

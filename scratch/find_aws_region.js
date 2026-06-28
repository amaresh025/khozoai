async function main() {
  try {
    const response = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
    const data = await response.json();
    const targetIp = '2406:da14:25a:5801:9653:f95a:8f58:10ac';
    
    // AWS prefixes are in the format "2406:da14:2000::/40" or similar.
    const matches = data.ipv6_prefixes.filter(p => p.ipv6_prefix.startsWith('2406:da14'));
    
    console.log("Matching prefixes for 2406:da14:");
    matches.forEach(m => {
      console.log(`- Prefix: ${m.ipv6_prefix}, Region: ${m.region}, Service: ${m.service}`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

main();

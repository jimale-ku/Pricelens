/**
 * List store names returned by Serper Shopping API (for finding logos).
 * Run from server folder: npx ts-node scripts/list-serper-stores.ts [query]
 * Example: npx ts-node scripts/list-serper-stores.ts "Lenovo laptop"
 *
 * Uses SERPER_API_KEY from .env. Prints unique "source" / merchant names.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function listSerperStores(query: string) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error('❌ SERPER_API_KEY not found in server/.env');
    process.exit(1);
  }

  console.log(`\n🔍 Serper Shopping – stores for: "${query}"\n`);

  try {
    const res = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'us', num: 100 }),
    });

    if (!res.ok) {
      console.error(`❌ Serper request failed (${res.status}):`, await res.text());
      process.exit(1);
    }

    const data = (await res.json()) as { shopping?: Array<{ source?: string; merchant?: string }> };
    const shopping = data.shopping || [];
    const seen = new Set<string>();
    const stores: string[] = [];

    for (const r of shopping) {
      const name = (r.source || r.merchant || '').trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        stores.push(name);
      }
    }

    console.log(`✅ Serper returned ${shopping.length} results, ${stores.length} unique stores:\n`);
    stores.forEach((s, i) => console.log(`${i + 1}. ${s}`));
    console.log('\nUse these exact names (or their main brand) when adding logos to STORE_LOGO_MAP.\n');
  } catch (e: any) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

const query = process.argv[2] || 'Lenovo laptop';
listSerperStores(query);

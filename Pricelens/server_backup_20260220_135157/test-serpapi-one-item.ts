/**
 * Test SERPAPI_KEY: one item with name, image, and 30+ store prices
 *
 * Usage: npx ts-node test-serpapi-one-item.ts [product]
 * Example: npx ts-node test-serpapi-one-item.ts "organic milk"
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function run() {
  const query = process.argv[2] || 'organic milk';

  if (!SERPAPI_KEY) {
    console.error('❌ SERPAPI_KEY not found in .env');
    process.exit(1);
  }

  console.log('\n🧪 SERPAPI_KEY test: 1 item, name + image + 30+ store prices\n');
  console.log('Query:', query);
  console.log('—'.repeat(50));

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=us&num=100&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`❌ HTTP ${res.status}`);
      const text = await res.text();
      if (res.status === 401) console.error('   Unauthorized – check SERPAPI_KEY is correct.');
      if (res.status === 402) console.error('   Out of credits.');
      if (text) console.error('   Body:', text.slice(0, 200));
      process.exit(1);
    }

    const data = await res.json();
    const results = data.shopping_results || [];

    if (results.length === 0) {
      console.log('❌ No shopping results.');
      if (data.error) console.log('   Error:', data.error);
      process.exit(1);
    }

    // First item = "the product"
    const item = results[0];
    const name = item.title || item.name || '—';
    const image = item.thumbnail || item.image || '';

    // Unique stores with price (from all results for this query; SerpAPI returns many offers)
    const storePrices: { store: string; price: string }[] = [];
    const seen = new Set<string>();

    for (const r of results) {
      const store = (r.source || 'Unknown').trim();
      const price = (r.price || '').toString().trim();
      const key = `${store.toLowerCase()}|${price}`;
      if (price && !seen.has(key)) {
        seen.add(key);
        storePrices.push({ store, price });
      }
    }

    const storeCount = storePrices.length;
    const hasName = !!name && name !== '—';
    const hasImage = !!image && image.startsWith('http');

    console.log('\n📦 First item:');
    console.log('   Name:  ', hasName ? name.slice(0, 60) + (name.length > 60 ? '...' : '') : '❌ missing');
    console.log('   Image: ', hasImage ? '✅ yes' : '❌ no');
    console.log('   Stores with price:', storeCount);

    if (storeCount > 0) {
      console.log('\n   Sample prices (first 10):');
      storePrices.slice(0, 10).forEach((p, i) => console.log(`      ${i + 1}. ${p.store}: ${p.price}`));
      if (storeCount > 10) console.log(`      ... and ${storeCount - 10} more`);
    }

    console.log('\n' + '—'.repeat(50));
    if (hasName && hasImage && storeCount >= 30) {
      console.log('✅ SERPAPI_KEY works: item has name, image, and 30+ store prices.');
    } else if (hasName && storeCount > 0) {
      console.log(`⚠️ SERPAPI_KEY works but: ${storeCount} stores (need 30+). Image: ${hasImage ? 'yes' : 'no'}`);
    } else {
      console.log('❌ Missing: name, image, or enough store prices.');
    }
    console.log('');
  } catch (e: any) {
    console.error('❌ Request failed:', e.message);
    process.exit(1);
  }
}

run();

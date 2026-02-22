/**
 * Test Puppeteer scraper: does it return multiple stores like SerpAPI?
 * Single query, then report: product count, unique stores, store names.
 * Usage: npx ts-node test-puppeteer-stores.ts [query]
 */

import { GoogleShoppingScraperService } from './src/integrations/services/google-shopping-scraper.service';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

class TestConfigService {
  get(key: string): string | undefined {
    return process.env[key];
  }
}

async function main() {
  const query = process.argv[2] || 'wireless mouse';
  console.log('Puppeteer scraper – store test');
  console.log('Query:', query);
  console.log('');

  const config = new TestConfigService() as any;
  const scraper = new GoogleShoppingScraperService(config);

  const start = Date.now();
  let products: any[] = [];
  try {
    products = await scraper.searchProducts(query, 20);
  } catch (e: any) {
    console.error('Scraper error:', e.message || e);
    process.exit(1);
  }
  const elapsed = Date.now() - start;

  const stores = new Set<string>();
  products.forEach((p) => {
    if (p.store && typeof p.store === 'string') stores.add(p.store.trim());
  });

  console.log('Result:');
  console.log('  Products found:', products.length);
  console.log('  Unique stores:', stores.size);
  console.log('  Time (ms):', elapsed);
  console.log('');
  console.log('Stores (like SerpAPI used to return):');
  if (stores.size === 0) {
    console.log('  (none)');
  } else {
    Array.from(stores)
      .sort()
      .forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  }

  if (products.length > 0) {
    console.log('');
    console.log('Sample products (name, store, price):');
    products.slice(0, 5).forEach((p, i) => {
      console.log(`  ${i + 1}. ${(p.name || '').substring(0, 50)}... | ${p.store} | $${p.price}`);
    });
  }

  await scraper.closeBrowser();
  process.exit(products.length > 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

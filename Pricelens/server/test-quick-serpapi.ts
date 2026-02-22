/**
 * QUICK SerpAPI Test - Fast Feedback
 * 
 * Tests a few key categories quickly to give immediate feedback
 * 
 * Usage: npx ts-node test-quick-serpapi.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const apiKey = process.env.SERPAPI_KEY;

if (!apiKey) {
  console.error('❌ SERPAPI_KEY not found in .env');
  process.exit(1);
}

interface QuickTest {
  name: string;
  query: string;
  engine: 'google_shopping' | 'google_maps';
  success: boolean;
  products?: number;
  stores?: number;
  hasImage?: boolean;
  hasPrice?: boolean;
  error?: string;
}

const quickTests: Omit<QuickTest, 'success' | 'products' | 'stores' | 'hasImage' | 'hasPrice' | 'error'>[] = [
  { name: 'Electronics (Products)', query: 'iPhone 15', engine: 'google_shopping' },
  { name: 'Groceries (Products)', query: 'organic milk', engine: 'google_shopping' },
  { name: 'Beauty (Products)', query: 'lipstick', engine: 'google_shopping' },
  { name: 'Hotels (Services)', query: 'hotels in Los Angeles', engine: 'google_maps' },
  { name: 'Gas Stations (Services)', query: 'gas station 90210', engine: 'google_maps' },
];

async function runQuickTest(test: Omit<QuickTest, 'success' | 'products' | 'stores' | 'hasImage' | 'hasPrice' | 'error'>): Promise<QuickTest> {
  try {
    const params = new URLSearchParams({
      engine: test.engine,
      q: test.query,
      api_key: apiKey!,
    });

    if (test.engine === 'google_shopping') {
      params.append('gl', 'us');
      params.append('num', '100');
    } else {
      params.append('radius', '10000');
    }

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 402) {
        return { ...test, success: false, error: 'OUT OF CREDITS - Need to upgrade!' };
      }
      return { ...test, success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    if (test.engine === 'google_shopping') {
      const results = data.shopping_results || [];
      const stores = new Set(results.map((r: any) => r.source).filter(Boolean));
      const hasImage = results.some((r: any) => r.thumbnail || r.image);
      const hasPrice = results.some((r: any) => r.price);

      return {
        ...test,
        success: true,
        products: results.length,
        stores: stores.size,
        hasImage,
        hasPrice,
      };
    } else {
      const results = data.local_results || [];
      return {
        ...test,
        success: true,
        products: results.length,
        stores: results.length,
        hasImage: results.some((r: any) => r.thumbnail),
        hasPrice: results.some((r: any) => r.price),
      };
    }
  } catch (error: any) {
    return { ...test, success: false, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 QUICK SERPAPI TEST\n');
  console.log('='.repeat(60));
  console.log('Testing key categories for immediate feedback...\n');

  const results: QuickTest[] = [];
  let searchesUsed = 0;

  for (const test of quickTests) {
    console.log(`Testing: ${test.name}...`);
    const result = await runQuickTest(test);
    results.push(result);
    searchesUsed++;

    if (result.success) {
      console.log(`  ✅ ${result.products} results, ${result.stores} stores`);
      console.log(`     Image: ${result.hasImage ? '✓' : '✗'} | Price: ${result.hasPrice ? '✓' : '✗'}`);
    } else {
      console.log(`  ❌ ${result.error}`);
    }

    // Longer delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 QUICK SUMMARY\n');

  const successful = results.filter(r => r.success).length;
  const outOfCredits = results.some(r => r.error?.includes('CREDITS'));

  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`🔍 Searches Used: ${searchesUsed}/1000 (${((searchesUsed / 1000) * 100).toFixed(1)}%)`);

  if (outOfCredits) {
    console.log('\n🚨 CRITICAL: OUT OF CREDITS!');
    console.log('   → Upgrade to Serper ($50/50000) immediately');
  } else {
    console.log('\n💡 RECOMMENDATION:');
    if (searchesUsed < 10) {
      console.log('   ✅ Current plan ($25/1000) is working');
      console.log('   → Run full test: npx ts-node test-all-categories-serpapi.ts');
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);

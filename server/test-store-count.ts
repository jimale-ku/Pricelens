/**
 * Test Store Count for Multi-Store Price Comparison
 * 
 * Tests how many stores SerpAPI returns for a product search
 * 
 * Usage: npx ts-node test-store-count.ts "grapes"
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function testStoreCount(productName: string = 'grapes') {
  if (!SERPAPI_KEY) {
    console.error('❌ SERPAPI_KEY not found in .env');
    process.exit(1);
  }

  console.log(`🧪 Testing store count for: "${productName}"\n`);
  console.log('='.repeat(60));

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(productName)}&api_key=${SERPAPI_KEY}`;
    
    console.log('🔍 Calling SerpAPI...');
    const startTime = Date.now();
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ SerpAPI request failed (${response.status}): ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    const searchTime = Date.now() - startTime;
    const shoppingResults = data.shopping_results || [];

    console.log(`✅ Response received in ${searchTime}ms\n`);
    console.log(`📦 Total results from SerpAPI: ${shoppingResults.length}\n`);

    if (shoppingResults.length === 0) {
      console.log('⚠️  No shopping results found');
      console.log('📋 Response keys:', Object.keys(data).join(', '));
      if (data.error) {
        console.log('❌ SerpAPI error:', data.error);
      }
      return;
    }

    // Extract unique stores
    const stores = new Set<string>();
    const storePrices: Array<{ store: string; price: number; title: string }> = [];

    console.log('🔍 Analyzing stores...\n');

    for (const result of shoppingResults) {
      const source = result.source || 'Unknown Store';
      const priceText = result.price || '0';
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

      // Normalize store name (remove seller suffixes)
      const normalizedStore = source
        .toLowerCase()
        .replace(/\s*-\s*.*$/, '') // Remove " - Seller Name" suffixes
        .trim();

      if (!stores.has(normalizedStore) && price > 0) {
        stores.add(normalizedStore);
        storePrices.push({
          store: source,
          price: price,
          title: result.title || 'No title',
        });
      }
    }

    // Sort by price
    storePrices.sort((a, b) => a.price - b.price);

    console.log(`✅ Found ${stores.size} unique stores\n`);
    console.log('='.repeat(60));
    console.log('\n📊 STORE LIST (sorted by price):\n');

    storePrices.slice(0, 30).forEach((item, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${item.store.padEnd(30, ' ')} $${item.price.toFixed(2)}`);
    });

    if (storePrices.length > 30) {
      console.log(`\n... and ${storePrices.length - 30} more stores`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📈 SUMMARY:\n');
    console.log(`   Total SerpAPI results: ${shoppingResults.length}`);
    console.log(`   Unique stores found: ${stores.size}`);
    console.log(`   Price range: $${storePrices[0]?.price.toFixed(2)} - $${storePrices[storePrices.length - 1]?.price.toFixed(2)}`);
    console.log(`   Search time: ${searchTime}ms`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:\n');
    
    if (stores.size < 10) {
      console.log('⚠️  Less than 10 stores found. This might be because:');
      console.log('   1. Product name is too specific');
      console.log('   2. Product is not widely available');
      console.log('   3. SerpAPI returned limited results');
    } else if (stores.size < 20) {
      console.log('✅ Good! Found 10-19 stores');
      console.log('💡 Consider increasing limit to 30+ for better comparison');
    } else {
      console.log('✅ Excellent! Found 20+ stores');
      console.log('💡 Current limit (50) is sufficient');
    }

    console.log('\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Get product name from command line or use default
const productName = process.argv[2] || 'grapes';
testStoreCount(productName);

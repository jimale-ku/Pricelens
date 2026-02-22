/**
 * Test script to see what stores SerpAPI returns for a product
 * Run: npx ts-node test-serpapi-stores.ts "almond"
 */

import * as dotenv from 'dotenv';
dotenv.config();

async function testSerpAPIStores(productName: string) {
  const apiKey = process.env.SERPAPI_KEY;
  
  if (!apiKey) {
    console.error('❌ SERPAPI_KEY not found in .env');
    return;
  }

  console.log(`🔍 Testing SerpAPI stores for: "${productName}"\n`);

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(productName)}&api_key=${apiKey}`;
    
    console.log(`📡 Fetching from SerpAPI...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ SerpAPI request failed (${response.status}): ${errorText}`);
      return;
    }

    const data = await response.json();
    const shoppingResults = data.shopping_results || [];

    console.log(`✅ SerpAPI returned ${shoppingResults.length} shopping results\n`);
    
    if (shoppingResults.length === 0) {
      console.warn(`⚠️ No results from SerpAPI`);
      console.log(`Response keys: ${Object.keys(data).join(', ')}`);
      if (data.error) {
        console.error(`SerpAPI error: ${data.error}`);
      }
      return;
    }

    // Extract all unique stores
    const stores = new Map<string, { count: number; prices: number[]; sources: string[] }>();
    
    for (const result of shoppingResults) {
      const source = result.source || 'Unknown Store';
      const priceText = result.price || '0';
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
      
      if (!stores.has(source)) {
        stores.set(source, { count: 0, prices: [], sources: [] });
      }
      
      const storeData = stores.get(source)!;
      storeData.count++;
      if (price > 0) {
        storeData.prices.push(price);
      }
      storeData.sources.push(source);
    }

    console.log(`📊 Found ${stores.size} UNIQUE STORES:\n`);
    console.log('='.repeat(80));
    
    // Sort stores by count (most common first)
    const sortedStores = Array.from(stores.entries()).sort((a, b) => b[1].count - a[1].count);
    
    sortedStores.forEach(([storeName, data], index) => {
      const minPrice = Math.min(...data.prices.filter(p => p > 0));
      const maxPrice = Math.max(...data.prices.filter(p => p > 0));
      const avgPrice = data.prices.filter(p => p > 0).reduce((a, b) => a + b, 0) / data.prices.filter(p => p > 0).length;
      
      console.log(`${index + 1}. ${storeName}`);
      console.log(`   - Appears ${data.count} time(s)`);
      if (data.prices.filter(p => p > 0).length > 0) {
        console.log(`   - Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
        console.log(`   - Average price: $${avgPrice.toFixed(2)}`);
      }
      console.log('');
    });

    console.log('='.repeat(80));
    console.log(`\n📈 Summary:`);
    console.log(`   - Total results: ${shoppingResults.length}`);
    console.log(`   - Unique stores: ${stores.size}`);
    console.log(`   - Stores with valid prices: ${sortedStores.filter(([_, d]) => d.prices.filter(p => p > 0).length > 0).length}`);
    
    // List all store names
    console.log(`\n📋 All store names returned by SerpAPI:`);
    sortedStores.forEach(([storeName], index) => {
      console.log(`   ${index + 1}. ${storeName}`);
    });

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  }
}

// Get product name from command line args
const productName = process.argv[2] || 'almond';
testSerpAPIStores(productName);

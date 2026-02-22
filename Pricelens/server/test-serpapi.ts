/**
 * Test SerpAPI Integration
 * 
 * Tests what stores SerpAPI actually returns for product searches
 * 
 * Usage:
 *   npx ts-node test-serpapi.ts "iPhone 15"
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const SERPAPI_KEY = process.env.SERPAPI_KEY || '94324ab2b874ec651b211c73e592c0da8371bb2984eface87cfbd1013a124fee';

async function testSerpAPI(query: string = 'iPhone 15') {
  console.log(`🧪 Testing SerpAPI for: "${query}"\n`);

  if (!SERPAPI_KEY) {
    console.error('❌ SERPAPI_KEY not found in .env');
    process.exit(1);
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    
    console.log('🔍 Making request to SerpAPI...');
    const startTime = Date.now();
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ SerpAPI request failed (${response.status}): ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    const searchTime = Date.now() - startTime;

    console.log(`✅ Response received in ${searchTime}ms\n`);

    // Check what we got
    if (!data.shopping_results || data.shopping_results.length === 0) {
      console.log('⚠️  No shopping results found');
      console.log('📋 Full response:', JSON.stringify(data, null, 2));
      return;
    }

    const results = data.shopping_results;
    console.log(`📦 Found ${results.length} results from Google Shopping\n`);

    // Extract unique stores
    const stores = new Set<string>();
    const storePrices: Array<{ store: string; price: number; title: string; url: string }> = [];

    results.forEach((result: any, index: number) => {
      const store = result.source || 'Unknown Store';
      const price = result.price ? parseFloat(result.price.replace(/[^0-9.]/g, '')) : 0;
      const title = result.title || 'No title';
      const url = result.link || '';

      stores.add(store);
      storePrices.push({ store, price, title, url });

      // Show first 10 results
      if (index < 10) {
        console.log(`${index + 1}. ${store}`);
        console.log(`   Title: ${title.substring(0, 60)}...`);
        console.log(`   Price: ${result.price || 'N/A'}`);
        console.log(`   URL: ${url.substring(0, 60)}...`);
        console.log('');
      }
    });

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 SUMMARY`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Results: ${results.length}`);
    console.log(`Unique Stores: ${stores.size}`);
    console.log(`\n🏪 Stores Found:`);
    Array.from(stores).sort().forEach((store, i) => {
      console.log(`   ${i + 1}. ${store}`);
    });

    // Price range
    const prices = storePrices.map(p => p.price).filter(p => p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      console.log(`\n💰 Price Range:`);
      console.log(`   Lowest: $${minPrice.toFixed(2)}`);
      console.log(`   Highest: $${maxPrice.toFixed(2)}`);
      console.log(`   Average: $${avgPrice.toFixed(2)}`);
    }

    // Answer the question
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ANSWER: Will it show all stores?`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Yes! SerpAPI returns results from ${stores.size} different stores.`);
    console.log(`\nHowever, note:`);
    console.log(`- Results depend on what Google Shopping has indexed`);
    console.log(`- Not all stores may appear for every product`);
    console.log(`- You'll typically get 10-20 stores per search`);
    console.log(`- Major retailers (Amazon, Walmart, Best Buy, etc.) are usually included`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Get query from command line or use default
const query = process.argv[2] || 'iPhone 15';
testSerpAPI(query).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});







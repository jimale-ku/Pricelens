/**
 * Direct SerpAPI Test for Beauty Products
 * Tests if SerpAPI returns beauty products when searching for beauty terms
 * 
 * Usage: npx ts-node test-beauty-serpapi-direct.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const SERPAPI_KEY = process.env.SERPAPI_KEY;

const BEAUTY_SEARCH_TERMS = [
  'shampoo',
  'lipstick',
  'foundation',
  'moisturizer',
  'mascara',
];

async function testSerpAPIDirect(term: string) {
  console.log(`\n🔍 Testing SerpAPI directly for: "${term}"`);
  
  if (!SERPAPI_KEY) {
    console.log('   ❌ SERPAPI_KEY not found in environment variables');
    return null;
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(term)}&api_key=${SERPAPI_KEY}`;
    console.log(`   URL: ${url.substring(0, 80)}...`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: HTTP ${response.status}`);
      console.log(`   Response: ${errorText.substring(0, 200)}`);
      return { success: false, duration, error: errorText };
    }

    const data = await response.json();
    
    // Check for SerpAPI errors
    if (data.error) {
      console.log(`   ❌ SerpAPI Error: ${data.error}`);
      return { success: false, duration, error: data.error };
    }

    const shoppingResults = data.shopping_results || [];
    console.log(`   ✅ Success: Found ${shoppingResults.length} results`);
    console.log(`   Duration: ${duration}ms`);
    
    if (shoppingResults.length > 0) {
      console.log(`   Sample products:`);
      shoppingResults.slice(0, 5).forEach((result: any, index: number) => {
        console.log(`     ${index + 1}. ${result.title || 'N/A'}`);
        console.log(`        Store: ${result.source || 'Unknown'}`);
        console.log(`        Price: ${result.price || 'N/A'}`);
        if (result.thumbnail) {
          console.log(`        Has image: ✅`);
        }
      });
      
      // Count unique stores
      const stores = new Set(shoppingResults.map((r: any) => r.source || 'Unknown').filter(Boolean));
      console.log(`   📊 Unique stores: ${stores.size}`);
      console.log(`   Stores: ${Array.from(stores).slice(0, 10).join(', ')}${stores.size > 10 ? '...' : ''}`);
    } else {
      console.log(`   ⚠️  No results found in SerpAPI response`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
    }

    return { success: true, duration, results: shoppingResults.length, stores: Array.from(new Set(shoppingResults.map((r: any) => r.source || 'Unknown').filter(Boolean))) };
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, duration: 0, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing SerpAPI Directly for Beauty Products\n');
  console.log('='.repeat(70));

  if (!SERPAPI_KEY) {
    console.log('❌ SERPAPI_KEY not found in environment variables');
    console.log('   Cannot test SerpAPI without API key\n');
    return;
  }

  console.log('✅ SERPAPI_KEY found\n');

  const results: Array<{ term: string; result: any }> = [];

  // Test each beauty term
  for (const term of BEAUTY_SEARCH_TERMS) {
    const result = await testSerpAPIDirect(term);
    if (result) {
      results.push({ term, result });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS SUMMARY\n');

  const successCount = results.filter(r => r.result.success).length;
  const failureCount = results.filter(r => !r.result.success).length;
  console.log(`   ✅ Successful: ${successCount}/${results.length}`);
  console.log(`   ❌ Failed: ${failureCount}/${results.length}`);

  if (successCount > 0) {
    const totalProducts = results
      .filter(r => r.result.success)
      .reduce((sum, r) => sum + (r.result.results || 0), 0);
    console.log(`   📦 Total products found: ${totalProducts}`);
    
    // Get all unique stores
    const allStoresSet = new Set<string>();
    results.forEach(r => {
      if (r.result.success && r.result.stores) {
        r.result.stores.forEach((store: string) => allStoresSet.add(store));
      }
    });
    
    console.log(`   🏪 Total unique stores: ${allStoresSet.size}`);
    if (allStoresSet.size > 0) {
      console.log(`   Stores: ${Array.from(allStoresSet).slice(0, 30).join(', ')}${allStoresSet.size > 30 ? '...' : ''}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  
  if (successCount === results.length) {
    console.log('\n🎉 All SerpAPI tests passed! SerpAPI is working for beauty products!\n');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some SerpAPI tests failed. Check the errors above.\n');
  } else {
    console.log('\n❌ All SerpAPI tests failed. Check your SerpAPI key and plan.\n');
  }

  console.log('='.repeat(70));
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

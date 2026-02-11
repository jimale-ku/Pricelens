/**
 * Test Beauty Products Search
 * Tests the beauty products category to see:
 * 1. How many stores are returned
 * 2. What kind of products are returned
 * 
 * Usage: npx ts-node test-beauty-products.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

interface TestCase {
  query: string;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    query: 'lipstick',
    description: 'Search for lipstick',
  },
  {
    query: 'foundation',
    description: 'Search for foundation',
  },
  {
    query: 'shampoo',
    description: 'Search for shampoo',
  },
  {
    query: 'moisturizer',
    description: 'Search for moisturizer',
  },
  {
    query: 'mascara',
    description: 'Search for mascara',
  },
];

async function testBeautyProductsSearch(testCase: TestCase) {
  console.log(`\n🔍 Testing: ${testCase.description}`);
  console.log(`   Query: "${testCase.query}"`);

  try {
    // First, get the beauty category ID
    const categoryResponse = await fetch(`${API_BASE_URL}/categories?slug=beauty`);
    let categoryId = '';
    
    if (categoryResponse.ok) {
      const categories = await categoryResponse.json();
      const beautyCategory = Array.isArray(categories) 
        ? categories.find((c: any) => c.slug === 'beauty' || c.slug === 'beauty-products')
        : null;
      if (beautyCategory) {
        categoryId = beautyCategory.id;
        console.log(`   Category ID: ${categoryId}`);
      }
    }

    // Search for products
    const searchUrl = `${API_BASE_URL}/products/search?q=${encodeURIComponent(testCase.query)}&categorySlug=beauty${categoryId ? `&categoryId=${categoryId}` : ''}`;
    console.log(`   URL: ${searchUrl}`);

    const startTime = Date.now();
    const response = await fetch(searchUrl, {
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
    const products = Array.isArray(data) ? data : (data.products || []);

    console.log(`   ✅ Success: Found ${products.length} products`);
    console.log(`   Duration: ${duration}ms`);
    
    if (products.length > 0) {
      console.log(`   Sample products:`);
      products.slice(0, 5).forEach((product: any, index: number) => {
        console.log(`     ${index + 1}. ${product.name || 'N/A'}`);
        if (product.prices && product.prices.length > 0) {
          const stores = product.prices.map((p: any) => p.store?.name || p.storeName || 'Unknown').filter((s: string, i: number, arr: string[]) => arr.indexOf(s) === i);
          console.log(`        Stores: ${stores.length} (${stores.slice(0, 5).join(', ')}${stores.length > 5 ? '...' : ''})`);
        }
        if (product.image || (product.images && product.images.length > 0)) {
          console.log(`        Has image: ✅`);
        }
      });
    }

    // Count unique stores across all products
    const allStores = new Set<string>();
    products.forEach((product: any) => {
      if (product.prices) {
        product.prices.forEach((p: any) => {
          const storeName = p.store?.name || p.storeName;
          if (storeName) {
            allStores.add(storeName);
          }
        });
      }
    });

    console.log(`   📊 Total unique stores found: ${allStores.size}`);
    if (allStores.size > 0) {
      console.log(`   Stores: ${Array.from(allStores).slice(0, 10).join(', ')}${allStores.size > 10 ? '...' : ''}`);
    }

    return { 
      success: true, 
      duration, 
      products: products.length,
      uniqueStores: allStores.size,
      stores: Array.from(allStores),
    };
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, duration: 0, error: error.message };
  }
}

async function testPopularBeautyProducts() {
  console.log(`\n🔍 Testing Popular Beauty Products (getPopular endpoint)`);
  
  try {
    const url = `${API_BASE_URL}/products/popular?categorySlug=beauty&limit=10`;
    console.log(`   URL: ${url}`);

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

    const products = await response.json();
    const productArray = Array.isArray(products) ? products : [];

    console.log(`   ✅ Success: Found ${productArray.length} popular products`);
    console.log(`   Duration: ${duration}ms`);
    
    if (productArray.length > 0) {
      console.log(`   Products:`);
      productArray.forEach((product: any, index: number) => {
        console.log(`     ${index + 1}. ${product.name || 'N/A'}`);
        if (product.prices && product.prices.length > 0) {
          const stores = product.prices.map((p: any) => p.store?.name || p.storeName || 'Unknown').filter((s: string, i: number, arr: string[]) => arr.indexOf(s) === i);
          console.log(`        Stores: ${stores.length} (${stores.join(', ')})`);
        }
      });
    }

    // Count unique stores
    const allStores = new Set<string>();
    productArray.forEach((product: any) => {
      if (product.prices) {
        product.prices.forEach((p: any) => {
          const storeName = p.store?.name || p.storeName;
          if (storeName) {
            allStores.add(storeName);
          }
        });
      }
    });

    console.log(`   📊 Total unique stores: ${allStores.size}`);
    if (allStores.size > 0) {
      console.log(`   Stores: ${Array.from(allStores).join(', ')}`);
    }

    return { 
      success: true, 
      duration, 
      products: productArray.length,
      uniqueStores: allStores.size,
      stores: Array.from(allStores),
    };
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, duration: 0, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Beauty Products Category\n');
  console.log('='.repeat(70));

  // Check if backend is reachable by trying a simple endpoint
  let backendAvailable = false;
  try {
    // Try to fetch categories endpoint instead of /health (which might not exist)
    const testCheck = await fetch(`${API_BASE_URL}/categories?slug=beauty`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    if (testCheck.ok || testCheck.status === 404) {
      // 404 is OK - it means server is running, just category might not exist
      backendAvailable = true;
      console.log('✅ Backend is reachable\n');
    } else {
      console.log('⚠️  Backend responded with error, but continuing test...\n');
      backendAvailable = true; // Continue anyway
    }
  } catch (error: any) {
    console.log('⚠️  Could not verify backend, but continuing test...');
    console.log(`   Error: ${error.message}`);
    console.log('   Will attempt to test endpoints anyway\n');
    backendAvailable = true; // Continue anyway - let the actual tests show if it works
  }

  const results: Array<{ testCase: TestCase; result: any }> = [];

  // Test popular products first
  const popularResult = await testPopularBeautyProducts();
  
  // Test each search query
  for (const testCase of TEST_CASES) {
    const result = await testBeautyProductsSearch(testCase);
    results.push({ testCase, result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS SUMMARY\n');

  // Popular Products Summary
  if (popularResult.success) {
    console.log('🌟 Popular Beauty Products:');
    console.log(`   ✅ Found ${popularResult.products || 0} products`);
    console.log(`   📊 Unique stores: ${popularResult.uniqueStores || 0}`);
    if (popularResult.stores && popularResult.stores.length > 0) {
      console.log(`   🏪 Stores: ${popularResult.stores.join(', ')}`);
    }
  }

  // Search Results Summary
  console.log('\n🔍 Search Results:');
  const successCount = results.filter(r => r.result.success).length;
  const failureCount = results.filter(r => !r.result.success).length;
  console.log(`   ✅ Successful: ${successCount}/${results.length}`);
  console.log(`   ❌ Failed: ${failureCount}/${results.length}`);

  if (successCount > 0) {
    const totalProducts = results
      .filter(r => r.result.success)
      .reduce((sum, r) => sum + (r.result.products || 0), 0);
    console.log(`   📦 Total products found: ${totalProducts}`);
    
    // Get all unique stores from all searches
    const allStoresSet = new Set<string>();
    results.forEach(r => {
      if (r.result.success && r.result.stores) {
        r.result.stores.forEach((store: string) => allStoresSet.add(store));
      }
    });
    if (popularResult.stores) {
      popularResult.stores.forEach((store: string) => allStoresSet.add(store));
    }
    
    console.log(`   🏪 Total unique stores across all searches: ${allStoresSet.size}`);
    if (allStoresSet.size > 0) {
      console.log(`   Stores: ${Array.from(allStoresSet).slice(0, 20).join(', ')}${allStoresSet.size > 20 ? '...' : ''}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Recommendations:');
  
  if (popularResult.success && (popularResult.uniqueStores || 0) < 10) {
    console.log('   ⚠️  Only a few stores found. Consider adding more beauty stores:');
    console.log('      - Sephora, Ulta, CVS, Walgreens, Rite Aid');
    console.log('      - Macy\'s, Nordstrom, Saks Fifth Avenue');
    console.log('      - Sally Beauty, Beauty Brands, Space NK');
  }
  
  console.log('\n' + '='.repeat(70));
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

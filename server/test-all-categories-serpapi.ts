/**
 * Comprehensive Category Test Script for SerpAPI
 * 
 * Tests ALL categories to verify they return:
 * - Product/Service name
 * - Image
 * - Price
 * - Stores (multiple stores for price comparison)
 * 
 * This helps determine if the current SerpAPI plan ($25/1000 searches) is sufficient
 * or if upgrading to Serper ($50/50000 searches) is needed.
 * 
 * Usage:
 *   npx ts-node test-all-categories-serpapi.ts           # All categories
 *   npx ts-node test-all-categories-serpapi.ts --services # Only non-product (oil-changes, renters, spa, hotels, etc.)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

interface CategoryTestResult {
  category: string;
  slug: string;
  pattern: 'A' | 'B' | 'C';
  type: 'product' | 'service';
  status: 'success' | 'error' | 'warning' | 'skipped';
  message: string;
  dataQuality: {
    hasName: boolean;
    hasImage: boolean;
    hasPrice: boolean;
    storeCount: number;
    priceComparison: boolean;
    sampleStores: string[];
  };
  searchCount: number;
  duration: number;
  error?: string;
}

// Category patterns from categoryPatterns.ts
const CATEGORY_PATTERNS: Record<string, 'A' | 'B' | 'C'> = {
  'groceries': 'A',
  'electronics': 'A',
  'kitchen': 'A',
  'home-accessories': 'A',
  'clothing': 'A',
  'footwear': 'A',
  'books': 'A',
  'household': 'A',
  'medicine': 'A',
  'beauty': 'A',
  'video-games': 'A',
  'sports-equipment': 'A',
  'office': 'A',
  'furniture': 'A',
  'tools': 'A',
  'pet-supplies': 'A',
  'mattresses': 'A',
  'gas-stations': 'B',
  'gym': 'B',
  'car-insurance': 'B',
  'renters-insurance': 'B',
  'tires': 'B',
  'oil-changes': 'B',
  'car-washes': 'B',
  'rental-cars': 'B',
  'hotels': 'B',
  'airfare': 'B',
  'storage': 'B',
  'meal-kits': 'B',
  'haircuts': 'C',
  'massage': 'C',
  'nail-salons': 'C',
  'spa': 'C',
  'apartments': 'C',
  'moving': 'C',
  'food-delivery': 'C',
  'services': 'C',
};

// Test queries for each category
const CATEGORY_TEST_QUERIES: Record<string, string[]> = {
  'groceries': ['organic milk', 'bananas', 'chicken breast'],
  'electronics': ['iPhone 15', 'laptop', 'headphones'],
  'kitchen': ['blender', 'coffee maker', 'air fryer'],
  'home-accessories': ['throw pillow', 'wall art', 'candle'],
  'clothing': ['t-shirt', 'jeans', 'jacket'],
  'footwear': ['running shoes', 'sneakers', 'boots'],
  'books': ['best seller book', 'novel', 'cookbook'],
  'household': ['paper towels', 'laundry detergent', 'trash bags'],
  'medicine': ['vitamins', 'pain reliever', 'cold medicine'],
  'beauty': ['lipstick', 'foundation', 'skincare'],
  'video-games': ['Nintendo Switch', 'PlayStation 5', 'Xbox game'],
  'sports-equipment': ['basketball', 'yoga mat', 'dumbbells'],
  'office': ['printer paper', 'stapler', 'notebook'],
  'furniture': ['sofa', 'dining table', 'bed frame'],
  'tools': ['drill', 'hammer', 'screwdriver'],
  'pet-supplies': ['dog food', 'cat litter', 'pet toys'],
  'mattresses': ['memory foam mattress', 'mattress', 'bed mattress'],
  'gas-stations': ['gas station 90210', 'cheap gas 10001', 'gas prices 60601'],
  'gym': ['gym 90210', 'fitness center 10001', 'gym membership 60601'],
  'car-insurance': ['car insurance', 'auto insurance', 'vehicle insurance'],
  'renters-insurance': ['renters insurance', 'tenant insurance', 'apartment insurance'],
  'tires': ['car tires', 'tire shop 90210', 'tire installation'],
  'oil-changes': ['oil change 90210', 'car service 10001', 'oil change service'],
  'car-washes': ['car wash 90210', 'auto wash 10001', 'car detailing'],
  'rental-cars': ['car rental', 'rent a car', 'car hire'],
  'hotels': ['hotels in Los Angeles', 'hotels New York', 'hotels Chicago'],
  'airfare': ['flights from LAX to JFK', 'cheap flights', 'airline tickets'],
  'storage': ['storage units 90210', 'self storage', 'storage facility'],
  'meal-kits': ['meal kit delivery', 'HelloFresh', 'Blue Apron'],
  'haircuts': ['hair salon 90210', 'barber shop 10001', 'haircut 60601'],
  'massage': ['massage 90210', 'spa massage', 'therapeutic massage'],
  'nail-salons': ['nail salon 90210', 'manicure pedicure', 'nail services'],
  'spa': ['spa services', 'day spa', 'spa treatments'],
  'apartments': ['apartments for rent', 'apartment rental', 'apartments'],
  'moving': ['moving companies', 'movers', 'moving services'],
  'food-delivery': ['food delivery', 'Uber Eats', 'DoorDash'],
  'services': ['plumber', 'electrician', 'handyman'],
};

const results: CategoryTestResult[] = [];
let totalSearches = 0;
const apiKey = process.env.SERPAPI_KEY;

// Run only non-product categories (Pattern B & C): oil-changes, renters-insurance, spa, hotels, etc.
const SERVICES_ONLY = process.argv.includes('--services');

if (!apiKey) {
  console.error('❌ SERPAPI_KEY not found in .env file!');
  console.error('Please add your SerpAPI key to the .env file.');
  process.exit(1);
}

/**
 * Test Google Shopping (Pattern A - Products)
 */
async function testGoogleShopping(category: string, slug: string, queries: string[]): Promise<CategoryTestResult> {
  const startTime = Date.now();
  let searchCount = 0;
  let bestResult: CategoryTestResult | null = null;

  for (const query of queries.slice(0, 1)) { // Test only first query to save credits
    searchCount++;
    totalSearches++;

    try {
      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=us&num=100&api_key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 402) {
          return {
            category,
            slug,
            pattern: 'A',
            type: 'product',
            status: 'error',
            message: `❌ OUT OF CREDITS (402) - Need to upgrade plan!`,
            dataQuality: {
              hasName: false,
              hasImage: false,
              hasPrice: false,
              storeCount: 0,
              priceComparison: false,
              sampleStores: [],
            },
            searchCount,
            duration: Date.now() - startTime,
            error: `HTTP ${response.status}: Out of credits`,
          };
        }
        return {
          category,
          slug,
          pattern: 'A',
          type: 'product',
          status: 'error',
          message: `❌ Request failed: ${response.status}`,
          dataQuality: {
            hasName: false,
            hasImage: false,
            hasPrice: false,
            storeCount: 0,
            priceComparison: false,
            sampleStores: [],
          },
          searchCount,
          duration: Date.now() - startTime,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const shoppingResults = data.shopping_results || [];

      if (shoppingResults.length === 0) {
        continue; // Try next query
      }

      // Analyze data quality
      const stores = new Set<string>();
      let hasName = false;
      let hasImage = false;
      let hasPrice = false;
      let priceCount = 0;

      shoppingResults.slice(0, 50).forEach((result: any) => {
        if (result.title) hasName = true;
        if (result.thumbnail || result.image) hasImage = true;
        if (result.price) {
          hasPrice = true;
          priceCount++;
        }
        if (result.source) stores.add(result.source);
      });

      const priceComparison = stores.size >= 3; // At least 3 stores for comparison

      bestResult = {
        category,
        slug,
        pattern: 'A',
        type: 'product',
        status: hasName && hasImage && hasPrice && priceComparison ? 'success' : 'warning',
        message: hasName && hasImage && hasPrice && priceComparison
          ? `✅ Working! ${shoppingResults.length} products, ${stores.size} stores`
          : `⚠️ Partial: Missing ${!hasName ? 'name ' : ''}${!hasImage ? 'image ' : ''}${!hasPrice ? 'price ' : ''}${!priceComparison ? 'stores ' : ''}`,
        dataQuality: {
          hasName,
          hasImage,
          hasPrice,
          storeCount: stores.size,
          priceComparison,
          sampleStores: Array.from(stores).slice(0, 10),
        },
        searchCount,
        duration: Date.now() - startTime,
      };

      break; // Found good result, stop testing
    } catch (error: any) {
      return {
        category,
        slug,
        pattern: 'A',
        type: 'product',
        status: 'error',
        message: `❌ Error: ${error.message}`,
        dataQuality: {
          hasName: false,
          hasImage: false,
          hasPrice: false,
          storeCount: 0,
          priceComparison: false,
          sampleStores: [],
        },
        searchCount,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  return bestResult || {
    category,
    slug,
    pattern: 'A',
    type: 'product',
    status: 'error',
    message: '❌ No results found',
    dataQuality: {
      hasName: false,
      hasImage: false,
      hasPrice: false,
      storeCount: 0,
      priceComparison: false,
      sampleStores: [],
    },
    searchCount,
    duration: Date.now() - startTime,
  };
}

/**
 * Test Google Maps (Pattern B & C - Services)
 */
async function testGoogleMaps(category: string, slug: string, queries: string[], pattern: 'B' | 'C'): Promise<CategoryTestResult> {
  const startTime = Date.now();
  let searchCount = 0;
  let bestResult: CategoryTestResult | null = null;

  for (const query of queries.slice(0, 1)) { // Test only first query
    searchCount++;
    totalSearches++;

    try {
      const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&radius=10000&api_key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 402) {
          return {
            category,
            slug,
            pattern,
            type: 'service',
            status: 'error',
            message: `❌ OUT OF CREDITS (402) - Need to upgrade plan!`,
            dataQuality: {
              hasName: false,
              hasImage: false,
              hasPrice: false,
              storeCount: 0,
              priceComparison: false,
              sampleStores: [],
            },
            searchCount,
            duration: Date.now() - startTime,
            error: `HTTP ${response.status}: Out of credits`,
          };
        }
        return {
          category,
          slug,
          pattern,
          type: 'service',
          status: 'error',
          message: `❌ Request failed: ${response.status}`,
          dataQuality: {
            hasName: false,
            hasImage: false,
            hasPrice: false,
            storeCount: 0,
            priceComparison: false,
            sampleStores: [],
          },
          searchCount,
          duration: Date.now() - startTime,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const localResults = data.local_results || [];

      if (localResults.length === 0) {
        continue; // Try next query
      }

      // Analyze data quality
      let hasName = false;
      let hasImage = false;
      let hasPrice = false;
      const stores = new Set<string>();

      localResults.slice(0, 20).forEach((result: any) => {
        if (result.title) {
          hasName = true;
          stores.add(result.title);
        }
        if (result.thumbnail) hasImage = true;
        if (result.price) hasPrice = true;
      });

      const priceComparison = stores.size >= 3;

      bestResult = {
        category,
        slug,
        pattern,
        type: 'service',
        status: hasName && priceComparison ? 'success' : 'warning',
        message: hasName && priceComparison
          ? `✅ Working! ${localResults.length} locations found`
          : `⚠️ Partial: Found ${localResults.length} locations but missing data`,
        dataQuality: {
          hasName,
          hasImage,
          hasPrice,
          storeCount: stores.size,
          priceComparison,
          sampleStores: Array.from(stores).slice(0, 10),
        },
        searchCount,
        duration: Date.now() - startTime,
      };

      break;
    } catch (error: any) {
      return {
        category,
        slug,
        pattern,
        type: 'service',
        status: 'error',
        message: `❌ Error: ${error.message}`,
        dataQuality: {
          hasName: false,
          hasImage: false,
          hasPrice: false,
          storeCount: 0,
          priceComparison: false,
          sampleStores: [],
        },
        searchCount,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  return bestResult || {
    category,
    slug,
    pattern,
    type: 'service',
    status: 'error',
    message: '❌ No results found',
    dataQuality: {
      hasName: false,
      hasImage: false,
      hasPrice: false,
      storeCount: 0,
      priceComparison: false,
      sampleStores: [],
    },
    searchCount,
    duration: Date.now() - startTime,
  };
}

/**
 * Main test function
 */
async function runAllTests() {
  console.log('\n🧪 COMPREHENSIVE CATEGORY TEST FOR SERPAPI\n');
  console.log('=' .repeat(70));
  if (SERVICES_ONLY) {
    console.log(`Testing NON-PRODUCT categories only (Pattern B & C):`);
    console.log(`  Oil changes, renters insurance, spa, hotels, tires, gym, haircuts, etc.`);
  } else {
    console.log(`Testing all categories to verify data quality...`);
  }
  console.log(`Current Plan: $25 for 1000 searches`);
  console.log(`Alternative: Serper $50 for 50000 searches`);
  console.log('=' .repeat(70));
  console.log('');

  let categories = Object.keys(CATEGORY_TEST_QUERIES);
  if (SERVICES_ONLY) {
    categories = categories.filter(slug => {
      const pattern = CATEGORY_PATTERNS[slug];
      return pattern === 'B' || pattern === 'C';
    });
    console.log(`Filtered to ${categories.length} service categories: ${categories.join(', ')}\n`);
  }

  for (const slug of categories) {
    const queries = CATEGORY_TEST_QUERIES[slug];
    const pattern = CATEGORY_PATTERNS[slug] || 'A';
    const categoryName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    console.log(`\n📦 Testing: ${categoryName} (${slug}) - Pattern ${pattern}`);

    let result: CategoryTestResult;

    if (pattern === 'A') {
      // Product categories - use Google Shopping
      result = await testGoogleShopping(categoryName, slug, queries);
    } else {
      // Service categories - use Google Maps
      result = await testGoogleMaps(categoryName, slug, queries, pattern);
    }

    results.push(result);
    console.log(`   ${result.message}`);

    // Longer delay to avoid rate limiting (SerpAPI has per-minute limits)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.status === 'success').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;
  const outOfCredits = results.filter(r => r.error?.includes('402') || r.error?.includes('credits')).length;

  console.log(`\n✅ Successful: ${successful}/${results.length}`);
  console.log(`⚠️  Warnings: ${warnings}/${results.length}`);
  console.log(`❌ Errors: ${errors}/${results.length}`);
  console.log(`💳 Out of Credits: ${outOfCredits}/${results.length}`);
  console.log(`\n🔍 Total Searches Used: ${totalSearches}/1000 (${((totalSearches / 1000) * 100).toFixed(1)}%)`);

  // Data quality summary
  console.log('\n📈 DATA QUALITY SUMMARY');
  console.log('-'.repeat(70));
  
  const categoriesWithAllData = results.filter(r => 
    r.dataQuality.hasName && 
    r.dataQuality.hasImage && 
    r.dataQuality.hasPrice && 
    r.dataQuality.priceComparison
  ).length;

  const avgStoreCount = results
    .filter(r => r.dataQuality.storeCount > 0)
    .reduce((sum, r) => sum + r.dataQuality.storeCount, 0) / 
    results.filter(r => r.dataQuality.storeCount > 0).length || 0;

  console.log(`Categories with complete data: ${categoriesWithAllData}/${results.length}`);
  console.log(`Average stores per category: ${avgStoreCount.toFixed(1)}`);
  console.log(`Categories with price comparison (3+ stores): ${results.filter(r => r.dataQuality.priceComparison).length}/${results.length}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(70));

  if (outOfCredits > 0) {
    console.log('🚨 CRITICAL: You ran out of credits during testing!');
    console.log('   → Upgrade to Serper ($50/50000) immediately');
  } else if (totalSearches > 800) {
    console.log('⚠️  WARNING: Used over 80% of your credits in testing');
    console.log('   → Consider upgrading to Serper ($50/50000) for production');
    console.log('   → Current plan may not be enough for regular usage');
  } else if (totalSearches > 500) {
    console.log('⚠️  You used over 50% of credits in testing');
    console.log('   → Current plan ($25/1000) might be tight for production');
    console.log('   → Consider Serper ($50/50000) if you expect high traffic');
  } else {
    console.log('✅ Current plan ($25/1000) seems sufficient for testing');
    console.log('   → Monitor usage in production');
    console.log('   → Upgrade to Serper if you exceed 800 searches/month');
  }

  // Category-specific issues
  const failedCategories = results.filter(r => r.status === 'error' && !r.error?.includes('402'));
  if (failedCategories.length > 0) {
    console.log('\n⚠️  Categories with issues:');
    failedCategories.forEach(r => {
      console.log(`   - ${r.category}: ${r.error || r.message}`);
    });
  }

  // Detailed results table
  console.log('\n\n📋 DETAILED RESULTS');
  console.log('='.repeat(70));
  console.log('Category'.padEnd(25) + 'Status'.padEnd(12) + 'Stores'.padEnd(10) + 'Data Quality');
  console.log('-'.repeat(70));

  results.forEach(r => {
    const statusIcon = r.status === 'success' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
    const dataQuality = [
      r.dataQuality.hasName ? '✓' : '✗',
      r.dataQuality.hasImage ? '✓' : '✗',
      r.dataQuality.hasPrice ? '✓' : '✗',
      r.dataQuality.priceComparison ? '✓' : '✗',
    ].join(' ');
    
    console.log(
      r.category.padEnd(25) + 
      `${statusIcon} ${r.status}`.padEnd(12) + 
      `${r.dataQuality.storeCount}`.padEnd(10) + 
      dataQuality
    );
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ Testing complete!');
  console.log('='.repeat(70) + '\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

/**
 * Test SerpAPI Multi-Store Results
 * 
 * This script tests why SerpAPI is not returning multiple stores for products.
 * It will help diagnose:
 * - Is SerpAPI returning results?
 * - Are results being filtered out?
 * - Are stores being excluded?
 * - Are prices invalid?
 */

const SERPAPI_KEY = process.env.SERPAPI_KEY || '94324ab2b874ec651b211c73e592c0da8371bb2984eface87cfbd1013a124fee';

interface SerpAPIResult {
  title?: string;
  source?: string;
  price?: string;
  link?: string;
  thumbnail?: string;
}

interface TestResult {
  query: string;
  totalResults: number;
  storesFound: string[];
  storesFiltered: string[];
  storesIncluded: string[];
  issues: string[];
}

async function testSerpAPI(query: string): Promise<TestResult> {
  console.log(`\n🧪 Testing: "${query}"`);
  console.log('='.repeat(60));

  if (!SERPAPI_KEY) {
    console.error('❌ SERPAPI_KEY not found in .env');
    return {
      query,
      totalResults: 0,
      storesFound: [],
      storesFiltered: [],
      storesIncluded: [],
      issues: ['SERPAPI_KEY not configured'],
    };
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    console.log(`📡 Fetching from: ${url.replace(SERPAPI_KEY, '***')}`);

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP ${response.status}: ${errorText}`);
      return {
        query,
        totalResults: 0,
        storesFound: [],
        storesFiltered: [],
        storesIncluded: [],
        issues: [`HTTP ${response.status}: ${errorText}`],
      };
    }

    const data = await response.json();
    const shoppingResults: SerpAPIResult[] = data.shopping_results || [];

    console.log(`📦 SerpAPI returned ${shoppingResults.length} results`);

    if (shoppingResults.length === 0) {
      console.warn('⚠️ No results from SerpAPI');
      console.log('Response keys:', Object.keys(data).join(', '));
      if (data.error) {
        console.error('SerpAPI error:', data.error);
      }
      return {
        query,
        totalResults: 0,
        storesFound: [],
        storesFiltered: [],
        storesIncluded: [],
        issues: ['No results from SerpAPI', data.error || 'Unknown error'],
      };
    }

    // Analyze results
    const storesFound = new Set<string>();
    const storesFiltered: string[] = [];
    const storesIncluded: string[] = [];
    const issues: string[] = [];

    const preferredStores = [
      'amazon',
      'walmart',
      'target',
      'best buy',
      'costco',
      'ebay',
      'newegg',
      'b&h',
      'home depot',
      'office depot',
    ];

    console.log('\n📊 Analyzing results:');
    console.log('-'.repeat(60));

    for (let i = 0; i < shoppingResults.length; i++) {
      const result = shoppingResults[i];
      const source = (result.source || '').toLowerCase();
      const priceText = result.price || '0';
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

      storesFound.add(source);

      console.log(`\n${i + 1}. ${result.title || 'No title'}`);
      console.log(`   Store: ${result.source || 'Unknown'}`);
      console.log(`   Price: ${priceText} (parsed: $${price})`);
      console.log(`   Has image: ${result.thumbnail ? 'Yes' : 'No'}`);

      // Check why it might be filtered
      const reasons: string[] = [];

      if (source.includes('amazon')) {
        reasons.push('Amazon (excluded in multi-store search)');
      }

      if (price <= 0) {
        reasons.push(`Invalid price: ${priceText}`);
      }

      const isPreferred = preferredStores.some(pref => source.includes(pref.toLowerCase()));
      if (!isPreferred && shoppingResults.length > 20) {
        reasons.push('Not a preferred store');
      }

      if (reasons.length > 0) {
        storesFiltered.push(`${result.source} (${reasons.join(', ')})`);
        console.log(`   ⏭️ Would be filtered: ${reasons.join(', ')}`);
      } else {
        storesIncluded.push(result.source || 'Unknown');
        console.log(`   ✅ Would be included`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📈 Summary:');
    console.log(`   Total results: ${shoppingResults.length}`);
    console.log(`   Unique stores found: ${storesFound.size}`);
    console.log(`   Stores that would be included: ${storesIncluded.length}`);
    console.log(`   Stores that would be filtered: ${storesFiltered.length}`);

    if (storesIncluded.length === 0) {
      issues.push('No stores would be included after filtering');
    }

    if (storesIncluded.length < 3) {
      issues.push(`Only ${storesIncluded.length} stores would be included (expected 5+)`);
    }

    return {
      query,
      totalResults: shoppingResults.length,
      storesFound: Array.from(storesFound),
      storesFiltered,
      storesIncluded,
      issues,
    };
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return {
      query,
      totalResults: 0,
      storesFound: [],
      storesFiltered: [],
      storesIncluded: [],
      issues: [error.message],
    };
  }
}

async function runTests() {
  console.log('🧪 SerpAPI Multi-Store Diagnostic Test');
  console.log('='.repeat(60));
  console.log(`\nAPI Key: ${SERPAPI_KEY ? '✅ Configured' : '❌ Not configured'}`);

  const testQueries = [
    'Airfryer',
    'KitchenAid Stand Mixer',
    'iPhone 15',
    'Samsung TV 55 inch',
    'Nike Air Max',
  ];

  const results: TestResult[] = [];

  for (const query of testQueries) {
    const result = await testSerpAPI(query);
    results.push(result);
    
    // Wait between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 FINAL SUMMARY');
  console.log('='.repeat(60));

  for (const result of results) {
    console.log(`\n${result.query}:`);
    console.log(`  Results: ${result.totalResults}`);
    console.log(`  Stores found: ${result.storesFound.length} (${result.storesFound.slice(0, 5).join(', ')}${result.storesFound.length > 5 ? '...' : ''})`);
    console.log(`  Stores included: ${result.storesIncluded.length}`);
    console.log(`  Issues: ${result.issues.length > 0 ? result.issues.join(', ') : 'None'}`);
  }

  console.log('\n💡 Recommendations:');
  const avgStores = results.reduce((sum, r) => sum + r.storesIncluded.length, 0) / results.length;
  if (avgStores < 3) {
    console.log('  ⚠️ Average stores per query is low. Consider:');
    console.log('     - Checking if SerpAPI key has sufficient quota');
    console.log('     - Adjusting preferred stores list');
    console.log('     - Relaxing price validation');
  } else {
    console.log('  ✅ SerpAPI is returning multiple stores');
  }
}

runTests().catch(console.error);


/**
 * Test Grocery Search - Verify APIs are Working
 * 
 * This script tests the search functionality with common grocery items
 * to verify that PriceAPI and SerpAPI are returning results.
 * 
 * Run: npx ts-node test-grocery-search.ts
 */

const PRICEAPI_KEY = process.env.PRICEAPI_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Top 20 grocery items to test
const TEST_ITEMS = [
  'Milk',
  'Bananas',
  'Bread',
  'Eggs',
  'Chicken Breast',
  'Salmon', // This is seafood!
  'Shrimp', // This is seafood!
  'Ground Beef',
  'Apples',
  'Oranges',
  'Tomatoes',
  'Lettuce',
  'Onions',
  'Potatoes',
  'Rice',
  'Pasta',
  'Cheese',
  'Yogurt',
  'Butter',
  'Cereal',
];

interface TestResult {
  item: string;
  priceApi: 'success' | 'failed' | 'not_configured';
  serpApi: 'success' | 'failed' | 'not_configured';
  priceApiResult?: any;
  serpApiResult?: any;
}

async function testPriceAPI(query: string): Promise<{ success: boolean; result?: any }> {
  if (!PRICEAPI_KEY) {
    return { success: false };
  }

  try {
    // Create job
    const jobPayload = {
      source: 'amazon',
      country: 'us',
      topic: 'product_and_offers',
      key: 'term',
      values: [query],
    };

    const createJobResponse = await fetch(`https://api.priceapi.com/v2/jobs?token=${PRICEAPI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobPayload),
    });

    if (!createJobResponse.ok) {
      return { success: false };
    }

    const jobData = await createJobResponse.json();
    const jobId = jobData.job_id;

    if (!jobId) {
      return { success: false };
    }

    // Wait for job to complete (polling)
    let attempts = 0;
    let jobStatus = 'processing';
    
    while (jobStatus === 'processing' && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`https://api.priceapi.com/v2/jobs/${jobId}?token=${PRICEAPI_KEY}`);
      const statusData = await statusResponse.json();
      jobStatus = statusData.status;
      attempts++;
    }

    if (jobStatus !== 'finished') {
      return { success: false };
    }

    // Get results
    const resultsResponse = await fetch(`https://api.priceapi.com/v2/jobs/${jobId}/download?token=${PRICEAPI_KEY}`);
    const results = await resultsResponse.json();

    return { success: results && results.length > 0, result: results };
  } catch (error) {
    return { success: false };
  }
}

async function testSerpAPI(query: string): Promise<{ success: boolean; result?: any }> {
  if (!SERPAPI_KEY) {
    return { success: false };
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    const shoppingResults = data.shopping_results || [];

    return { success: shoppingResults.length > 0, result: shoppingResults };
  } catch (error) {
    return { success: false };
  }
}

async function testItem(item: string): Promise<TestResult> {
  console.log(`\n🧪 Testing: ${item}`);
  console.log('-'.repeat(60));

  // Test PriceAPI
  let priceApiStatus: 'success' | 'failed' | 'not_configured' = 'not_configured';
  let priceApiResult: any = null;

  if (PRICEAPI_KEY) {
    console.log(`  📡 Testing PriceAPI...`);
    const priceApiTest = await testPriceAPI(item);
    if (priceApiTest.success) {
      priceApiStatus = 'success';
      priceApiResult = priceApiTest.result;
      console.log(`  ✅ PriceAPI: Found ${priceApiTest.result?.length || 0} results`);
    } else {
      priceApiStatus = 'failed';
      console.log(`  ❌ PriceAPI: No results`);
    }
  } else {
    console.log(`  ⚠️  PriceAPI: Not configured (PRICEAPI_KEY missing)`);
  }

  // Test SerpAPI
  let serpApiStatus: 'success' | 'failed' | 'not_configured' = 'not_configured';
  let serpApiResult: any = null;

  if (SERPAPI_KEY) {
    console.log(`  📡 Testing SerpAPI...`);
    const serpApiTest = await testSerpAPI(item);
    if (serpApiTest.success) {
      serpApiStatus = 'success';
      serpApiResult = serpApiTest.result;
      console.log(`  ✅ SerpAPI: Found ${serpApiTest.result?.length || 0} results`);
    } else {
      serpApiStatus = 'failed';
      console.log(`  ❌ SerpAPI: No results`);
    }
  } else {
    console.log(`  ⚠️  SerpAPI: Not configured (SERPAPI_KEY missing)`);
  }

  return {
    item,
    priceApi: priceApiStatus,
    serpApi: serpApiStatus,
    priceApiResult,
    serpApiResult,
  };
}

async function runTests() {
  console.log('🧪 Grocery Search API Test');
  console.log('='.repeat(60));
  console.log(`\n📋 Testing ${TEST_ITEMS.length} items...`);
  console.log(`\nAPI Configuration:`);
  console.log(`  PriceAPI: ${PRICEAPI_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  SerpAPI: ${SERPAPI_KEY ? '✅ Configured' : '❌ Not configured'}`);

  if (!PRICEAPI_KEY && !SERPAPI_KEY) {
    console.log('\n⚠️  No APIs configured! Add PRICEAPI_KEY and/or SERPAPI_KEY to .env');
    return;
  }

  const results: TestResult[] = [];

  // Test first 5 items (to avoid rate limits)
  const itemsToTest = TEST_ITEMS.slice(0, 5);
  
  for (const item of itemsToTest) {
    const result = await testItem(item);
    results.push(result);
    
    // Wait between tests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary:');
  console.log('-'.repeat(60));

  const priceApiSuccess = results.filter(r => r.priceApi === 'success').length;
  const priceApiFailed = results.filter(r => r.priceApi === 'failed').length;
  const serpApiSuccess = results.filter(r => r.serpApi === 'success').length;
  const serpApiFailed = results.filter(r => r.serpApi === 'failed').length;

  console.log(`\nPriceAPI:`);
  console.log(`  ✅ Success: ${priceApiSuccess}/${itemsToTest.length}`);
  console.log(`  ❌ Failed: ${priceApiFailed}/${itemsToTest.length}`);
  console.log(`  ⚠️  Not configured: ${itemsToTest.length - priceApiSuccess - priceApiFailed}/${itemsToTest.length}`);

  console.log(`\nSerpAPI:`);
  console.log(`  ✅ Success: ${serpApiSuccess}/${itemsToTest.length}`);
  console.log(`  ❌ Failed: ${serpApiFailed}/${itemsToTest.length}`);
  console.log(`  ⚠️  Not configured: ${itemsToTest.length - serpApiSuccess - serpApiFailed}/${itemsToTest.length}`);

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Tips:');
  console.log('  - If PriceAPI fails: Check PRICEAPI_KEY in .env');
  console.log('  - If SerpAPI fails: Check SERPAPI_KEY in .env');
  console.log('  - If both fail: Check network connection and API keys');
  console.log('  - "Seafood" won\'t work - use "Salmon" or "Shrimp" instead');
}

runTests().catch(console.error);


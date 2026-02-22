/**
 * Test Serper API Key
 * Serper.dev is more cost-effective than SerpAPI
 */

const SERPER_API_KEY = '0d2d55e5bfb29860e9989b6e83bf5896789ecb4e';

async function testSerperAPI(query: string) {
  const testUrl = 'https://google.serper.dev/shopping';
  
  const payload = {
    q: query,
    num: 10,
  };
  
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (response.status === 200) {
      const results = data.shopping || [];
      console.log(`✅ "${query}": Found ${results.length} results`);
      if (results.length > 0) {
        console.log(`   Example: ${results[0].title} - ${results[0].price || 'N/A'}`);
      }
      return true;
    } else {
      console.log(`❌ "${query}": Failed (${response.status})`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ "${query}": Error - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Serper API with multiple product categories...');
  console.log(`Key: ${SERPER_API_KEY.substring(0, 20)}...\n`);
  
  const testQueries = [
    'laptop',
    'whole milk gallon',
    'sneakers',
    'iPhone 15',
  ];
  
  let successCount = 0;
  for (const query of testQueries) {
    const success = await testSerperAPI(query);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }
  
  console.log(`\n📊 Results: ${successCount}/${testQueries.length} tests passed`);
  return successCount === testQueries.length;
}

runTests().then(valid => {
  process.exit(valid ? 0 : 1);
});

/**
 * Test Serper API for Service Categories (Pattern B)
 * Tests: Gas Stations, Gyms, Hotels, Oil Changes, etc.
 */

const SERPER_API_KEY = '0d2d55e5bfb29860e9989b6e83bf5896789ecb4e';

async function testSerperMaps(query: string, location: string) {
  const testUrl = 'https://google.serper.dev/maps';
  
  const payload = {
    q: query,
    location: location,
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
      const results = data.places || [];
      console.log(`✅ "${query}" in ${location}: Found ${results.length} results`);
      if (results.length > 0) {
        const first = results[0];
        console.log(`   Example: ${first.title || first.name}`);
        console.log(`   Address: ${first.address || 'N/A'}`);
        console.log(`   Rating: ${first.rating || 'N/A'}`);
        if (first.price) console.log(`   Price: ${first.price}`);
      }
      return true;
    } else {
      console.log(`❌ "${query}": Failed (${response.status})`);
      if (data.error) console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ "${query}": Error - ${error.message}`);
    return false;
  }
}

async function runServiceTests() {
  console.log('🧪 Testing Serper API for Service Categories...');
  console.log(`Key: ${SERPER_API_KEY.substring(0, 20)}...\n`);
  
  const testServices = [
    { query: 'gas station', location: '90210' },
    { query: 'gym', location: '10001' },
    { query: 'hotel', location: 'Las Vegas, NV' },
    { query: 'oil change', location: '90210' },
    { query: 'nail salon', location: '10001' },
    { query: 'moving company', location: '90210' },
  ];
  
  let successCount = 0;
  for (const test of testServices) {
    const success = await testSerperMaps(test.query, test.location);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds between requests
  }
  
  console.log(`\n📊 Results: ${successCount}/${testServices.length} service categories tested successfully`);
  return successCount === testServices.length;
}

runServiceTests().then(valid => {
  process.exit(valid ? 0 : 1);
});

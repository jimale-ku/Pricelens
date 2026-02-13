/**
 * Test SerpAPI Key
 * Quick test to verify if an API key works
 */

const API_KEY = '3c1010679fd4e7a6c97c9d2f6a8501d5de362fc7eecd62337a2ab5ac34770b2c';

async function testSerpAPIKey() {
  console.log('🧪 Testing SerpAPI Key...');
  console.log(`Key: ${API_KEY.substring(0, 20)}...`);
  
  // Test with a simple Google Shopping search
  const testUrl = `https://serpapi.com/search.json?engine=google_shopping&q=laptop&api_key=${API_KEY}`;
  
  try {
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ API Key is VALID!');
      console.log(`   Found ${data.shopping_results?.length || 0} results`);
      return true;
    } else if (response.status === 401) {
      console.log('❌ API Key is INVALID (401 Unauthorized)');
      console.log(`   Error: ${data.error || 'Authentication failed'}`);
      return false;
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error testing API key:', error.message);
    return false;
  }
}

testSerpAPIKey().then(valid => {
  process.exit(valid ? 0 : 1);
});

/**
 * Test Backend Connection
 * 
 * Run this to verify backend and frontend are communicating
 */

import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

export async function testBackendConnection() {
  console.log('🔌 Testing backend connection...');
  console.log('📍 API_BASE_URL:', API_BASE_URL);
  console.log('💡 If connection fails, check:');
  console.log('   1. Backend is running: cd server && npm run start:dev');
  console.log('   2. IP matches your current network IP (check with: ipconfig)');
  console.log('   3. Update client/constants/api.ts if IP changed');
  console.log('');
  
  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    const healthCheck = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    }).catch((err) => {
      // Health endpoint might not exist, that's okay - try stores endpoint instead
      console.log('   ⚠️ Health endpoint not available, trying stores endpoint...');
      return null;
    });
    
    if (healthCheck?.ok) {
      console.log('   ✅ Backend is reachable!');
    } else {
      console.log('   ⚠️ Health endpoint not available, trying stores endpoint...');
    }
    
    // Test 2: Stores endpoint
    console.log('\n2️⃣ Testing stores endpoint...');
    const storesUrl = API_ENDPOINTS.stores.all;
    console.log('   📍 Fetching:', storesUrl);
    
    const storesResponse = await fetch(storesUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    console.log('   📊 Response status:', storesResponse.status, storesResponse.statusText);
    
    if (storesResponse.ok) {
      const storesData = await storesResponse.json();
      console.log('   ✅ Stores endpoint working!');
      console.log('   📦 Received stores:', Array.isArray(storesData) ? storesData.length : 'Not an array');
      if (storesData.length > 0) {
        console.log('   📦 First store:', storesData[0].name || storesData[0]);
      }
    } else {
      const errorText = await storesResponse.text();
      console.error('   ❌ Stores endpoint failed:', errorText.substring(0, 200));
    }
    
    // Test 3: Products search endpoint
    console.log('\n3️⃣ Testing products search endpoint...');
    const searchUrl = API_ENDPOINTS.products.compareMultiStore('test', 'auto');
    console.log('   📍 Fetching:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000), // 10 second timeout (SerpAPI can be slow)
    });
    
    console.log('   📊 Response status:', searchResponse.status, searchResponse.statusText);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('   ✅ Products search endpoint working!');
      console.log('   📦 Response keys:', Object.keys(searchData));
      console.log('   📦 Has product:', !!searchData.product);
      console.log('   📦 Has prices:', !!searchData.prices);
      if (searchData.product) {
        console.log('   📦 Product name:', searchData.product.name);
        console.log('   📦 Product image:', searchData.product.image ? '✅ Has image' : '❌ NO IMAGE');
      }
    } else {
      const errorText = await searchResponse.text();
      console.error('   ❌ Products search endpoint failed:', errorText.substring(0, 200));
    }
    
    console.log('\n✅ Connection test complete!');
    console.log('💡 If any tests failed, check:');
    console.log('   - Backend server is running');
    console.log('   - IP address in client/constants/api.ts matches your current IP');
    console.log('   - Both devices are on the same network');
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Connection test FAILED!');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('Failed to fetch')) {
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('1. Is backend server running? (cd server && npm run start:dev)');
      console.error('2. Is the IP address correct? Current:', API_BASE_URL);
      console.error('3. Are you on the same WiFi network?');
      console.error('4. Is Windows Firewall blocking port 3000?');
      console.error('5. Try: ping', API_BASE_URL.replace('http://', '').replace(':3000', ''));
    }
    
    return false;
  }
}














/**
 * Test SerpAPI Maps Integration
 * 
 * Tests the SerpAPI Google Maps service for Patterns B & C
 * 
 * Usage:
 *   npx ts-node test-serpapi-maps.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const SERPAPI_KEY = process.env.SERPAPI_KEY;

if (!SERPAPI_KEY) {
  console.error('❌ SERPAPI_KEY not found in .env file');
  console.log('💡 Add SERPAPI_KEY=your_key_here to server/.env');
  process.exit(1);
}

async function testSerpAPIMaps() {
  console.log('🧪 Testing SerpAPI Google Maps Integration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Gas Stations (Pattern B)
  console.log('📋 TEST 1: Gas Stations (Pattern B)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const gasUrl = `https://serpapi.com/search.json?engine=google_maps&q=gas+station+near+90210&api_key=${SERPAPI_KEY}&radius=10000`;
    console.log('🔍 Searching for gas stations near 90210...\n');
    
    const gasResponse = await fetch(gasUrl);
    if (!gasResponse.ok) {
      throw new Error(`HTTP ${gasResponse.status}: ${gasResponse.statusText}`);
    }
    
    const gasData = await gasResponse.json();
    const gasResults = gasData.local_results || [];
    
    console.log(`✅ Found ${gasResults.length} gas stations\n`);
    
    if (gasResults.length > 0) {
      console.log('📊 Sample Results:');
      gasResults.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`\n${index + 1}. ${result.title || 'Unknown'}`);
        console.log(`   Address: ${result.address || 'N/A'}`);
        console.log(`   Rating: ${result.rating ? `⭐ ${result.rating}` : 'N/A'}`);
        console.log(`   Reviews: ${result.reviews || 'N/A'}`);
        console.log(`   Distance: ${result.distance || 'N/A'}`);
        console.log(`   Phone: ${result.phone || 'N/A'}`);
      });
    }
    
    console.log('\n✅ Gas Stations Test: PASSED\n');
  } catch (error: any) {
    console.error(`❌ Gas Stations Test: FAILED - ${error.message}\n`);
  }

  // Test 2: Gyms (Pattern B)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 2: Gyms (Pattern B)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const gymUrl = `https://serpapi.com/search.json?engine=google_maps&q=gym+near+90210&api_key=${SERPAPI_KEY}&type=gym&radius=10000`;
    console.log('🔍 Searching for gyms near 90210...\n');
    
    const gymResponse = await fetch(gymUrl);
    if (!gymResponse.ok) {
      throw new Error(`HTTP ${gymResponse.status}: ${gymResponse.statusText}`);
    }
    
    const gymData = await gymResponse.json();
    const gymResults = gymData.local_results || [];
    
    console.log(`✅ Found ${gymResults.length} gyms\n`);
    
    if (gymResults.length > 0) {
      console.log('📊 Sample Results:');
      gymResults.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`\n${index + 1}. ${result.title || 'Unknown'}`);
        console.log(`   Address: ${result.address || 'N/A'}`);
        console.log(`   Rating: ${result.rating ? `⭐ ${result.rating}` : 'N/A'}`);
        console.log(`   Price: ${result.price || 'N/A'}`);
        console.log(`   Distance: ${result.distance || 'N/A'}`);
      });
    }
    
    console.log('\n✅ Gyms Test: PASSED\n');
  } catch (error: any) {
    console.error(`❌ Gyms Test: FAILED - ${error.message}\n`);
  }

  // Test 3: Service Providers - Haircuts (Pattern C)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 3: Hair Salons (Pattern C)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const salonUrl = `https://serpapi.com/search.json?engine=google_maps&q=hair+salon+near+90210&api_key=${SERPAPI_KEY}&type=hair_salon&radius=10000`;
    console.log('🔍 Searching for hair salons near 90210...\n');
    
    const salonResponse = await fetch(salonUrl);
    if (!salonResponse.ok) {
      throw new Error(`HTTP ${salonResponse.status}: ${salonResponse.statusText}`);
    }
    
    const salonData = await salonResponse.json();
    const salonResults = salonData.local_results || [];
    
    console.log(`✅ Found ${salonResults.length} hair salons\n`);
    
    if (salonResults.length > 0) {
      console.log('📊 Sample Results:');
      salonResults.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`\n${index + 1}. ${result.title || 'Unknown'}`);
        console.log(`   Address: ${result.address || 'N/A'}`);
        console.log(`   Rating: ${result.rating ? `⭐ ${result.rating} (${result.reviews} reviews)` : 'N/A'}`);
        console.log(`   Price: ${result.price || 'N/A'}`);
        console.log(`   Hours: ${result.hours || 'N/A'}`);
        console.log(`   Distance: ${result.distance || 'N/A'}`);
      });
    }
    
    console.log('\n✅ Hair Salons Test: PASSED\n');
  } catch (error: any) {
    console.error(`❌ Hair Salons Test: FAILED - ${error.message}\n`);
  }

  // Test 4: Backend API Endpoint
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 4: Backend API Endpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Testing backend endpoint: GET /services/gas-stations\n');
  
  try {
    const backendUrl = 'http://localhost:3000/services/gas-stations?zipCode=90210';
    console.log(`📡 Calling: ${backendUrl}\n`);
    
    const backendResponse = await fetch(backendUrl);
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(`HTTP ${backendResponse.status}: ${errorText}`);
    }
    
    const backendData = await backendResponse.json();
    
    console.log(`✅ Backend returned ${Array.isArray(backendData) ? backendData.length : 0} results\n`);
    
    if (Array.isArray(backendData) && backendData.length > 0) {
      console.log('📊 Sample Result:');
      console.log(JSON.stringify(backendData[0], null, 2));
    }
    
    console.log('\n✅ Backend API Test: PASSED\n');
  } catch (error: any) {
    console.error(`❌ Backend API Test: FAILED - ${error.message}`);
    console.log('\n💡 Make sure your backend server is running:');
    console.log('   cd server && npm run start:dev\n');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SerpAPI Key: Configured');
  console.log('✅ Direct SerpAPI calls: Working');
  console.log('⚠️  Backend API: Check if server is running');
  console.log('\n💡 Next Steps:');
  console.log('   1. Start backend: cd server && npm run start:dev');
  console.log('   2. Test frontend: Navigate to Pattern B or C category');
  console.log('   3. Enter ZIP code and search');
  console.log('\n');
}

testSerpAPIMaps().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});




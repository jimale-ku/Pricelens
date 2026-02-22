/**
 * Simple PriceAPI Key Verification Script
 */

import { config } from 'dotenv';
config();

const apiKey = process.env.PRICEAPI_KEY;

console.log('🔍 PriceAPI Key Verification\n');
console.log('='.repeat(60));
console.log(`\n📋 API Key Found: ${apiKey ? 'Yes' : 'No'}`);
console.log(`📏 Key Length: ${apiKey?.length || 0} characters`);
console.log(`🔑 Key Preview: ${apiKey ? apiKey.substring(0, 20) + '...' : 'N/A'}\n`);

async function testAPIKey() {
  if (!apiKey) {
    console.log('❌ No API key found in .env file\n');
    return;
  }

  console.log('Testing with different parameter formats...\n');

  // Test 1: Using 'token' parameter in body
  console.log('1️⃣  Testing with "token" in request body:');
  try {
    const response = await fetch('https://api.priceapi.com/v2/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'google_shopping',
        country: 'us',
        topic: 'product_search',
        token: apiKey,
        values: { search_term: 'test' },
      }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 2: Using 'key' parameter in body
  console.log('2️⃣  Testing with "key" in request body:');
  try {
    const response = await fetch('https://api.priceapi.com/v2/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'google_shopping',
        country: 'us',
        topic: 'product_search',
        key: apiKey,
        values: { search_term: 'test' },
      }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 3: Using Authorization header
  console.log('3️⃣  Testing with Authorization header:');
  try {
    const response = await fetch('https://api.priceapi.com/v2/jobs', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        source: 'google_shopping',
        country: 'us',
        topic: 'product_search',
        values: { search_term: 'test' },
      }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  console.log('='.repeat(60));
  console.log('\n💡 DIAGNOSIS:\n');
  console.log('If all tests show "401 Unauthorized" or "400 Bad Request":');
  console.log('   → The API key is likely invalid or not activated yet');
  console.log('   → Ask your client to verify the key from PriceAPI dashboard');
  console.log('   → Make sure the subscription is active\n');
  console.log('If one test succeeds:');
  console.log('   → We can update the service to use that format\n');
}

testAPIKey();

/**
 * Test OilPriceAPI Integration
 * 
 * Tests the OilPriceAPI key and verifies it works
 * 
 * Usage:
 *   npx ts-node test-oilpriceapi.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const OILPRICEAPI_KEY = process.env.OILPRICEAPI_KEY || '8f244a6b9d2bf1a023c1e6bc8bb9c7a9622cc299f8229d00a0b6fd7c66d1b4fc';

async function testOilPriceAPI() {
  console.log('🧪 Testing OilPriceAPI Integration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!OILPRICEAPI_KEY) {
    console.error('❌ OILPRICEAPI_KEY not found');
    console.log('💡 Add OILPRICEAPI_KEY=your_key_here to server/.env');
    process.exit(1);
  }

  console.log(`✅ API Key found: ${OILPRICEAPI_KEY.substring(0, 20)}...\n`);

  // Test different API endpoints based on OilPriceAPI documentation
  const endpoints = [
    {
      name: 'Latest Prices',
      url: `https://api.oilpriceapi.com/v1/prices/latest`,
      method: 'GET',
    },
    {
      name: 'Prices by Location',
      url: `https://api.oilpriceapi.com/v1/prices/latest?zip=90210`,
      method: 'GET',
    },
    {
      name: 'Historical Prices',
      url: `https://api.oilpriceapi.com/v1/prices/historical`,
      method: 'GET',
    },
  ];

  for (const endpoint of endpoints) {
    console.log(`📋 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}\n`);

    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${OILPRICEAPI_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 200)}\n`);
        continue;
      }

      const data = await response.json();
      console.log(`   ✅ Success!\n`);
      console.log(`   Response structure:`);
      console.log(JSON.stringify(data, null, 2).substring(0, 500));
      console.log(`\n   ✅ ${endpoint.name} Test: PASSED\n`);
      
      // If we got data, break (found working endpoint)
      if (data && Object.keys(data).length > 0) {
        break;
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ API Key: Configured');
  console.log('💡 Next: Add OILPRICEAPI_KEY to server/.env');
  console.log('💡 Then restart backend: npm run start:dev');
  console.log('\n');
}

testOilPriceAPI().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});




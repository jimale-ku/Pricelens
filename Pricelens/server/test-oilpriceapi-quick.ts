/**
 * Quick OilPriceAPI Test
 * 
 * Tests if the API key works
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.OILPRICEAPI_KEY;

if (!API_KEY) {
  console.error('❌ OILPRICEAPI_KEY not found in .env');
  process.exit(1);
}

console.log('🧪 Testing OilPriceAPI...\n');
console.log(`Key: ${API_KEY.substring(0, 20)}...\n`);

// Try the API endpoint
async function test() {
  try {
    // Try different possible endpoints
    const endpoints = [
      'https://api.oilpriceapi.com/v1/prices/latest',
      'https://api.oilpriceapi.com/v1/prices',
      'https://api.oilpriceapi.com/v1/latest',
    ];

    for (const endpoint of endpoints) {
      console.log(`Trying: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
        return;
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error.substring(0, 200)}\n`);
      }
    }

    console.log('\n⚠️  None of the endpoints worked.');
    console.log('💡 Check OilPriceAPI documentation for correct endpoint format.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

test();




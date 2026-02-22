/**
 * Test OilPriceAPI Gas Price Estimation
 * 
 * Tests if OilPriceAPI is providing estimated gas prices correctly
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const OILPRICEAPI_KEY = process.env.OILPRICEAPI_KEY;

if (!OILPRICEAPI_KEY) {
  console.error('❌ OILPRICEAPI_KEY not found in .env');
  process.exit(1);
}

async function testOilPriceAPIGasPrices() {
  console.log('🧪 Testing OilPriceAPI Gas Price Estimation\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get wholesale gasoline price
    const url = `https://api.oilpriceapi.com/v1/prices/latest?by_code=GASOLINE_USD`;
    
    console.log('📋 Fetching wholesale gasoline price...\n');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${OILPRICEAPI_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.status === 'success' && data.data?.GASOLINE_USD) {
      const wholesalePrice = data.data.GASOLINE_USD.price;
      const wholesalePerBarrel = wholesalePrice;
      
      // Calculate estimated retail price
      const wholesalePerGallon = wholesalePerBarrel / 42;
      const markup = 0.75; // Average retailer markup
      const taxes = 0.30; // Average state/local taxes
      const estimatedRetail = wholesalePerGallon + markup + taxes;
      
      console.log('✅ Wholesale Price Data:');
      console.log(`   Wholesale (per barrel): $${wholesalePerBarrel.toFixed(2)}`);
      console.log(`   Wholesale (per gallon): $${wholesalePerGallon.toFixed(2)}`);
      console.log(`   Markup: $${markup.toFixed(2)}`);
      console.log(`   Taxes: $${taxes.toFixed(2)}`);
      console.log(`\n💰 Estimated Retail Price: ~$${estimatedRetail.toFixed(2)}/gallon\n`);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SUCCESS! OilPriceAPI is working!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('💡 This estimated price will show for all gas stations');
      console.log('   (since we\'re using wholesale + estimation, not station-level data)\n');
    } else {
      console.error('❌ Unexpected response format:', JSON.stringify(data, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testOilPriceAPIGasPrices().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});



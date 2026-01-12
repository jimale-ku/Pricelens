/**
 * Test PriceAPI for "decorative pillow"
 * 
 * Usage:
 *   cd server
 *   npx ts-node test-decorative-pillow.ts
 */

import { config } from 'dotenv';
import { PriceApiService } from './src/integrations/services/priceapi.service';
import { ConfigService } from '@nestjs/config';

// Load environment variables
config();

class MockConfigService {
  get(key: string, defaultValue?: any): any {
    return process.env[key] || defaultValue;
  }
}

async function testDecorativePillow() {
  console.log('🧪 Testing PriceAPI for "decorative pillow"\n');
  console.log('='.repeat(60));
  
  const configService = new MockConfigService() as any;
  const priceApiService = new PriceApiService(configService);
  
  // Check if API is enabled
  console.log('\n1️⃣ Checking API Status:');
  const isEnabled = priceApiService.isEnabled();
  console.log(`   Enabled: ${isEnabled}`);
  
  if (!isEnabled) {
    console.log('\n❌ PriceAPI is not enabled!');
    console.log('   Please add PRICEAPI_KEY to your .env file\n');
    console.log('   Example: PRICEAPI_KEY=your_key_here\n');
    return;
  }
  
  console.log('   ✅ API Key detected!\n');
  
  // Test search for "decorative pillow"
  console.log('2️⃣ Testing Search: "decorative pillow"');
  console.log('-'.repeat(60));
  console.log('   ⏳ This may take 2-5 seconds (PriceAPI uses async jobs)...\n');
  
  try {
    const startTime = Date.now();
    const results = await priceApiService.searchProducts('decorative pillow', {
      limit: 10,
    });
    const duration = Date.now() - startTime;
    
    if (results.length === 0) {
      console.log('   ⚠️  No results found\n');
      console.log('   Possible reasons:');
      console.log('   - PriceAPI may not have data for this search term');
      console.log('   - API quota may be exceeded');
      console.log('   - Network/API error occurred\n');
    } else {
      console.log(`   ✅ Found ${results.length} products (took ${duration}ms):\n`);
      
      results.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Store: ${product.store}`);
        console.log(`      Price: $${product.price.toFixed(2)} ${product.currency}`);
        console.log(`      Shipping: $${(product.shipping || 0).toFixed(2)}`);
        console.log(`      In Stock: ${product.inStock ? '✅ Yes' : '❌ No'}`);
        console.log(`      Image: ${product.image ? '✅ ' + product.image.substring(0, 60) + '...' : '❌ No image'}`);
        console.log(`      URL: ${product.url.substring(0, 60)}...`);
        if (product.barcode) {
          console.log(`      Barcode: ${product.barcode}`);
        }
        console.log('');
      });
      
      // Summary
      console.log('   📊 Summary:');
      console.log(`      Total products: ${results.length}`);
      const withImages = results.filter(p => p.image).length;
      console.log(`      Products with images: ${withImages}/${results.length}`);
      const avgPrice = results.reduce((sum, p) => sum + p.price, 0) / results.length;
      console.log(`      Average price: $${avgPrice.toFixed(2)}`);
      const stores = [...new Set(results.map(p => p.store))];
      console.log(`      Stores: ${stores.join(', ')}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
    console.log('   Stack trace:');
    console.log(error.stack);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!\n');
}

// Run the test
testDecorativePillow().catch(console.error);


/**
 * Test PriceAPI for "apple" (groceries)
 * 
 * Usage:
 *   cd server
 *   npx ts-node test-apple.ts
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

async function testApple() {
  console.log('🧪 Testing PriceAPI for "apple" (Groceries)\n');
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
    return;
  }
  
  console.log('   ✅ API Key detected!\n');
  
  // Test search for "apple"
  console.log('2️⃣ Testing Search: "apple"');
  console.log('-'.repeat(60));
  console.log('   ⏳ This may take 2-5 seconds (PriceAPI uses async jobs)...\n');
  
  try {
    const startTime = Date.now();
    const results = await priceApiService.searchProducts('apple', {
      limit: 10,
    });
    const duration = Date.now() - startTime;
    
    if (results.length === 0) {
      console.log('   ⚠️  No results found\n');
    } else {
      console.log(`   ✅ Found ${results.length} products (took ${duration}ms):\n`);
      
      results.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Store: ${product.store}`);
        console.log(`      Price: $${product.price.toFixed(2)} ${product.currency}`);
        console.log(`      Shipping: $${(product.shipping || 0).toFixed(2)}`);
        console.log(`      In Stock: ${product.inStock ? '✅ Yes' : '❌ No'}`);
        console.log(`      Image: ${product.image ? '✅ ' + product.image.substring(0, 70) + '...' : '❌ No image'}`);
        console.log(`      URL: ${product.url.substring(0, 60)}...`);
        if (product.barcode) {
          console.log(`      Barcode: ${product.barcode}`);
        }
        console.log('');
      });
      
      // Summary
      console.log('   📊 Summary:');
      console.log(`      Total products: ${results.length}`);
      const withImages = results.filter(p => p.image && p.image.length > 0).length;
      console.log(`      Products with images: ${withImages}/${results.length} (${Math.round(withImages/results.length*100)}%)`);
      const avgPrice = results.reduce((sum, p) => sum + p.price, 0) / results.length;
      console.log(`      Average price: $${avgPrice.toFixed(2)}`);
      const stores = [...new Set(results.map(p => p.store))];
      console.log(`      Stores: ${stores.join(', ')}`);
      
      // Show first image URL in detail
      if (results[0]?.image) {
        console.log(`\n   🖼️  First product image URL:`);
        console.log(`      ${results[0].image}`);
      }
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
testApple().catch(console.error);














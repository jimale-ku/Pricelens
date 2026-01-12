/**
 * Test ThinkPad Search
 */

import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { PriceApiService } from './src/integrations/services/priceapi.service';

config();

class MockConfigService {
  get(key: string, defaultValue?: any): any {
    return process.env[key] || defaultValue;
  }
}

async function testThinkPad() {
  console.log('🔍 Testing ThinkPad Search\n');
  console.log('='.repeat(60));
  
  const configService = new MockConfigService();
  const priceApiService = new PriceApiService(configService as any);
  
  const searchQueries = [
    'Thinkpad covo core i7 black X1',
    'ThinkPad X1 Carbon Core i7',
    'ThinkPad X1 Carbon i7',
  ];
  
  for (const query of searchQueries) {
    console.log(`\n📊 Searching: "${query}"`);
    console.log('-'.repeat(60));
    
    try {
      const results = await priceApiService.searchProducts(query, {
        limit: 5,
      });
      
      if (results.length === 0) {
        console.log('   ⚠️  No results found\n');
      } else {
        console.log(`   ✅ Found ${results.length} products:\n`);
        results.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name}`);
          console.log(`      Store: ${product.store}`);
          console.log(`      Price: $${product.price.toFixed(2)}`);
          console.log(`      Image: ${product.image ? '✅ ' + product.image.substring(0, 60) + '...' : '❌ No image'}`);
          console.log(`      URL: ${product.url}`);
          console.log('');
        });
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log('✅ Test Complete!\n');
}

testThinkPad().catch(console.error);


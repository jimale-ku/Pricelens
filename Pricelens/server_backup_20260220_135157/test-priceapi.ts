/**
 * PriceAPI Integration Test Script
 * 
 * This script tests the PriceAPI integration to verify it's working correctly.
 * 
 * Usage:
 *   ts-node test-priceapi.ts
 */

import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { PriceApiService } from './src/integrations/services/priceapi.service';

// Load environment variables from .env file
config();

class MockConfigService {
  get(key: string, defaultValue?: any): any {
    // Load from environment
    return process.env[key] || defaultValue;
  }
}

async function testPriceAPI() {
  console.log('🧪 Testing PriceAPI Integration\n');
  console.log('='.repeat(50));
  
  const configService = new MockConfigService();
  const priceApiService = new PriceApiService(configService as any);
  
  // Check if API is enabled
  console.log('\n1️⃣ Checking API Status:');
  console.log(`   Enabled: ${priceApiService.isEnabled()}`);
  
  if (!priceApiService.isEnabled()) {
    console.log('\n❌ PriceAPI is not enabled!');
    console.log('   Please add PRICEAPI_KEY to your .env file\n');
    return;
  }
  
  console.log('   ✅ API Key detected!\n');
  
  // Test 1: Search for iPhone
  console.log('2️⃣ Test Search: "iPhone 15"');
  console.log('-'.repeat(50));
  try {
    const results = await priceApiService.searchProducts('iPhone 15', {
      stores: ['walmart', 'amazon', 'target'],
      limit: 5,
    });
    
    if (results.length === 0) {
      console.log('   ⚠️  No results found\n');
    } else {
      console.log(`   ✅ Found ${results.length} products:\n`);
      results.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Store: ${product.store}`);
        console.log(`      Price: $${product.price}`);
        console.log(`      In Stock: ${product.inStock ? 'Yes' : 'No'}`);
        console.log(`      URL: ${product.url}`);
        console.log(`      Image: ${product.image ? '✅ ' + product.image : '❌ No image'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Test 2: Search for laptops
  console.log('3️⃣ Test Search: "laptop"');
  console.log('-'.repeat(50));
  try {
    const results = await priceApiService.searchProducts('laptop', {
      limit: 3,
      minPrice: 300,
      maxPrice: 1000,
    });
    
    if (results.length === 0) {
      console.log('   ⚠️  No results found\n');
    } else {
      console.log(`   ✅ Found ${results.length} products:\n`);
      results.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Store: ${product.store}`);
        console.log(`      Price: $${product.price}`);
        console.log(`      Image: ${product.image ? '✅ ' + product.image : '❌ No image'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Test 3: Search for groceries
  console.log('4️⃣ Test Search: "coffee beans"');
  console.log('-'.repeat(50));
  try {
    const results = await priceApiService.searchProducts('coffee beans', {
      limit: 3,
    });
    
    if (results.length === 0) {
      console.log('   ⚠️  No results found\n');
    } else {
      console.log(`   ✅ Found ${results.length} products:\n`);
      results.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Store: ${product.store}`);
        console.log(`      Price: $${product.price}`);
        console.log(`      Image: ${product.image ? '✅ ' + product.image : '❌ No image'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  console.log('='.repeat(50));
  console.log('✅ PriceAPI Integration Test Complete!\n');
}

// Run the test
testPriceAPI().catch(console.error);

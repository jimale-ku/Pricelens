/**
 * Test Amazon Adapter
 * 
 * Tests the Amazon Product Advertising API adapter
 * 
 * Usage:
 *   npx ts-node test-amazon-adapter.ts
 * 
 * Prerequisites:
 *   - Add to server/.env:
 *     AMAZON_ACCESS_KEY_ID=your_key
 *     AMAZON_SECRET_ACCESS_KEY=your_secret
 *     AMAZON_ASSOCIATE_TAG=your_tag
 */

import { AmazonAdapter } from './src/integrations/adapters/amazon/amazon.adapter';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testAmazonAdapter() {
  console.log('🧪 Testing Amazon Adapter\n');
  console.log('📝 Note: This test requires Amazon Product Advertising API credentials\n');

  // Simple ConfigService mock
  const configService = {
    get: (key: string, defaultValue?: string) => {
      return process.env[key] || defaultValue;
    },
  };

  // Create adapter
  const adapter = new AmazonAdapter(configService as any);

  // Test 1: Check if enabled
  console.log('📋 Test 1: Check if adapter is enabled');
  const isEnabled = adapter.isEnabled();
  console.log(`   Enabled: ${isEnabled ? '✅' : '❌'}`);
  
  if (!isEnabled) {
    console.log('\n⚠️  Amazon adapter is not configured!');
    console.log('💡 Add to server/.env:');
    console.log('   AMAZON_ACCESS_KEY_ID=your_key');
    console.log('   AMAZON_SECRET_ACCESS_KEY=your_secret');
    console.log('   AMAZON_ASSOCIATE_TAG=your_tag');
    console.log('\n📖 Get credentials from: https://affiliate-program.amazon.com/');
    return;
  }

  // Test 2: Get store info
  console.log('\n📋 Test 2: Get store information');
  const storeInfo = adapter.getStoreInfo();
  console.log(`   Store: ${storeInfo.name}`);
  console.log(`   Type: ${storeInfo.type}`);
  console.log(`   Logo: ${storeInfo.logo}`);

  // Test 3: Test connection
  console.log('\n📋 Test 3: Test connection');
  try {
    const connectionTest = await adapter.testConnection();
    console.log(`   Connection: ${connectionTest ? '✅' : '❌'}`);
  } catch (error: any) {
    console.log(`   Connection: ❌ ${error.message}`);
  }

  // Test 4: Search products
  console.log('\n📋 Test 4: Search products ("iPhone 15")');
  try {
    const startTime = Date.now();
    const products = await adapter.searchProducts('iPhone 15', { limit: 5 });
    const searchTime = Date.now() - startTime;

    console.log(`   Found: ${products.length} products`);
    console.log(`   Time: ${searchTime}ms`);

    if (products.length > 0) {
      const firstProduct = products[0];
      console.log(`\n   First Product:`);
      console.log(`   - Name: ${firstProduct.name}`);
      console.log(`   - Brand: ${firstProduct.brand || 'N/A'}`);
      console.log(`   - Barcode: ${firstProduct.barcode || 'N/A'}`);
      console.log(`   - Prices: ${firstProduct.prices.length}`);
      
      if (firstProduct.prices.length > 0) {
        const firstPrice = firstProduct.prices[0];
        console.log(`   - Price: ${firstPrice.formattedPrice || `$${firstPrice.price}`}`);
        console.log(`   - In Stock: ${firstPrice.inStock ? '✅' : '❌'}`);
        console.log(`   - URL: ${firstPrice.url}`);
      }
    }
  } catch (error: any) {
    console.log(`   Search failed: ❌ ${error.message}`);
    if (error.stack) {
      console.log(`   Stack: ${error.stack}`);
    }
  }

  // Test 5: Get health status
  console.log('\n📋 Test 5: Get health status');
  const health = adapter.getHealthStatus();
  console.log(`   Status: ${health.status}`);
  console.log(`   Healthy: ${health.isHealthy ? '✅' : '❌'}`);
  console.log(`   Consecutive Failures: ${health.consecutiveFailures}`);
  if (health.lastSuccess) {
    console.log(`   Last Success: ${health.lastSuccess.toISOString()}`);
  }
  if (health.lastFailure) {
    console.log(`   Last Failure: ${health.lastFailure.toISOString()}`);
  }

  console.log('\n✅ Amazon adapter test complete!');
}

// Run tests
testAmazonAdapter().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});


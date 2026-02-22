/**
 * Test eBay Adapter
 * 
 * Tests the eBay Browse API adapter
 * 
 * Usage:
 *   npx ts-node test-ebay-adapter.ts
 * 
 * Prerequisites:
 *   - Add to server/.env:
 *     EBAY_CLIENT_ID=your_client_id
 * 
 * Note: eBay Browse API may require OAuth 2.0 for some endpoints.
 * Check eBay API documentation for the latest authentication requirements.
 */

import { EbayAdapter } from './src/integrations/adapters/ebay/ebay.adapter';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file in the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Mock ConfigService for standalone testing
class MockConfigService {
  get(key: string, defaultValue?: any): any {
    return process.env[key] || defaultValue;
  }
}

async function testEbayAdapter() {
  console.log('🧪 Testing eBay Adapter\n');

  const configService = new MockConfigService();
  const adapter = new EbayAdapter(configService as any);

  // Test 1: Check if enabled
  console.log('📋 Test 1: Check if adapter is enabled');
  const isEnabled = adapter.isEnabled();
  console.log(`   Enabled: ${isEnabled ? '✅' : '❌'}`);
  
  if (!isEnabled) {
    console.log('\n⚠️  eBay adapter is not configured!');
    console.log('💡 Add to server/.env:');
    console.log('   EBAY_CLIENT_ID=your_client_id');
    console.log('\n📖 Get Client ID from: https://developer.ebay.com/');
    console.log('\n⚠️  Note: eBay Browse API may require OAuth 2.0 authentication.');
    console.log('   Check the eBay API documentation for the latest requirements.');
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
      console.log(`   - Image URL: ${firstProduct.image || 'N/A'}`);
      console.log(`   - Product URL: ${firstProduct.url || 'N/A'}`);
      console.log(`   - Prices: ${firstProduct.prices.length}`);
      
      if (firstProduct.prices.length > 0) {
        const firstPrice = firstProduct.prices[0];
        console.log(`   - Price: ${firstPrice.formattedPrice || `$${firstPrice.price.toFixed(2)}`} ${firstPrice.currency}`);
        console.log(`   - Total Price: $${firstPrice.totalPrice?.toFixed(2) || 'N/A'}`);
        console.log(`   - In Stock: ${firstPrice.inStock ? '✅' : '❌'}`);
        console.log(`   - Seller: ${firstPrice.metadata?.seller || 'N/A'}`);
        console.log(`   - Last Updated: ${firstPrice.fetchedAt.toLocaleString()}`);
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

  console.log('\n✅ eBay adapter test complete!');
}

// Run tests
testEbayAdapter().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});







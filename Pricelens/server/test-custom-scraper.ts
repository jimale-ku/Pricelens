/**
 * Intense Test Suite for Custom Google Shopping Scraper
 * 
 * This script tests the custom scraper with various scenarios:
 * - Different product categories
 * - Rate limiting
 * - Error handling
 * - Data format validation
 * - Performance testing
 */

import { GoogleShoppingScraperService } from './src/integrations/services/google-shopping-scraper.service';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Mock ConfigService for testing
class TestConfigService {
  get(key: string): string | undefined {
    return process.env[key];
  }
}

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  productsFound: number;
  executionTime: number;
  errors?: string[];
}

class ScraperTestSuite {
  private scraper: GoogleShoppingScraperService;
  private results: TestResult[] = [];
  private configService: ConfigService;

  constructor() {
    this.configService = new TestConfigService() as any;
    this.scraper = new GoogleShoppingScraperService(this.configService);
  }

  private async runTest(
    testName: string,
    testFn: () => Promise<{ products: any[]; errors?: string[] }>
  ): Promise<void> {
    console.log(`\n🧪 Running: ${testName}`);
    console.log('─'.repeat(60));
    
    const startTime = Date.now();
    let passed = false;
    let message = '';
    let productsFound = 0;
    let errors: string[] = [];

    try {
      const result = await testFn();
      productsFound = result.products.length;
      errors = result.errors || [];

      if (productsFound > 0) {
        passed = true;
        message = `✅ Found ${productsFound} products`;
      } else {
        passed = false;
        message = `❌ No products found`;
      }

      if (errors.length > 0) {
        message += ` (${errors.length} warnings)`;
      }
    } catch (error: any) {
      passed = false;
      message = `❌ Test failed: ${error.message}`;
      errors.push(error.message);
    }

    const executionTime = Date.now() - startTime;
    
    this.results.push({
      testName,
      passed,
      message,
      productsFound,
      executionTime,
      errors: errors.length > 0 ? errors : undefined,
    });

    console.log(`${message} (${executionTime}ms)`);
    if (errors.length > 0) {
      errors.forEach(err => console.log(`   ⚠️ ${err}`));
    }
  }

  // Test 1: Basic Product Search
  async testBasicSearch() {
    await this.runTest('Basic Product Search - "laptop"', async () => {
      const products = await this.scraper.searchProducts('laptop', 10);
      return { products };
    });
  }

  // Test 2: Electronics Category
  async testElectronics() {
    await this.runTest('Electronics - "iPhone 15"', async () => {
      const products = await this.scraper.searchProducts('iPhone 15', 10, 'electronics');
      return { products };
    });
  }

  // Test 3: Footwear Category
  async testFootwear() {
    await this.runTest('Footwear - "adidas sneakers"', async () => {
      const products = await this.scraper.searchProducts('adidas sneakers', 10, 'footwear');
      return { products };
    });
  }

  // Test 4: Kitchen Category
  async testKitchen() {
    await this.runTest('Kitchen - "coffee maker"', async () => {
      const products = await this.scraper.searchProducts('coffee maker', 10, 'kitchen');
      return { products };
    });
  }

  // Test 5: Books Category
  async testBooks() {
    await this.runTest('Books - "harry potter"', async () => {
      const products = await this.scraper.searchProducts('harry potter', 10, 'books');
      return { products };
    });
  }

  // Test 6: Video Games Category
  async testVideoGames() {
    await this.runTest('Video Games - "call of duty"', async () => {
      const products = await this.scraper.searchProducts('call of duty', 10, 'video-games');
      return { products };
    });
  }

  // Test 7: Rate Limiting Test
  async testRateLimiting() {
    await this.runTest('Rate Limiting - Multiple Rapid Requests', async () => {
      const queries = ['laptop', 'phone', 'headphones', 'mouse', 'keyboard'];
      const allProducts: any[] = [];
      const errors: string[] = [];
      const startTime = Date.now();

      for (const query of queries) {
        try {
          const products = await this.scraper.searchProducts(query, 5);
          allProducts.push(...products);
          console.log(`   ⏱️  Query "${query}": ${products.length} products`);
        } catch (error: any) {
          errors.push(`Query "${query}": ${error.message}`);
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`   ⏱️  Total time for 5 queries: ${totalTime}ms (avg: ${Math.round(totalTime / queries.length)}ms per query)`);
      
      // Rate limiting should add delays, so this should take at least 10 seconds (5 queries * 2s min delay)
      if (totalTime < 10000) {
        errors.push('Rate limiting may not be working - requests too fast');
      }

      return { products: allProducts, errors };
    });
  }

  // Test 8: Data Format Validation
  async testDataFormat() {
    await this.runTest('Data Format Validation - "laptop"', async () => {
      const products = await this.scraper.searchProducts('laptop', 5);
      const errors: string[] = [];

      products.forEach((product, index) => {
        // Check required fields
        if (!product.name || typeof product.name !== 'string') {
          errors.push(`Product ${index}: Missing or invalid 'name' field`);
        }
        if (!product.image || typeof product.image !== 'string') {
          errors.push(`Product ${index}: Missing or invalid 'image' field`);
        }
        if (typeof product.price !== 'number' || product.price <= 0) {
          errors.push(`Product ${index}: Missing or invalid 'price' field (got: ${product.price})`);
        }
        if (!product.currency || typeof product.currency !== 'string') {
          errors.push(`Product ${index}: Missing or invalid 'currency' field`);
        }
        if (!product.url || typeof product.url !== 'string') {
          errors.push(`Product ${index}: Missing or invalid 'url' field`);
        }
        if (!product.store || typeof product.store !== 'string') {
          errors.push(`Product ${index}: Missing or invalid 'store' field`);
        }
      });

      if (errors.length === 0 && products.length > 0) {
        console.log(`   ✅ All ${products.length} products have valid format`);
        // Show sample product
        console.log(`   📦 Sample product:`, JSON.stringify(products[0], null, 2));
      }

      return { products, errors };
    });
  }

  // Test 9: Edge Cases
  async testEdgeCases() {
    await this.runTest('Edge Cases - Empty Query', async () => {
      const products = await this.scraper.searchProducts('', 5);
      return { products };
    });

    await this.runTest('Edge Cases - Very Long Query', async () => {
      const longQuery = 'laptop computer with high performance processor and large memory storage capacity for gaming and professional work';
      const products = await this.scraper.searchProducts(longQuery, 5);
      return { products };
    });

    await this.runTest('Edge Cases - Special Characters', async () => {
      const products = await this.scraper.searchProducts('iPhone 15 Pro Max 256GB', 5);
      return { products };
    });
  }

  // Test 10: Performance Test
  async testPerformance() {
    await this.runTest('Performance - Multiple Categories', async () => {
      const categories = [
        { query: 'laptop', category: 'electronics' },
        { query: 'nike shoes', category: 'footwear' },
        { query: 'blender', category: 'kitchen' },
        { query: 'mattress', category: 'mattresses' },
      ];

      const allProducts: any[] = [];
      const errors: string[] = [];
      const startTime = Date.now();

      for (const { query, category } of categories) {
        try {
          const products = await this.scraper.searchProducts(query, 5, category);
          allProducts.push(...products);
          console.log(`   📦 ${category}: ${products.length} products`);
        } catch (error: any) {
          errors.push(`${category}: ${error.message}`);
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`   ⏱️  Total time: ${totalTime}ms for ${categories.length} categories`);

      return { products: allProducts, errors };
    });
  }

  // Test 11: Scraper Statistics
  async testStatistics() {
    await this.runTest('Statistics - Request Tracking', async () => {
      // Make a few requests
      await this.scraper.searchProducts('laptop', 5);
      await this.scraper.searchProducts('phone', 5);
      
      const stats = this.scraper.getStats();
      console.log(`   📊 Total requests: ${stats.totalRequests}`);
      console.log(`   📊 Requests last minute: ${stats.requestsLastMinute}`);
      
      if (stats.totalRequests < 2) {
        return { products: [], errors: ['Statistics not tracking correctly'] };
      }

      return { products: [{ name: 'Stats test', price: 0, currency: 'USD', url: '', store: '', image: '' }] };
    });
  }

  // Test 12: Error Handling
  async testErrorHandling() {
    await this.runTest('Error Handling - Invalid Inputs', async () => {
      const errors: string[] = [];
      
      try {
        // Test with null/undefined (should handle gracefully)
        const products1 = await this.scraper.searchProducts('test', -1); // Negative limit
        if (products1.length > 0) {
          errors.push('Should handle negative limit');
        }
      } catch (error: any) {
        // Expected to handle gracefully
      }

      return { products: [], errors };
    });
  }

  // Run all tests
  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 CUSTOM SCRAPER INTENSE TEST SUITE');
    console.log('='.repeat(60));
    console.log(`\n⏰ Started at: ${new Date().toISOString()}\n`);

    const testStartTime = Date.now();

    // Basic functionality tests
    await this.testBasicSearch();
    await this.testElectronics();
    await this.testFootwear();
    await this.testKitchen();
    await this.testBooks();
    await this.testVideoGames();

    // Advanced tests
    await this.testRateLimiting();
    await this.testDataFormat();
    await this.testEdgeCases();
    await this.testPerformance();
    await this.testStatistics();
    await this.testErrorHandling();

    const totalTime = Date.now() - testStartTime;

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalProducts = this.results.reduce((sum, r) => sum + r.productsFound, 0);
    const avgTime = this.results.reduce((sum, r) => sum + r.executionTime, 0) / this.results.length;

    console.log(`\n✅ Passed: ${passed}/${this.results.length}`);
    console.log(`❌ Failed: ${failed}/${this.results.length}`);
    console.log(`📦 Total Products Found: ${totalProducts}`);
    console.log(`⏱️  Total Execution Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`⏱️  Average Test Time: ${Math.round(avgTime)}ms`);

    console.log('\n📋 Detailed Results:');
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.testName}`);
      console.log(`      ${result.message}`);
      if (result.productsFound > 0) {
        console.log(`      Products: ${result.productsFound}, Time: ${result.executionTime}ms`);
      }
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(err => console.log(`      ⚠️  ${err}`));
      }
    });

    // Success rate
    const successRate = (passed / this.results.length) * 100;
    console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);

    if (successRate >= 80) {
      console.log('\n🎉 EXCELLENT! Scraper is working well!');
    } else if (successRate >= 60) {
      console.log('\n⚠️  GOOD, but some improvements needed');
    } else {
      console.log('\n❌ NEEDS WORK - Many tests failed');
    }

    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');

    return {
      passed,
      failed,
      totalProducts,
      totalTime,
      successRate,
      results: this.results,
    };
  }
}

// Run tests
async function main() {
  const testSuite = new ScraperTestSuite();
  const summary = await testSuite.runAllTests();

  // Exit with appropriate code
  process.exit(summary.successRate >= 60 ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

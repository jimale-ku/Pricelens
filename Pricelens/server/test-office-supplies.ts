/**
 * Test script for Office Supplies category
 * Tests 50 office items to verify:
 * 1. Correct images from SerpAPI
 * 2. Realistic prices from 20+ popular USA stores
 * 3. No unrealistic prices (e.g., $23 for a printer)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MultiStoreScrapingService } from './src/integrations/services/multi-store-scraping.service';

const OFFICE_ITEMS = [
  // Printers & Scanners
  'printer',
  'inkjet printer',
  'laser printer',
  'scanner',
  'all-in-one printer',
  
  // Paper & Supplies
  'printer paper',
  'notebook',
  'legal pad',
  'sticky notes',
  'envelope',
  'folder',
  'binder',
  
  // Writing Supplies
  'pen',
  'pencil',
  'marker',
  'highlighter',
  'eraser',
  
  // Desk Accessories
  'stapler',
  'paper clips',
  'binder clips',
  'tape',
  'scissors',
  'desk organizer',
  'desk lamp',
  
  // Office Furniture
  'office chair',
  'desk',
  'file cabinet',
  'bookshelf',
  
  // Electronics
  'calculator',
  'label maker',
  'whiteboard',
  'projector',
  
  // Storage
  'storage box',
  'file folder',
  'hanging folder',
  'document holder',
  
  // Other
  'calendar',
  'planner',
  'post-it notes',
  'rubber bands',
  'push pins',
  'thumbtacks',
  'paper shredder',
  'hole punch',
  'ruler',
  'stapler remover',
];

interface TestResult {
  product: string;
  success: boolean;
  storeCount: number;
  minPrice: number;
  maxPrice: number;
  hasImage: boolean;
  issues: string[];
  stores: string[];
}

async function testOfficeSupplies() {
  console.log('🧪 Starting Office Supplies Test (50 items)...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const multiStoreService = app.get(MultiStoreScrapingService);
  
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < OFFICE_ITEMS.length; i++) {
    const item = OFFICE_ITEMS[i];
    console.log(`\n[${i + 1}/50] Testing: "${item}"`);
    
    try {
      const result = await multiStoreService.searchProductWithMultiStorePrices(item, {
        limit: 100,
      });
      
      if (!result || !result.storePrices || result.storePrices.length === 0) {
        results.push({
          product: item,
          success: false,
          storeCount: 0,
          minPrice: 0,
          maxPrice: 0,
          hasImage: false,
          issues: ['No stores found'],
          stores: [],
        });
        failed++;
        console.log(`   ❌ FAILED: No stores found`);
        continue;
      }
      
      const prices = result.storePrices.map(sp => sp.price).filter(p => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const storeNames = result.storePrices.map(sp => sp.storeName);
      const uniqueStores = new Set(storeNames);
      
      const issues: string[] = [];
      
      // Check store count
      if (uniqueStores.size < 20) {
        issues.push(`Only ${uniqueStores.size} stores (expected 20+)`);
      }
      
      // Check for unrealistic prices based on product type
      if (item.includes('printer') && !item.includes('ink') && !item.includes('toner')) {
        if (minPrice < 50) {
          issues.push(`Unrealistic price: $${minPrice} for printer (minimum: $50)`);
        }
      }
      
      if (item.includes('scanner')) {
        if (minPrice < 50) {
          issues.push(`Unrealistic price: $${minPrice} for scanner (minimum: $50)`);
        }
      }
      
      if (item.includes('office chair') || (item.includes('chair') && item.includes('office'))) {
        if (minPrice < 30) {
          issues.push(`Unrealistic price: $${minPrice} for office chair (minimum: $30)`);
        }
      }
      
      if (item.includes('desk')) {
        if (minPrice < 50) {
          issues.push(`Unrealistic price: $${minPrice} for desk (minimum: $50)`);
        }
      }
      
      // Check image
      if (!result.image || result.image.length === 0) {
        issues.push('No image found');
      }
      
      const success = issues.length === 0 && uniqueStores.size >= 20;
      
      if (success) {
        passed++;
        console.log(`   ✅ PASSED: ${uniqueStores.size} stores, price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
      } else {
        failed++;
        console.log(`   ⚠️  ISSUES: ${issues.join(', ')}`);
        console.log(`   Stores: ${uniqueStores.size}, Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
      }
      
      results.push({
        product: item,
        success,
        storeCount: uniqueStores.size,
        minPrice,
        maxPrice,
        hasImage: !!result.image,
        issues,
        stores: Array.from(uniqueStores).slice(0, 10), // First 10 stores
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      failed++;
      console.log(`   ❌ ERROR: ${error.message}`);
      results.push({
        product: item,
        success: false,
        storeCount: 0,
        minPrice: 0,
        maxPrice: 0,
        hasImage: false,
        issues: [error.message],
        stores: [],
      });
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total items tested: ${OFFICE_ITEMS.length}`);
  console.log(`✅ Passed: ${passed} (${((passed / OFFICE_ITEMS.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed} (${((failed / OFFICE_ITEMS.length) * 100).toFixed(1)}%)`);
  
  // Show failed items
  const failedItems = results.filter(r => !r.success);
  if (failedItems.length > 0) {
    console.log('\n❌ FAILED ITEMS:');
    failedItems.forEach(item => {
      console.log(`   - ${item.product}: ${item.issues.join(', ')}`);
    });
  }
  
  // Show items with unrealistic prices
  const unrealisticPrices = results.filter(r => 
    r.issues.some(issue => issue.includes('Unrealistic price'))
  );
  if (unrealisticPrices.length > 0) {
    console.log('\n⚠️  ITEMS WITH UNREALISTIC PRICES:');
    unrealisticPrices.forEach(item => {
      const priceIssue = item.issues.find(i => i.includes('Unrealistic price'));
      console.log(`   - ${item.product}: ${priceIssue} (found: $${item.minPrice.toFixed(2)})`);
    });
  }
  
  // Show items with < 20 stores
  const lowStoreCount = results.filter(r => r.storeCount > 0 && r.storeCount < 20);
  if (lowStoreCount.length > 0) {
    console.log('\n⚠️  ITEMS WITH < 20 STORES:');
    lowStoreCount.forEach(item => {
      console.log(`   - ${item.product}: ${item.storeCount} stores (expected 20+)`);
    });
  }
  
  // Show average store count
  const avgStoreCount = results
    .filter(r => r.storeCount > 0)
    .reduce((sum, r) => sum + r.storeCount, 0) / results.filter(r => r.storeCount > 0).length;
  console.log(`\n📈 Average stores per item: ${avgStoreCount.toFixed(1)}`);
  
  // Show sample stores
  const allStores = new Set<string>();
  results.forEach(r => r.stores.forEach(s => allStores.add(s)));
  console.log(`\n🏪 Unique stores found: ${allStores.size}`);
  console.log(`   Sample: ${Array.from(allStores).slice(0, 20).join(', ')}`);
  
  await app.close();
}

// Run the test
testOfficeSupplies()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

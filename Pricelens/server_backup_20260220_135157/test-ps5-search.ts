/**
 * Test PS5 Search
 * 
 * Run: npx ts-node test-ps5-search.ts
 * 
 * This tests the search endpoint to see if PS5 search works
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ProductsService } from './src/products/products.service';

async function testPS5Search() {
  console.log('🎮 Testing PS5 Search...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const productsService = app.get(ProductsService);
  
  const queries = ['PS5', 'playstation 5', 'PlayStation 5'];
  
  for (const query of queries) {
    console.log(`\n🔍 Searching for: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      const result = await productsService.compareProductAcrossStores(query, 'auto');
      
      console.log('📦 Result:', {
        hasProduct: !!result.product,
        productName: result.product?.name,
        productImage: result.product?.image || 'NO IMAGE',
        pricesCount: result.prices?.length || 0,
        source: result.metadata?.source,
        message: (result.metadata as any)?.message || (result.metadata as any)?.note,
      });
      
      if (result.product) {
        console.log('✅ SUCCESS! Product found:');
        console.log(`   Name: ${result.product.name}`);
        console.log(`   Image: ${result.product.image || 'NO IMAGE'}`);
        console.log(`   Prices: ${result.prices.length} stores`);
        result.prices.forEach((price, i) => {
          console.log(`   ${i + 1}. ${price.store.name}: $${price.price}`);
        });
      } else {
        console.log('❌ No product found');
        const metadata = result.metadata as any;
        console.log(`   Message: ${metadata?.message || metadata?.note || 'Unknown error'}`);
        console.log(`   PriceAPI Enabled: ${metadata?.priceApiEnabled || false}`);
      }
    } catch (error: any) {
      console.error(`❌ Error searching for "${query}":`, error.message);
    }
  }
  
  await app.close();
  console.log('\n✅ Test complete!');
}

testPS5Search().catch(console.error);




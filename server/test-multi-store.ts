/**
 * Test Multi-Store Price Comparison
 * 
 * This tests the new endpoint that compares prices across all stores
 */

console.log('🧪 Testing Multi-Store Price Comparison\n');
console.log('='.repeat(60));

const BASE_URL = 'http://localhost:3000';

async function testComparison() {
  const tests = [
    { query: 'Organic Bananas', type: 'Product Name' },
    { query: '4011', type: 'Barcode (GTIN)' },
    { query: 'milk', type: 'Keyword Search' },
  ];

  for (const test of tests) {
    console.log(`\n\n📊 Test: ${test.type}`);
    console.log(`Query: "${test.query}"`);
    console.log('-'.repeat(60));

    try {
      const response = await fetch(
        `${BASE_URL}/products/compare/multi-store?q=${encodeURIComponent(test.query)}`
      );

      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();

      if (!data.product) {
        console.log('⚠️  No product found');
        continue;
      }

      console.log(`\n✅ Found: ${data.product.name}`);
      console.log(`   Category: ${data.product.category || 'N/A'}`);
      console.log(`   Barcode: ${data.product.barcode || 'N/A'}`);
      console.log(`   Image: ${data.product.image ? '✅ ' + data.product.image : '❌ No image'}`);

      console.log(`\n💰 Prices from ${data.prices.length} stores:`);
      console.log(`   Lowest: $${data.metadata.lowestPrice}`);
      console.log(`   Highest: $${data.metadata.highestPrice}`);
      console.log(`   Max Savings: $${data.metadata.maxSavings}\n`);

      // Show top 5 stores
      data.prices.slice(0, 5).forEach((price) => {
        const badge = price.isBestPrice ? '🏆 BEST' : '';
        const savings = price.savings > 0 ? `(+$${price.savings.toFixed(2)})` : '';
        console.log(`   ${price.rank}. ${price.store.name.padEnd(20)} $${price.price.toFixed(2)} ${savings} ${badge}`);
      });

      if (data.prices.length > 5) {
        console.log(`   ... and ${data.prices.length - 5} more stores`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ Multi-Store Comparison Test Complete!');
  console.log('\n💡 Frontend Integration:');
  console.log('   GET /products/compare/multi-store?q=Organic%20Bananas');
  console.log('   GET /products/compare/multi-store?q=4011');
  console.log('   GET /products/compare/multi-store?q=iphone&searchType=term\n');
}

// Wait for server to be ready
setTimeout(testComparison, 2000);

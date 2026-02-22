/**
 * Test PriceAPI with Different Sources
 * 
 * Run: npx ts-node test-priceapi-sources.ts
 * 
 * This tests if PriceAPI supports other sources besides Amazon
 */

import { config } from 'dotenv';

config();

async function testPriceAPISources() {
  console.log('🧪 Testing PriceAPI with Different Sources\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.PRICEAPI_KEY;
  if (!apiKey) {
    console.log('❌ PRICEAPI_KEY not found in .env\n');
    return;
  }
  
  const baseUrl = 'https://api.priceapi.com';
  const testQuery = 'playstation 5';
  
  // Test different sources
  const sourcesToTest = [
    { name: 'Amazon', source: 'amazon', topic: 'product_and_offers' },
    { name: 'Walmart', source: 'walmart', topic: 'product_and_offers' },
    { name: 'Target', source: 'target', topic: 'product_and_offers' },
    { name: 'Best Buy', source: 'bestbuy', topic: 'product_and_offers' },
    { name: 'Google Shopping', source: 'google_shopping', topic: 'product_and_offers' },
  ];
  
  for (const { name, source, topic } of sourcesToTest) {
    console.log(`\n📦 Testing ${name} (source: ${source})`);
    console.log('-'.repeat(60));
    
    try {
      const jobPayload = {
        source: source,
        country: 'us',
        topic: topic,
        key: 'term',
        values: [testQuery],
      };
      
      console.log(`   Creating job...`);
      
      const response = await fetch(`${baseUrl}/v2/jobs?token=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      });
      
      const data = await response.json();
      
      if (response.ok && data.job_id) {
        console.log(`   ✅ ${name} source is SUPPORTED!`);
        console.log(`   Job ID: ${data.job_id}`);
        console.log(`   ⏱️  Waiting for results (this may take 5-10 seconds)...`);
        
        // Wait a bit and check job status
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`${baseUrl}/v2/jobs/${data.job_id}?token=${apiKey}`);
        const statusData = await statusResponse.json();
        
        console.log(`   Status: ${statusData.status}`);
        if (statusData.status === 'finished') {
          console.log(`   ✅ ${name} works! You can use this source.`);
        }
      } else {
        console.log(`   ❌ ${name} not supported`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!\n');
  console.log('💡 If multiple sources work, we can search all of them in parallel!');
}

testPriceAPISources().catch(console.error);










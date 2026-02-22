/**
 * PriceAPI GTIN Test - Proves API Key Works!
 * 
 * This demonstrates that the API key is valid and working.
 * We just need the client to upgrade their plan for keyword search.
 */

import { config } from 'dotenv';
config();

const apiKey = process.env.PRICEAPI_KEY;

console.log('\n🧪 PriceAPI GTIN Search Test\n');
console.log('='.repeat(60));

async function testGTINSearch() {
  // Example GTIN for iPhone (from iPhone 13)
  const testGTIN = '0190198791757';
  
  console.log(`\n📱 Testing with iPhone GTIN: ${testGTIN}\n`);
  
  try {
    // Create job
    console.log('1️⃣  Creating job...');
    const createResponse = await fetch(`https://api.priceapi.com/v2/jobs?token=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'google_shopping',
        country: 'us',
        topic: 'product_and_offers',
        key: 'gtin',
        values: [testGTIN],
      }),
    });

    const jobData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.log('❌ Job creation failed:');
      console.log(JSON.stringify(jobData, null, 2));
      return;
    }

    console.log(`✅ Job created: ${jobData.job_id}`);
    console.log(`   Status: ${jobData.status}`);
    console.log(`   Topic: ${jobData.topic}`);
    console.log(`   Key: ${jobData.key}\n`);

    // Poll for results
    console.log('2️⃣  Waiting for results...\n');
    const jobId = jobData.job_id;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;

      const statusResponse = await fetch(`https://api.priceapi.com/v2/jobs/${jobId}?token=${apiKey}`);
      const statusData = await statusResponse.json();

      console.log(`   Attempt ${attempts}: ${statusData.status}`);

      if (statusData.status === 'finished') {
        console.log('\n✅ Job completed!\n');
        
        // Get results
        const downloadResponse = await fetch(`https://api.priceapi.com/v2/jobs/${jobId}/download?token=${apiKey}`);
        const results = await downloadResponse.json();

        console.log('📊 Results:\n');
        console.log(JSON.stringify(results, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ SUCCESS: API KEY IS WORKING!');
        console.log('='.repeat(60));
        console.log('\n💡 The API key is valid.');
        console.log('💡 GTIN (barcode) search works perfectly.');
        console.log('💡 Client needs to upgrade plan for keyword search.\n');
        return;
      }

      if (statusData.status === 'failed') {
        console.log('\n❌ Job failed:');
        console.log(JSON.stringify(statusData, null, 2));
        return;
      }
    }

    console.log('\n⚠️  Timeout waiting for results');

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
  }
}

testGTINSearch();

/**
 * Test Apify Gas Prices Integration
 * 
 * Tests your Apify API key with the Gas Station Prices actor
 * 
 * Usage:
 *   npx ts-node test-apify-gas-prices.ts YOUR_API_KEY
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Get API key from command line or .env
const API_KEY = process.argv[2] || process.env.APIFY_API_KEY;

if (!API_KEY) {
  console.error('❌ APIFY_API_KEY not found');
  console.log('\n💡 Usage:');
  console.log('   npx ts-node test-apify-gas-prices.ts YOUR_API_KEY');
  console.log('   OR add APIFY_API_KEY=your_key to server/.env\n');
  process.exit(1);
}

async function testApifyGasPrices() {
  console.log('🧪 Testing Apify Gas Station Prices\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 20) + '...' : 'NOT FOUND'}\n`);

  // Try different actor IDs - some may require payment or have different permissions
  // Format: username~actor-name (use ~ not /)
  const actorsToTry = [
    'eneiromatos~us-gas-stations-scraper',  // Alternative - try this first
    'scraped~gas-station-prices',  // Original (might need permissions)
  ];
  
  const zipCode = '90210'; // Test ZIP code

  for (const actorId of actorsToTry) {
    try {
      console.log('📋 Step 1: Starting Actor Run');
      console.log(`   Actor: ${actorId}`);
      console.log(`   ZIP Code: ${zipCode}\n`);

      // Start the actor run
      const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${API_KEY}`;
    
      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipcodes: [zipCode],
        }),
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.log(`⚠️  Actor ${actorId} failed: ${runResponse.status}`);
        console.log(`   Error: ${errorText.substring(0, 200)}\n`);
        
        // Try next actor
        if (actorId !== actorsToTry[actorsToTry.length - 1]) {
          console.log(`   Trying next actor...\n`);
          continue;
        } else {
          console.error(`❌ All actors failed. Check your API key permissions.\n`);
          process.exit(1);
        }
      }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    console.log(`✅ Actor started! Run ID: ${runId}\n`);
    console.log('📋 Step 2: Waiting for actor to complete...\n');

    // Wait for the run to complete (poll status)
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${API_KEY}`;
      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();
      
      status = statusData.data.status;
      attempts++;
      
      if (status === 'RUNNING') {
        process.stdout.write(`   Waiting... (${attempts}s)\r`);
      }
    }

    console.log(`\n✅ Actor completed! Status: ${status}\n`);

    if (status !== 'SUCCEEDED') {
      console.error(`❌ Actor failed with status: ${status}`);
      process.exit(1);
    }

    console.log('📋 Step 3: Fetching results...\n');

    // Get the dataset items (results)
    const datasetUrl = `https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items?token=${API_KEY}`;
    const datasetResponse = await fetch(datasetUrl);
    
    if (!datasetResponse.ok) {
      throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
    }

    const results = await datasetResponse.json();

      console.log(`✅ Got ${results.length} results!\n`);
      console.log(`✅ Working Actor: ${actorId}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 SAMPLE RESULTS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (results.length > 0) {
      // Show first 3 results
      results.slice(0, 3).forEach((station: any, index: number) => {
        console.log(`${index + 1}. ${station.name || station.stationName || 'Unknown'}`);
        console.log(`   Address: ${station.address || station.location || 'N/A'}`);
        console.log(`   Regular: ${station.regular || station.regularPrice || station.price || 'N/A'}`);
        console.log(`   Premium: ${station.premium || station.premiumPrice || 'N/A'}`);
        console.log(`   Diesel: ${station.diesel || station.dieselPrice || 'N/A'}`);
        console.log('');
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SUCCESS! Your Apify API key works!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('💡 Next Steps:');
      console.log('   1. Update actor ID in code to: ' + actorId);
      console.log('   2. Restart backend');
      console.log('   3. Test gas station search in frontend\n');
      
      // Success - break out of loop
      return;
    } else {
      console.log('⚠️  No results found for this ZIP code');
      console.log('   Try a different ZIP code or check actor documentation\n');
      return;
    }

    } catch (error: any) {
      console.log(`⚠️  Error with actor ${actorId}: ${error.message}`);
      
      // Try next actor
      if (actorId !== actorsToTry[actorsToTry.length - 1]) {
        console.log(`   Trying next actor...\n`);
        continue;
      } else {
        console.error('❌ All actors failed:', error.message);
        if (error.stack) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    }
  }
  
  // If we get here, all actors failed
  console.error('❌ All actors failed. Possible issues:');
  console.error('   1. API key doesn\'t have permission for these actors');
  console.error('   2. Actors require payment/subscription');
  console.error('   3. Check Apify dashboard for available actors\n');
}

testApifyGasPrices().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});


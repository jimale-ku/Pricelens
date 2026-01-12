/**
 * Test if PriceAPI supports Google Shopping (multi-retailer) source
 * 
 * Usage:
 *   cd server
 *   npx ts-node test-google-shopping.ts
 */

import { config } from 'dotenv';
import { PriceApiService } from './src/integrations/services/priceapi.service';

config();

class MockConfigService {
  get(key: string, defaultValue?: any): any {
    return process.env[key] || defaultValue;
  }
}

async function testGoogleShopping() {
  console.log('🧪 Testing PriceAPI Google Shopping Source (Multi-Retailer)\n');
  console.log('='.repeat(60));
  
  const configService = new MockConfigService() as any;
  const priceApiService = new PriceApiService(configService);
  
  if (!priceApiService.isEnabled()) {
    console.log('❌ PriceAPI not enabled\n');
    return;
  }
  
  const apiKey = process.env.PRICEAPI_KEY;
  const baseUrl = 'https://api.priceapi.com';
  
  console.log('\n1️⃣ Testing Google Shopping Source:');
  console.log('-'.repeat(60));
  
  try {
    // Test Google Shopping source (aggregates from multiple retailers)
    const jobPayload = {
      source: 'google_shopping',
      country: 'us',
      topic: 'search_results', // Google Shopping uses search_results topic
      key: 'term',
      values: ['apple'],
    };
    
    console.log('   Creating job with Google Shopping source...');
    console.log('   Payload:', JSON.stringify(jobPayload, null, 2));
    
    const response = await fetch(`${baseUrl}/v2/jobs?token=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobPayload),
    });
    
    const data = await response.json();
    
    if (response.ok && data.job_id) {
      console.log('   ✅ Google Shopping source is supported!');
      console.log(`   Job ID: ${data.job_id}`);
      console.log('\n   This source aggregates from multiple retailers!');
    } else {
      console.log('   ❌ Google Shopping not supported or requires different plan');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!\n');
}

testGoogleShopping().catch(console.error);


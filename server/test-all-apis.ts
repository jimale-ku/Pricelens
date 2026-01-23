/**
 * Comprehensive API Test Script
 * Tests all configured APIs: SerpAPI, PriceAPI, OilPriceAPI, Apify, ScrapingBee
 * 
 * Usage: npx ts-node test-all-apis.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

interface ApiTestResult {
  name: string;
  enabled: boolean;
  status: 'success' | 'error' | 'not_configured';
  message: string;
  details?: any;
}

const results: ApiTestResult[] = [];

/**
 * Test SerpAPI (Google Shopping & Google Maps)
 */
async function testSerpAPI(): Promise<ApiTestResult> {
  const apiKey = process.env.SERPAPI_KEY;
  
  if (!apiKey) {
    return {
      name: 'SerpAPI',
      enabled: false,
      status: 'not_configured',
      message: 'SERPAPI_KEY not found in .env',
    };
  }

  try {
    console.log('\n🔍 Testing SerpAPI (Google Shopping)...');
    
    // Test Google Shopping search
    const testQuery = 'blender';
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(testQuery)}&api_key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        name: 'SerpAPI',
        enabled: true,
        status: 'error',
        message: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const data = await response.json();
    const shoppingResults = data.shopping_results || [];
    
    if (shoppingResults.length === 0) {
      return {
        name: 'SerpAPI',
        enabled: true,
        status: 'error',
        message: 'No shopping results returned',
        details: { responseKeys: Object.keys(data) },
      };
    }

    // Extract store names from results
    const stores = new Set<string>();
    shoppingResults.slice(0, 10).forEach((result: any) => {
      if (result.source) stores.add(result.source);
    });

    return {
      name: 'SerpAPI',
      enabled: true,
      status: 'success',
      message: `✅ Working! Found ${shoppingResults.length} products, ${stores.size} stores: ${Array.from(stores).slice(0, 5).join(', ')}${stores.size > 5 ? '...' : ''}`,
      details: {
        productsFound: shoppingResults.length,
        storesFound: stores.size,
        sampleStores: Array.from(stores).slice(0, 10),
      },
    };
  } catch (error: any) {
    return {
      name: 'SerpAPI',
      enabled: true,
      status: 'error',
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Test PriceAPI (Amazon product search)
 */
async function testPriceAPI(): Promise<ApiTestResult> {
  const apiKey = process.env.PRICEAPI_KEY;
  
  if (!apiKey) {
    return {
      name: 'PriceAPI',
      enabled: false,
      status: 'not_configured',
      message: 'PRICEAPI_KEY not found in .env',
    };
  }

  try {
    console.log('\n🔍 Testing PriceAPI (Amazon)...');
    
    // PriceAPI v2 uses job-based async processing
    // Create a search job with correct parameters (in body, not query)
    const testQuery = 'blender';
    const jobPayload = {
      source: 'amazon',
      country: 'us',
      topic: 'product_and_offers',
      key: 'term',
      values: [testQuery],
    };
    
    const jobUrl = `https://api.priceapi.com/v2/jobs?token=${apiKey}`;
    const jobResponse = await fetch(jobUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobPayload),
    });
    
    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      return {
        name: 'PriceAPI',
        enabled: true,
        status: 'error',
        message: `HTTP ${jobResponse.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const jobData = await jobResponse.json();
    const jobId = jobData.job_id;

    if (!jobId) {
      return {
        name: 'PriceAPI',
        enabled: true,
        status: 'error',
        message: 'No job_id returned',
        details: jobData,
      };
    }

    console.log(`   Job created: ${jobId}, polling for results...`);
    
    // Poll for job completion (max 15 seconds)
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusUrl = `https://api.priceapi.com/v2/jobs/${jobId}?token=${apiKey}`;
      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'finished') {
        const products = statusData.products || [];
        return {
          name: 'PriceAPI',
          enabled: true,
          status: 'success',
          message: `✅ Working! Found ${products.length} products from Amazon`,
          details: {
            productsFound: products.length,
            sampleProduct: products[0]?.name || 'N/A',
            jobId: jobId,
          },
        };
      }
      
      if (statusData.status === 'failed') {
        return {
          name: 'PriceAPI',
          enabled: true,
          status: 'error',
          message: `Job failed: ${statusData.error || 'Unknown error'}`,
          details: statusData,
        };
      }
      
      attempts++;
    }

    return {
      name: 'PriceAPI',
      enabled: true,
      status: 'error',
      message: 'Job timed out after 15 seconds (this is normal - PriceAPI jobs can take 30-60 seconds)',
      details: { jobId: jobId, note: 'Check job status manually or wait longer' },
    };
  } catch (error: any) {
    return {
      name: 'PriceAPI',
      enabled: true,
      status: 'error',
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Test OilPriceAPI (Fuel prices)
 */
async function testOilPriceAPI(): Promise<ApiTestResult> {
  const apiKey = process.env.OILPRICEAPI_KEY;
  
  if (!apiKey) {
    return {
      name: 'OilPriceAPI',
      enabled: false,
      status: 'not_configured',
      message: 'OILPRICEAPI_KEY not found in .env',
    };
  }

  try {
    console.log('\n🔍 Testing OilPriceAPI (Fuel Prices)...');
    
    // Test latest wholesale prices
    const url = 'https://api.oilpriceapi.com/v1/prices/latest';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        name: 'OilPriceAPI',
        enabled: true,
        status: 'error',
        message: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const data = await response.json();
    const prices = data.data || {};
    
    if (Object.keys(prices).length === 0) {
      return {
        name: 'OilPriceAPI',
        enabled: true,
        status: 'error',
        message: 'No price data returned',
        details: data,
      };
    }

    const fuelTypes = Object.keys(prices);
    const samplePrice = prices[fuelTypes[0]];

    return {
      name: 'OilPriceAPI',
      enabled: true,
      status: 'success',
      message: `✅ Working! Found prices for ${fuelTypes.length} fuel types (${fuelTypes.join(', ')})`,
      details: {
        fuelTypes: fuelTypes,
        samplePrice: samplePrice,
      },
    };
  } catch (error: any) {
    return {
      name: 'OilPriceAPI',
      enabled: true,
      status: 'error',
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Test Apify (Gas prices scraping)
 */
async function testApify(): Promise<ApiTestResult> {
  const apiKey = process.env.APIFY_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'Apify',
      enabled: false,
      status: 'not_configured',
      message: 'APIFY_API_KEY not found in .env',
    };
  }

  try {
    console.log('\n🔍 Testing Apify API...');
    
    // Test API key by checking account info
    const url = 'https://api.apify.com/v2/users/me';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        name: 'Apify',
        enabled: true,
        status: 'error',
        message: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const data = await response.json();
    
    return {
      name: 'Apify',
      enabled: true,
      status: 'success',
      message: `✅ Working! Account: ${data.data?.username || 'N/A'}`,
      details: {
        username: data.data?.username,
        plan: data.data?.plan,
      },
    };
  } catch (error: any) {
    return {
      name: 'Apify',
      enabled: true,
      status: 'error',
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Test ScrapingBee (Web scraping for gas prices)
 */
async function testScrapingBee(): Promise<ApiTestResult> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'ScrapingBee',
      enabled: false,
      status: 'not_configured',
      message: 'SCRAPINGBEE_API_KEY not found in .env',
    };
  }

  try {
    console.log('\n🔍 Testing ScrapingBee API...');
    
    // Test with a simple scrape
    const testUrl = 'https://www.gasbuddy.com';
    const url = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(testUrl)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        name: 'ScrapingBee',
        enabled: true,
        status: 'error',
        message: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const html = await response.text();
    
    return {
      name: 'ScrapingBee',
      enabled: true,
      status: 'success',
      message: `✅ Working! Scraped ${html.length} characters from test URL`,
      details: {
        responseLength: html.length,
      },
    };
  } catch (error: any) {
    return {
      name: 'ScrapingBee',
      enabled: true,
      status: 'error',
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Main test function
 */
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log('='.repeat(60));
  
  // Test all APIs
  results.push(await testSerpAPI());
  results.push(await testPriceAPI());
  results.push(await testOilPriceAPI());
  results.push(await testApify());
  results.push(await testScrapingBee());
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  
  const enabled = results.filter(r => r.enabled);
  const working = results.filter(r => r.status === 'success');
  const errors = results.filter(r => r.status === 'error');
  const notConfigured = results.filter(r => r.status === 'not_configured');
  
  console.log(`✅ Working: ${working.length}/${results.length}`);
  console.log(`❌ Errors: ${errors.length}/${results.length}`);
  console.log(`⚠️  Not Configured: ${notConfigured.length}/${results.length}\n`);
  
  // Print detailed results
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');
  
  if (notConfigured.length > 0) {
    console.log('⚠️  Missing API Keys:');
    notConfigured.forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ API Errors:');
    errors.forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }
  
  if (working.length === results.length) {
    console.log('🎉 All configured APIs are working perfectly!\n');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

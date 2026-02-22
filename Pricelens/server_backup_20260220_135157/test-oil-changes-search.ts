/**
 * Test Oil Changes Search Endpoint
 * Tests the oil changes search functionality with SerpAPI
 * 
 * Usage: npx ts-node test-oil-changes-search.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SERPAPI_KEY = process.env.SERPAPI_KEY;

interface TestCase {
  zipCode: string;
  vehicleType?: string;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    zipCode: '90210',
    vehicleType: 'sedan',
    description: 'Oil change for sedan in Beverly Hills',
  },
  {
    zipCode: '10001',
    vehicleType: 'suv',
    description: 'Oil change for SUV in New York',
  },
  {
    zipCode: '75201',
    vehicleType: 'truck',
    description: 'Oil change for truck in Dallas',
  },
  {
    zipCode: '33139',
    description: 'Oil change in Miami (no vehicle type specified)',
  },
];

async function testDirectSerpAPI(zipCode: string, vehicleType?: string) {
  console.log(`\n🔍 Testing SerpAPI directly for: ZIP ${zipCode}${vehicleType ? `, Vehicle: ${vehicleType}` : ''}`);
  
  if (!SERPAPI_KEY) {
    console.log('   ⚠️  SERPAPI_KEY not found in environment variables');
    return null;
  }

  try {
    // Build query
    let query = `oil change ${zipCode}`;
    if (vehicleType) {
      query = `${vehicleType} oil change ${zipCode}`;
    }

    const params = new URLSearchParams({
      engine: 'google_maps',
      q: query,
      api_key: SERPAPI_KEY,
    });

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    console.log(`   URL: ${url.substring(0, 100)}...`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: HTTP ${response.status}`);
      console.log(`   Response: ${errorText.substring(0, 200)}`);
      return { success: false, duration, error: errorText };
    }

    const data = await response.json();
    
    // Check for SerpAPI errors
    if (data.error) {
      console.log(`   ❌ SerpAPI Error: ${data.error}`);
      return { success: false, duration, error: data.error };
    }

    const results = data.local_results || [];
    console.log(`   ✅ Success: Found ${results.length} results`);
    console.log(`   Duration: ${duration}ms`);
    
    if (results.length > 0) {
      console.log(`   Sample results:`);
      results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`     ${index + 1}. ${result.title || result.name || 'N/A'}`);
        console.log(`        Address: ${result.address || result.location || 'N/A'}`);
        if (result.rating) {
          console.log(`        Rating: ${result.rating} ⭐`);
        }
        if (result.reviews) {
          console.log(`        Reviews: ${result.reviews}`);
        }
        if (result.distance) {
          console.log(`        Distance: ${result.distance}`);
        }
      });
    } else {
      console.log(`   ⚠️  No results found in SerpAPI response`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
    }

    return { success: true, duration, results: results.length, data };
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, duration: 0, error: error.message };
  }
}

async function testBackendEndpoint(testCase: TestCase) {
  console.log(`\n🔍 Testing Backend Endpoint: ${testCase.description}`);
  console.log(`   ZIP Code: ${testCase.zipCode}`);
  if (testCase.vehicleType) console.log(`   Vehicle Type: ${testCase.vehicleType}`);

  try {
    const params = new URLSearchParams({
      zipCode: testCase.zipCode,
    });
    
    if (testCase.vehicleType) {
      params.append('vehicleType', testCase.vehicleType);
    }

    const url = `${API_BASE_URL}/services/oil-changes?${params.toString()}`;
    console.log(`   URL: ${url}`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: HTTP ${response.status}`);
      console.log(`   Response: ${errorText.substring(0, 200)}`);
      return { success: false, duration, error: errorText };
    }

    const data = await response.json();
    const results = Array.isArray(data) ? data : [];

    console.log(`   ✅ Success: Found ${results.length} shops`);
    console.log(`   Duration: ${duration}ms`);
    
    if (results.length > 0) {
      console.log(`   Sample results:`);
      results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`     ${index + 1}. ${result.shop || result.title || 'N/A'}`);
        console.log(`        Address: ${result.address || 'N/A'}`);
        console.log(`        Price: ${result.price || 'N/A'}`);
        if (result.distance) {
          console.log(`        Distance: ${result.distance}`);
        }
        if (result.rating) {
          console.log(`        Rating: ${result.rating} ⭐`);
        }
      });
    }

    return { success: true, duration, results: results.length };
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, duration: 0, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Oil Changes Search (SerpAPI + Backend)\n');
  console.log('='.repeat(70));

  // Check if SerpAPI key is available
  if (!SERPAPI_KEY) {
    console.log('⚠️  SERPAPI_KEY not found in environment variables');
    console.log('   Direct SerpAPI tests will be skipped');
    console.log('   Backend tests will still run (backend may have its own key)\n');
  } else {
    console.log('✅ SERPAPI_KEY found\n');
  }

  // First check if backend is reachable
  let backendAvailable = false;
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/health`);
    if (healthCheck.ok) {
      backendAvailable = true;
      console.log('✅ Backend is reachable\n');
    } else {
      console.log('⚠️  Backend is not running or not reachable');
      console.log('   Backend tests will be skipped');
      console.log('   To test backend, start server: cd server && npm run start:dev\n');
    }
  } catch (error: any) {
    console.log('⚠️  Backend is not running or not reachable');
    console.log(`   Error: ${error.message}`);
    console.log('   Backend tests will be skipped');
    console.log('   To test backend, start server: cd server && npm run start:dev\n');
  }

  const backendResults: Array<{ testCase: TestCase; result: any }> = [];
  const serpapiResults: Array<{ testCase: TestCase; result: any }> = [];

  // Test each case
  for (const testCase of TEST_CASES) {
    // Test backend endpoint (if available)
    if (backendAvailable) {
      const backendResult = await testBackendEndpoint(testCase);
      backendResults.push({ testCase, result: backendResult });
    }
    
    // Test SerpAPI directly (if key available)
    if (SERPAPI_KEY) {
      const serpapiResult = await testDirectSerpAPI(
        testCase.zipCode,
        testCase.vehicleType
      );
      if (serpapiResult) {
        serpapiResults.push({ testCase, result: serpapiResult });
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS SUMMARY\n');

  // Backend Results
  if (backendResults.length > 0) {
    console.log('🔧 Backend Endpoint Results:');
    const backendSuccessCount = backendResults.filter(r => r.result.success).length;
    const backendFailureCount = backendResults.filter(r => !r.result.success).length;
    console.log(`   ✅ Successful: ${backendSuccessCount}/${backendResults.length}`);
    console.log(`   ❌ Failed: ${backendFailureCount}/${backendResults.length}`);

    if (backendSuccessCount > 0) {
      const avgDuration = backendResults
        .filter(r => r.result.success)
        .reduce((sum, r) => sum + r.result.duration, 0) / backendSuccessCount;
      console.log(`   ⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
      
      const totalResults = backendResults
        .filter(r => r.result.success)
        .reduce((sum, r) => sum + (r.result.results || 0), 0);
      console.log(`   📊 Total Shops Found: ${totalResults}`);
    }
  } else {
    console.log('🔧 Backend Endpoint Results: Skipped (backend not running)');
  }

  // SerpAPI Direct Results
  if (serpapiResults.length > 0) {
    console.log('\n🌐 SerpAPI Direct Results:');
    const serpapiSuccessCount = serpapiResults.filter(r => r.result.success).length;
    const serpapiFailureCount = serpapiResults.filter(r => !r.result.success).length;
    console.log(`   ✅ Successful: ${serpapiSuccessCount}/${serpapiResults.length}`);
    console.log(`   ❌ Failed: ${serpapiFailureCount}/${serpapiResults.length}`);

    if (serpapiSuccessCount > 0) {
      const avgDuration = serpapiResults
        .filter(r => r.result.success)
        .reduce((sum, r) => sum + r.result.duration, 0) / serpapiSuccessCount;
      console.log(`   ⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
      
      const totalResults = serpapiResults
        .filter(r => r.result.success)
        .reduce((sum, r) => sum + (r.result.results || 0), 0);
      console.log(`   📊 Total Results Found: ${totalResults}`);
    }
  }

  console.log('\n' + '='.repeat(70));

  // Final verdict
  if (backendResults.length > 0) {
    const backendSuccessCount = backendResults.filter(r => r.result.success).length;
    if (backendSuccessCount === backendResults.length) {
      console.log('\n🎉 All backend tests passed! Oil changes search is working correctly!\n');
    } else if (backendSuccessCount > 0) {
      console.log('\n⚠️  Some backend tests failed. Check the errors above.\n');
    } else {
      console.log('\n❌ All backend tests failed. Check your backend configuration.\n');
    }
  } else {
    console.log('\n⚠️  Backend tests skipped (backend not running)\n');
  }

  if (serpapiResults.length > 0) {
    const serpapiSuccessCount = serpapiResults.filter(r => r.result.success).length;
    if (serpapiSuccessCount === serpapiResults.length) {
      console.log('🎉 All SerpAPI direct tests passed!\n');
    } else if (serpapiSuccessCount > 0) {
      console.log('⚠️  Some SerpAPI tests failed. Check the errors above.\n');
    } else {
      console.log('❌ All SerpAPI tests failed. Check your SerpAPI key and plan.\n');
    }
  }

  console.log('='.repeat(70));
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

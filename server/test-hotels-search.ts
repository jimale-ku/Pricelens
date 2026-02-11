/**
 * Test Hotels Search Endpoint
 * Tests the hotel search functionality with SerpAPI
 * 
 * Usage: npx ts-node test-hotels-search.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SERPAPI_KEY = process.env.SERPAPI_KEY;

interface TestCase {
  location: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    location: 'New York, NY',
    checkIn: '2024-02-15',
    checkOut: '2024-02-20',
    guests: 2,
    description: 'New York hotels for 5 nights, 2 guests',
  },
  {
    location: 'Los Angeles, CA',
    checkIn: '2024-03-01',
    checkOut: '2024-03-05',
    guests: 1,
    description: 'Los Angeles hotels for 4 nights, 1 guest',
  },
  {
    location: 'Las Vegas, NV',
    checkIn: '2024-04-10',
    checkOut: '2024-04-12',
    guests: 2,
    description: 'Las Vegas hotels for 2 nights, 2 guests',
  },
  {
    location: 'Miami, FL',
    description: 'Miami hotels (no dates specified)',
  },
  {
    location: '90210',
    checkIn: '2024-05-01',
    checkOut: '2024-05-07',
    guests: 4,
    description: 'Hotels near ZIP 90210 for 6 nights, 4 guests',
  },
];

async function testDirectSerpAPI(location: string, checkIn?: string, checkOut?: string) {
  console.log(`\n🔍 Testing SerpAPI directly for: ${location}`);
  
  if (!SERPAPI_KEY) {
    console.log('   ⚠️  SERPAPI_KEY not found in environment variables');
    return null;
  }

  try {
    // Build query
    let query = `hotels in ${location}`;
    if (checkIn && checkOut) {
      query += ` from ${checkIn} to ${checkOut}`;
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

    const results = data.local_results || data.organic_results || [];
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
  console.log(`   Location: ${testCase.location}`);
  if (testCase.checkIn) console.log(`   Check-in: ${testCase.checkIn}`);
  if (testCase.checkOut) console.log(`   Check-out: ${testCase.checkOut}`);
  if (testCase.guests) console.log(`   Guests: ${testCase.guests}`);

  try {
    const params = new URLSearchParams({
      location: testCase.location,
    });
    
    if (testCase.checkIn) {
      params.append('checkIn', testCase.checkIn);
    }
    if (testCase.checkOut) {
      params.append('checkOut', testCase.checkOut);
    }
    if (testCase.guests) {
      params.append('guests', testCase.guests.toString());
    }

    const url = `${API_BASE_URL}/services/hotels?${params.toString()}`;
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

    console.log(`   ✅ Success: Found ${results.length} hotels`);
    console.log(`   Duration: ${duration}ms`);
    
    if (results.length > 0) {
      console.log(`   Sample results:`);
      results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`     ${index + 1}. ${result.hotel || result.title || 'N/A'}`);
        console.log(`        Address: ${result.address || 'N/A'}`);
        console.log(`        Price: ${result.price || 'N/A'}`);
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
  console.log('🚀 Testing Hotels Search (SerpAPI + Backend)\n');
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
        testCase.location,
        testCase.checkIn,
        testCase.checkOut
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
      console.log(`   📊 Total Hotels Found: ${totalResults}`);
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
      console.log('\n🎉 All backend tests passed! Hotels search is working correctly!\n');
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

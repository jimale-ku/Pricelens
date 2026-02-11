/**
 * Test Airfare Search Endpoint
 * Tests the airfare search functionality with SerpAPI
 * 
 * Usage: npx ts-node test-airfare-search.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SERPAPI_KEY = process.env.SERPAPI_KEY;

interface TestCase {
  origin: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  passengers?: number;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    departDate: '2024-03-15',
    returnDate: '2024-03-20',
    passengers: 1,
    description: 'NYC to LA round trip, 1 passenger',
  },
  {
    origin: 'JFK',
    destination: 'LAX',
    departDate: '2024-04-01',
    returnDate: '2024-04-08',
    passengers: 2,
    description: 'JFK to LAX round trip, 2 passengers',
  },
  {
    origin: 'Chicago, IL',
    destination: 'Miami, FL',
    departDate: '2024-05-10',
    passengers: 1,
    description: 'Chicago to Miami one-way, 1 passenger',
  },
  {
    origin: 'Dallas, TX',
    destination: 'Seattle, WA',
    departDate: '2024-06-01',
    returnDate: '2024-06-15',
    passengers: 4,
    description: 'Dallas to Seattle round trip, 4 passengers',
  },
];

async function testDirectSerpAPI(origin: string, destination: string, departDate?: string, returnDate?: string) {
  console.log(`\n🔍 Testing SerpAPI directly for: ${origin} → ${destination}`);
  
  if (!SERPAPI_KEY) {
    console.log('   ⚠️  SERPAPI_KEY not found in environment variables');
    return null;
  }

  try {
    // Build query for flight search
    let query = `flights from ${origin} to ${destination}`;
    if (departDate) {
      query += ` on ${departDate}`;
    }
    if (returnDate) {
      query += ` return ${returnDate}`;
    }

    // Try Google Flights engine
    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: origin,
      arrival_id: destination,
      api_key: SERPAPI_KEY,
    });

    if (departDate) {
      params.append('outbound_date', departDate);
    }
    if (returnDate) {
      params.append('return_date', returnDate);
    }

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    console.log(`   URL: ${url.substring(0, 120)}...`);

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
      
      // Try alternative: Google Search for flights
      console.log(`   🔄 Trying alternative: Google Search engine...`);
      return await testGoogleSearchFlights(origin, destination, departDate, returnDate);
    }

    const data = await response.json();
    
    // Check for SerpAPI errors
    if (data.error) {
      console.log(`   ❌ SerpAPI Error: ${data.error}`);
      // Try alternative
      console.log(`   🔄 Trying alternative: Google Search engine...`);
      return await testGoogleSearchFlights(origin, destination, departDate, returnDate);
    }

    // Check for flight results
    const flights = data.best_flights || data.other_flights || data.flights || [];
    const results = flights.length > 0 ? flights : (data.organic_results || []);
    
    console.log(`   ✅ Success: Found ${results.length} results`);
    console.log(`   Duration: ${duration}ms`);
    
    if (results.length > 0) {
      console.log(`   Sample results:`);
      results.slice(0, 3).forEach((result: any, index: number) => {
        if (result.flights && result.flights.length > 0) {
          const flight = result.flights[0];
          console.log(`     ${index + 1}. ${result.airline || flight.airline || 'N/A'}`);
          console.log(`        Price: ${result.price || 'N/A'}`);
          if (flight.departure) {
            console.log(`        Departure: ${flight.departure.airport} at ${flight.departure.time || 'N/A'}`);
          }
          if (flight.arrival) {
            console.log(`        Arrival: ${flight.arrival.airport} at ${flight.arrival.time || 'N/A'}`);
          }
        } else {
          console.log(`     ${index + 1}. ${result.title || result.airline || 'N/A'}`);
          console.log(`        Price: ${result.price || 'N/A'}`);
        }
      });
    } else {
      console.log(`   ⚠️  No flight results found`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
    }

    return { success: true, duration, results: results.length, data };
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, duration: 0, error: error.message };
  }
}

async function testGoogleSearchFlights(origin: string, destination: string, departDate?: string, returnDate?: string) {
  try {
    let query = `flights ${origin} to ${destination}`;
    if (departDate) query += ` ${departDate}`;
    if (returnDate) query += ` return ${returnDate}`;

    const params = new URLSearchParams();
    params.append('engine', 'google');
    params.append('q', query);
    if (SERPAPI_KEY) {
      params.append('api_key', SERPAPI_KEY);
    }

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      return { success: false, duration, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const results = data.organic_results || data.flight_results || [];
    
    console.log(`   ✅ Alternative search found ${results.length} results`);
    console.log(`   Duration: ${duration}ms`);
    
    if (results.length > 0) {
      results.slice(0, 2).forEach((result: any, index: number) => {
        console.log(`     ${index + 1}. ${result.title || 'N/A'}`);
      });
    }

    return { success: true, duration, results: results.length, data };
  } catch (error: any) {
    return { success: false, duration: 0, error: error.message };
  }
}

async function testBackendEndpoint(testCase: TestCase) {
  console.log(`\n🔍 Testing Backend Endpoint: ${testCase.description}`);
  console.log(`   Origin: ${testCase.origin}`);
  console.log(`   Destination: ${testCase.destination}`);
  if (testCase.departDate) console.log(`   Departure: ${testCase.departDate}`);
  if (testCase.returnDate) console.log(`   Return: ${testCase.returnDate}`);
  if (testCase.passengers) console.log(`   Passengers: ${testCase.passengers}`);

  try {
    const params = new URLSearchParams({
      origin: testCase.origin,
      destination: testCase.destination,
    });
    
    if (testCase.departDate) {
      params.append('departDate', testCase.departDate);
    }
    if (testCase.returnDate) {
      params.append('returnDate', testCase.returnDate);
    }
    if (testCase.passengers) {
      params.append('passengers', testCase.passengers.toString());
    }

    const url = `${API_BASE_URL}/services/airfare?${params.toString()}`;
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

    console.log(`   ✅ Success: Found ${results.length} flights`);
    console.log(`   Duration: ${duration}ms`);
    
    if (results.length > 0) {
      console.log(`   Sample results:`);
      results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`     ${index + 1}. ${result.airline || result.title || 'N/A'}`);
        console.log(`        Price: ${result.price || 'N/A'}`);
        if (result.times) {
          console.log(`        Times: ${result.times}`);
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
  console.log('🚀 Testing Airfare Search (SerpAPI + Backend)\n');
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
        testCase.origin,
        testCase.destination,
        testCase.departDate,
        testCase.returnDate
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
      console.log(`   📊 Total Flights Found: ${totalResults}`);
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
      console.log('\n🎉 All backend tests passed! Airfare search is working correctly!\n');
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

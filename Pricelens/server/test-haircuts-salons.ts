/**
 * Haircuts & Salons Service Test
 * Tests SerpAPI integration for haircuts and salon services using real US ZIP codes
 * 
 * Usage: npx ts-node test-haircuts-salons.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Real US ZIP codes from different states and regions
const TEST_ZIP_CODES = [
  // California
  '90210',   // Beverly Hills, CA
  '90028',   // Hollywood, CA
  '94102',   // San Francisco, CA
  '92101',   // San Diego, CA
  '92660',   // Newport Beach, CA
  '90266',   // Manhattan Beach, CA
  '94025',   // Menlo Park, CA
  '94301',   // Palo Alto, CA
  
  // New York
  '10001',   // New York, NY (Manhattan)
  '11201',   // Brooklyn, NY
  '10019',   // Midtown Manhattan, NY
  '10012',   // SoHo, NY
  
  // Texas
  '75201',   // Dallas, TX
  '77001',   // Houston, TX
  '78701',   // Austin, TX
  '78201',   // San Antonio, TX
  
  // Florida
  '33139',   // Miami Beach, FL
  '32801',   // Orlando, FL
  '33601',   // Tampa, FL
  '32201',   // Jacksonville, FL
  
  // Illinois
  '60601',   // Chicago, IL (Loop)
  '60614',   // Lincoln Park, Chicago, IL
  '60657',   // Lakeview, Chicago, IL
  
  // Washington
  '98101',   // Seattle, WA
  '98102',   // Capitol Hill, Seattle, WA
  
  // Colorado
  '80202',   // Denver, CO
  '80301',   // Boulder, CO
  
  // Massachusetts
  '02101',   // Boston, MA
  '02115',   // Back Bay, Boston, MA
  
  // Other Major Cities
  '30301',   // Atlanta, GA
  '19102',   // Philadelphia, PA
  '48201',   // Detroit, MI
  '85001',   // Phoenix, AZ
  '97201',   // Portland, OR
  '55401',   // Minneapolis, MN
  '70112',   // New Orleans, LA
  '20001',   // Washington, DC
  '37201',   // Nashville, TN
  '84101',   // Salt Lake City, UT
  '73101',   // Oklahoma City, OK
  '28201',   // Charlotte, NC
  '45201',   // Cincinnati, OH
  '43201',   // Columbus, OH
  '80201',   // Denver, CO (downtown)
  '80210',   // Denver, CO (Cherry Creek)
];

interface TestResult {
  zipCode: string;
  location: string;
  status: 'success' | 'error';
  businessesFound: number;
  details: {
    withRatings: number;
    withPhone: number;
    withWebsite: number;
    sampleBusinesses: string[];
    averageRating?: number;
  };
  duration: number;
  error?: string;
}

/**
 * Test SerpAPI Google Maps for haircuts/salons
 */
async function testSerpAPIHaircuts(zipCode: string): Promise<TestResult> {
  const startTime = Date.now();
  
  if (!SERPAPI_KEY) {
    return {
      zipCode,
      location: 'Unknown',
      status: 'error',
      businessesFound: 0,
      details: {
        withRatings: 0,
        withPhone: 0,
        withWebsite: 0,
        sampleBusinesses: [],
      },
      duration: 0,
      error: 'SERPAPI_KEY not configured',
    };
  }

  try {
    // Use a more specific query without type parameter (type might not be supported in all plans)
    // Include location in query string instead of separate location parameter
    // This avoids the zoom parameter requirement
    const query = `hair salon ${zipCode}`;
    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    
    console.log(`\n🔍 Testing ZIP: ${zipCode}`);
    console.log(`   Query: ${query}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        zipCode,
        location: 'Unknown',
        status: 'error',
        businessesFound: 0,
        details: {
          withRatings: 0,
          withPhone: 0,
          withWebsite: 0,
          sampleBusinesses: [],
        },
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const data = await response.json();
    const localResults = data.local_results || [];
    
    if (localResults.length === 0) {
      return {
        zipCode,
        location: data.search_parameters?.location || 'Unknown',
        status: 'error',
        businessesFound: 0,
        details: {
          withRatings: 0,
          withPhone: 0,
          withWebsite: 0,
          sampleBusinesses: [],
        },
        duration: Date.now() - startTime,
        error: 'No results found',
      };
    }

    const withRatings = localResults.filter((r: any) => r.rating).length;
    const withPhone = localResults.filter((r: any) => r.phone).length;
    const withWebsite = localResults.filter((r: any) => r.website).length;
    
    const ratings = localResults
      .filter((r: any) => r.rating)
      .map((r: any) => parseFloat(r.rating.toString()));
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : undefined;

    const sampleBusinesses = localResults
      .slice(0, 5)
      .map((r: any) => r.title || 'Unknown')
      .filter(Boolean);

    return {
      zipCode,
      location: data.search_parameters?.location || zipCode,
      status: 'success',
      businessesFound: localResults.length,
      details: {
        withRatings,
        withPhone,
        withWebsite,
        sampleBusinesses,
        averageRating: avgRating,
      },
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      zipCode,
      location: 'Unknown',
      status: 'error',
      businessesFound: 0,
      details: {
        withRatings: 0,
        withPhone: 0,
        withWebsite: 0,
        sampleBusinesses: [],
      },
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Test backend service endpoint
 */
async function testBackendService(zipCode: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const url = `${API_BASE_URL}/services/providers?category=haircuts&serviceType=mens&zipCode=${zipCode}`;
    
    console.log(`\n🔍 Testing Backend Service - ZIP: ${zipCode}`);
    console.log(`   Endpoint: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        zipCode,
        location: 'Unknown',
        status: 'error',
        businessesFound: 0,
        details: {
          withRatings: 0,
          withPhone: 0,
          withWebsite: 0,
          sampleBusinesses: [],
        },
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const data = await response.json();
    const results = Array.isArray(data) ? data : (data.results || []);
    
    if (results.length === 0) {
      return {
        zipCode,
        location: 'Unknown',
        status: 'error',
        businessesFound: 0,
        details: {
          withRatings: 0,
          withPhone: 0,
          withWebsite: 0,
          sampleBusinesses: [],
        },
        duration: Date.now() - startTime,
        error: 'No results returned from backend',
      };
    }

    const withRatings = results.filter((r: any) => r.rating).length;
    const withPhone = results.filter((r: any) => r.phone).length;
    const withWebsite = results.filter((r: any) => r.website).length;
    
    const ratings = results
      .filter((r: any) => r.rating)
      .map((r: any) => parseFloat(r.rating.toString()));
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : undefined;

    const sampleBusinesses = results
      .slice(0, 5)
      .map((r: any) => r.name || r.title || r.station || 'Unknown')
      .filter(Boolean);

    return {
      zipCode,
      location: 'Backend Response',
      status: 'success',
      businessesFound: results.length,
      details: {
        withRatings,
        withPhone,
        withWebsite,
        sampleBusinesses,
        averageRating: avgRating,
      },
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      zipCode,
      location: 'Unknown',
      status: 'error',
      businessesFound: 0,
      details: {
        withRatings: 0,
        withPhone: 0,
        withWebsite: 0,
        sampleBusinesses: [],
      },
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Testing Haircuts & Salons Service\n');
  console.log('='.repeat(70));
  
  if (!SERPAPI_KEY) {
    console.error('❌ SERPAPI_KEY not found in .env');
    console.log('💡 Add SERPAPI_KEY=your_key_here to server/.env\n');
    process.exit(1);
  }
  
  console.log(`✅ SerpAPI Key: ${SERPAPI_KEY.substring(0, 20)}...`);
  console.log(`📍 Testing ${TEST_ZIP_CODES.length} US ZIP codes\n`);
  
  const serpapiResults: TestResult[] = [];
  const backendResults: TestResult[] = [];
  
  // Test SerpAPI directly
  console.log('\n📡 TESTING SERPAPI DIRECTLY:\n');
  console.log('='.repeat(70));
  
  for (const zipCode of TEST_ZIP_CODES) {
    const result = await testSerpAPIHaircuts(zipCode);
    serpapiResults.push(result);
    
    if (result.status === 'success') {
      console.log(`✅ ZIP ${zipCode}: Found ${result.businessesFound} salons`);
      console.log(`   Sample: ${result.details.sampleBusinesses.slice(0, 3).join(', ')}`);
      if (result.details.averageRating) {
        console.log(`   Avg Rating: ${result.details.averageRating.toFixed(1)} ⭐`);
      }
    } else {
      console.log(`❌ ZIP ${zipCode}: ${result.error || 'Failed'}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test backend service (if available)
  console.log('\n\n🏢 TESTING BACKEND SERVICE:\n');
  console.log('='.repeat(70));
  
  // First check if backend is reachable
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/health`);
    if (!healthCheck.ok) {
      console.log('⚠️  Backend is not running or not reachable');
      console.log('   Skipping backend tests...\n');
    } else {
      console.log('✅ Backend is reachable, testing endpoints...\n');
      
      for (const zipCode of TEST_ZIP_CODES.slice(0, 3)) { // Test first 3 ZIP codes
        const result = await testBackendService(zipCode);
        backendResults.push(result);
        
        if (result.status === 'success') {
          console.log(`✅ ZIP ${zipCode}: Found ${result.businessesFound} salons`);
          console.log(`   Sample: ${result.details.sampleBusinesses.slice(0, 3).join(', ')}`);
        } else {
          console.log(`❌ ZIP ${zipCode}: ${result.error || 'Failed'}`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (error: any) {
    console.log('⚠️  Backend is not running or not reachable');
    console.log(`   Error: ${error.message}`);
    console.log('   To test backend, start server: cd server && npm run start:dev\n');
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  
  const serpapiSuccess = serpapiResults.filter(r => r.status === 'success').length;
  const serpapiErrors = serpapiResults.filter(r => r.status === 'error').length;
  
  console.log(`📡 SerpAPI Direct Tests:`);
  console.log(`   ✅ Success: ${serpapiSuccess}/${serpapiResults.length}`);
  console.log(`   ❌ Errors: ${serpapiErrors}/${serpapiResults.length}`);
  
  if (backendResults.length > 0) {
    const backendSuccess = backendResults.filter(r => r.status === 'success').length;
    const backendErrors = backendResults.filter(r => r.status === 'error').length;
    
    console.log(`\n🏢 Backend Service Tests:`);
    console.log(`   ✅ Success: ${backendSuccess}/${backendResults.length}`);
    console.log(`   ❌ Errors: ${backendErrors}/${backendResults.length}`);
  }
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:\n');
  
  console.log('📡 SerpAPI Results:');
  serpapiResults.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`\n${icon} ZIP ${result.zipCode} (${result.location})`);
    if (result.status === 'success') {
      console.log(`   Businesses: ${result.businessesFound}`);
      console.log(`   With Ratings: ${result.details.withRatings}`);
      console.log(`   With Phone: ${result.details.withPhone}`);
      console.log(`   With Website: ${result.details.withWebsite}`);
      if (result.details.averageRating) {
        console.log(`   Average Rating: ${result.details.averageRating.toFixed(1)} ⭐`);
      }
      console.log(`   Sample: ${result.details.sampleBusinesses.join(', ')}`);
      console.log(`   Duration: ${result.duration}ms`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  if (backendResults.length > 0) {
    console.log('\n\n🏢 Backend Service Results:');
    backendResults.forEach(result => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`\n${icon} ZIP ${result.zipCode}`);
      if (result.status === 'success') {
        console.log(`   Businesses: ${result.businessesFound}`);
        console.log(`   Sample: ${result.details.sampleBusinesses.join(', ')}`);
        console.log(`   Duration: ${result.duration}ms`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Final verdict
  if (serpapiSuccess === serpapiResults.length) {
    console.log('\n🎉 All SerpAPI tests passed! Haircuts & Salons service is working perfectly!\n');
  } else if (serpapiSuccess > 0) {
    console.log('\n⚠️  Some SerpAPI tests failed. Check the errors above.\n');
  } else {
    console.log('\n❌ All SerpAPI tests failed. Check your SERPAPI_KEY configuration.\n');
  }
  
  console.log('='.repeat(70));
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

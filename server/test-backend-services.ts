/**
 * Backend Services Test Script
 * Tests backend service endpoints to verify they use APIs correctly
 * 
 * Usage: npx ts-node test-backend-services.ts
 * 
 * Note: Backend must be running on http://localhost:3000
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: any;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Test backend endpoint
 */
async function testEndpoint(
  name: string,
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`\n🔍 Testing ${name}...`);
    console.log(`   Endpoint: ${method} ${url}`);
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        name,
        endpoint,
        status: 'error',
        message: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
        duration,
      };
    }
    
    const data = await response.json();
    
    // Check if response is an array or object
    const isArray = Array.isArray(data);
    const count = isArray ? data.length : (data.results?.length || data.data?.length || 1);
    
    return {
      name,
      endpoint,
      status: 'success',
      message: `✅ Working! ${isArray ? `Found ${count} items` : 'Response received'}`,
      details: {
        responseType: isArray ? 'array' : 'object',
        itemCount: count,
        sampleData: isArray ? data[0] : (data.results?.[0] || data.data?.[0] || Object.keys(data).slice(0, 3)),
      },
      duration,
    };
  } catch (error: any) {
    return {
      name,
      endpoint,
      status: 'error',
      message: `Error: ${error.message}`,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test health endpoint
 */
async function testHealth(): Promise<TestResult> {
  return testEndpoint('Health Check', '/health');
}

/**
 * Test products endpoints
 */
async function testProducts(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test fast search (uses SerpAPI Google Shopping)
  results.push(await testEndpoint(
    'Products - Fast Search (SerpAPI)',
    '/products/search/fast?q=iPhone&categorySlug=electronics&limit=6'
  ));
  
  // Test popular products
  results.push(await testEndpoint(
    'Products - Popular (Database)',
    '/products/popular?categorySlug=groceries&limit=6'
  ));
  
  // Test multi-store comparison (uses SerpAPI Google Shopping)
  results.push(await testEndpoint(
    'Products - Multi-Store Comparison (SerpAPI)',
    '/products/compare/multi-store?productName=iPhone%2015&categorySlug=electronics'
  ));
  
  return results;
}

/**
 * Test services endpoints (Pattern B & C)
 */
async function testServices(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test gas stations (uses SerpAPI Google Maps)
  results.push(await testEndpoint(
    'Services - Gas Stations (SerpAPI Maps)',
    '/services/gas-stations?zipCode=90210&gasType=regular'
  ));
  
  // Test gyms (uses SerpAPI Google Maps)
  results.push(await testEndpoint(
    'Services - Gyms (SerpAPI Maps)',
    '/services/gyms?zipCode=90210&membershipType=basic'
  ));
  
  // Test service providers (uses SerpAPI Google Maps)
  results.push(await testEndpoint(
    'Services - Service Providers (SerpAPI Maps)',
    '/services/providers?category=haircuts&serviceType=mens&zipCode=90210'
  ));
  
  return results;
}

/**
 * Main test function
 */
async function runAllTests() {
  console.log('🚀 Starting Backend Services Tests...\n');
  console.log('='.repeat(70));
  console.log(`Testing backend at: ${API_BASE_URL}\n`);
  
  // First, test if backend is reachable
  const healthResult = await testHealth();
  results.push(healthResult);
  
  if (healthResult.status === 'error') {
    console.log('\n❌ Backend is not reachable!');
    console.log('   Please start the backend server:');
    console.log('   cd server && npm run start:dev\n');
    return;
  }
  
  // Test products endpoints
  const productResults = await testProducts();
  results.push(...productResults);
  
  // Test services endpoints
  const serviceResults = await testServices();
  results.push(...serviceResults);
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  
  const working = results.filter(r => r.status === 'success');
  const errors = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');
  
  console.log(`✅ Working: ${working.length}/${results.length}`);
  console.log(`❌ Errors: ${errors.length}/${results.length}`);
  if (skipped.length > 0) {
    console.log(`⏭️  Skipped: ${skipped.length}/${results.length}`);
  }
  console.log('');
  
  // Print detailed results
  console.log('📋 DETAILED RESULTS:\n');
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' 
                 : result.status === 'error' ? '❌' 
                 : '⏭️';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${result.name}${duration}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2).split('\n').map(l => '   ' + l).join('\n'));
    }
    console.log('');
  });
  
  console.log('='.repeat(70));
  
  // Group by service type
  const productTests = results.filter(r => r.name.includes('Products'));
  const serviceTests = results.filter(r => r.name.includes('Services'));
  
  console.log('\n📦 PRODUCTS SERVICE:\n');
  console.log(`   Tests: ${productTests.length}`);
  console.log(`   Working: ${productTests.filter(r => r.status === 'success').length}/${productTests.length}`);
  
  console.log('\n🏢 SERVICES SERVICE:\n');
  console.log(`   Tests: ${serviceTests.length}`);
  console.log(`   Working: ${serviceTests.filter(r => r.status === 'success').length}/${serviceTests.length}`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');
  
  if (errors.length > 0) {
    console.log('❌ Failed Tests:');
    errors.forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }
  
  if (working.length === results.length) {
    console.log('🎉 All backend services are working perfectly!\n');
  } else if (working.length > 0) {
    console.log('⚠️  Some backend services have issues. Check the errors above.\n');
  }
  
  console.log('='.repeat(70));
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

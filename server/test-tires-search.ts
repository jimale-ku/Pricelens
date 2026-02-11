/**
 * Test Tires Search Endpoint
 * Tests the tire search functionality with vehicle information
 * 
 * Usage: npx ts-node test-tires-search.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

interface TestCase {
  year: string;
  make: string;
  model: string;
  tireSize?: string;
  zipCode: string;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    year: '2020',
    make: 'Toyota',
    model: 'RAV4',
    tireSize: 'P225/65R17',
    zipCode: '90210',
    description: 'Toyota RAV4 with tire size',
  },
  {
    year: '2018',
    make: 'Honda',
    model: 'Civic',
    zipCode: '10001',
    description: 'Honda Civic without tire size',
  },
  {
    year: '2022',
    make: 'Ford',
    model: 'F-150',
    zipCode: '75201',
    description: 'Ford F-150 truck',
  },
];

async function testTireSearch(testCase: TestCase) {
  console.log(`\n🔍 Testing: ${testCase.description}`);
  console.log(`   Vehicle: ${testCase.year} ${testCase.make} ${testCase.model}`);
  console.log(`   ZIP: ${testCase.zipCode}`);
  if (testCase.tireSize) {
    console.log(`   Tire Size: ${testCase.tireSize}`);
  }

  try {
    const params = new URLSearchParams({
      year: testCase.year,
      make: testCase.make,
      model: testCase.model,
      zipCode: testCase.zipCode,
    });
    
    if (testCase.tireSize) {
      params.append('tireSize', testCase.tireSize);
    }

    const url = `${API_BASE_URL}/services/tires?${params.toString()}`;
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

    console.log(`   ✅ Success: Found ${results.length} tire shops`);
    console.log(`   Duration: ${duration}ms`);
    
    if (results.length > 0) {
      console.log(`   Sample results:`);
      results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`     ${index + 1}. ${result.shop || result.name || 'N/A'}`);
        console.log(`        Address: ${result.address || 'N/A'}`);
        console.log(`        Price: ${result.price || 'N/A'}`);
        console.log(`        Distance: ${result.distance || 'N/A'}`);
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
  console.log('🚀 Testing Tires Search Endpoint\n');
  console.log('='.repeat(70));

  // First check if backend is reachable
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/health`);
    if (!healthCheck.ok) {
      console.log('⚠️  Backend is not running or not reachable');
      console.log('   To test, start server: cd server && npm run start:dev\n');
      process.exit(1);
    }
    console.log('✅ Backend is reachable\n');
  } catch (error: any) {
    console.log('⚠️  Backend is not running or not reachable');
    console.log(`   Error: ${error.message}`);
    console.log('   To test, start server: cd server && npm run start:dev\n');
    process.exit(1);
  }

  const results: Array<{ testCase: TestCase; result: any }> = [];

  for (const testCase of TEST_CASES) {
    const result = await testTireSearch(testCase);
    results.push({ testCase, result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS SUMMARY\n');

  const successCount = results.filter(r => r.result.success).length;
  const failureCount = results.filter(r => !r.result.success).length;

  console.log(`✅ Successful: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failureCount}/${results.length}`);

  if (successCount > 0) {
    const avgDuration = results
      .filter(r => r.result.success)
      .reduce((sum, r) => sum + r.result.duration, 0) / successCount;
    console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
  }

  console.log('\n' + '='.repeat(70));

  if (successCount === results.length) {
    console.log('\n🎉 All tests passed! Tires search is working correctly!\n');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  } else {
    console.log('\n❌ All tests failed. Check your backend configuration.\n');
  }

  console.log('='.repeat(70));
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

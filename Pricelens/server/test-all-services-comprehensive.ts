/**
 * Comprehensive Service Categories Test
 * 
 * Tests ALL service categories and shows:
 * - Available service types
 * - Prices across different stores/providers
 * - Sample data returned
 * 
 * Run: npx ts-node test-all-services-comprehensive.ts
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

interface ServiceCategoryTest {
  name: string;
  category: string;
  endpoint: string;
  params: Record<string, string>;
  description: string;
}

// Pattern B Service Categories (location-based)
const PATTERN_B_TESTS: ServiceCategoryTest[] = [
  {
    name: 'Gas Stations',
    category: 'gas-stations',
    endpoint: '/services/gas-stations',
    params: { zipCode: '90210', gasType: 'regular' },
    description: 'Compare gas prices by type (regular, midgrade, premium, diesel)',
  },
  {
    name: 'Gas Stations (Premium)',
    category: 'gas-stations',
    endpoint: '/services/gas-stations',
    params: { zipCode: '10001', gasType: 'premium' },
    description: 'Premium gas prices in New York',
  },
  {
    name: 'Hotels',
    category: 'hotels',
    endpoint: '/services/hotels',
    params: { location: 'Los Angeles' },
    description: 'Hotel prices and availability',
  },
  {
    name: 'Hotels (With Dates)',
    category: 'hotels',
    endpoint: '/services/hotels',
    params: { 
      location: 'New York', 
      checkIn: '2026-03-15', 
      checkOut: '2026-03-18',
      guests: '2'
    },
    description: 'Hotel prices for specific dates',
  },
  {
    name: 'Gyms',
    category: 'gyms',
    endpoint: '/services/gyms',
    params: { zipCode: '90210' },
    description: 'Gym membership prices and types',
  },
  {
    name: 'Gyms (Premium)',
    category: 'gyms',
    endpoint: '/services/gyms',
    params: { zipCode: '10001', membershipType: 'premium' },
    description: 'Premium gym memberships',
  },
  {
    name: 'Airfare',
    category: 'airfare',
    endpoint: '/services/airfare',
    params: { origin: 'LAX', destination: 'JFK' },
    description: 'Flight prices between cities',
  },
  {
    name: 'Airfare (Round Trip)',
    category: 'airfare',
    endpoint: '/services/airfare',
    params: { 
      origin: 'Miami', 
      destination: 'Chicago',
      departDate: '2026-05-01',
      returnDate: '2026-05-08',
      passengers: '2'
    },
    description: 'Round trip flight prices',
  },
  {
    name: 'Oil Changes',
    category: 'oil-changes',
    endpoint: '/services/oil-changes',
    params: { zipCode: '90210' },
    description: 'Oil change prices for cars',
  },
  {
    name: 'Oil Changes (SUV)',
    category: 'oil-changes',
    endpoint: '/services/oil-changes',
    params: { zipCode: '10001', vehicleType: 'suv' },
    description: 'Oil change prices for SUVs',
  },
  {
    name: 'Tires',
    category: 'tires',
    endpoint: '/services/tires',
    params: { 
      year: '2020', 
      make: 'Toyota', 
      model: 'RAV4',
      zipCode: '90210'
    },
    description: 'Tire prices for specific vehicle',
  },
  {
    name: 'Tires (Truck)',
    category: 'tires',
    endpoint: '/services/tires',
    params: { 
      year: '2019', 
      make: 'Ford', 
      model: 'F-150',
      zipCode: '33139'
    },
    description: 'Tire prices for trucks',
  },
  {
    name: 'Car Washes',
    category: 'car-washes',
    endpoint: '/services/car-washes',
    params: { zipCode: '90210', washType: 'basic' },
    description: 'Car wash prices by type',
  },
  {
    name: 'Car Washes (Premium)',
    category: 'car-washes',
    endpoint: '/services/car-washes',
    params: { zipCode: '10001', washType: 'premium' },
    description: 'Premium car wash prices',
  },
  {
    name: 'Rental Cars',
    category: 'rental-cars',
    endpoint: '/services/rental-cars',
    params: { location: 'Los Angeles' },
    description: 'Rental car prices',
  },
  {
    name: 'Rental Cars (With Dates)',
    category: 'rental-cars',
    endpoint: '/services/rental-cars',
    params: { 
      location: 'New York',
      pickupDate: '2026-03-15',
      returnDate: '2026-03-20'
    },
    description: 'Rental car prices for specific dates',
  },
  {
    name: 'Storage Units',
    category: 'storage',
    endpoint: '/services/storage',
    params: { zipCode: '90210', size: 'medium' },
    description: 'Storage unit prices by size',
  },
  {
    name: 'Storage Units (Large)',
    category: 'storage',
    endpoint: '/services/storage',
    params: { zipCode: '10001', size: 'large' },
    description: 'Large storage unit prices',
  },
  {
    name: 'Meal Kits',
    category: 'meal-kits',
    endpoint: '/services/meal-kits',
    params: { zipCode: '90210' },
    description: 'Meal kit delivery prices',
  },
  {
    name: 'Car Insurance',
    category: 'car-insurance',
    endpoint: '/services/car-insurance',
    params: { zipCode: '90210' },
    description: 'Car insurance quotes',
  },
  {
    name: 'Car Insurance (With Vehicle)',
    category: 'car-insurance',
    endpoint: '/services/car-insurance',
    params: { 
      zipCode: '10001',
      vehicleYear: '2020',
      vehicleMake: 'Toyota',
      vehicleModel: 'RAV4'
    },
    description: 'Car insurance quotes for specific vehicle',
  },
  {
    name: 'Renters Insurance',
    category: 'renters-insurance',
    endpoint: '/services/renters-insurance',
    params: { zipCode: '90210' },
    description: 'Renters insurance quotes',
  },
];

// Pattern C Service Categories (service providers)
const PATTERN_C_TESTS: ServiceCategoryTest[] = [
  {
    name: 'Haircuts - Men\'s',
    category: 'haircuts',
    endpoint: '/services/providers',
    params: { category: 'haircuts', serviceType: 'mens', zipCode: '90210' },
    description: 'Men\'s haircut prices at local salons',
  },
  {
    name: 'Haircuts - Women\'s',
    category: 'haircuts',
    endpoint: '/services/providers',
    params: { category: 'haircuts', serviceType: 'womens', zipCode: '10001' },
    description: 'Women\'s haircut prices at local salons',
  },
  {
    name: 'Haircuts - Kids',
    category: 'haircuts',
    endpoint: '/services/providers',
    params: { category: 'haircuts', serviceType: 'kids', zipCode: '90210' },
    description: 'Kids\' haircut prices',
  },
  {
    name: 'Massage - Swedish',
    category: 'massage',
    endpoint: '/services/providers',
    params: { category: 'massage', serviceType: 'swedish', zipCode: '90210' },
    description: 'Swedish massage prices',
  },
  {
    name: 'Massage - Deep Tissue',
    category: 'massage',
    endpoint: '/services/providers',
    params: { category: 'massage', serviceType: 'deep', zipCode: '10001' },
    description: 'Deep tissue massage prices',
  },
  {
    name: 'Massage - Hot Stone',
    category: 'massage',
    endpoint: '/services/providers',
    params: { category: 'massage', serviceType: 'hot', zipCode: '90210' },
    description: 'Hot stone massage prices',
  },
  {
    name: 'Nail Salons - Manicure',
    category: 'nail-salons',
    endpoint: '/services/providers',
    params: { category: 'nail-salons', serviceType: 'manicure', zipCode: '90210' },
    description: 'Manicure prices',
  },
  {
    name: 'Nail Salons - Pedicure',
    category: 'nail-salons',
    endpoint: '/services/providers',
    params: { category: 'nail-salons', serviceType: 'pedicure', zipCode: '10001' },
    description: 'Pedicure prices',
  },
  {
    name: 'Nail Salons - Both',
    category: 'nail-salons',
    endpoint: '/services/providers',
    params: { category: 'nail-salons', serviceType: 'both', zipCode: '90210' },
    description: 'Manicure + Pedicure combo prices',
  },
  {
    name: 'Spa Services',
    category: 'spa',
    endpoint: '/services/providers',
    params: { category: 'spa', serviceType: 'massage', zipCode: '90210' },
    description: 'Spa service prices',
  },
  {
    name: 'Apartments',
    category: 'apartments',
    endpoint: '/services/apartments',
    params: { zipCode: '90210', serviceType: '1br' },
    description: 'Apartment rental prices',
  },
  {
    name: 'Apartments (2BR)',
    category: 'apartments',
    endpoint: '/services/apartments',
    params: { zipCode: '10001', serviceType: '2br' },
    description: '2 bedroom apartment prices',
  },
  {
    name: 'Moving Companies',
    category: 'moving',
    endpoint: '/services/moving',
    params: { zipCode: '90210', moveType: 'local' },
    description: 'Local moving company prices',
  },
  {
    name: 'Moving Companies (Long Distance)',
    category: 'moving',
    endpoint: '/services/moving',
    params: { zipCode: '10001', moveType: 'long-distance' },
    description: 'Long distance moving prices',
  },
  {
    name: 'Food Delivery',
    category: 'food-delivery',
    endpoint: '/services/food-delivery',
    params: { zipCode: '90210' },
    description: 'Food delivery service prices',
  },
  {
    name: 'Food Delivery (Italian)',
    category: 'food-delivery',
    endpoint: '/services/food-delivery',
    params: { zipCode: '10001', cuisine: 'italian' },
    description: 'Italian food delivery prices',
  },
];

interface TestResult {
  success: boolean;
  status: number;
  resultCount: number;
  error?: string;
  sampleData?: any;
  priceRange?: { min: string; max: string; average: string };
  providers?: string[];
}

async function runTest(test: ServiceCategoryTest): Promise<TestResult> {
  try {
    const urlParams = new URLSearchParams(test.params);
    const url = `${API_BASE}${test.endpoint}?${urlParams.toString()}`;
    
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();
    
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        status: res.status,
        resultCount: 0,
        error: `Invalid JSON: ${text.slice(0, 200)}`,
      };
    }
    
    if (!res.ok) {
      let errorMsg = 'Unknown error';
      if (data?.error) {
        errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      } else if (data?.message) {
        errorMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
      } else if (typeof data === 'string') {
        errorMsg = data;
      } else {
        errorMsg = JSON.stringify(data).slice(0, 300);
      }
      return {
        success: false,
        status: res.status,
        resultCount: 0,
        error: errorMsg,
      };
    }
    
    const results = Array.isArray(data) ? data : data?.results || data?.data || [];
    const resultCount = Array.isArray(results) ? results.length : 0;
    
    // Extract price information
    let priceRange: { min: string; max: string; average: string } | undefined;
    let providers: string[] = [];
    
    if (resultCount > 0 && Array.isArray(results)) {
      // Extract provider names
      providers = results
        .map((r: any) => r.name || r.station || r.hotel || r.gym || r.shop || r.businessName || r.airline || 'Unknown')
        .filter((name: string) => name !== 'Unknown')
        .slice(0, 10);
      
      // Extract and analyze prices
      const prices: number[] = [];
      results.forEach((r: any) => {
        const priceStr = r.price || r.priceRange || '';
        if (priceStr) {
          // Extract numeric values from price strings like "$29.99", "$30-50", "~$4.25"
          const matches = priceStr.match(/\$?(\d+\.?\d*)/g);
          if (matches) {
            matches.forEach((match: string) => {
              const num = parseFloat(match.replace('$', ''));
              if (!isNaN(num)) prices.push(num);
            });
          }
        }
      });
      
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        priceRange = {
          min: `$${min.toFixed(2)}`,
          max: `$${max.toFixed(2)}`,
          average: `$${avg.toFixed(2)}`,
        };
      }
    }
    
    return {
      success: true,
      status: res.status,
      resultCount,
      sampleData: results[0] || null,
      priceRange,
      providers,
    };
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      resultCount: 0,
      error: error.message,
    };
  }
}

function formatSampleData(sample: any): string {
  if (!sample) return 'No data';
  
  const relevantFields: Record<string, string> = {};
  
  // Extract key fields
  if (sample.name) relevantFields.name = sample.name;
  if (sample.station) relevantFields.station = sample.station;
  if (sample.hotel) relevantFields.hotel = sample.hotel;
  if (sample.gym) relevantFields.gym = sample.gym;
  if (sample.shop) relevantFields.shop = sample.shop;
  if (sample.airline) relevantFields.airline = sample.airline;
  if (sample.businessName) relevantFields.businessName = sample.businessName;
  
  if (sample.address) relevantFields.address = sample.address;
  if (sample.price) relevantFields.price = sample.price;
  if (sample.priceRange) relevantFields.priceRange = sample.priceRange;
  if (sample.rating) relevantFields.rating = `${sample.rating}⭐`;
  if (sample.distance) relevantFields.distance = sample.distance;
  
  return JSON.stringify(relevantFields, null, 2).slice(0, 300);
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  COMPREHENSIVE SERVICE CATEGORIES TEST');
  console.log('  Testing all service categories for types and prices');
  console.log('  Base URL: ' + API_BASE);
  console.log('='.repeat(80) + '\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Test Pattern B Categories
  console.log('\n📊 PATTERN B: Location-Based Services\n');
  console.log('-'.repeat(80));
  
  for (const test of PATTERN_B_TESTS) {
    console.log(`\n🔍 ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Endpoint: ${test.endpoint}`);
    console.log(`   Params: ${JSON.stringify(test.params)}`);
    process.stdout.write(`   Testing... `);
    
    const result = await runTest(test);
    
    if (result.success) {
      totalPassed++;
      console.log(`✅ SUCCESS`);
      console.log(`   Results: ${result.resultCount} providers/stores found`);
      
      if (result.priceRange) {
        console.log(`   💰 Price Range: ${result.priceRange.min} - ${result.priceRange.max} (Avg: ${result.priceRange.average})`);
      }
      
      if (result.providers && result.providers.length > 0) {
        console.log(`   🏪 Providers/Stores (first ${Math.min(5, result.providers.length)}):`);
        result.providers.slice(0, 5).forEach((p, i) => {
          console.log(`      ${i + 1}. ${p}`);
        });
      }
      
      if (result.sampleData) {
        console.log(`   📋 Sample Data:`);
        const formatted = formatSampleData(result.sampleData);
        formatted.split('\n').forEach(line => {
          console.log(`      ${line}`);
        });
      }
    } else {
      totalFailed++;
      console.log(`❌ FAILED`);
      console.log(`   Status: ${result.status || 'Error'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    
    await new Promise((r) => setTimeout(r, 500)); // Rate limiting
  }
  
  // Test Pattern C Categories
  console.log('\n\n📋 PATTERN C: Service Providers\n');
  console.log('-'.repeat(80));
  
  for (const test of PATTERN_C_TESTS) {
    console.log(`\n🔍 ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Service Type: ${test.params.serviceType}`);
    console.log(`   Endpoint: ${test.endpoint}`);
    process.stdout.write(`   Testing... `);
    
    const result = await runTest(test);
    
    if (result.success) {
      totalPassed++;
      console.log(`✅ SUCCESS`);
      console.log(`   Results: ${result.resultCount} service providers found`);
      
      if (result.priceRange) {
        console.log(`   💰 Price Range: ${result.priceRange.min} - ${result.priceRange.max} (Avg: ${result.priceRange.average})`);
      }
      
      if (result.providers && result.providers.length > 0) {
        console.log(`   🏪 Service Providers (first ${Math.min(5, result.providers.length)}):`);
        result.providers.slice(0, 5).forEach((p, i) => {
          console.log(`      ${i + 1}. ${p}`);
        });
      }
      
      if (result.sampleData) {
        console.log(`   📋 Sample Data:`);
        const formatted = formatSampleData(result.sampleData);
        formatted.split('\n').forEach(line => {
          console.log(`      ${line}`);
        });
      }
    } else {
      totalFailed++;
      console.log(`❌ FAILED`);
      console.log(`   Status: ${result.status || 'Error'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    
    await new Promise((r) => setTimeout(r, 500)); // Rate limiting
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('  SUMMARY');
  console.log('='.repeat(80));
  console.log(`  ✅ Passed: ${totalPassed}`);
  console.log(`  ❌ Failed: ${totalFailed}`);
  console.log(`  Total Tests: ${totalPassed + totalFailed}`);
  console.log('='.repeat(80) + '\n');
  
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(console.error);

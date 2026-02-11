/**
 * Test Serper API for Maps/Places (service categories)
 * Usage: npx ts-node test-serper-maps.ts
 */
const SERPER_KEY = process.env.SERPER_API_KEY || '04cd24be53ae188f1e8d817f1f37ddf08e3e946a';

async function testMaps(query: string, type: string) {
  console.log(`\n🧪 Testing Serper Maps: "${query}" (${type})\n`);
  try {
    // Try Maps endpoint
    const res = await fetch('https://google.serper.dev/maps', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'us', num: 10 }),
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    
    if (!res.ok) {
      console.log('Error:', text.slice(0, 500));
      return false;
    }
    
    const data = JSON.parse(text);
    const places = data.places || data.localResults || data.results || [];
    
    console.log('Places found:', Array.isArray(places) ? places.length : 0);
    
    if (places.length > 0) {
      const p = places[0];
      console.log('\n✅ Sample result:');
      console.log('  Name:', p.title || p.name || 'N/A');
      console.log('  Address:', p.address || p.addressLines?.[0] || 'N/A');
      console.log('  Rating:', p.rating || p.ratingStars || 'N/A');
      console.log('  Reviews:', p.reviews || p.reviewCount || 'N/A');
      console.log('  Price:', p.price || p.priceLevel || 'N/A');
      console.log('  Phone:', p.phone || 'N/A');
      console.log('  Website:', p.website || p.link || 'N/A');
      console.log('  Category:', p.category || p.type || 'N/A');
      return true;
    } else {
      console.log('⚠️ No places found. Response keys:', Object.keys(data).join(', '));
      return false;
    }
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    return false;
  }
}

async function run() {
  const tests = [
    { query: 'spa services near me', type: 'Spa (Pattern C)' },
    { query: 'oil change 90210', type: 'Oil Changes (Pattern B)' },
    { query: 'renters insurance', type: 'Renters Insurance (Pattern B)' },
    { query: 'hotels in Los Angeles', type: 'Hotels (Pattern B)' },
    { query: 'hair salon 90210', type: 'Haircuts (Pattern C)' },
  ];
  
  console.log('='.repeat(60));
  console.log('Testing Serper Maps API for Service Categories');
  console.log('='.repeat(60));
  
  let successCount = 0;
  for (const test of tests) {
    const success = await testMaps(test.query, test.type);
    if (success) successCount++;
    await new Promise(r => setTimeout(r, 2000)); // Rate limit delay
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${successCount}/${tests.length} tests passed`);
  console.log('='.repeat(60) + '\n');
}

run();

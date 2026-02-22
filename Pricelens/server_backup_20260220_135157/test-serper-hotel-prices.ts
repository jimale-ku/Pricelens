/**
 * Test Serper Shopping for hotel prices
 */
const SERPER_KEY = process.env.SERPER_API_KEY || '04cd24be53ae188f1e8d817f1f37ddf08e3e946a';

async function testHotelPrices() {
  console.log('\n🧪 Testing Serper Shopping for Hotel Prices\n');
  
  try {
    const res = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: 'hotels in Los Angeles',
        gl: 'us',
        num: 10,
      }),
    });
    
    const data = await res.json();
    const shopping = data.shopping || [];
    
    console.log('Status:', res.status);
    console.log('Hotels found:', shopping.length);
    
    if (shopping.length > 0) {
      console.log('\n✅ Sample hotel with price:');
      const h = shopping[0];
      console.log('  Name:', h.title || h.name);
      console.log('  Price:', h.price || h.extractedPrice || 'N/A');
      console.log('  Store:', h.source || h.merchant || 'N/A');
      console.log('  Link:', h.link || h.productUrl || 'N/A');
    } else {
      console.log('⚠️ No shopping results. Keys:', Object.keys(data).join(', '));
    }
  } catch (e: any) {
    console.error('❌', e.message);
  }
}

testHotelPrices();

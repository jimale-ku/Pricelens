/**
 * Quick Serper API test - Shopping
 * Usage: npx ts-node test-serper.ts
 */
const SERPER_KEY = process.env.SERPER_API_KEY || '04cd24be53ae188f1e8d817f1f37ddf08e3e946a';

async function test() {
  console.log('\n🧪 Testing Serper API (Shopping)...\n');
  try {
    const res = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: 'organic milk', gl: 'us', num: 20 }),
    });
    const text = await res.text();
    console.log('Status:', res.status);
    if (!res.ok) {
      console.log('Error:', text.slice(0, 300));
      process.exit(1);
    }
    const data = JSON.parse(text);
    const products = data.shopping || data.results || [];
    console.log('Products found:', Array.isArray(products) ? products.length : 0);
    if (products.length > 0) {
      const p = products[0];
      console.log('First:', (p.title || p.name || '').slice(0, 50), '|', p.price || p.extractedPrice, '|', p.source || p.merchant);
    }
    console.log('\n✅ Serper key works.\n');
  } catch (e: any) {
    console.error('❌', e.message);
    process.exit(1);
  }
}
test();

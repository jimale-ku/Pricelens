/**
 * Barcode API test script for PriceLens
 *
 * Tests the two barcode providers (accurate product data, not generic search):
 * - Barcode Lookup (barcodelookup.com): GET /v3/products?barcode=...&key=...
 * - PricesAPI.io: search by barcode → product id → GET /products/:id/offers (x-api-key)
 *
 * Both return store prices for the exact product (UPC). Popular US stores are sorted first.
 *
 * Usage (from Pricelens/server):
 *   npx ts-node test-barcode-apis.ts <BARCODE>
 *
 * Example:
 *   npx ts-node test-barcode-apis.ts 190199246888
 *
 * Env:
 *   BARCODE_LOOKUP_API_KEY=...  (403 = invalid key or expired free trial)
 *   PRICESAPI_KEY=...           (must start with pricesapi_; use x-api-key header)
 */

import 'dotenv/config';

type Json = any;

async function testBarcodeLookup(barcode: string) {
  const apiKey = process.env.BARCODE_LOOKUP_API_KEY;
  if (!apiKey) {
    console.log('⏭️  Skipping Barcode Lookup: BARCODE_LOOKUP_API_KEY not set.');
    return;
  }

  const url = `https://api.barcodelookup.com/v3/products?barcode=${encodeURIComponent(
    barcode,
  )}&key=${encodeURIComponent(apiKey)}`;

  console.log('\n🔍 Testing Barcode Lookup (barcodelookup.com)...');
  console.log(`   GET ${url.replace(apiKey, '***')}`);

  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    console.log(`❌ Barcode Lookup HTTP ${res.status}: ${text.slice(0, 200)}`);
    return;
  }

  let data: Json;
  try {
    data = JSON.parse(text);
  } catch {
    console.log('❌ Barcode Lookup: response is not valid JSON.');
    return;
  }

  const products = Array.isArray(data?.products) ? data.products : [];
  if (products.length === 0) {
    console.log('⚠️  Barcode Lookup returned no products for this barcode.');
    return;
  }

  const p = products[0];
  const title = p.product_name || p.title || p.description || 'Unknown product';
  const image = p.images?.[0] || p.image_url || p.image;
  const stores = Array.isArray(p.stores || p.retailers || p.offers) ? (p.stores || p.retailers || p.offers) : [];

  console.log('✅ Barcode Lookup returned data:');
  console.log(`   Product: ${title}`);
  console.log(`   Image:   ${image || 'NO IMAGE'}`);
  console.log(`   Stores:  ${stores.length}`);
  if (stores.length > 0) {
    const s = stores[0];
    const storeName = s.store_name || s.store || s.retailer || s.name || 'Store';
    console.log(`   Sample store: ${storeName} - $${s.price || s.retail_price || s.current_price || 'n/a'}`);
  }
}

async function testPricesApi(barcode: string) {
  const apiKey = process.env.PRICESAPI_KEY;
  if (!apiKey) {
    console.log('\n⏭️  Skipping PricesAPI.io: PRICESAPI_KEY not set.');
    return;
  }

  const baseUrl = 'https://api.pricesapi.io/api/v1';
  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };

  console.log('\n🔍 Testing PricesAPI.io (search by barcode → product → offers)...');
  const searchUrl = `${baseUrl}/products/search?q=${encodeURIComponent(barcode)}&limit=1`;
  console.log(`   GET ${searchUrl.replace(apiKey, '***')}`);

  const searchRes = await fetch(searchUrl, { headers });
  const searchText = await searchRes.text();

  if (!searchRes.ok) {
    console.log(`❌ PricesAPI.io search HTTP ${searchRes.status}: ${searchText.slice(0, 200)}`);
    return;
  }

  let searchData: Json;
  try {
    searchData = JSON.parse(searchText);
  } catch {
    console.log('❌ PricesAPI.io: search response is not valid JSON.');
    return;
  }

  const results = searchData?.data?.results;
  if (!Array.isArray(results) || results.length === 0) {
    console.log('⚠️  PricesAPI.io: no product found for this barcode.');
    return;
  }

  const product = results[0];
  const productId = product.id;
  if (productId == null) {
    console.log('⚠️  PricesAPI.io: search result has no product id.');
    return;
  }

  const offersUrl = `${baseUrl}/products/${productId}/offers?country=us`;
  console.log(`   GET ${offersUrl} (real-time offers, may take 5–30s)`);
  const offersRes = await fetch(offersUrl, { headers });
  const offersText = await offersRes.text();

  if (!offersRes.ok) {
    console.log(`❌ PricesAPI.io offers HTTP ${offersRes.status}: ${offersText.slice(0, 200)}`);
    return;
  }

  let offersData: Json;
  try {
    offersData = JSON.parse(offersText);
  } catch {
    console.log('❌ PricesAPI.io: offers response is not valid JSON.');
    return;
  }

  const payload = offersData?.data ?? offersData;
  const offers = Array.isArray(payload?.offers) ? payload.offers : [];
  const title = product?.title || product?.name || payload?.title || 'Unknown product';
  const image = payload?.image || product?.image;

  console.log('✅ PricesAPI.io returned data (barcode → exact product → offers):');
  console.log(`   Product: ${title}`);
  console.log(`   Image:   ${image ? 'YES' : 'NO IMAGE'}`);
  console.log(`   Stores:  ${offers.length}`);
  if (offers.length > 0) {
    const o = offers[0];
    console.log(`   Sample: ${o.seller || 'Store'} - $${o.price} (${o.currency || 'USD'})`);
    console.log(`   URL: ${o.url || o.seller_url || 'n/a'}`);
  }
}

async function main() {
  const barcode = process.argv[2]?.trim();
  if (!barcode) {
    console.error('Usage: npx ts-node test-barcode-apis.ts <BARCODE>');
    process.exit(1);
  }

  console.log(`\n🚀 Testing barcode providers for UPC: ${barcode}\n`);

  await testBarcodeLookup(barcode);
  await testPricesApi(barcode);

  console.log('\n✅ Finished barcode API tests.\n');
}

main().catch((err) => {
  console.error('❌ Test script failed:', err);
  process.exit(1);
});


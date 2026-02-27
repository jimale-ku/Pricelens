/**
 * Lenovo item: how many stores, item price per store, and whether stores have icons.
 * Run: npx ts-node test-lenovo-stores-prices.ts
 */

import 'dotenv/config';

const PRICESAPI_BASE = 'https://api.pricesapi.io/api/v1';

async function main() {
  const key = process.env.PRICESAPI_KEY;
  if (!key?.trim()) {
    console.log('PRICESAPI_KEY not set in .env');
    process.exit(1);
  }
  const headers: Record<string, string> = { 'x-api-key': key, 'Content-Type': 'application/json' };

  console.log('\n--- Lenovo (PricesAPI) ---\n');

  const searchUrl = `${PRICESAPI_BASE}/products/search?q=Lenovo+laptop&limit=1`;
  const searchRes = await fetch(searchUrl, { headers });
  if (!searchRes.ok) {
    console.log('Search failed:', searchRes.status, await searchRes.text());
    process.exit(1);
  }
  const searchData = await searchRes.json();
  const results = searchData?.data?.results ?? [];
  if (results.length === 0) {
    console.log('No products found for "Lenovo laptop"');
    process.exit(1);
  }

  const product = results[0];
  const productId = product.id;
  const offersUrl = `${PRICESAPI_BASE}/products/${productId}/offers?country=us`;
  console.log('Fetching offers (can take 5–30s)...\n');
  const offersRes = await fetch(offersUrl, { headers });
  if (!offersRes.ok) {
    console.log('Offers failed:', offersRes.status, await offersRes.text());
    process.exit(1);
  }
  const offersData = await offersRes.json();
  const data = offersData?.data ?? {};
  const offers = data.offers ?? [];
  const title = data.title || product.title || product.name || 'Lenovo product';
  const productImage = data.image || product.image;

  console.log('Item:', title);
  console.log('Product image:', productImage ? 'YES' : 'NO');
  console.log('Number of stores (offers):', offers.length);
  console.log('');

  // Sample of store + price (first 25)
  console.log('--- Store and price (first 25) ---');
  const sample = offers.slice(0, 25);
  sample.forEach((o: any, i: number) => {
    const seller = o.seller || o.store || 'Unknown';
    const price = o.price != null ? (typeof o.price === 'number' ? o.price : parseFloat(o.price)) : null;
    const priceStr = price != null ? `$${price}` : 'n/a';
    console.log(`  ${(i + 1).toString().padStart(2)}. ${seller.padEnd(28)} ${priceStr}`);
  });
  if (offers.length > 25) {
    console.log(`  ... and ${offers.length - 25} more stores`);
  }

  // Do offers include any icon/logo field?
  const firstOffer = offers[0];
  const offerKeys = firstOffer ? Object.keys(firstOffer) : [];
  const iconKeys = offerKeys.filter((k) => /icon|logo|image|img|favicon/i.test(k));
  console.log('\n--- Store icons from API? ---');
  if (iconKeys.length > 0) {
    console.log('  Yes. Keys that might be store icon:', iconKeys.join(', '));
    iconKeys.forEach((k) => console.log(`    ${k}:`, firstOffer[k]));
  } else {
    console.log('  No. PricesAPI does not return store icons/logos in the offers.');
    console.log('  Offer keys:', offerKeys.join(', '));
  }
  console.log('\n--- Done ---\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

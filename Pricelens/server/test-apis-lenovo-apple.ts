/**
 * Quick test: can PricesAPI and Barcode Lookup return items for "Lenovo" and "Apple"?
 * Run from Pricelens/server: npx ts-node test-apis-lenovo-apple.ts
 */

import 'dotenv/config';

const PRICESAPI_BASE = 'https://api.pricesapi.io/api/v1';
const BARCODE_LOOKUP_BASE = 'https://api.barcodelookup.com/v3/products';

async function testPricesApiSearch(query: string): Promise<{ ok: boolean; productCount?: number; offersCount?: number; firstTitle?: string; error?: string }> {
  const key = process.env.PRICESAPI_KEY;
  if (!key?.trim()) {
    return { ok: false, error: 'PRICESAPI_KEY not set' };
  }
  const headers: Record<string, string> = { 'x-api-key': key, 'Content-Type': 'application/json' };

  try {
    const searchUrl = `${PRICESAPI_BASE}/products/search?q=${encodeURIComponent(query)}&limit=5`;
    const searchRes = await fetch(searchUrl, { headers });
    const searchText = await searchRes.text();

    if (!searchRes.ok) {
      const err = JSON.parse(searchText).error || searchText;
      return { ok: false, error: `search ${searchRes.status}: ${JSON.stringify(err).slice(0, 120)}` };
    }

    const searchData = JSON.parse(searchText);
    const results = searchData?.data?.results;
    if (!Array.isArray(results) || results.length === 0) {
      return { ok: true, productCount: 0, error: 'No products found for this query' };
    }

    const first = results[0];
    const productId = first.id;
    if (productId == null) {
      return { ok: true, productCount: results.length, firstTitle: first.title || first.name, error: 'No product id' };
    }

    const offersUrl = `${PRICESAPI_BASE}/products/${productId}/offers?country=us`;
    const offersRes = await fetch(offersUrl, { headers });
    const offersText = await offersRes.text();

    if (!offersRes.ok) {
      return {
        ok: false,
        productCount: results.length,
        firstTitle: first.title || first.name,
        error: `offers ${offersRes.status}: ${offersText.slice(0, 80)}`,
      };
    }

    const offersData = JSON.parse(offersText);
    const offers = offersData?.data?.offers ?? [];
    const title = offersData?.data?.title || first.title || first.name;

    return {
      ok: true,
      productCount: results.length,
      offersCount: offers.length,
      firstTitle: title,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

async function testBarcodeLookupSearch(query: string): Promise<{ ok: boolean; productCount?: number; firstTitle?: string; error?: string }> {
  const key = process.env.BARCODE_LOOKUP_API_KEY;
  if (!key?.trim()) {
    return { ok: false, error: 'BARCODE_LOOKUP_API_KEY not set' };
  }

  try {
    const url = `${BARCODE_LOOKUP_BASE}?search=${encodeURIComponent(query)}&formatted=y&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 100)}` };
    }

    const data = JSON.parse(text);
    const products = Array.isArray(data?.products) ? data.products : [];
    const first = products[0];
    const title = first?.product_name || first?.title || first?.description || first?.product_description;

    return {
      ok: true,
      productCount: products.length,
      firstTitle: title || (products.length ? 'Unknown' : undefined),
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

async function main() {
  console.log('\n=== Testing APIs for Lenovo & Apple ===\n');

  const queries = ['Lenovo laptop', 'Apple iPhone'];

  for (const query of queries) {
    console.log(`--- "${query}" ---`);

    const pricesResult = await testPricesApiSearch(query);
    if (pricesResult.error && !pricesResult.ok) {
      console.log(`  PricesAPI:  ❌ ${pricesResult.error}`);
    } else if (pricesResult.productCount === 0 || (pricesResult.offersCount !== undefined && pricesResult.offersCount === 0)) {
      console.log(`  PricesAPI:  ⚠️ No items (search ok: ${pricesResult.productCount ?? 0} products, ${pricesResult.offersCount ?? 0} offers)`);
    } else {
      console.log(`  PricesAPI:  ✅ ${pricesResult.offersCount ?? 0} offers | "${(pricesResult.firstTitle || '').slice(0, 50)}..."`);
    }

    const barcodeResult = await testBarcodeLookupSearch(query);
    if (barcodeResult.error && !barcodeResult.ok) {
      console.log(`  BarcodeLookup: ❌ ${barcodeResult.error}`);
    } else if (barcodeResult.productCount === 0) {
      console.log(`  BarcodeLookup: ⚠️ No products found`);
    } else {
      console.log(`  BarcodeLookup: ✅ ${barcodeResult.productCount} product(s) | "${(barcodeResult.firstTitle || '').slice(0, 50)}..."`);
    }

    console.log('');
  }

  console.log('=== Done ===\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Quick SerpAPI renewal check – does the key still return data?
 * Usage: npx ts-node test-serpapi-renewal-check.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function checkSerpAPI(): Promise<void> {
  console.log('SerpAPI renewal check\n');

  if (!SERPAPI_KEY || SERPAPI_KEY.trim() === '') {
    console.log('Result: NO_KEY');
    console.log('SERPAPI_KEY is missing or empty in .env. Add it to use SerpAPI.');
    process.exit(1);
  }

  const query = 'milk';
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=us&num=10&api_key=${SERPAPI_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 401) {
      console.log('Result: INVALID_KEY');
      console.log('SerpAPI returned 401 – key is invalid or revoked.');
      process.exit(1);
    }
    if (response.status === 402) {
      console.log('Result: OUT_OF_CREDITS');
      console.log('SerpAPI returned 402 – plan expired or out of credits. Renew the plan.');
      process.exit(1);
    }
    if (response.status === 429) {
      console.log('Result: RATE_LIMITED');
      console.log('SerpAPI returned 429 – too many requests. Try again later.');
      process.exit(1);
    }
    if (!response.ok) {
      const text = await response.text();
      console.log('Result: ERROR');
      console.log(`SerpAPI returned ${response.status}: ${text.slice(0, 300)}`);
      process.exit(1);
    }

    const data = await response.json();
    const results = data.shopping_results || [];

    if (results.length === 0) {
      console.log('Result: NO_RESULTS');
      console.log('SerpAPI responded OK but returned no shopping_results (query or region may affect this).');
      process.exit(1);
    }

    const stores = new Set((results as any[]).map((r: any) => r.source || 'Unknown').filter(Boolean));
    console.log('Result: OK');
    console.log(`SerpAPI is working. Got ${results.length} results from ${stores.size} store(s).`);
    console.log('Stores (sample):', Array.from(stores).slice(0, 10).join(', '));
    process.exit(0);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.log('Result: TIMEOUT');
      console.log('Request timed out after 20s. SerpAPI may be slow or unreachable.');
      process.exit(1);
    }
    console.log('Result: ERROR');
    console.log('Error:', err.message || err);
    process.exit(1);
  }
}

checkSerpAPI();

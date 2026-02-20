#!/usr/bin/env node
/**
 * Test: Do we get store icons/images?
 * 1. getStoreLogoUrl returns a URL for every store name.
 * 2. Optionally fetch compare API and check store data + logo URLs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'store-logo-test-result.txt');

const STORE_LOGO_MAP = {
  Amazon: 'https://logo.clearbit.com/amazon.com',
  'Amazon Fresh': 'https://logo.clearbit.com/amazon.com',
  Walmart: 'https://logo.clearbit.com/walmart.com',
  Target: 'https://logo.clearbit.com/target.com',
  'Best Buy': 'https://logo.clearbit.com/bestbuy.com',
  Costco: 'https://logo.clearbit.com/costco.com',
  "Sam's Club": 'https://logo.clearbit.com/samsclub.com',
  Kroger: 'https://logo.clearbit.com/kroger.com',
  'King Soopers': 'https://logo.clearbit.com/kroger.com',
  Safeway: 'https://logo.clearbit.com/safeway.com',
  'Whole Foods': 'https://logo.clearbit.com/wholefoodsmarket.com',
  "Trader Joe's": 'https://logo.clearbit.com/traderjoes.com',
  Aldi: 'https://logo.clearbit.com/aldi.us',
  'Food Lion': 'https://logo.clearbit.com/foodlion.com',
  Newegg: 'https://logo.clearbit.com/newegg.com',
  'B&H Photo': 'https://logo.clearbit.com/bhphotovideo.com',
  eBay: 'https://logo.clearbit.com/ebay.com',
  Apple: 'https://logo.clearbit.com/apple.com',
};

function getStoreLogoUrl(storeName, backendLogo) {
  if (backendLogo && typeof backendLogo === 'string' && backendLogo.startsWith('http')) return backendLogo;
  const name = (storeName || '').trim();
  if (!name) return 'https://via.placeholder.com/40?text=?';
  if (STORE_LOGO_MAP[name]) return STORE_LOGO_MAP[name];
  const clean = name.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
  if (clean) return `https://logo.clearbit.com/${clean}.com`;
  return 'https://via.placeholder.com/40?text=' + encodeURIComponent(name.charAt(0).toUpperCase() || '?');
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { status: res.status, ok: res.ok };
  } catch (e) {
    return { status: null, ok: false, error: e.message };
  }
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL || 'https://pricelens-1.onrender.com';
let lines = [];

function log(...args) {
  const msg = args.join(' ');
  console.log(...args);
  lines.push(msg);
}

async function main() {
  log('=== Store logo URL test ===\n');

  const sampleStores = ['Amazon', 'Walmart', 'Target', 'Best Buy', 'Unknown Store', ''];
  log('1. getStoreLogoUrl() always returns a URL:');
  for (const name of sampleStores) {
    const url = getStoreLogoUrl(name, null);
    const hasHttp = url.startsWith('http');
    log(`   "${name || '(empty)'}" -> ${url.substring(0, 60)}${url.length > 60 ? '...' : ''} ${hasHttp ? '✓' : '✗'}`);
  }

  log('\n2. Checking if a few logo URLs are reachable (HEAD request):');
  const toCheck = ['Amazon', 'Walmart', 'Target'].map((n) => getStoreLogoUrl(n, null));
  for (const url of toCheck) {
    const result = await checkUrl(url);
    log(`   ${url.split('/').pop()} -> ${result.ok ? '200 OK ✓' : `HTTP ${result.status || result.error}`}`);
  }

  log('\n3. API response: stores and logos from backend');
  try {
    const storesRes = await fetch(`${API_BASE}/stores`, { signal: AbortSignal.timeout(15000) });
    if (!storesRes.ok) {
      log(`   /stores: HTTP ${storesRes.status}`);
    } else {
      const stores = await storesRes.json();
      const list = Array.isArray(stores) ? stores : stores?.data || [];
      log(`   /stores returned ${list.length} stores`);
      const withLogo = list.filter((s) => s.logo && String(s.logo).startsWith('http'));
      log(`   Stores with backend logo URL: ${withLogo.length}`);
      list.slice(0, 5).forEach((s) => {
        const name = s.name || s.slug || '?';
        const backendLogo = s.logo;
        const ourUrl = getStoreLogoUrl(name, backendLogo);
        log(`   - ${name}: backend logo=${backendLogo ? 'yes' : 'no'}, our URL=${ourUrl.startsWith('http') ? 'yes' : 'no'}`);
      });
    }
  } catch (e) {
    log('   Failed to fetch /stores:', e.message);
  }

  try {
    const compareRes = await fetch(
      `${API_BASE}/products/compare/multi-store?q=iPhone&searchType=auto`,
      { signal: AbortSignal.timeout(20000) }
    );
    if (!compareRes.ok) {
      log(`   /compare/multi-store: HTTP ${compareRes.status}`);
    } else {
      const data = await compareRes.json();
      const prices = data.prices || [];
      log(`   /compare/multi-store returned ${prices.length} store prices`);
      prices.slice(0, 6).forEach((p, i) => {
        const storeName = p.store?.name || '?';
        const backendLogo = p.store?.logo;
        const ourUrl = getStoreLogoUrl(storeName, backendLogo);
        log(`   - #${i + 1} ${storeName}: backend logo=${backendLogo ? 'yes' : 'no'}, resolved URL=${ourUrl.startsWith('http') ? 'yes' : 'no'}`);
      });
    }
  } catch (e) {
    log('   Failed to fetch /compare/multi-store:', e.message);
  }

  log('\n=== Summary ===');
  log('Store icons/images are "returned" in the app by:');
  log('  - Backend may send store.logo; if not, we use getStoreLogoUrl(storeName)');
  log('  - getStoreLogoUrl always returns an HTTP URL (map, Clearbit, or placeholder)');
  log('  - StoreCard shows that URL and falls back to store initial if image fails to load');

  try {
    fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  } catch (e) {
    lines.push('Write error: ' + e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Test ALL service categories individually
 *
 * Requires:
 * - Backend running: npm run start:dev (in server folder)
 * - SERPER_API_KEY in server/.env (for Maps + Shopping)
 *
 * Run: npx ts-node test-all-service-categories.ts
 *
 * If you get 500: check server console for the real error (often missing SERPER_API_KEY).
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

interface TestCase {
  name: string;
  category: string;
  url: string;
  method: 'GET';
}

const TESTS: TestCase[] = [
  {
    name: 'Gas Stations',
    category: 'gas-stations',
    url: `${API_BASE}/services/gas-stations?zipCode=90210&gasType=regular`,
    method: 'GET',
  },
  {
    name: 'Gyms',
    category: 'gyms',
    url: `${API_BASE}/services/gyms?zipCode=90210`,
    method: 'GET',
  },
  {
    name: 'Hotels',
    category: 'hotels',
    url: `${API_BASE}/services/hotels?location=Los%20Angeles`,
    method: 'GET',
  },
  {
    name: 'Oil Changes',
    category: 'oil-changes',
    url: `${API_BASE}/services/oil-changes?zipCode=90210`,
    method: 'GET',
  },
  {
    name: 'Tires',
    category: 'tires',
    url: `${API_BASE}/services/tires?year=2020&make=Toyota&model=RAV4&zipCode=90210`,
    method: 'GET',
  },
  {
    name: 'Airfare',
    category: 'airfare',
    url: `${API_BASE}/services/airfare?origin=JFK&destination=LAX`,
    method: 'GET',
  },
  {
    name: 'Providers (Haircuts)',
    category: 'providers-haircuts',
    url: `${API_BASE}/services/providers?category=haircuts&serviceType=mens&zipCode=90210`,
    method: 'GET',
  },
  {
    name: 'Providers (Spa)',
    category: 'providers-spa',
    url: `${API_BASE}/services/providers?category=spa&serviceType=massage&zipCode=90210`,
    method: 'GET',
  },
  {
    name: 'Providers (Nail Salons)',
    category: 'providers-nail',
    url: `${API_BASE}/services/providers?category=nail-salons&serviceType=manicure&zipCode=90210`,
    method: 'GET',
  },
];

async function runOne(test: TestCase): Promise<{ ok: boolean; status: number; count: number; error?: string; sample?: string }> {
  try {
    const res = await fetch(test.url, { method: test.method });
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, status: res.status, count: 0, error: text.slice(0, 150) };
    }
    if (!res.ok) {
      const err = data?.error ?? data;
      const errMsg = typeof err?.message === 'string' ? err.message : (err?.stack ?? (typeof data === 'object' ? JSON.stringify(data).slice(0, 400) : text.slice(0, 200)));
      return { ok: false, status: res.status, count: 0, error: errMsg };
    }
    const arr = Array.isArray(data) ? data : data?.results || data?.data || [];
    const count = Array.isArray(arr) ? arr.length : 0;
    const sample = count > 0 ? JSON.stringify(arr[0]).slice(0, 120) + '...' : '';
    return { ok: true, status: res.status, count, sample };
  } catch (e: any) {
    return { ok: false, status: 0, count: 0, error: e.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  SERVICE CATEGORIES – INDIVIDUAL TESTS');
  console.log('  Base URL: ' + API_BASE);
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    process.stdout.write(`  ${test.name.padEnd(28)} ... `);
    const result = await runOne(test);
    if (result.ok && result.count >= 0) {
      passed++;
      console.log(`OK (${result.count} results)`);
      if (result.sample) console.log(`      Sample: ${result.sample}`);
    } else {
      failed++;
      console.log(`FAIL (${result.status || 'error'})`);
      if (result.error) console.log(`      ${result.error}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Result: ${passed}/${TESTS.length} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}

main();

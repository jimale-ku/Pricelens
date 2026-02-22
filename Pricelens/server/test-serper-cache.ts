/**
 * Proves Serper cache works by calling the app services directly (no HTTP).
 * First searchMaps() adds a cache row; second call with same params does not.
 *
 * Requires: SERPAPI_KEY (Serper) in .env. DB must be up (migration applied).
 *
 * Run from server: npx ts-node -r dotenv/config test-serper-cache.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SerpAPIMapsService } from './src/integrations/services/serpapi-maps.service';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  console.log('Serper cache test (in-process)\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const mapsService = app.get(SerpAPIMapsService);

  const before = await prisma.serperCache.count();
  console.log(`1. SerperCache rows before: ${before}`);

  const params = { query: 'gas station 90210', zipCode: '90210', sort: 'distance' as const };
  console.log('2. First searchMaps(...)');
  const r1 = await mapsService.searchMaps(params);
  console.log(`   Results: ${r1.results.length}, engine: ${r1.searchMetadata?.engine}`);

  const afterFirst = await prisma.serperCache.count();
  console.log(`3. SerperCache rows after 1st: ${afterFirst} (added ${afterFirst - before})`);

  console.log('4. Second searchMaps(...) same params');
  const r2 = await mapsService.searchMaps(params);
  console.log(`   Results: ${r2.results.length}, engine: ${r2.searchMetadata?.engine}`);

  const afterSecond = await prisma.serperCache.count();
  console.log(`5. SerperCache rows after 2nd: ${afterSecond} (added ${afterSecond - afterFirst})`);

  const cacheUsed = afterSecond === afterFirst && afterFirst > before;
  console.log('\n--- Result ---');
  if (cacheUsed) {
    console.log('PASS: First request added cache; second used cache (no new rows).');
  } else if (afterFirst === before) {
    console.log('FAIL: No cache row after first request (Serper may have failed or key missing).');
  } else {
    console.log('FAIL: Second request added more rows (cache not hit).');
  }

  await app.close();
  process.exit(cacheUsed ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

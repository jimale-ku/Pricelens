/**
 * Test Hybrid Approach: PriceAPI (Amazon) + SerpAPI (Other Stores)
 * 
 * This test verifies that:
 * 1. PriceAPI provides Amazon prices
 * 2. SerpAPI provides other store prices
 * 3. Both are combined correctly
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const PRICEAPI_KEY = process.env.PRICEAPI_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function testHybridApproach(query: string = 'iPhone 15') {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Testing Hybrid Approach');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Query: "${query}"\n`);

  // Step 1: Get Amazon price from PriceAPI
  console.log('📦 Step 1: Getting Amazon price from PriceAPI...');
  let amazonPrice: any = null;
  let productInfo: any = null;

  if (PRICEAPI_KEY) {
    try {
      const priceApiUrl = `https://api.priceapi.com/v2/jobs?token=${PRICEAPI_KEY}`;
      const jobPayload = {
        source: 'amazon',
        country: 'us',
        topic: 'product_and_offers',
        key: 'term',
        values: [query],
      };

      const createJobResponse = await fetch(priceApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      });

      if (createJobResponse.ok) {
        const jobData = await createJobResponse.json();
        const jobId = jobData.job_id;

        if (jobId) {
          console.log(`   ✅ Job created: ${jobId}`);
          console.log(`   ⏳ Polling for results...`);

          // Poll for results (simplified - just wait a bit)
          await new Promise(resolve => setTimeout(resolve, 5000));

          const resultResponse = await fetch(`https://api.priceapi.com/v2/jobs/${jobId}?token=${PRICEAPI_KEY}`);
          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            if (resultData.status === 'finished') {
              const downloadResponse = await fetch(`https://api.priceapi.com/v2/jobs/${jobId}/download?token=${PRICEAPI_KEY}`);
              if (downloadResponse.ok) {
                const downloadData = await downloadResponse.json();
                if (downloadData.results && downloadData.results.length > 0) {
                  const content = downloadData.results[0].content;
                  const buybox = content.buybox;
                  
                  productInfo = {
                    name: content.name || content.title,
                    image: content.image_url || content.main_image?.link,
                    barcode: content.gtins?.[0] || content.eans?.[0],
                  };

                  if (buybox && buybox.min_price) {
                    amazonPrice = {
                      store: 'Amazon',
                      price: parseFloat(buybox.min_price),
                      currency: buybox.currency || 'USD',
                      url: content.url,
                      image: productInfo.image,
                    };
                    console.log(`   ✅ Amazon price: $${amazonPrice.price} (${amazonPrice.currency})`);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.log(`   ⚠️  PriceAPI error: ${error.message}`);
    }
  } else {
    console.log(`   ⚠️  PRICEAPI_KEY not configured`);
  }

  // Step 2: Get other store prices from SerpAPI
  console.log('\n🛒 Step 2: Getting other store prices from SerpAPI...');
  const otherStores: any[] = [];

  if (SERPAPI_KEY) {
    try {
      const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
      const response = await fetch(serpUrl);

      if (response.ok) {
        const data = await response.json();
        const results = data.shopping_results || [];

        const seenStores = new Set<string>();
        for (const result of results) {
          const source = (result.source || '').toLowerCase();
          
          // Skip Amazon (we get it from PriceAPI)
          if (source.includes('amazon')) continue;
          
          // Skip duplicates
          if (seenStores.has(source)) continue;
          seenStores.add(source);

          const priceText = result.price || '0';
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

          if (price > 0) {
            otherStores.push({
              store: result.source,
              price: price,
              currency: 'USD',
              url: result.link,
              image: result.thumbnail,
            });
          }
        }

        console.log(`   ✅ Found ${otherStores.length} other stores`);
        otherStores.slice(0, 5).forEach((store, i) => {
          console.log(`      ${i + 1}. ${store.store}: $${store.price}`);
        });
      }
    } catch (error: any) {
      console.log(`   ⚠️  SerpAPI error: ${error.message}`);
    }
  } else {
    console.log(`   ⚠️  SERPAPI_KEY not configured`);
  }

  // Step 3: Combine results
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ HYBRID RESULT:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const allStores: any[] = [];
  
  if (amazonPrice) {
    allStores.push(amazonPrice);
  }
  
  allStores.push(...otherStores);
  
  // Sort by price
  allStores.sort((a, b) => a.price - b.price);

  console.log(`\n📊 Product: ${productInfo?.name || query}`);
  console.log(`🖼️  Image: ${productInfo?.image ? '✅ Yes' : '❌ No'}`);
  console.log(`📦 Barcode: ${productInfo?.barcode || 'N/A'}`);
  console.log(`\n💰 Prices from ${allStores.length} stores:\n`);

  allStores.forEach((store, index) => {
    const isBest = index === 0;
    console.log(`${index + 1}. ${isBest ? '🏆 ' : '   '}${store.store}: $${store.price}${isBest ? ' (BEST PRICE)' : ''}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Amazon: ${amazonPrice ? `$${amazonPrice.price} (from PriceAPI)` : 'Not found'}`);
  console.log(`✅ Other stores: ${otherStores.length} (from SerpAPI)`);
  console.log(`✅ Total stores: ${allStores.length}`);
  console.log(`✅ Best price: $${allStores[0]?.price || 'N/A'} from ${allStores[0]?.store || 'N/A'}`);
  console.log(`✅ Price range: $${allStores[0]?.price || 'N/A'} - $${allStores[allStores.length - 1]?.price || 'N/A'}`);
  console.log('');
}

// Run test
testHybridApproach('iPhone 15').catch(console.error);





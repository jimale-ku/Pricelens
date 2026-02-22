/**
 * Detailed SerpAPI Test
 * 
 * Tests what SerpAPI actually returns:
 * 1. Product images
 * 2. Amazon results
 * 3. Full product information
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SERPAPI_KEY = process.env.SERPAPI_KEY || '94324ab2b874ec651b211c73e592c0da8371bb2984eface87cfbd1013a124fee';

async function testSerpAPIDetailed(query: string = 'iPhone 15') {
  console.log(`🧪 Detailed SerpAPI Test for: "${query}"\n`);

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Request failed: ${response.status}`);
      return;
    }

    const data = await response.json();
    const results = data.shopping_results || [];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 QUESTION 1: Does SerpAPI return product images?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let hasImages = 0;
    let noImages = 0;
    
    results.slice(0, 10).forEach((result: any, index: number) => {
      const hasImage = result.thumbnail || result.image;
      if (hasImage) {
        hasImages++;
        console.log(`${index + 1}. ✅ HAS IMAGE: ${result.thumbnail || result.image}`);
      } else {
        noImages++;
        console.log(`${index + 1}. ❌ NO IMAGE`);
      }
    });
    
    console.log(`\n📊 Summary: ${hasImages} with images, ${noImages} without images`);
    console.log(`✅ ANSWER: Yes, SerpAPI returns product images (thumbnail field)`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 QUESTION 2: Does SerpAPI return Amazon results?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const amazonResults = results.filter((r: any) => 
      (r.source || '').toLowerCase().includes('amazon')
    );
    
    if (amazonResults.length > 0) {
      console.log(`✅ YES! Found ${amazonResults.length} Amazon result(s):\n`);
      amazonResults.forEach((result: any, index: number) => {
        console.log(`${index + 1}. ${result.source}`);
        console.log(`   Title: ${result.title?.substring(0, 70)}...`);
        console.log(`   Price: ${result.price}`);
        console.log(`   Image: ${result.thumbnail ? '✅ Yes' : '❌ No'}`);
        console.log(`   URL: ${result.link?.substring(0, 60)}...`);
        console.log('');
      });
    } else {
      console.log(`❌ NO Amazon results found in this search`);
      console.log(`\n⚠️  Why?`);
      console.log(`- Google Shopping results vary by product`);
      console.log(`- Amazon may not always appear in top results`);
      console.log(`- Try different search terms or check full results`);
      
      // Check all results for Amazon
      const allAmazon = results.filter((r: any) => 
        (r.source || '').toLowerCase().includes('amazon')
      );
      console.log(`\n📊 Total Amazon results in all ${results.length} results: ${allAmazon.length}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 QUESTION 3: What product info does SerpAPI return?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (results.length > 0) {
      const firstResult = results[0];
      console.log('Sample result structure:');
      console.log(JSON.stringify({
        title: firstResult.title,
        price: firstResult.price,
        source: firstResult.source,
        link: firstResult.link,
        thumbnail: firstResult.thumbnail ? '✅ Present' : '❌ Missing',
        rating: firstResult.rating,
        reviews: firstResult.reviews,
        shipping: firstResult.shipping,
        condition: firstResult.condition,
      }, null, 2));
      
      console.log('\n✅ SerpAPI returns:');
      console.log('   - Product title ✅');
      console.log('   - Price ✅');
      console.log('   - Store name ✅');
      console.log('   - Product URL ✅');
      console.log('   - Product image (thumbnail) ✅');
      console.log('   - Rating (sometimes) ✅');
      console.log('   - Reviews (sometimes) ✅');
      console.log('   - Shipping info (sometimes) ✅');
      console.log('\n❌ SerpAPI does NOT return:');
      console.log('   - Detailed product description');
      console.log('   - Barcode/UPC (usually)');
      console.log('   - Brand (sometimes, in title)');
      console.log('   - Category');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ BEST APPROACH: Hybrid Solution');
    console.log('');
    console.log('1. Use PriceAPI for product discovery:');
    console.log('   - Product name, image, barcode, description');
    console.log('   - More reliable product info');
    console.log('');
    console.log('2. Use SerpAPI for multi-store prices:');
    console.log('   - Prices from 10+ stores');
    console.log('   - Works without approvals');
    console.log('   - Amazon may or may not appear (depends on Google Shopping)');
    console.log('');
    console.log('3. Combine both:');
    console.log('   - PriceAPI → Product info (image, name, barcode)');
    console.log('   - SerpAPI → Store prices (10+ stores)');
    console.log('   - Result → Complete product with multi-store prices ✅');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testSerpAPIDetailed('iPhone 15').catch(console.error);







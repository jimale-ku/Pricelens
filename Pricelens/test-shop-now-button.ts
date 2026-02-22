/**
 * Test Script: Shop Now Button Functionality
 * 
 * This script tests that the "Shop Now" button correctly:
 * 1. Receives valid product URLs
 * 2. Opens store homepages when product URLs are missing
 * 3. Handles invalid URLs gracefully
 * 
 * Run this with: npx ts-node test-shop-now-button.ts
 * 
 * Note: This is a Node.js test script that simulates the React Native Linking behavior.
 * In a real React Native app, you would use Linking.canOpenURL() and Linking.openURL().
 */

// Mock test data - simulate what the API returns
interface TestStorePrice {
  rank: number;
  storeName: string;
  price: string;
  storeImage: string;
  isBestDeal?: boolean;
  productUrl?: string;
}

// Test cases
const testCases: Array<{
  name: string;
  storePrice: TestStorePrice;
  expectedUrl: string;
  shouldSucceed: boolean;
}> = [
  // Test 1: Amazon with homepage URL (current implementation)
  {
    name: 'Amazon - Homepage URL',
    storePrice: {
      rank: 1,
      storeName: 'Amazon',
      price: '$799.99',
      storeImage: 'https://logo.clearbit.com/amazon.com',
      isBestDeal: true,
      productUrl: 'https://www.amazon.com',
    },
    expectedUrl: 'https://www.amazon.com',
    shouldSucceed: true,
  },
  
  // Test 2: Walmart with homepage URL
  {
    name: 'Walmart - Homepage URL',
    storePrice: {
      rank: 2,
      storeName: 'Walmart',
      price: '$829.99',
      storeImage: 'https://logo.clearbit.com/walmart.com',
      productUrl: 'https://www.walmart.com',
    },
    expectedUrl: 'https://www.walmart.com',
    shouldSucceed: true,
  },
  
  // Test 3: Target with homepage URL
  {
    name: 'Target - Homepage URL',
    storePrice: {
      rank: 3,
      storeName: 'Target',
      price: '$849.99',
      storeImage: 'https://logo.clearbit.com/target.com',
      productUrl: 'https://www.target.com',
    },
    expectedUrl: 'https://www.target.com',
    shouldSucceed: true,
  },
  
  // Test 4: Best Buy with homepage URL
  {
    name: 'Best Buy - Homepage URL',
    storePrice: {
      rank: 4,
      storeName: 'Best Buy',
      price: '$799.99',
      storeImage: 'https://logo.clearbit.com/bestbuy.com',
      productUrl: 'https://www.bestbuy.com',
    },
    expectedUrl: 'https://www.bestbuy.com',
    shouldSucceed: true,
  },
  
  // Test 5: Future - Amazon with direct product URL (what we want)
  {
    name: 'Amazon - Direct Product URL (Future)',
    storePrice: {
      rank: 1,
      storeName: 'Amazon',
      price: '$799.99',
      storeImage: 'https://logo.clearbit.com/amazon.com',
      isBestDeal: true,
      productUrl: 'https://www.amazon.com/dp/B08N5WRWNW',
    },
    expectedUrl: 'https://www.amazon.com/dp/B08N5WRWNW',
    shouldSucceed: true,
  },
  
  // Test 6: Future - Amazon with affiliate link
  {
    name: 'Amazon - Affiliate Link (Future)',
    storePrice: {
      rank: 1,
      storeName: 'Amazon',
      price: '$799.99',
      storeImage: 'https://logo.clearbit.com/amazon.com',
      isBestDeal: true,
      productUrl: 'https://www.amazon.com/dp/B08N5WRWNW?tag=your-affiliate-tag',
    },
    expectedUrl: 'https://www.amazon.com/dp/B08N5WRWNW?tag=your-affiliate-tag',
    shouldSucceed: true,
  },
  
  // Test 7: Missing URL (should fallback to homepage)
  {
    name: 'Missing URL - Should Fallback',
    storePrice: {
      rank: 5,
      storeName: 'Costco',
      price: '$779.99',
      storeImage: 'https://logo.clearbit.com/costco.com',
      productUrl: undefined,
    },
    expectedUrl: 'https://www.costco.com', // Generated fallback
    shouldSucceed: true,
  },
  
  // Test 8: Invalid URL (should fail gracefully)
  {
    name: 'Invalid URL - Should Fail Gracefully',
    storePrice: {
      rank: 6,
      storeName: 'eBay',
      price: '$750.00',
      storeImage: 'https://logo.clearbit.com/ebay.com',
      productUrl: 'not-a-valid-url',
    },
    expectedUrl: 'not-a-valid-url',
    shouldSucceed: false,
  },
  
  // Test 9: Empty string URL
  {
    name: 'Empty String URL - Should Fail Gracefully',
    storePrice: {
      rank: 7,
      storeName: 'Newegg',
      price: '$820.00',
      storeImage: 'https://logo.clearbit.com/newegg.com',
      productUrl: '',
    },
    expectedUrl: '',
    shouldSucceed: false,
  },
];

/**
 * Simulate the handleShopNow function from StoreCard.tsx
 */
async function simulateHandleShopNow(storePrice: TestStorePrice): Promise<{
  success: boolean;
  urlOpened?: string;
  error?: string;
}> {
  const { storeName, productUrl } = storePrice;
  
  console.log(`\n🛒 Testing Shop Now for ${storeName}:`, {
    productUrl,
    hasUrl: !!productUrl,
    urlType: typeof productUrl,
    urlLength: productUrl?.length,
  });
  
  // Check if productUrl is valid (same validation as StoreCard)
  const isValidUrl = productUrl && 
                     typeof productUrl === 'string' && 
                     productUrl.trim().length > 0 && 
                     (productUrl.startsWith('http://') || productUrl.startsWith('https://'));
  
  if (!isValidUrl) {
    // Generate fallback URL (same logic as backend)
    const storeNameLower = storeName.toLowerCase();
    let fallbackUrl: string | undefined;
    
    if (storeNameLower.includes('amazon')) {
      fallbackUrl = 'https://www.amazon.com';
    } else if (storeNameLower.includes('walmart')) {
      fallbackUrl = 'https://www.walmart.com';
    } else if (storeNameLower.includes('target')) {
      fallbackUrl = 'https://www.target.com';
    } else if (storeNameLower.includes('best buy') || storeNameLower.includes('bestbuy')) {
      fallbackUrl = 'https://www.bestbuy.com';
    } else if (storeNameLower.includes('costco')) {
      fallbackUrl = 'https://www.costco.com';
    } else if (storeNameLower.includes('ebay')) {
      fallbackUrl = 'https://www.ebay.com';
    } else if (storeNameLower.includes('newegg')) {
      fallbackUrl = 'https://www.newegg.com';
    } else {
      fallbackUrl = `https://www.${storeName.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com`;
    }
    
    console.log(`⚠️ Invalid productUrl, using fallback: ${fallbackUrl}`);
    
    if (fallbackUrl) {
      try {
        // Validate URL format (simulates Linking.canOpenURL)
        // In a real React Native app, we would do:
        // const canOpen = await Linking.canOpenURL(fallbackUrl);
        // if (canOpen) {
        //   await Linking.openURL(fallbackUrl);
        // }
        const url = new URL(fallbackUrl);
        return { success: true, urlOpened: fallbackUrl };
      } catch (error) {
        return { success: false, error: 'Invalid fallback URL format' };
      }
    }
    
    return { success: false, error: 'No valid URL available' };
  }
  
  // Valid URL - try to open it
  try {
    const urlToOpen = productUrl.trim();
    console.log(`🔗 Attempting to open URL: ${urlToOpen}`);
    
    // Validate URL format (simulates Linking.canOpenURL)
    const url = new URL(urlToOpen);
    
    // In a real React Native app, we would do:
    // const canOpen = await Linking.canOpenURL(urlToOpen);
    // if (canOpen) {
    //   await Linking.openURL(urlToOpen);
    //   return { success: true, urlOpened: urlToOpen };
    // } else {
    //   return { success: false, error: 'URL cannot be opened' };
    // }
    
    return { success: true, urlOpened: urlToOpen };
  } catch (error: any) {
    console.error(`❌ Error with URL: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Run all test cases
 */
async function runTests() {
  console.log('🧪 Starting Shop Now Button Tests\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log('-'.repeat(60));
    
    const result = await simulateHandleShopNow(testCase.storePrice);
    
    const testPassed = result.success === testCase.shouldSucceed && 
                       (result.urlOpened === testCase.expectedUrl || 
                        (!testCase.shouldSucceed && result.error));
    
    if (testPassed) {
      console.log(`✅ PASSED`);
      passed++;
    } else {
      console.log(`❌ FAILED`);
      console.log(`   Expected: ${testCase.shouldSucceed ? 'Success' : 'Failure'}`);
      console.log(`   Got: ${result.success ? 'Success' : 'Failure'}`);
      if (result.urlOpened) {
        console.log(`   URL Opened: ${result.urlOpened}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`   📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Review the output above.');
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}


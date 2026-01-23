# Affiliate Links & Revenue Guide

## 🎯 How "Shop Now" Buttons Benefit You

When users click "Shop Now" on store cards, they're taken directly to the product page on the retailer's website. This creates multiple revenue opportunities:

### 💰 Revenue Benefits

1. **Affiliate Commissions**
   - Earn 1-10% commission on purchases made through your links
   - Major retailers pay commissions:
     - **Amazon Associates**: 1-10% (varies by category)
     - **Walmart Affiliates**: 1-4%
     - **Target Affiliates**: 1-8%
     - **Best Buy Affiliates**: 1-5%
     - **eBay Partner Network**: 50-70% of revenue share

2. **Tracking & Analytics**
   - Track which products users click most
   - Identify best-performing stores
   - Optimize product recommendations
   - Measure conversion rates

3. **User Value**
   - Users get direct access to products
   - No extra steps - seamless experience
   - Builds trust and user retention

## 🔧 How It Works Now

Currently, the "Shop Now" button:
1. ✅ Opens the product URL from the store
2. ✅ Uses React Native `Linking` API
3. ✅ Handles errors gracefully
4. ✅ Works on both iOS and Android

## 🚀 Setting Up Affiliate Links

### Step 1: Sign Up for Affiliate Programs

1. **Amazon Associates** (Most Important)
   - Sign up: https://affiliate-program.amazon.com/
   - Get your Associate Tag (e.g., `yourstore-20`)
   - Commission: 1-10% depending on category

2. **Walmart Affiliates**
   - Sign up: https://affiliates.walmart.com/
   - Get your Partner ID
   - Commission: 1-4%

3. **Target Affiliates**
   - Sign up: https://www.target.com/c/affiliates
   - Get your Affiliate ID
   - Commission: 1-8%

4. **Best Buy Affiliates**
   - Sign up: https://www.bestbuy.com/site/misc/affiliate-program/pcmcat149900050025.c
   - Commission: 1-5%

### Step 2: Add Affiliate IDs to Environment Variables

Add to `server/.env`:

```env
# Amazon Associates
AMAZON_ASSOCIATE_TAG=yourstore-20

# Walmart Affiliates
WALMART_PARTNER_ID=your-partner-id

# Target Affiliates
TARGET_AFFILIATE_ID=your-affiliate-id

# Best Buy Affiliates
BESTBUY_AFFILIATE_ID=your-affiliate-id
```

### Step 3: Create Affiliate Link Utility

Create `server/src/utils/affiliate-links.util.ts`:

```typescript
import { ConfigService } from '@nestjs/config';

export class AffiliateLinkUtil {
  constructor(private configService: ConfigService) {}

  /**
   * Add affiliate tracking to product URLs
   */
  addAffiliateTracking(originalUrl: string, storeName: string): string {
    if (!originalUrl) return originalUrl;

    try {
      const url = new URL(originalUrl);
      const store = storeName.toLowerCase();

      // Amazon Associates
      if (store.includes('amazon')) {
        const tag = this.configService.get<string>('AMAZON_ASSOCIATE_TAG');
        if (tag) {
          url.searchParams.set('tag', tag);
          // Add other tracking parameters
          url.searchParams.set('linkCode', 'll1');
          url.searchParams.set('creative', '9325');
          url.searchParams.set('creativeASIN', this.extractAsin(originalUrl));
        }
      }

      // Walmart Affiliates
      if (store.includes('walmart')) {
        const partnerId = this.configService.get<string>('WALMART_PARTNER_ID');
        if (partnerId) {
          url.searchParams.set('affp1', partnerId);
        }
      }

      // Target Affiliates
      if (store.includes('target')) {
        const affiliateId = this.configService.get<string>('TARGET_AFFILIATE_ID');
        if (affiliateId) {
          url.searchParams.set('ref', affiliateId);
        }
      }

      // Best Buy Affiliates
      if (store.includes('best buy') || store.includes('bestbuy')) {
        const affiliateId = this.configService.get<string>('BESTBUY_AFFILIATE_ID');
        if (affiliateId) {
          url.searchParams.set('ref', affiliateId);
        }
      }

      return url.toString();
    } catch (error) {
      console.error('Error adding affiliate tracking:', error);
      return originalUrl; // Return original if URL parsing fails
    }
  }

  /**
   * Extract ASIN from Amazon URL
   */
  private extractAsin(url: string): string {
    const match = url.match(/\/dp\/([A-Z0-9]{10})/);
    return match ? match[1] : '';
  }
}
```

### Step 4: Update Products Service

In `server/src/products/products.service.ts`, use the affiliate link utility:

```typescript
import { AffiliateLinkUtil } from '../utils/affiliate-links.util';

// In formatMultiStoreResponse method:
const affiliateUtil = new AffiliateLinkUtil(this.configService);
const productUrl = affiliateUtil.addAffiliateTracking(
  price.productUrl || price.store.websiteUrl,
  price.store.name
);
```

## 📊 Tracking & Analytics

### What to Track

1. **Click-Through Rate (CTR)**
   - How many users click "Shop Now"
   - Which stores get most clicks
   - Which products are most popular

2. **Conversion Rate**
   - How many clicks lead to purchases
   - Revenue per click
   - Best-performing product categories

3. **Revenue Metrics**
   - Total affiliate commissions
   - Average commission per sale
   - Monthly revenue trends

### Implementation

Add click tracking to `StoreCard.tsx`:

```typescript
const handleShopNow = async () => {
  // Track click event
  // You can use analytics service like:
  // - Firebase Analytics
  // - Mixpanel
  // - Custom analytics endpoint
  
  // Example:
  // analytics.track('shop_now_clicked', {
  //   store: storeName,
  //   product: productName,
  //   price: price,
  //   isBestDeal: isBestDeal,
  // });

  // Then open URL
  if (productUrl) {
    await Linking.openURL(productUrl);
  }
};
```

## 💡 Best Practices

1. **Disclosure**
   - Add "We may earn a commission" disclaimer
   - Required by FTC for affiliate links
   - Place near "Shop Now" buttons

2. **User Experience**
   - Open links in external browser (not in-app)
   - Show loading state while opening
   - Handle errors gracefully

3. **Optimization**
   - Track which stores convert best
   - Prioritize high-commission stores
   - A/B test button placement and text

## 📈 Expected Revenue

Based on typical affiliate programs:

- **100 clicks/day** → ~5-10 purchases → $50-200/month
- **1,000 clicks/day** → ~50-100 purchases → $500-2,000/month
- **10,000 clicks/day** → ~500-1,000 purchases → $5,000-20,000/month

*Note: Conversion rates vary by product category and store*

## ✅ Next Steps

1. ✅ "Shop Now" buttons now open product URLs
2. ⏳ Sign up for affiliate programs
3. ⏳ Add affiliate IDs to `.env`
4. ⏳ Implement affiliate link utility
5. ⏳ Add click tracking
6. ⏳ Add FTC disclosure

## 🔗 Resources

- [Amazon Associates](https://affiliate-program.amazon.com/)
- [Walmart Affiliates](https://affiliates.walmart.com/)
- [Target Affiliates](https://www.target.com/c/affiliates)
- [FTC Disclosure Guidelines](https://www.ftc.gov/tips-advice/business-center/guidance/ftcs-endorsement-guides-what-people-are-asking)





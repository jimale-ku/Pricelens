# Implementing Direct Product URLs with Affiliate Links

## 🎯 Goal

When a user clicks "Shop Now" for a product, they should be taken **directly to that product's page** on the store's website, not just the homepage. Additionally, we should use **affiliate links** to generate revenue from purchases.

**Current State:**
- ✅ Users click "Shop Now" → Taken to store homepage (e.g., `amazon.com`)
- ❌ Users must search for the product themselves

**Target State:**
- ✅ Users click "Shop Now" → Taken directly to product page (e.g., `amazon.com/dp/B08N5WRWNW`)
- ✅ Link includes affiliate tag → We earn commission on purchases
- ✅ Works for all major stores (Amazon, Walmart, Target, Best Buy, etc.)

---

## 💰 Why Affiliate Links?

### Revenue Opportunity

**How it works:**
1. User clicks "Shop Now" on your app
2. They're taken to the store's website via your affiliate link
3. If they make a purchase (within 24-48 hours), you earn a commission
4. Typical commission rates:
   - **Amazon Associates**: 1-10% (varies by category)
   - **Walmart Affiliates**: 1-4%
   - **Target Affiliates**: 1-8%
   - **Best Buy Affiliates**: 1-5%
   - **eBay Partner Network**: 50-70% of eBay's commission

**Example:**
- User buys iPhone 15 for $799 via your Amazon affiliate link
- Amazon Associates commission: ~4% = **$32 per sale**
- If 100 users buy per month → **$3,200/month revenue**

### Benefits

✅ **Passive Income**: Earn money while users shop  
✅ **No Extra Cost**: Affiliate programs are free to join  
✅ **Better UX**: Direct links are more convenient for users  
✅ **Trackable**: See which products/stores generate revenue  

---

## 🔍 How to Get Direct Product URLs

### Option 1: Store-Specific APIs (Best Quality)

#### Amazon Product Advertising API

**What it provides:**
- Direct product URLs (e.g., `amazon.com/dp/ASIN`)
- Product details (name, price, images, reviews)
- Affiliate link generation

**Requirements:**
- Free to join (Amazon Associates account)
- API approval required (can take 1-2 weeks)
- Must have a website/app with content
- Must make 3 sales in 180 days to stay active

**Implementation:**
```typescript
// Example: Get product URL from Amazon API
const response = await amazonAPI.getItem({
  ItemId: 'B08N5WRWNW', // ASIN
  ResponseGroup: 'ItemAttributes,Offers',
});

const productUrl = response.ItemDetailPageURL; // Direct product URL
const affiliateUrl = `${productUrl}?tag=your-affiliate-tag`; // Add affiliate tag
```

**Cost:** Free (but requires API approval)

---

#### Walmart Open API

**What it provides:**
- Direct product URLs
- Product details
- Pricing information

**Requirements:**
- Free API key (sign up at developer.walmart.com)
- No approval needed
- Rate limits: 5 calls/second

**Implementation:**
```typescript
// Example: Get product URL from Walmart API
const response = await walmartAPI.search({
  query: 'iPhone 15',
  format: 'json',
});

const productUrl = response.items[0].productUrl; // Direct product URL
const affiliateUrl = `${productUrl}?affiliateId=your-id`; // Add affiliate tag
```

**Cost:** Free

---

#### Best Buy Store API

**What it provides:**
- Direct product URLs
- Product details
- Pricing and availability

**Requirements:**
- Free API key (sign up at developer.bestbuy.com)
- No approval needed

**Implementation:**
```typescript
// Example: Get product URL from Best Buy API
const response = await bestBuyAPI.search({
  query: 'iPhone 15',
  format: 'json',
});

const productUrl = response.products[0].url; // Direct product URL
const affiliateUrl = `${productUrl}?ref=your-affiliate-id`; // Add affiliate tag
```

**Cost:** Free

---

### Option 2: PriceAPI Paid Plan

**What it provides:**
- Product URLs for multiple stores
- Already includes some affiliate links
- Unified API for all stores

**Requirements:**
- Paid plan ($200-500/month)
- No individual store API approvals needed

**Cost:** $200-500/month

---

### Option 3: SerpAPI (Google Shopping)

**Current Status:**
- Returns Google Shopping redirect URLs (not direct)
- Need to follow redirect to get actual store URL

**Limitation:**
- URLs are Google redirects, not direct store URLs
- Requires additional processing to extract real URLs

**Cost:** $50/month (current plan)

---

### Option 4: Hybrid Approach (Recommended)

**Combine multiple sources:**

1. **Amazon**: Use Amazon Product Advertising API (free, requires approval)
2. **Walmart**: Use Walmart Open API (free, no approval)
3. **Best Buy**: Use Best Buy Store API (free, no approval)
4. **Target**: Use Target Affiliate API (free, requires approval)
5. **Others**: Use SerpAPI or PriceAPI as fallback

**Benefits:**
- ✅ Free for most stores
- ✅ Direct product URLs
- ✅ Can add affiliate tags
- ✅ Best data quality

**Cost:** $0-50/month (only SerpAPI/PriceAPI for fallback stores)

---

## 🛠️ Step-by-Step Implementation

### Phase 1: Set Up Affiliate Accounts (Week 1)

#### 1. Amazon Associates

**Steps:**
1. Go to [affiliate-program.amazon.com](https://affiliate-program.amazon.com)
2. Sign up with your website/app URL
3. Wait for approval (1-3 days)
4. Get your affiliate tag (e.g., `yourstore-20`)
5. Apply for Product Advertising API access
6. Wait for API approval (1-2 weeks)

**Affiliate Tag Format:**
```
https://www.amazon.com/dp/B08N5WRWNW?tag=yourstore-20
```

---

#### 2. Walmart Affiliates

**Steps:**
1. Go to [affiliates.walmart.com](https://affiliates.walmart.com)
2. Sign up (requires website/app)
3. Get your affiliate ID
4. Sign up for Walmart Open API at [developer.walmart.com](https://developer.walmart.com)

**Affiliate Tag Format:**
```
https://www.walmart.com/ip/product/123456?affiliateId=your-id
```

---

#### 3. Best Buy Affiliates

**Steps:**
1. Go to [bestbuy.com/site/partner-program](https://www.bestbuy.com/site/partner-program)
2. Sign up
3. Get your affiliate ID
4. Sign up for Best Buy Store API at [developer.bestbuy.com](https://developer.bestbuy.com)

**Affiliate Tag Format:**
```
https://www.bestbuy.com/site/product/123456?ref=your-affiliate-id
```

---

#### 4. Target Affiliates

**Steps:**
1. Go to [target.com/corporate/affiliates](https://www.target.com/corporate/affiliates)
2. Sign up (requires website/app)
3. Get your affiliate ID
4. Access Target Affiliate API

**Affiliate Tag Format:**
```
https://www.target.com/p/product/-/A-123456?ref=your-affiliate-id
```

---

### Phase 2: Update Backend to Get Product URLs (Week 2)

#### Step 1: Update Store Adapters

**File:** `server/src/integrations/adapters/amazon/amazon.adapter.ts`

```typescript
async searchProducts(query: string): Promise<NormalizedPrice[]> {
  // Call Amazon Product Advertising API
  const response = await this.amazonAPI.searchItems({
    Keywords: query,
    SearchIndex: 'All',
    ItemCount: 10,
  });
  
  return response.Items.map(item => ({
    // ... existing fields ...
    url: this.addAffiliateTag(item.DetailPageURL), // Add affiliate tag
    productId: item.ASIN, // Store ASIN for future lookups
  }));
}

private addAffiliateTag(url: string): string {
  const affiliateTag = process.env.AMAZON_AFFILIATE_TAG; // e.g., "yourstore-20"
  if (!affiliateTag) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tag=${affiliateTag}`;
}
```

---

#### Step 2: Update Multi-Store Service

**File:** `server/src/integrations/services/multi-store-scraping.service.ts`

```typescript
async searchMultiStore(query: string, categoryId?: string) {
  // 1. Try Amazon API first (if approved)
  const amazonResults = await this.amazonAdapter.searchProducts(query);
  
  // 2. Try Walmart API
  const walmartResults = await this.walmartAdapter.searchProducts(query);
  
  // 3. Try Best Buy API
  const bestBuyResults = await this.bestBuyAdapter.searchProducts(query);
  
  // 4. Combine results
  return {
    // ... existing fields ...
    storePrices: [
      ...amazonResults.map(p => ({ ...p, url: this.addAffiliateTag(p.url, 'amazon') })),
      ...walmartResults.map(p => ({ ...p, url: this.addAffiliateTag(p.url, 'walmart') })),
      ...bestBuyResults.map(p => ({ ...p, url: this.addAffiliateTag(p.url, 'bestbuy') })),
    ],
  };
}

private addAffiliateTag(url: string, store: string): string {
  const tags = {
    amazon: process.env.AMAZON_AFFILIATE_TAG,
    walmart: process.env.WALMART_AFFILIATE_ID,
    bestbuy: process.env.BESTBUY_AFFILIATE_ID,
    target: process.env.TARGET_AFFILIATE_ID,
  };
  
  const tag = tags[store];
  if (!tag || !url) return url;
  
  // Add affiliate tag based on store
  if (store === 'amazon') {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tag=${tag}`;
  } else if (store === 'walmart') {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}affiliateId=${tag}`;
  }
  // ... handle other stores ...
  
  return url;
}
```

---

#### Step 3: Update Database Schema (If Needed)

**File:** `server/prisma/schema.prisma`

```prisma
model ProductPrice {
  // ... existing fields ...
  productUrl     String?  // Direct product URL
  affiliateUrl   String?  // URL with affiliate tag (computed)
  productId      String?  // Store-specific product ID (ASIN, SKU, etc.)
  lastUpdated    DateTime @default(now())
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_affiliate_urls
```

---

#### Step 4: Update Products Service

**File:** `server/src/products/products.service.ts`

```typescript
private formatMultiStoreResponse(dbProduct: any, source: string) {
  return {
    // ... existing fields ...
    prices: dbProduct.prices.map((price) => {
      // Use affiliateUrl if available, otherwise use productUrl
      const finalUrl = price.affiliateUrl || price.productUrl || price.store.websiteUrl;
      
      return {
        // ... existing fields ...
        productUrl: finalUrl, // This will be the affiliate link
      };
    }),
  };
}
```

---

### Phase 3: Update Frontend (Week 2)

**No changes needed!** The frontend already uses `productUrl` from the API response. Once the backend returns affiliate URLs, the frontend will automatically use them.

---

### Phase 4: Testing (Week 3)

#### Test Checklist

- [ ] Amazon affiliate links work and include correct tag
- [ ] Walmart affiliate links work and include correct ID
- [ ] Best Buy affiliate links work and include correct ID
- [ ] Target affiliate links work and include correct ID
- [ ] Fallback to homepage if product URL is missing
- [ ] URLs open correctly in browser/app
- [ ] Affiliate tracking is working (check affiliate dashboard)

#### Test Script

Run the test script:
```bash
npx ts-node test-shop-now-button.ts
```

---

## 📊 Cost Analysis

### Free Options (Recommended)

| Store | API Cost | Affiliate Program | Approval Needed |
|-------|----------|-------------------|-----------------|
| Amazon | Free | Free | Yes (1-2 weeks) |
| Walmart | Free | Free | No |
| Best Buy | Free | Free | No |
| Target | Free | Free | Yes (1 week) |
| eBay | Free | Free | No |

**Total Cost:** $0/month (if using free APIs)

---

### Paid Options (Fallback)

| Service | Cost/Month | What It Provides |
|---------|------------|------------------|
| PriceAPI | $200-500 | Product URLs for all stores |
| SerpAPI | $50 | Google Shopping results (redirect URLs) |

**Total Cost:** $50-500/month (only if needed for stores without free APIs)

---

## 🎯 Recommended Implementation Plan

### Month 1: Foundation

**Week 1:**
- ✅ Sign up for Amazon Associates
- ✅ Sign up for Walmart Affiliates
- ✅ Sign up for Best Buy Affiliates
- ✅ Apply for Amazon Product Advertising API

**Week 2:**
- ✅ Implement Walmart API adapter
- ✅ Implement Best Buy API adapter
- ✅ Update multi-store service to use APIs

**Week 3:**
- ✅ Test affiliate links
- ✅ Verify tracking in affiliate dashboards
- ✅ Update database with product URLs

**Week 4:**
- ✅ Monitor affiliate revenue
- ✅ Optimize based on performance

---

### Month 2: Expansion

**Week 1:**
- ✅ Get Amazon API approval (if received)
- ✅ Implement Amazon API adapter
- ✅ Add Amazon affiliate tags

**Week 2:**
- ✅ Sign up for Target Affiliates
- ✅ Implement Target API adapter

**Week 3-4:**
- ✅ Monitor and optimize
- ✅ Add more stores as needed

---

## 🔐 Environment Variables

Add these to your `.env` file:

```env
# Amazon
AMAZON_ACCESS_KEY=your-access-key
AMAZON_SECRET_KEY=your-secret-key
AMAZON_ASSOCIATE_TAG=yourstore-20
AMAZON_PARTNER_TAG=your-partner-tag

# Walmart
WALMART_API_KEY=your-api-key
WALMART_AFFILIATE_ID=your-affiliate-id

# Best Buy
BESTBUY_API_KEY=your-api-key
BESTBUY_AFFILIATE_ID=your-affiliate-id

# Target
TARGET_AFFILIATE_ID=your-affiliate-id

# eBay
EBAY_APP_ID=your-app-id
EBAY_AFFILIATE_CAMPAIGN_ID=your-campaign-id
```

---

## 📈 Revenue Projections

### Conservative Estimate

**Assumptions:**
- 1,000 users per month
- 10% click-through rate (100 users click "Shop Now")
- 5% conversion rate (5 users make a purchase)
- Average order value: $100
- Average commission: 3%

**Monthly Revenue:**
```
5 purchases × $100 × 3% = $15/month
```

### Optimistic Estimate

**Assumptions:**
- 10,000 users per month
- 20% click-through rate (2,000 users click "Shop Now")
- 10% conversion rate (200 users make a purchase)
- Average order value: $150
- Average commission: 4%

**Monthly Revenue:**
```
200 purchases × $150 × 4% = $1,200/month
```

---

## ✅ Success Metrics

Track these metrics:

1. **Click-Through Rate (CTR)**
   - % of users who click "Shop Now"
   - Target: 15-25%

2. **Conversion Rate**
   - % of clicks that result in purchases
   - Target: 5-10%

3. **Revenue per User**
   - Average commission per user
   - Target: $0.10-0.50/user

4. **Store Performance**
   - Which stores generate most revenue
   - Optimize based on performance

---

## 🚨 Important Notes

### Amazon Associates Requirements

1. **Must make 3 sales in 180 days** to stay active
2. **Must have content** on your website/app (product reviews, comparisons, etc.)
3. **Cannot use Amazon logo** without permission
4. **Must disclose** that links are affiliate links (add disclaimer)

### Legal Requirements

1. **FTC Disclosure**: Must disclose affiliate relationships
   - Add: "We may earn a commission from purchases made through our links"
2. **Privacy Policy**: Update to mention affiliate links
3. **Terms of Service**: Update to mention affiliate programs

---

## 📝 Summary

**To implement direct product URLs with affiliate links:**

1. ✅ **Sign up for affiliate programs** (Amazon, Walmart, Best Buy, Target)
2. ✅ **Get API access** (free for most stores)
3. ✅ **Update store adapters** to fetch product URLs
4. ✅ **Add affiliate tags** to URLs
5. ✅ **Update database** to store affiliate URLs
6. ✅ **Test and monitor** revenue

**Cost:** $0-50/month (only if using paid APIs for fallback stores)

**Revenue Potential:** $15-1,200/month (depending on traffic and conversions)

**Timeline:** 4-8 weeks (including API approval wait times)

---

**Next Steps:**
1. Review this document
2. Sign up for affiliate programs
3. Start with Walmart and Best Buy (no approval needed)
4. Apply for Amazon API access
5. Implement adapters one by one
6. Test and iterate




# 🏪 Multi-Store Price Comparison Architecture
## Complete Guide for PriceLens Startup

---

## 🎯 The Big Picture (Simple Analogy)

**Think of PriceLens like a smart shopping assistant:**

Imagine you want to buy a laptop. Instead of visiting 10 different stores yourself, you send 10 assistants (adapters) to each store. Each assistant:
- Knows exactly how that store works
- Finds the product you want
- Gets the price and availability
- Reports back in the same format

Then you compare all 10 reports, find the best price, and show it to your customer.

**That's exactly what we're building!**

---

## 🏗️ Architecture Overview

### **The Three-Layer System**

```
┌─────────────────────────────────────┐
│   User Interface (Frontend)        │  ← What users see
│   "Show me iPhone prices"          │
└──────────────┬────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Price Comparison Service          │  ← The Orchestrator
│   "Find product, get all prices"    │
└──────────────┬────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Store Adapters (10 adapters)      │  ← The Assistants
│   Amazon, Walmart, Target, etc.     │
└──────────────┬────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Scraping APIs                     │  ← The Tools
│   Bright Data, Oxylabs, Apify        │
└─────────────────────────────────────┘
```

---

## 🔑 Key Concepts Explained

### **1. Store Adapters (The Specialists)**

**Analogy:** Each adapter is like a specialist who only works at one store.

- **Amazon Adapter** = Expert who knows Amazon's website inside-out
- **Walmart Adapter** = Expert who knows Walmart's website inside-out
- **Target Adapter** = Expert who knows Target's website inside-out

**Why separate adapters?**
- Each store's website is different (like different languages)
- Amazon's HTML structure ≠ Walmart's HTML structure
- Each adapter speaks its store's "language" fluently

**What each adapter does:**
1. Takes your search query ("iPhone 15")
2. Searches that specific store
3. Extracts: price, availability, URL, image
4. Returns data in a standard format (normalized)

---

### **2. Product Matching (The Detective Work)**

**Analogy:** Like matching fingerprints to identify the same person.

When you search "Samsung Galaxy S23", you might get:
- Amazon: "Samsung Galaxy S23 128GB Black"
- Walmart: "Samsung Galaxy S23 Smartphone"
- Best Buy: "Samsung - Galaxy S23 5G"

**Are these the same product?** Yes! But how do we know?

**Matching Strategy (Best → Worst):**

1. **Barcode/UPC** (Best - like a fingerprint)
   - Same barcode = Same product ✅
   - Most reliable method

2. **Manufacturer Part Number (MPN)**
   - Samsung's internal model number
   - Very reliable

3. **Exact Model Number**
   - "SM-S911B" = specific model
   - Good for matching

4. **Fuzzy Name Matching** (Last resort)
   - Compare product names
   - Less reliable, but works when no barcode

**Why this matters:**
- Without matching, you might show 3 different products as "the same"
- With matching, you show 3 prices for the SAME product ✅

---

### **3. Canonical Products (The Master Record)**

**Analogy:** Like a library catalog card - one card represents the book, but it can be on different shelves.

```
Canonical Product: "Samsung Galaxy S23"
├── Barcode: 880609...
├── Brand: Samsung
├── Model: SM-S911B
└── Store Prices:
    ├── Amazon: $799
    ├── Walmart: $779
    ├── Best Buy: $799
    └── Target: $789
```

**Benefits:**
- One product record = Multiple store prices
- Easy to add new stores (just link to canonical product)
- Clean database structure

---

### **4. Background Jobs (The Price Updaters)**

**Analogy:** Like a newspaper delivery person who updates prices every few hours.

**Instead of:**
- ❌ User searches → Scrape all stores → Wait 10 seconds → Show results
- (Slow, expensive, unreliable)

**We do:**
- ✅ Background job runs every 6 hours → Updates prices → Saves to database
- ✅ User searches → Get from database → Show instantly
- (Fast, cheap, reliable)

**Refresh Schedule:**
- **Electronics**: Every 6-12 hours (prices change slowly)
- **Groceries**: Every 1-3 hours (prices change more often)
- **Rare items**: On-demand (only when someone searches)

**Why this works:**
- Prices don't change every minute
- 6-hour-old price is still useful
- Much cheaper (fewer API calls)
- Much faster (from database, not live scraping)

---

### **5. Failure Handling (The Safety Net)**

**Analogy:** Like having backup plans when your main plan fails.

**What happens when scraping fails?**

1. **Retry Logic**
   - Try 3 times with delays
   - Sometimes it's just a temporary network issue

2. **Health Monitoring**
   - Track which stores are working
   - If Amazon keeps failing, disable it temporarily
   - Try again later

3. **Fallback to Cached Price**
   - Show last known price (even if 12 hours old)
   - Flag it: "Updated 12h ago - Price may have changed"
   - Better than showing nothing!

4. **Transparency**
   - Show users: "Price updated 5 hours ago"
   - Builds trust (users know it's not real-time)
   - Better than pretending it's always fresh

---

## 💰 Cost Analysis (Startup Budget: $50-100/month)

### **Option 1: Apify (Recommended for Startups) 💡**

**Why Apify?**
- ✅ Pay-as-you-go (no monthly minimum)
- ✅ Good for low-medium volume
- ✅ Easy to set up
- ✅ Custom scrapers available

**Cost Breakdown:**

| Service | Cost | Usage |
|---------|------|-------|
| **Apify Scrapers** | $0.10 per search | 500 searches/month = $50 |
| **Storage (Database)** | $0-10/month | PostgreSQL (free tier available) |
| **Hosting (Backend)** | $0-20/month | Railway/Render free tier, or VPS |
| **Total** | **$50-80/month** | ✅ Within budget! |

**How it works:**
- Create 10 scrapers (one per store)
- Each search costs ~$0.10
- 500 searches/month = $50
- Perfect for startup phase!

---

### **Option 2: Bright Data (Enterprise-Grade)**

**Why Bright Data?**
- ✅ Highest success rate
- ✅ Best for high volume
- ✅ Most reliable

**Cost Breakdown:**

| Service | Cost | Usage |
|---------|------|-------|
| **Bright Data** | $500/month minimum | Too expensive for startup ❌ |
| **Total** | **$500+/month** | ❌ Over budget |

**Verdict:** Too expensive for startup phase. Consider later when scaling.

---

### **Option 3: Oxylabs (Mid-Range)**

**Why Oxylabs?**
- ✅ Good balance of price/quality
- ✅ Reliable service

**Cost Breakdown:**

| Service | Cost | Usage |
|---------|------|-------|
| **Oxylabs** | $300/month minimum | Still expensive ❌ |
| **Total** | **$300+/month** | ❌ Over budget |

**Verdict:** Better than Bright Data, but still over budget for startup.

---

### **Option 4: Hybrid Approach (Best for Startup) ⭐**

**Strategy:**
- Use **Apify** for most stores (pay-as-you-go)
- Use **free affiliate APIs** where available (Amazon, Walmart)
- Use **Apify** only for stores without APIs

**Cost Breakdown:**

| Service | Cost | Usage |
|---------|------|-------|
| **Amazon Affiliate API** | FREE | Unlimited (with limits) |
| **Walmart Open API** | FREE | 5,000 calls/day free |
| **eBay Browse API** | FREE | 5,000 calls/day free |
| **Best Buy Store API** | FREE | Unlimited (with limits) |
| **Apify (Target, Costco, etc.)** | $0.10/search | 200 searches/month = $20 |
| **Database** | $0-10/month | PostgreSQL |
| **Hosting** | $0-20/month | Free tier available |
| **Total** | **$20-50/month** | ✅ Well within budget! |

**This is the BEST approach for startups!**

---

## 🎯 Recommended Architecture (Startup-Friendly)

### **Phase 1: Free APIs First (Month 1-2)**

**Stores with Free APIs:**
1. ✅ **Amazon** - Product Advertising API (free)
2. ✅ **Walmart** - Open API (5,000 calls/day free)
3. ✅ **eBay** - Browse API (5,000 calls/day free)
4. ✅ **Best Buy** - Store API (free with limits)
5. ✅ **Newegg** - API (free with registration)

**Cost: $0/month** 🎉

**Implementation:**
- Create adapters for each API
- Use official APIs (stable, legal, free)
- Get 5 stores for free!

---

### **Phase 2: Add Scraping for Remaining Stores (Month 3+)**

**Stores without APIs (use Apify):**
6. **Target** - Apify scraper ($0.10/search)
7. **Costco** - Apify scraper ($0.10/search)
8. **Home Depot** - Apify scraper ($0.10/search)
9. **B&H Photo** - Apify scraper ($0.10/search)
10. **Apple Store** - Apify scraper ($0.10/search)

**Cost: ~$20-30/month** (if 200-300 searches/month)

**Total Cost: $20-50/month** ✅

---

## 📊 Monthly Cost Breakdown (Realistic Startup Scenario)

### **Scenario: 1,000 product searches/month**

| Component | Cost | Notes |
|-----------|------|-------|
| **Free APIs (5 stores)** | $0 | Amazon, Walmart, eBay, Best Buy, Newegg |
| **Apify Scraping (5 stores)** | $25 | 250 searches × $0.10 = $25 |
| **Database (PostgreSQL)** | $0-10 | Free tier or small VPS |
| **Backend Hosting** | $0-20 | Railway/Render free tier, or small VPS |
| **Monitoring/Logging** | $0-5 | Free tier services |
| **Total** | **$25-55/month** | ✅ Well within $50-100 budget! |

---

## 🚀 Implementation Roadmap

### **Week 1-2: Foundation**

1. **Create Adapter Interface**
   ```typescript
   interface StoreAdapter {
     searchProducts(query: string): Promise<NormalizedProduct[]>;
     getProductPrice(barcode: string): Promise<NormalizedPrice[]>;
     isEnabled(): boolean;
   }
   ```

2. **Build Free API Adapters**
   - Amazon Adapter (Product Advertising API)
   - Walmart Adapter (Open API)
   - eBay Adapter (Browse API)
   - Best Buy Adapter (Store API)

3. **Set Up Database Schema**
   - Add `canonical_name`, `barcode`, `model` to Product
   - Add `last_updated` to StoreProduct
   - Create indexes for fast lookups

**Cost: $0** (all free APIs)

---

### **Week 3-4: Product Matching**

4. **Implement Product Matching**
   - Barcode matching (priority 1)
   - MPN matching (priority 2)
   - Model matching (priority 3)
   - Fuzzy name matching (fallback)

5. **Create Canonical Product System**
   - Normalize product names
   - Link store prices to canonical products
   - Handle duplicates

**Cost: $0** (code only)

---

### **Week 5-6: Scraping Integration**

6. **Set Up Apify Account**
   - Sign up (free tier available)
   - Create scrapers for Target, Costco, etc.
   - Test scrapers

7. **Build Scraping Adapters**
   - Target Adapter (Apify)
   - Costco Adapter (Apify)
   - Home Depot Adapter (Apify)
   - B&H Adapter (Apify)

**Cost: ~$10-20** (testing phase)

---

### **Week 7-8: Background Jobs**

8. **Implement Background Job System**
   - Use NestJS @Cron or Bull Queue
   - Schedule price refreshes
   - Different intervals per category

9. **Add Caching Logic**
   - Check `last_updated` before refreshing
   - Skip if price is still fresh
   - Save to database

**Cost: $0** (code only)

---

### **Week 9-10: Failure Handling**

10. **Add Retry Logic**
    - 3 retries with exponential backoff
    - Per-store retry strategies

11. **Health Monitoring**
    - Track store health status
    - Disable failing stores temporarily
    - Alert on persistent failures

12. **UI Indicators**
    - Show "Updated X hours ago"
    - Flag stale prices
    - Show store availability

**Cost: $0** (code only)

---

## 🏗️ Technical Architecture

### **File Structure**

```
server/src/
├── integrations/
│   ├── adapters/
│   │   ├── base/
│   │   │   └── StoreAdapter.interface.ts
│   │   ├── amazon/
│   │   │   ├── AmazonAdapter.ts
│   │   │   └── amazon.types.ts
│   │   ├── walmart/
│   │   │   ├── WalmartAdapter.ts
│   │   │   └── walmart.types.ts
│   │   ├── ebay/
│   │   │   ├── EbayAdapter.ts
│   │   │   └── ebay.types.ts
│   │   ├── bestbuy/
│   │   │   ├── BestBuyAdapter.ts
│   │   │   └── bestbuy.types.ts
│   │   ├── target/
│   │   │   ├── TargetAdapter.ts (uses Apify)
│   │   │   └── target.types.ts
│   │   └── costco/
│   │       ├── CostcoAdapter.ts (uses Apify)
│   │       └── costco.types.ts
│   ├── services/
│   │   ├── PriceComparisonService.ts
│   │   ├── ProductMatchingService.ts
│   │   └── PriceRefreshService.ts (background jobs)
│   └── integrations.module.ts
├── products/
│   ├── products.service.ts
│   └── products.controller.ts
└── jobs/
    ├── price-refresh.job.ts
    └── price-refresh.module.ts
```

---

## 🔄 Data Flow (Step-by-Step)

### **Scenario: User searches "iPhone 15"**

```
1. User Types: "iPhone 15"
   ↓
2. Frontend sends to: GET /products/compare?q=iPhone+15
   ↓
3. Backend: PriceComparisonService
   ├─→ Check database for canonical product
   ├─→ If found: Get cached prices (FAST!)
   └─→ If not found: Continue to step 4
   ↓
4. Parallel Adapter Calls (all at once):
   ├─→ AmazonAdapter.searchProducts("iPhone 15")
   ├─→ WalmartAdapter.searchProducts("iPhone 15")
   ├─→ BestBuyAdapter.searchProducts("iPhone 15")
   ├─→ TargetAdapter.searchProducts("iPhone 15")
   └─→ ... (all 10 stores)
   ↓
5. Each Adapter Returns:
   {
     name: "Apple iPhone 15 128GB",
     barcode: "194253123456",
     prices: [{ store: "Amazon", price: 799, ... }]
   }
   ↓
6. ProductMatchingService:
   ├─→ Match by barcode (best)
   ├─→ Create/find canonical product
   └─→ Link all store prices to canonical product
   ↓
7. Save to Database:
   ├─→ Save canonical product
   ├─→ Save all store prices
   └─→ Set last_updated timestamps
   ↓
8. Return to Frontend:
   {
     product: { name: "iPhone 15", ... },
     prices: [
       { store: "Best Buy", price: 799, rank: 1 },
       { store: "Amazon", price: 799, rank: 2 },
       { store: "Walmart", price: 829, rank: 3 },
       ...
     ]
   }
   ↓
9. Frontend displays ProductCard with store prices!
```

---

## 💡 Cost Optimization Strategies

### **1. Smart Caching (Save 80% of costs)**

**Instead of:**
- Every search = Scrape all stores = $1.00

**Do this:**
- Search 1: Scrape all stores = $1.00, save to DB
- Search 2-100: Get from DB = $0.00
- After 6 hours: Refresh = $1.00

**Savings:** 99% reduction in API calls! 🎉

---

### **2. Use Free APIs First**

**Priority:**
1. ✅ Free APIs (Amazon, Walmart, eBay, Best Buy) - Use these first
2. ⚠️ Apify scraping - Only for stores without APIs
3. ❌ Expensive services - Avoid until scaling

**Savings:** 50% of stores are free!

---

### **3. Background Jobs (Not On-Demand)**

**Instead of:**
- User searches → Scrape → Wait → Show (slow, expensive)

**Do this:**
- Background job: Scrape every 6 hours → Save to DB
- User searches → Get from DB → Show instantly (fast, cheap)

**Savings:** 90% reduction in user-facing delays!

---

### **4. Selective Refreshing**

**Strategy:**
- Popular products: Refresh every 1-3 hours
- Rare products: Refresh only when searched
- Electronics: Refresh every 6-12 hours (prices change slowly)

**Savings:** Only refresh what's needed!

---

## 📈 Scaling Path (Startup → Growth)

### **Phase 1: Startup (Months 1-3)**
- **Stores:** 5-7 stores (free APIs + 2-3 Apify)
- **Volume:** 500-1,000 searches/month
- **Cost:** $20-50/month
- **Focus:** Get it working, prove concept

### **Phase 2: Growth (Months 4-6)**
- **Stores:** 10 stores (all major retailers)
- **Volume:** 2,000-5,000 searches/month
- **Cost:** $50-100/month
- **Focus:** Add more stores, optimize caching

### **Phase 3: Scale (Month 7+)**
- **Stores:** 15-20 stores
- **Volume:** 10,000+ searches/month
- **Cost:** $100-200/month
- **Focus:** Consider Bright Data for reliability
- **Revenue:** Start monetizing (affiliate links)

---

## 🎯 Recommended First 10 Stores (Priority Order)

### **Tier 1: Free APIs (Do First)**
1. ✅ **Amazon** - Product Advertising API
2. ✅ **Walmart** - Open API
3. ✅ **eBay** - Browse API
4. ✅ **Best Buy** - Store API
5. ✅ **Newegg** - API

**Cost: $0/month**

### **Tier 2: Apify Scraping (Add Next)**
6. **Target** - High user trust, clear pages
7. **Costco** - Popular for bulk items
8. **Home Depot** - Major home improvement store
9. **B&H Photo** - Electronics specialty
10. **Apple Store** - Brand recognition

**Cost: ~$20-30/month** (if 200-300 searches/month)

---

## 🛠️ Implementation Checklist

### **Week 1-2: Foundation**
- [ ] Create `StoreAdapter` interface
- [ ] Build Amazon adapter (free API)
- [ ] Build Walmart adapter (free API)
- [ ] Build eBay adapter (free API)
- [ ] Build Best Buy adapter (free API)
- [ ] Update database schema (add `canonical_name`, `barcode`, `last_updated`)
- [ ] Create `PriceComparisonService` (orchestrator)

### **Week 3-4: Product Matching**
- [ ] Implement barcode matching
- [ ] Implement MPN matching
- [ ] Implement model matching
- [ ] Implement fuzzy name matching
- [ ] Create `ProductMatchingService`
- [ ] Test matching with real products

### **Week 5-6: Scraping Integration**
- [ ] Sign up for Apify account
- [ ] Create Target scraper (Apify)
- [ ] Create Costco scraper (Apify)
- [ ] Build Target adapter
- [ ] Build Costco adapter
- [ ] Test scraping adapters

### **Week 7-8: Background Jobs**
- [ ] Set up NestJS @Cron or Bull Queue
- [ ] Create `PriceRefreshService`
- [ ] Implement refresh schedules (6h for electronics, 3h for groceries)
- [ ] Add caching logic (check `last_updated`)
- [ ] Test background jobs

### **Week 9-10: Failure Handling**
- [ ] Add retry logic (3 retries, exponential backoff)
- [ ] Implement store health monitoring
- [ ] Add fallback to cached prices
- [ ] Create UI indicators ("Updated X hours ago")
- [ ] Add error logging and alerts

---

## 💰 Monthly Cost Calculator

### **Input Your Volume:**

```
Number of unique product searches per month: _______

Calculation:
- Free APIs (5 stores): $0
- Apify scraping (5 stores): _______ searches × $0.10 = $_______
- Database: $0-10
- Hosting: $0-20
- Total: $_______
```

### **Example Scenarios:**

**Low Volume (500 searches/month):**
- Free APIs: $0
- Apify: 250 searches × $0.10 = $25
- Database: $5
- Hosting: $10
- **Total: $40/month** ✅

**Medium Volume (1,000 searches/month):**
- Free APIs: $0
- Apify: 500 searches × $0.10 = $50
- Database: $10
- Hosting: $15
- **Total: $75/month** ✅

**High Volume (2,000 searches/month):**
- Free APIs: $0
- Apify: 1,000 searches × $0.10 = $100
- Database: $10
- Hosting: $20
- **Total: $130/month** ⚠️ (slightly over, but can optimize)

---

## 🎯 Summary: What You Get

### **For $50-100/month, you get:**

✅ **10 major U.S. retailers** (Amazon, Walmart, Target, Costco, etc.)  
✅ **Real prices** (not mock data)  
✅ **Fast responses** (cached in database)  
✅ **Reliable system** (failure handling, retries)  
✅ **Scalable architecture** (easy to add more stores)  
✅ **Production-ready** (used by real comparison engines)

### **Key Benefits:**

1. **Cost-Effective**: Start with free APIs, add scraping gradually
2. **Fast**: Background jobs + caching = instant responses
3. **Reliable**: Retry logic + health monitoring = high uptime
4. **Scalable**: Add more stores easily (just create new adapter)
5. **Transparent**: Show freshness to users (builds trust)

---

## 🚀 Next Steps

1. **Review this document** with your team
2. **Choose your stores** (start with 5-7, expand to 10)
3. **Set up free APIs first** (Amazon, Walmart, eBay, Best Buy)
4. **Sign up for Apify** (free tier to test)
5. **Start with Week 1-2** (build foundation)
6. **Iterate and scale** (add stores as you grow)

---

## 📞 Questions?

**Common Questions:**

**Q: Can I start with just 5 stores?**  
A: Yes! Start with free APIs (Amazon, Walmart, eBay, Best Buy, Newegg) = $0/month

**Q: What if I exceed my budget?**  
A: Optimize caching, use more free APIs, refresh less frequently

**Q: How do I add more stores later?**  
A: Just create a new adapter! The architecture supports unlimited stores.

**Q: What if a store changes their website?**  
A: Update that specific adapter - others aren't affected (adapter pattern!)

---

**You're ready to build a production-grade price comparison system!** 🎉








# ⛽ Gas Price API Alternatives to ScrapingBee

## 🎯 Best Alternatives for Station-Level Gas Prices

### 1. **Cardog API** ⭐ **RECOMMENDED**

**What it provides:**
- ✅ Real-time fuel prices by location (coordinates or city/state)
- ✅ Station-level data: name, address, GPS coordinates
- ✅ Multiple fuel types: regular, premium, diesel
- ✅ Price by payment method (cash/credit)
- ✅ Station amenities
- ✅ Historical price data

**Pricing:**
- API key required
- Pay-per-use pricing
- More affordable than enterprise solutions

**API Documentation:** https://docs.cardog.ai/reference/fuel

**Why it's good:**
- Structured API (not scraping)
- Station-level granularity
- Good coverage in US
- Legal and reliable

**Integration:**
```typescript
// Example endpoint
GET https://api.cardog.ai/v1/fuel?lat=34.0522&lng=-118.2437&radius=5000
Authorization: Bearer YOUR_API_KEY
```

---

### 2. **Apify - Gas Station Prices** 🏆 **BEST VALUE**

**What it provides:**
- ✅ Scrapes GasBuddy for station prices
- ✅ Station-level data by ZIP code
- ✅ Multiple fuel types
- ✅ Real-time prices

**Pricing:**
- Pay-per-result or monthly plans
- Very affordable
- Free tier available

**Apify Actor:** https://apify.com/scraped/gas-station-prices

**Why it's good:**
- Similar to ScrapingBee but different provider
- Good coverage
- Easy to use
- Community-maintained

**⚠️ Note:** Still scraping-based, so same legal concerns as ScrapingBee

**Integration:**
```typescript
// Apify API
POST https://api.apify.com/v2/acts/scraped~gas-station-prices/run-sync
Authorization: Bearer YOUR_API_KEY
Body: { "zipCode": "90210" }
```

---

### 3. **TomTom Fuel Prices API** 🚗 **ENTERPRISE OPTION**

**What it provides:**
- ✅ Station-level fuel prices
- ✅ Updated every ~10 minutes
- ✅ Global coverage (varies by country)
- ✅ Multiple fuel types
- ✅ Station details

**Pricing:**
- Enterprise/paid plans only
- Contact sales for pricing
- Not available on free tier

**Documentation:** https://docs.tomtom.com/fuel-prices-api/

**Why it's good:**
- Very reliable
- Frequent updates
- Professional-grade data
- Legal and official

**Why it might not work:**
- Requires sales contact
- Higher cost
- May need enterprise agreement

---

### 4. **OPIS NAVX** 💼 **ENTERPRISE SOLUTION**

**What it provides:**
- ✅ 400,000+ gas stations globally
- ✅ Station-level retail prices
- ✅ Multiple updates per day
- ✅ Very comprehensive data
- ✅ EV charging stations too

**Pricing:**
- Enterprise pricing
- Contact sales
- High cost but comprehensive

**Website:** https://www.opis.com/product/pricing/retail-fuel-prices/opisnavx/

**Why it's good:**
- Industry standard
- Most comprehensive
- Very reliable
- Professional-grade

**Why it might not work:**
- Enterprise pricing (expensive)
- Requires sales contact
- May be overkill for your needs

---

### 5. **INRIX Fuel Stations API** 🗺️ **LOCATION-BASED**

**What it provides:**
- ✅ Station info + fuel prices
- ✅ Query by bounding box or radius
- ✅ Fuel types and prices
- ✅ Location data

**Pricing:**
- Subscription/contract required
- Contact for pricing

**Documentation:** https://docs.inrix.com/traffic/fuel/

**Why it's good:**
- Good for "find cheapest nearby" use cases
- Structured API
- Reliable data

**Why it might not work:**
- Requires contract
- Pricing not publicly available
- May be expensive

---

### 6. **OilPriceAPI Station-Level** (You Already Have This!)

**What it provides:**
- ✅ Station-level diesel prices (130,000+ stations)
- ✅ Wholesale gasoline prices
- ✅ State averages (free)

**Pricing:**
- ~$0.024 per station query
- Free state averages
- You already have a key!

**Documentation:** https://docs.oilpriceapi.com/solutions/gas-stations

**Why it's good:**
- You already have access
- Station-level data available
- Affordable pricing

**Limitations:**
- Better for diesel than gasoline
- May need to check gasoline coverage

**Check if available:**
- Log into OilPriceAPI dashboard
- Check if station-level endpoints are available
- May need to upgrade plan

---

## 📊 Comparison Table

| Service | Station-Level | Cost | Coverage | Update Frequency | Legal |
|---------|--------------|------|----------|------------------|-------|
| **Cardog API** | ✅ Yes | $$ | US (good) | Real-time | ✅ Yes |
| **Apify** | ✅ Yes | $ | US/Canada | Near real-time | ⚠️ Scraping |
| **TomTom** | ✅ Yes | $$$ | Global (varies) | ~10 min | ✅ Yes |
| **OPIS NAVX** | ✅ Yes | $$$$ | Global (400k+) | Multiple/day | ✅ Yes |
| **INRIX** | ✅ Yes | $$$ | US | Varies | ✅ Yes |
| **OilPriceAPI** | ⚠️ Partial | $ | US (diesel better) | Varies | ✅ Yes |

---

## 🎯 My Recommendations

### **Option 1: Apify** (Easiest, Similar to ScrapingBee)
- ✅ Similar to ScrapingBee but different provider
- ✅ Affordable
- ✅ Easy integration
- ⚠️ Still scraping-based

**Best for:** Quick setup, similar to ScrapingBee

### **Option 2: Cardog API** (Best Balance)
- ✅ Structured API (not scraping)
- ✅ Station-level data
- ✅ Affordable
- ✅ Legal and reliable

**Best for:** Production use, want reliability without enterprise cost

### **Option 3: Check OilPriceAPI First** (You Already Have It!)
- ✅ You already have a key
- ✅ May have station-level endpoints
- ✅ Affordable if available

**Best for:** Check your OilPriceAPI dashboard first!

### **Option 4: TomTom/OPIS** (Enterprise)
- ✅ Most reliable
- ✅ Professional-grade
- ❌ Expensive
- ❌ Requires sales contact

**Best for:** Enterprise/business use, budget available

---

## 🚀 Quick Start: Apify (Recommended for You)

### Step 1: Sign Up
1. Go to: https://apify.com/
2. Sign up for free account
3. Get API key from dashboard

### Step 2: Add to Backend

Add to `server/.env`:
```env
APIFY_API_KEY=your_apify_key_here
```

### Step 3: Update Service

I can help you integrate Apify into `fuel-price.service.ts`. It's very similar to ScrapingBee but uses Apify's infrastructure.

**Apify Actor:** `scraped/gas-station-prices`

**API Endpoint:**
```typescript
POST https://api.apify.com/v2/acts/scraped~gas-station-prices/run-sync
Authorization: Bearer YOUR_APIFY_KEY
Body: {
  "zipCode": "90210",
  "fuelType": "regular"
}
```

---

## 🚀 Quick Start: Cardog API (Best Long-Term)

### Step 1: Sign Up
1. Go to: https://cardog.ai/ (or check their docs)
2. Sign up and get API key
3. Check pricing plans

### Step 2: Add to Backend

Add to `server/.env`:
```env
CARDOG_API_KEY=your_cardog_key_here
```

### Step 3: Integration

Cardog uses location-based queries:
```typescript
GET https://api.cardog.ai/v1/fuel?lat=34.0522&lng=-118.2437&radius=5000
Authorization: Bearer YOUR_CARDOG_KEY
```

**Note:** You'll need to convert ZIP codes to lat/lng (use a geocoding service).

---

## 💡 Recommendation for You

**Start with Apify** because:
1. ✅ Similar to ScrapingBee (easy transition)
2. ✅ Affordable pricing
3. ✅ Good coverage
4. ✅ Quick to integrate

**Then consider Cardog** if:
- You want a non-scraping solution
- You need more reliability
- Budget allows

**Check OilPriceAPI first** - you might already have station-level access!

---

## 🔧 Want Me to Integrate One?

Tell me which one you prefer and I can:
1. Add the integration to `fuel-price.service.ts`
2. Update the service to use real station prices
3. Test it with your API key

**My recommendation:** Start with **Apify** (easiest) or check **OilPriceAPI dashboard** first (you already have it)!




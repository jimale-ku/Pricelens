# 🧪 Testing SerpAPI & Getting Real Data Guide

## ✅ Step 1: Test Your SerpAPI Integration

### Quick Test Script

Run the test script I created:

```bash
cd server
npx ts-node test-serpapi-maps.ts
```

This will test:
- ✅ SerpAPI key is configured
- ✅ Gas stations search (Pattern B)
- ✅ Gyms search (Pattern B)
- ✅ Hair salons search (Pattern C)
- ✅ Backend API endpoint

### Manual Testing

**Test Backend Endpoints:**

```bash
# Test gas stations
curl "http://localhost:3000/services/gas-stations?zipCode=90210&gasType=regular"

# Test gyms
curl "http://localhost:3000/services/gyms?zipCode=90210&membershipType=basic"

# Test service providers
curl "http://localhost:3000/services/providers?category=haircuts&serviceType=mens&zipCode=90210"
```

**Test Frontend:**
1. Start backend: `cd server && npm run start:dev`
2. Start frontend: `cd client && npm start`
3. Navigate to a Pattern B category (e.g., `/category/gas-stations`)
4. Enter ZIP code: `90210`
5. Click "Search Prices"
6. Should see real results!

---

## 🚫 What SerpAPI Doesn't Provide

### ❌ Missing Data:

1. **Real Gas Prices** - SerpAPI only gives business info, not actual fuel prices
2. **Exact Gym Membership Prices** - Only price indicators ($, $$, $$$)
3. **Exact Hotel Rates** - Only price indicators, not real-time booking prices
4. **Exact Service Prices** - Only price indicators for salons, massage, etc.

### ✅ What SerpAPI DOES Provide:

- Business names, addresses, phone numbers
- Ratings and review counts
- Distance calculations
- Business hours
- Website links
- Price indicators ($, $$, $$$, $$$$)

---

## 🔌 Alternative APIs for Missing Data

### 1. Gas Prices (GasBuddy Alternative)

#### Option A: Fuel Price APIs (Paid)

**Zyla API Hub - US Fuel Prices API**
- URL: https://zylalabs.com/api/1000/us+fuel+prices+per+state+api
- Cost: Paid plans available
- Provides: State-level fuel prices
- Coverage: US states

**OilPriceAPI**
- URL: https://docs.oilpriceapi.com/
- Cost: Free tier + paid plans
- Provides: Wholesale/commodity prices, some station-level data
- Coverage: Global

#### Option B: Scraping Services (Use with Caution)

**ScrapingBee - GasBuddy Scraper**
- URL: https://www.scrapingbee.com/scrapers/gasbuddy-scraper-api/
- Cost: Pay per request
- Provides: Scraped gas prices from GasBuddy
- ⚠️ **Warning**: May violate GasBuddy's ToS, use at your own risk

**Apify - GasBuddy Scraper**
- URL: Search Apify marketplace for "GasBuddy"
- Cost: Pay per execution
- Provides: Scraped gas station prices
- ⚠️ **Warning**: Legal/ToS concerns

#### Option C: GasBuddy GraphQL (Unofficial)

There are some Python libraries that attempt to access GasBuddy's internal GraphQL:
- `py-gasbuddy` on PyPI
- ⚠️ **Warning**: Not officially documented, may break, legal concerns

**Recommendation**: Use a paid fuel price API for production, or contact GasBuddy for enterprise access.

---

### 2. Gym Membership Prices

**No dedicated API exists**, but options:

#### Option A: Web Scraping
- Scrape gym websites (Planet Fitness, 24 Hour Fitness, etc.)
- Use ScrapingBee or Apify
- ⚠️ **Warning**: Legal/ToS concerns

#### Option B: User-Submitted Data
- Allow users to submit gym prices
- Build a crowdsourced database
- Similar to how GasBuddy works

#### Option C: Price Estimation
- Use SerpAPI's price indicators ($, $$, $$$)
- Estimate ranges based on indicators:
  - `$` = $20-40/month
  - `$$` = $40-80/month
  - `$$$` = $80-150/month
  - `$$$$` = $150+/month

**Recommendation**: Use price estimation for now, consider crowdsourcing later.

---

### 3. Hotel Prices

#### Option A: Booking APIs

**Booking.com Affiliate API**
- URL: https://developers.booking.com/
- Cost: Free (affiliate program)
- Provides: Real-time hotel prices, availability
- Coverage: Global

**Expedia Partner Solutions API**
- URL: https://developer.expedia.com/
- Cost: Free (partner program)
- Provides: Hotel prices, availability, booking
- Coverage: Global

**Amadeus Hotel API**
- URL: https://developers.amadeus.com/
- Cost: Free tier + paid
- Provides: Hotel search, prices, availability
- Coverage: Global

**Recommendation**: Use Booking.com or Expedia APIs for real hotel prices.

---

### 4. Service Prices (Haircuts, Massage, etc.)

**No dedicated APIs exist**, but options:

#### Option A: Web Scraping
- Scrape business websites (Yelp, Google Business)
- Use ScrapingBee or Apify
- ⚠️ **Warning**: Legal/ToS concerns

#### Option B: Yelp Fusion API
- URL: https://www.yelp.com/developers/documentation/v3
- Cost: Free tier (5,000 requests/day)
- Provides: Business info, some price indicators
- **Note**: Doesn't provide exact prices, but better business data

#### Option C: Google Places API
- URL: https://developers.google.com/maps/documentation/places
- Cost: Pay-as-you-go
- Provides: Business info, price indicators
- **Note**: Similar to SerpAPI, but more reliable

**Recommendation**: Use Yelp Fusion API for better business data, estimate prices from indicators.

---

## 🛠️ Implementation: Adding Real Gas Prices

Here's how to integrate a fuel price API:

### Step 1: Choose an API

Let's use **OilPriceAPI** as an example (has free tier):

```bash
# Sign up at: https://oilpriceapi.com/
# Get your API key
```

### Step 2: Add to Backend

Create `server/src/integrations/services/fuel-price.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FuelPriceService {
  private readonly logger = new Logger(FuelPriceService.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OILPRICEAPI_KEY') || '';
  }

  async getGasPrices(zipCode: string, fuelType: string = 'regular') {
    // Call OilPriceAPI or your chosen fuel price API
    // Map fuelType: regular -> RON91, premium -> RON95, etc.
    
    try {
      const response = await fetch(
        `https://api.oilpriceapi.com/v1/prices/latest?zip=${zipCode}&fuel=${fuelType}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Fuel price API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error(`Error fetching fuel prices: ${error.message}`);
      return null;
    }
  }
}
```

### Step 3: Merge with SerpAPI Data

Update `services.service.ts`:

```typescript
async searchGasStations(dto: SearchGasStationsDto) {
  // Get stations from SerpAPI
  const serpResults = await this.serpAPIMapsService.searchGasStations(
    dto.zipCode,
    dto.gasType
  );

  // Get prices from fuel price API
  const fuelPrices = await this.fuelPriceService.getGasPrices(
    dto.zipCode,
    dto.gasType
  );

  // Merge data
  return serpResults.results.map((station, index) => {
    // Try to match station with price data
    const priceData = this.matchStationWithPrice(station, fuelPrices);
    
    return {
      rank: index + 1,
      station: station.title,
      address: station.address,
      price: priceData?.price || 'N/A', // Real price if available
      distance: station.distance || 'N/A',
      rating: station.rating,
      phone: station.phone,
      website: station.website,
    };
  });
}
```

---

## 📊 Data Source Comparison

| Data Type | SerpAPI | Alternative APIs | Recommendation |
|-----------|---------|------------------|----------------|
| **Gas Stations** | ✅ Business info | OilPriceAPI, ScrapingBee | Use SerpAPI + OilPriceAPI |
| **Gas Prices** | ❌ Not available | OilPriceAPI, ScrapingBee | Use OilPriceAPI or scraping |
| **Gyms** | ✅ Business info | None (scraping only) | Use SerpAPI + price estimation |
| **Gym Prices** | ❌ Only indicators | None (crowdsource) | Estimate from indicators |
| **Hotels** | ✅ Business info | Booking.com, Expedia | Use SerpAPI + Booking.com API |
| **Hotel Prices** | ❌ Only indicators | Booking.com, Expedia | Use Booking.com API |
| **Services** | ✅ Business info | Yelp Fusion | Use SerpAPI + Yelp Fusion |
| **Service Prices** | ❌ Only indicators | None (scraping) | Estimate from indicators |

---

## 🎯 Recommended Implementation Strategy

### Phase 1: Use SerpAPI (Current)
- ✅ Business listings
- ✅ Ratings, reviews
- ✅ Addresses, phone numbers
- ⚠️ Price estimation from indicators

### Phase 2: Add Real Prices (Future)
1. **Gas Prices**: Integrate OilPriceAPI or similar
2. **Hotel Prices**: Integrate Booking.com Affiliate API
3. **Service Prices**: Keep estimation, or add crowdsourcing

### Phase 3: Enhance with Additional Data
1. **Yelp Fusion API**: Better business data
2. **Google Places API**: More reliable than SerpAPI for some data
3. **User Contributions**: Allow users to submit prices

---

## 🧪 Testing Checklist

- [ ] Run `test-serpapi-maps.ts` - All tests pass
- [ ] Test backend endpoints with curl
- [ ] Test frontend Pattern B category
- [ ] Test frontend Pattern C category
- [ ] Verify real data appears (not "Coming Soon")
- [ ] Check error handling (invalid ZIP, no results)
- [ ] Test with different ZIP codes
- [ ] Verify price indicators show correctly

---

## 💡 Next Steps

1. **Test SerpAPI**: Run the test script
2. **Choose Fuel Price API**: Sign up for OilPriceAPI or similar
3. **Integrate Fuel Prices**: Add fuel price service to backend
4. **Add Hotel API**: Integrate Booking.com for real hotel prices
5. **Enhance Service Data**: Add Yelp Fusion API for better business info

---

## 📝 Summary

**What Works Now:**
- ✅ SerpAPI provides business listings, ratings, addresses
- ✅ Backend endpoints are ready
- ✅ Frontend is connected

**What's Missing:**
- ⚠️ Real gas prices (use OilPriceAPI)
- ⚠️ Real hotel prices (use Booking.com API)
- ⚠️ Exact service prices (estimate from indicators)

**Quick Win:**
Start with SerpAPI (you have it working), then gradually add real price APIs as needed!




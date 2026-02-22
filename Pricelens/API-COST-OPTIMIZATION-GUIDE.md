# API Cost Optimization Guide

## Problem
You've used up your paid SerpAPI quota and are now on a free plan with only 250 queries. You need to continue development without spending money on API calls.

## Solution: Development Mode with Mock Data

I've implemented a **cost-effective development mode** that uses mock/sample data instead of making real API calls. This allows you to:

✅ **Build and test** all service categories without API costs  
✅ **Develop features** without worrying about quota limits  
✅ **Switch to real APIs** easily when ready for production  

---

## How It Works

### Automatic Mock Mode
The system automatically uses mock data when:
1. **`USE_MOCK_SERVICE_DATA=true`** is set in `.env`, OR
2. **Development mode** (`NODE_ENV=development`) AND **no API key** is present

### Manual Control
You can explicitly control mock mode:
```env
# Force mock data (saves API costs)
USE_MOCK_SERVICE_DATA=true

# Use real APIs (when you have quota)
USE_MOCK_SERVICE_DATA=false
```

---

## Configuration

### 1. Enable Mock Mode (Recommended for Development)

Add to `server/.env`:
```env
# Use mock data to save API costs during development
USE_MOCK_SERVICE_DATA=true

# Increase cache TTL to reduce API calls when using real APIs
SERPER_CACHE_TTL_HOURS=168  # 1 week (max)
```

### 2. Mock Data Features

All service categories now have realistic mock data:

- ✅ **Gas Stations** - 8 stations with realistic prices by fuel type
- ✅ **Gyms** - 8 gyms with membership prices
- ✅ **Hotels** - 8 hotels with nightly rates
- ✅ **Oil Changes** - 8 shops with prices by vehicle type
- ✅ **Tires** - 8 tire shops with prices
- ✅ **Haircuts** - 8 salons with service prices
- ✅ **Massage** - 8 massage therapists/spas
- ✅ **Nail Salons** - 8 nail salons with service prices
- ✅ **Spa Services** - 8 spas with treatment prices

**Note**: Airfare still uses real API (it's working), but you can add mock data if needed.

---

## Cost Optimization Strategies

### Strategy 1: Use Mock Data During Development ✅ **RECOMMENDED**

```env
USE_MOCK_SERVICE_DATA=true
```

**Benefits:**
- ✅ Zero API costs
- ✅ Instant responses (no network delay)
- ✅ Predictable data for testing
- ✅ No quota limits

**When to use:**
- During feature development
- UI/UX testing
- Local development
- Testing without API keys

### Strategy 2: Aggressive Caching

```env
USE_MOCK_SERVICE_DATA=false
SERPER_CACHE_TTL_HOURS=168  # Cache for 1 week
```

**Benefits:**
- ✅ Real data (when cached)
- ✅ Minimal API calls (once per week per query)
- ✅ Good for testing real API integration

**When to use:**
- Testing API integration
- Verifying real data structure
- Limited API quota available

### Strategy 3: Hybrid Approach

Use mock data for most development, switch to real APIs only when:
- Testing specific API features
- Verifying data accuracy
- Preparing for production

---

## Testing with Mock Data

### Test All Service Categories

```bash
cd server
npx ts-node test-all-services-comprehensive.ts
```

All categories will return mock data instantly without API calls.

### Test Individual Endpoints

```bash
# Gas Stations (mock data)
curl "http://localhost:3000/services/gas-stations?zipCode=90210&gasType=regular"

# Gyms (mock data)
curl "http://localhost:3000/services/gyms?zipCode=90210"

# Haircuts (mock data)
curl "http://localhost:3000/services/providers?category=haircuts&serviceType=mens&zipCode=90210"
```

---

## Mock Data Quality

Mock data includes:
- ✅ Realistic business names (Shell, Chevron, Planet Fitness, etc.)
- ✅ Realistic prices (based on market averages)
- ✅ Addresses with ZIP codes
- ✅ Ratings (3.8-4.8 range)
- ✅ Review counts
- ✅ Phone numbers
- ✅ Distances
- ✅ Service-specific pricing

**Example Mock Gas Station:**
```json
{
  "rank": 1,
  "station": "Shell",
  "address": "100 Main St, City, State 90210",
  "price": "$3.89",
  "distance": "0.3 miles",
  "rating": "4.5",
  "phone": "(555) 100-1000",
  "website": "https://shell.com"
}
```

---

## Switching to Real APIs

When ready to use real APIs:

1. **Get API Key** (Serper.dev or SerpAPI)
2. **Add to `.env`**:
   ```env
   SERPER_API_KEY=your_api_key_here
   USE_MOCK_SERVICE_DATA=false
   ```
3. **Restart server**
4. **Test endpoints** - they'll now use real APIs

---

## API Cost Comparison

### Without Mock Data (250 free queries)
- Each service search = 1 API call
- Testing 20 categories = 20 calls
- Testing 5 times = 100 calls
- **You'll run out quickly!**

### With Mock Data
- Each service search = 0 API calls
- Testing 20 categories = 0 calls
- Testing unlimited times = 0 calls
- **No cost, no limits!**

---

## Fallback Behavior

The system automatically falls back to mock data if:
- API call fails (network error, rate limit, etc.)
- API key is invalid
- API service is down

This ensures your app **never breaks** due to API issues.

---

## Production Considerations

### Before Production:

1. **Test with real APIs** (set `USE_MOCK_SERVICE_DATA=false`)
2. **Verify data accuracy**
3. **Set appropriate cache TTL** (24 hours is good)
4. **Monitor API usage**
5. **Set up API key rotation** if needed

### Production Settings:

```env
NODE_ENV=production
USE_MOCK_SERVICE_DATA=false
SERPER_API_KEY=your_production_key
SERPER_CACHE_TTL_HOURS=24  # Balance freshness vs cost
```

---

## Summary

✅ **Use `USE_MOCK_SERVICE_DATA=true`** during development  
✅ **Zero API costs** while building features  
✅ **Switch to real APIs** easily when ready  
✅ **Automatic fallback** if APIs fail  
✅ **Realistic mock data** for all categories  

**You can now develop without worrying about API costs!** 🎉

---

## Next Steps

1. Set `USE_MOCK_SERVICE_DATA=true` in your `.env`
2. Restart your server
3. Test all service categories - they'll use mock data
4. Build features without API costs
5. Switch to real APIs when ready for production testing

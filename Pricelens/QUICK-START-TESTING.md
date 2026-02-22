# 🚀 Quick Start: Testing SerpAPI & Adding Real Data

## ✅ Step 1: Test Your SerpAPI Integration

### Run the Test Script

```bash
cd server
npx ts-node test-serpapi-maps.ts
```

This will test:
- ✅ SerpAPI key configuration
- ✅ Gas stations search
- ✅ Gyms search  
- ✅ Hair salons search
- ✅ Backend API endpoint

**Expected Output:**
```
🧪 Testing SerpAPI Google Maps Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 TEST 1: Gas Stations (Pattern B)
✅ Found 20 gas stations
✅ Gas Stations Test: PASSED

📋 TEST 2: Gyms (Pattern B)
✅ Found 15 gyms
✅ Gyms Test: PASSED

📋 TEST 3: Hair Salons (Pattern C)
✅ Found 12 hair salons
✅ Hair Salons Test: PASSED
```

---

## 🔌 Step 2: Test Backend Endpoints

**Make sure backend is running:**
```bash
cd server
npm run start:dev
```

**Test in another terminal:**

```bash
# Test gas stations
curl "http://localhost:3000/services/gas-stations?zipCode=90210&gasType=regular"

# Test gyms
curl "http://localhost:3000/services/gyms?zipCode=90210&membershipType=basic"

# Test service providers
curl "http://localhost:3000/services/providers?category=haircuts&serviceType=mens&zipCode=90210"
```

**Expected:** JSON array with real business data

---

## 🧪 Step 3: Test Frontend

1. **Start frontend:**
   ```bash
   cd client
   npm start
   ```

2. **Navigate to Pattern B category:**
   - Go to: `/category/gas-stations`
   - Enter ZIP: `90210`
   - Select gas type: `Regular`
   - Click "Search Prices"

3. **Check results:**
   - Should see real gas stations (not "Coming Soon")
   - Table shows: Rank, Station, Address, Price, Distance
   - ⚠️ Price may show "N/A" (we'll fix this next)

---

## ⛽ Step 4: Add Real Gas Prices

### Option A: OilPriceAPI (Recommended)

1. **Sign up:** https://oilpriceapi.com/
2. **Get API key**
3. **Add to `server/.env`:**
   ```env
   OILPRICEAPI_KEY=your_key_here
   ```
4. **Restart backend:**
   ```bash
   cd server
   npm run start:dev
   ```

5. **Test again:**
   - Search gas stations
   - Should now see real prices like `$3.45`, `$3.49`, etc.

### Option B: ScrapingBee (Alternative)

1. **Sign up:** https://www.scrapingbee.com/
2. **Get API key**
3. **Add to `server/.env`:**
   ```env
   SCRAPINGBEE_API_KEY=your_key_here
   ```
4. **Restart backend**

⚠️ **Note:** Scraping may violate GasBuddy's ToS. Use at your own risk.

---

## 📊 What You'll See

### With SerpAPI Only:
- ✅ Business names, addresses, phone numbers
- ✅ Ratings and reviews
- ✅ Distance calculations
- ❌ Gas prices show "N/A"

### With SerpAPI + Fuel Price API:
- ✅ Everything above
- ✅ **Real gas prices** (e.g., `$3.45`, `$3.49`)

---

## 🎯 Next Steps

1. **Test SerpAPI:** ✅ Run test script
2. **Test Backend:** ✅ Test endpoints with curl
3. **Test Frontend:** ✅ Search in UI
4. **Add Fuel Prices:** ⚠️ Sign up for OilPriceAPI or ScrapingBee
5. **Add Hotel Prices:** Consider Booking.com API
6. **Add Service Prices:** Use Yelp Fusion API for better data

---

## 📝 Troubleshooting

### "SERPAPI_KEY not found"
- Check `server/.env` file exists
- Verify key is set: `SERPAPI_KEY=your_key_here`
- No quotes around the key

### "Backend API Test: FAILED"
- Make sure backend is running: `cd server && npm run start:dev`
- Check port 3000 is not in use
- Check backend logs for errors

### "No results found"
- Try different ZIP codes (90210, 10001, 33139)
- Check SerpAPI quota (free tier: 100 searches/month)
- Check backend logs for API errors

### "Price shows N/A"
- This is normal if you don't have a fuel price API
- Add `OILPRICEAPI_KEY` or `SCRAPINGBEE_API_KEY` to get real prices

---

## ✅ Success Checklist

- [ ] Test script runs successfully
- [ ] Backend endpoints return data
- [ ] Frontend shows real results (not "Coming Soon")
- [ ] Gas stations appear with addresses, ratings
- [ ] (Optional) Real gas prices appear

---

## 🎉 You're Done!

Your Patterns B & C are now connected to real data! 🚀

For more details, see:
- `TESTING-SERPAPI-AND-REAL-DATA-GUIDE.md` - Complete guide
- `SERPAPI-INTEGRATION-GUIDE.md` - Integration details




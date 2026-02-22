# 🔑 Adding OilPriceAPI Key

## Step 1: Add Key to Environment File

**Open `server/.env` and add this line:**

```env
OILPRICEAPI_KEY=8f244a6b9d2bf1a023c1e6bc8bb9c7a9622cc299f8229d00a0b6fd7c66d1b4fc
```

**Or if the file doesn't exist, create it:**

1. Navigate to `server` folder
2. Create a file named `.env` (if it doesn't exist)
3. Add the line above

## Step 2: Test the Key

Run the test script:

```bash
cd server
npx ts-node test-oilpriceapi.ts
```

This will verify your API key works with OilPriceAPI.

## Step 3: Restart Backend

After adding the key, restart your backend:

```bash
cd server
npm run start:dev
```

## Step 4: Test Gas Stations with Real Prices

1. **Test via API:**
   ```bash
   curl "http://localhost:3000/services/gas-stations?zipCode=90210&gasType=regular"
   ```

2. **Test via Frontend:**
   - Navigate to `/category/gas-stations`
   - Enter ZIP: `90210`
   - Select gas type: `Regular`
   - Click "Search Prices"
   - **Should now see real prices** like `$3.45`, `$3.49`, etc. (instead of "N/A")

## ✅ Expected Results

**Before (SerpAPI only):**
- Station names ✅
- Addresses ✅
- Ratings ✅
- Prices: `N/A` ❌

**After (SerpAPI + OilPriceAPI):**
- Station names ✅
- Addresses ✅
- Ratings ✅
- **Real prices: `$3.45`, `$3.49`, etc.** ✅

## 🔍 Troubleshooting

### "OILPRICEAPI_KEY not found"
- Make sure you added it to `server/.env` (not `server/.env.example`)
- No quotes around the key
- Restart backend after adding

### "Prices still show N/A"
- Check backend logs for OilPriceAPI errors
- Verify API key is correct
- Check OilPriceAPI quota/limits
- Try different ZIP codes

### "API Error 401"
- API key is invalid or expired
- Check your OilPriceAPI dashboard

### "API Error 429"
- Rate limit exceeded
- Wait a few minutes and try again

## 📝 Note

The OilPriceAPI endpoint format may need adjustment based on their actual API documentation. If the test script shows errors, we may need to update the endpoint URL in `fuel-price.service.ts`.




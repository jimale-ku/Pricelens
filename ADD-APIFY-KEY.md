# 🔑 Adding Your Apify API Key

## ✅ Step 1: Add Key to Environment

**Open `server/.env` and add this line:**

```env
APIFY_API_KEY=your_apify_api_key_here
```

**Replace `your_apify_api_key_here` with your actual key from Apify Settings.**

---

## 🧪 Step 2: Test Your Key

**Run the test script:**

```bash
cd server
npx ts-node test-apify-gas-prices.ts YOUR_API_KEY
```

**Or if you added it to .env:**

```bash
cd server
npx ts-node test-apify-gas-prices.ts
```

**Expected Output:**
```
🧪 Testing Apify Gas Station Prices

✅ Actor started! Run ID: abc123
✅ Actor completed! Status: SUCCEEDED
✅ Got 15 results!

📊 SAMPLE RESULTS
1. Shell
   Address: 123 Main St, Los Angeles, CA
   Regular: $3.45
   Premium: $3.89
   Diesel: $4.12
```

---

## 🚀 Step 3: Restart Backend

After adding the key, restart your backend:

```bash
cd server
npm run start:dev
```

---

## ✅ Step 4: Test in Frontend

1. Navigate to `/category/gas-stations`
2. Enter ZIP: `90210`
3. Select gas type: `Regular`
4. Click "Search Prices"
5. **Should now see REAL prices** like `$3.45`, `$3.49`, etc.!

---

## 🎯 How It Works

1. **You search** for gas stations with a ZIP code
2. **Backend calls Apify** actor `scraped~gas-station-prices`
3. **Actor scrapes GasBuddy** for that ZIP code
4. **You get real prices** for each station!

**No need to understand actors or stores** - it just works! 🎉

---

## 🔍 Troubleshooting

### "APIFY_API_KEY not found"
- Make sure you added it to `server/.env` (not `.env.example`)
- No quotes around the key
- Restart backend after adding

### "Actor failed" or "401 Unauthorized"
- Check your API key is correct
- Make sure you copied the full key from Apify Settings
- Check Apify dashboard for usage/quota

### "No results found"
- Try different ZIP codes (90210, 10001, 33139)
- Check Apify actor is working (visit actor page)
- Some ZIP codes may not have data

---

## ✅ Success!

Once the test script works, your gas stations will show **real prices from GasBuddy**! 🎉




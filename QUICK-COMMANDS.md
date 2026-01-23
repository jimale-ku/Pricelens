# 🚀 Quick Commands - Apify Setup

## Step 1: Add API Key to .env

**Open `server/.env` and add this line:**
```env
APIFY_API_KEY=your_apify_api_key_here
```

## Step 2: Test Apify Integration

```bash
cd server
npx ts-node test-apify-gas-prices.ts
```

**Expected:** Should see gas station results with real prices!

## Step 3: Test Backend Endpoint

**Make sure backend is running first:**
```bash
cd server
npm run start:dev
```

**Then in another terminal:**
```bash
curl "http://localhost:3000/services/gas-stations?zipCode=90210&gasType=regular"
```

**Expected:** JSON with gas stations and real prices!

## Step 4: Test Frontend

1. Navigate to `/category/gas-stations`
2. Enter ZIP: `90210`
3. Select gas type: `Regular`
4. Click "Search Prices"
5. **Should see real prices!** 🎉

---

## ✅ That's It!

If the test script works, everything is set up correctly!




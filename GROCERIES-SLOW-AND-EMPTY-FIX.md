# Groceries (and other categories): Items not showing + very slow load

## What you were seeing

- In **Groceries** (or other product categories), the list stayed empty or took a very long time to load.
- The app felt stuck or timed out before any products appeared.

## Why it happened

### 1. **Backend was too slow for the client timeout**

- **Render free tier**: First request after idle can take **30–60 seconds** (cold start).
- **Serper/SerpAPI**: When the DB has no products for that category, the backend fetches from Serper. For groceries it was doing **up to 10 search terms** (e.g. “whole milk gallon”, “sandwich bread loaf”, …), each term = one API call, run **one after another**.
- So total time could be: **30–60 s (cold) + 20–50 s (Serper)** → often **50–110 seconds**.
- The **client** was using a **15 second** timeout for `/products/popular`. So the request was aborted before the backend finished, and you got **no items**.

### 2. **Empty database for that category**

- If the category (e.g. groceries) had no products in the DB yet, the backend *must* call Serper to get the first set. That first load is always slower than later loads (when results are already in the DB).

### 3. **Possible extra causes** (if it still happens)

- **SERPER_API_KEY** (or SerpAPI key) not set or invalid on Render → Serper calls fail, no products saved.
- **Stores not seeded** → Products from Serper need store records to attach prices to; if stores were missing, prices might not save and products get filtered out (we fixed seed in an earlier step).

## What we changed

1. **Client timeout** (`client/services/categoryService.ts`)
   - Increased from **15 s to 45 s** for `fetchCategoryProducts`.
   - So when the backend is warm, it has time to finish Serper and return products instead of the client aborting and showing nothing.

2. **Backend: fewer Serper terms when DB is empty** (`server/src/products/products.service.ts`)
   - When the database has **no** products for that category, we now cap search at **4 terms** instead of 10.
   - First load for groceries (and similar categories) does **4 Serper calls** instead of 10, so the first response is **faster** and more likely to complete within the 45 s timeout.

3. **Documentation**
   - This file: cause (cold start + many Serper calls + short timeout) and the fixes above.

## What you should do

- **Before a demo or heavy use**: Wake the backend so it’s not cold, e.g. open:
  - `https://pricelens-1.onrender.com/stores`
  - or use UptimeRobot to hit that URL every 5–10 minutes.
- **On Render**: Ensure **SERPER_API_KEY** (or your SerpAPI key) is set and valid so Serper can return grocery (and other) products.
- After the first successful load, groceries (and others) will be in the DB, so **next time** the same category will load from the DB and be much faster.

## If items still don’t show

1. Check Render logs for `/products/popular?categorySlug=groceries` (errors, 401, timeouts).
2. Confirm **SERPER_API_KEY** (or SerpAPI key) is set in Render env.
3. Confirm **stores are seeded** (seed runs on deploy; see RENDER-CONNECTION-FIX.md / WHY-BACKEND-DIED-DURING-DEMO.md).

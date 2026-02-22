# How Your Price Comparison App Works

## High-level flow

```
Stores (Walmart, Target, Best Buy, etc.)
         ↓
   Serper or SerpAPI (Google Shopping)
         ↓
   Your backend (NestJS)
         ↓
   Database (Prisma / SQLite or Postgres) — products + prices
         ↓
   Frontend (Expo/React Native) — categories, list, "View price" → compare
```

**Prices come from stores via Serper or SerpAPI.** The backend uses that data to fill the DB and to serve live results. The frontend shows categories, product lists, and the compare (View price) screen.

---

## 1. Where prices come from (external APIs)

- **Serper** (`google.serper.dev/shopping`) – used when `SERPER_API_KEY` or `SERPAPI_KEY` is set.  
  Returns Google Shopping results: product title, image, price, store name, link.
- **SerpAPI** (`serpapi.com` – Google Shopping) – used when Serper is not set but `SERPAPI_KEY` is set.  
  Same idea: shopping results with store and price.

So: **store prices are not scraped directly from retailer sites.** They come from **Google Shopping**, which aggregates store listings. Your app gets that via Serper or SerpAPI.

---

## 2. Backend: how the API feeds the DB and serves the app

### A. Category page – “Popular” product list (first 6, then pagination)

- **Endpoint:** `GET /products/popular?categorySlug=electronics&limit=6&page=1`
- **Logic:**
  1. **DB first:** Load products for that category from the database (with images, with at least one price).
  2. **If DB is empty or has fewer than `limit` products:**  
     Backend calls **Serper/SerpAPI** (`searchProductsFromSerpAPI`) with category search terms (e.g. “laptop”, “headphones” for electronics).  
     Each API response is a list of shopping results (many stores per query). Backend:
     - Groups by product name and builds `storePrices` (store + price + url).
     - Saves products and their store prices into the **database** via `autoSaveProductFromAPI` (Product + Store + ProductPrice).
  3. **Response:** Products (name, image, category, prices from DB). Pagination uses `page` and returns `hasMore` when there are more than `limit` products.

So: **Serper/SerpAPI feed the DB** when a category has no or few products. Once saved, the category page is served from the DB until more data is needed.

### B. “View price” – compare page (20+ USA stores)

- **Endpoint:** `GET /products/compare/multi-store?q=ProductName` (and optional `categoryId`).
- **Logic:**
  1. Backend may resolve the product from DB (e.g. by id or name).
  2. **Even if the product is in the DB:** When the user clicks “View price”, the backend **always** calls Serper/SerpAPI again for that product name:  
     `multiStoreScrapingService.searchProductWithMultiStorePrices(query)` → `getAllStorePricesFromSerpAPI(productName)`.  
     So the **compare view is driven by live Serper/SerpAPI results**, not only by what’s in the DB.
  3. Results are filtered (USA stores, accessory vs main product, basic price checks).  
     Up to ~100 stores per product; you aim for 20+ USA retailers.
  4. Optionally, the backend **writes these fresh prices back into the DB** (Store + ProductPrice) so future category/product views can use them.
  5. **Response:** One product (name, image) + list of store prices (store name, price, link). Frontend shows this as the price comparison.

So: **Prices on the compare screen come from Serper/SerpAPI at click time**; the DB is updated for reuse.

---

## 3. Frontend: what the user sees

- **Tabs / home:** Search, categories, etc.
- **Category page (e.g. Electronics, Groceries):**  
  - Calls `GET /products/popular?categorySlug=...&limit=6&page=1`.  
  - Shows 6 items per page (image, name, maybe lowest price).  
  - Pagination: when user reaches the 6th item, frontend requests `page=2` and appends the next 6.  
  - This only works if the backend actually has enough products (e.g. 6+ for page 1); otherwise `hasMore` is false and there is no second page.
- **“View price” on a product:**  
  - Navigates to the compare screen and calls `GET /products/compare/multi-store?q=...`.  
  - Backend fetches live Serper/SerpAPI results and returns 20+ USA store prices.  
  - Screen shows one product and a list of stores with prices (price comparison).

---

## 4. End-to-end summary

| Step | What happens |
|------|----------------|
| 1 | **Stores** list products and prices on Google Shopping. |
| 2 | **Serper or SerpAPI** returns those results to your backend (product + store + price + link). |
| 3 | **Backend** uses that to: (a) **fill the DB** when a category is empty or low on products, (b) **serve “View price”** with 20+ USA stores by calling Serper/SerpAPI again. |
| 4 | **DB** stores Product, Store, ProductPrice so category lists can be served from DB when possible. |
| 5 | **Frontend** gets: category list from **DB** (fed by API when needed), compare view from **live Serper/SerpAPI** (and optionally updates DB). |

So: **Prices come from stores via Serper/SerpAPI (Google Shopping).** The API feeds the DB and the backend; the backend returns those items and prices to the front so you get a price comparison app with categories, product grid, and multi-store “View price”.

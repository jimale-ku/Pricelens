# Barcode-Based Pricing (No Google – Accurate Data)

We are **not** locked to PricesAPI. You can use any barcode/price API that returns **direct product data** (not Google Shopping). Below are options that give **accurate, non–Google-sourced** prices.

---

## Why not Google (Serper/SerpAPI)?

- Serper and SerpAPI return **Google Shopping search results**. Those are aggregated/indexed by Google, often stale, and can mix wrong products (e.g. accessories instead of the main item).
- For **accuracy** you want an API that returns **price for this exact product (UPC/GTIN)** at each store – i.e. **barcode-based lookup**, not search.

---

## Non-Google APIs (barcode → accurate prices)

| API | What it does | Uses Google? | Barcode lookup | Notes |
|-----|----------------|--------------|----------------|--------|
| **ShopSavvy Data API** | Product + pricing across many retailers | No | UPC, EAN, ISBN, ASIN, URL | Tens of thousands of retailers, price history, scheduled refresh. [shopsavvy.com/data](https://shopsavvy.com/data) |
| **Barcode Lookup** (barcodelookup.com) | Product info + retail pricing by barcode | No | UPC, EAN, ISBN | Product name, images, retail pricing. [barcodelookup.com/api](https://www.barcodelookup.com/api) |
| **Price API** (priceapi.com) | Price monitoring by GTIN | No | GTIN, EAN, UPC, bulk | Async jobs, 72h results, bulk (e.g. 1000 products). [priceapi.com](https://www.priceapi.com) |
| **PricesAPI** (pricesapi.io) | Multi-store prices by barcode/search | No | Search by barcode → product id → offers | 100+ retailers, free tier. Base: `api.pricesapi.io/api/v1`, auth: `x-api-key`. [pricesapi.io](https://pricesapi.io) |

All of the above provide **direct product/price data** (retailer or aggregated), not Google SERP results.

---

## How the backend uses barcode (any provider)

1. **Compare by barcode** (scanner or product with barcode): backend receives `q=<barcode>&searchType=gtin`.
2. Backend tries **barcode price providers in order** (whichever keys you set in `.env`):
   - **Barcode Lookup** – if `BARCODE_LOOKUP_API_KEY` is set.
   - **PricesAPI** – if `PRICESAPI_KEY` is set.
3. If a provider returns at least one price → we return that (accurate, by UPC). No Google call.
4. If no provider is configured or all return empty → we fall back to Serper/SerpAPI (search-based).

So you choose **which** barcode API to use by setting the right env key; we don’t insist on PricesAPI.

---

## Where we get barcodes

| Source | When | Used for barcode pricing? |
|--------|------|---------------------------|
| **Barcode Scanner** | User scans or enters 8–14 digits | ✅ Yes – request sent as `q=<barcode>&searchType=gtin`. |
| **Product in DB** | Product saved with barcode (e.g. from PriceAPI or scan) | ✅ Yes – compare screen sends this barcode when opening Compare. |
| **PriceAPI** (if enabled) | Search returns products with `gtins`/`eans` | ✅ Yes – we save barcode to product for future compare. |
| **Serper/SerpAPI** | Search/compare by name | ❌ No – they don’t return barcode. |

---

## What to set in `.env`

- **Option A – Barcode Lookup (barcodelookup.com)**  
  `BARCODE_LOOKUP_API_KEY=your_key`

- **Option B – PricesAPI (pricesapi.io)**  
  `PRICESAPI_KEY=your_key`

- **Option C – ShopSavvy**  
  (Add `SHOPSAVVY_API_KEY` when we add the adapter; same pattern.)

You can set more than one; we try them in order and use the first that returns prices.

**Store order:** Results are sorted so the most popular US retailers appear first (e.g. Walmart, Amazon, Target, Costco, Best Buy, Home Depot, then the rest). Over 50 store names are in the priority list; others follow in API order.

---

## Client behavior

- **Compare screen**: If the product has `barcode`, we call the compare API with that barcode and `searchType=gtin` so the backend uses barcode-based pricing first.

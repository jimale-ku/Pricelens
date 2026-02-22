# Stores Returned by Serper API – For Logo Lookup

Use this list when adding store logos (e.g. to `client/constants/storeLogos.ts` STORE_LOGO_MAP). Names can appear exactly as below or with suffixes (e.g. "Walmart - SUSR", "Amazon.com").

## Get a live list from your API

From the **server** folder:

```bash
npx ts-node scripts/list-serper-stores.ts "Lenovo laptop"
```

Or try other queries:

```bash
npx ts-node scripts/list-serper-stores.ts "iPhone 15"
npx ts-node scripts/list-serper-stores.ts "headphones"
```

That prints the **exact store names** (sources) Serper returns so you can match logos.

---

## ~20 stores commonly returned by Serper (Google Shopping)

| # | Store name (typical) | Domain for Clearbit / logo |
|---|----------------------|----------------------------|
| 1 | Amazon | amazon.com |
| 2 | Walmart | walmart.com |
| 3 | Target | target.com |
| 4 | Best Buy | bestbuy.com |
| 5 | eBay | ebay.com |
| 6 | Costco | costco.com |
| 7 | Newegg | newegg.com |
| 8 | B&H Photo / B&H Photo Video | bhphotovideo.com |
| 9 | Adorama | adorama.com |
| 10 | Ant Online | antonline.com |
| 11 | Woot | woot.com |
| 12 | Back Market | backmarket.com |
| 13 | Lenovo | lenovo.com |
| 14 | Dell | dell.com |
| 15 | HP | hp.com |
| 16 | Micro Center | microcenter.com |
| 17 | GameStop | gamestop.com |
| 18 | QVC | qvc.com |
| 19 | HSN | hsn.com |
| 20 | Focus Camera | focuscamera.com |

Others you may see: **Walmart - 3rd Party**, **Amazon.com**, **Office Depot**, **Staples**, **Home Depot**, **Kohl's**, **Macy's**, **Overstock**, **Wayfair**, **Beach Camera**, **Samsung**, **Apple**, **Google Store**.

When adding logos, use the **domain** for Clearbit: `https://logo.clearbit.com/{domain}`. For display names with suffixes (e.g. "Walmart - SUSR"), match on the main name (e.g. "Walmart") or add an entry for the full name if needed.

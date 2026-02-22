# Service Categories: Real vs Mock Data

## When do you get **real** data?

- **Real data** is used when:
  1. You have **SERPER_API_KEY** or **SERPAPI_KEY** set in `.env`, and  
  2. You do **not** set `USE_MOCK_SERVICE_DATA=true`.

- **Mock/partner list** data is used when:
  1. You set `USE_MOCK_SERVICE_DATA=true` (to save API cost while testing), or  
  2. You are in **development** and have **no** SERPER_API_KEY or SERPAPI_KEY.

So for a **live app**, set `SERPER_API_KEY` in production and leave `USE_MOCK_SERVICE_DATA` unset (or `false`). Then rental cars, gas stations, gyms, etc. use **Serper Maps** (or SerpAPI) and return real places and real links.

---

## What Serper gives you (real data)

| Source | What it returns | What it does **not** return |
|--------|------------------|-----------------------------|
| **Serper Maps** (`google.serper.dev/maps`) | Real business names, addresses, **website URLs**, phone, rating, reviews, opening hours. | **Live prices** (e.g. $/day for rental cars). Maps/local results don’t include rental rates. |
| **Serper Shopping** | Product listings and prices (used for retail products, not for services like rental cars). | N/A for car rental. |

So for **rental cars** with Serper:

- You get **real** rental locations (e.g. “Hertz – LAX”, “Enterprise – Downtown”) and **real** `website` links from Google.
- We match names to a partner list to add **logos** and **“Sponsored”** where applicable; the **book** link is the real site from Serper when available.
- **Price** is shown as **“Check price on site”** because Serper Maps does not provide per-day rental prices. Users tap **Book** to see real prices on the provider’s site.

To show **real prices** in the app you’d need a **car-rental/affiliate API** (e.g. Rentalcars.com, Kayak, Skyscanner) that returns live rates; Serper alone cannot do that.

---

## Can OpenAI provide this?

- **OpenAI does not have live rental car (or hotel/flight) inventory or prices.**  
  It can’t “call” booking systems to get current rates.

- You *could* use OpenAI to **parse** text (e.g. from a webpage or search snippet) into structured data, but:
  - You’d need another source for the text (e.g. scraping or search results).
  - That’s brittle and may violate terms of service; not recommended for production pricing.

For **live** prices and availability, use **affiliate/booking APIs** or official partner APIs when you have agreements.

---

## Summary

| Goal | How |
|------|-----|
| **Real places + real links** (rental cars, gyms, etc.) | Use **Serper** (or SerpAPI): set **SERPER_API_KEY**, don’t force mock. |
| **Real prices for rental cars** | Use a **car rental / affiliate API** (e.g. Kayak, Rentalcars.com); not Serper, not OpenAI. |
| **Save cost while developing** | Set **USE_MOCK_SERVICE_DATA=true** or omit API keys in dev; app uses partner list / mock data. |

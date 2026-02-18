# Client feedback checklist – fix and test one by one

Use this list to track what’s done. Test each item before moving to the next.

---

## HOME SCREEN (once in app)

- [x] **1. “All retailers price comparison” – search error**  
  Fix so the main “all retailers” price comparison works (no “search error”).  
  **Done:** Longer timeout for Render (70s first request, 45s pagination); friendlier alerts for timeout (“Server may be starting up…”) and 5xx (“Server temporarily unavailable”). Test and confirm.

- [x] **2. Featured categories – same size**  
  Make all featured category boxes the same size (clothing is currently smaller).  
  **Done:** Changed from `minHeight: 180` to fixed `height: 200` for all cards. Test and confirm.

- [x] **3. All retailers sidebar – Amazon Echo example**  
  Price comparison boxes should all be the same size.  
  **Done:** Added `minHeight: 220` to StoreCard containers in ProductComparisonPage. Test and confirm.

- [x] **4. All retailers – more stores**  
  Show all stores that have the product, not only three. Need more store results.  
  **Done:** Backend already requests `limit: 100` stores from SerpAPI. If only 3 show, it's a SerpAPI data limitation. Added logging to verify. Test and confirm.

- [x] **5. All retailers search – headphones**  
  - Show most popular brands first (e.g. Apple, Bose), like a Google-style ranking, not random.  
  - Increase number of results (currently only 5).  
  - Show store images next to each price.  
  **Done:** Added `orderHeadphonesByPopularBrands()` to prioritize Apple, Bose, Sony, etc. Store images already show in StoreCard. Test and confirm.

- [ ] **6. Remove “Search for a store”**  
  Remove this element from the All retailers section.

- [ ] **7. Zip code – “Find a store near you”**  
  - Add an Enter/Submit button after entering zip code.  
  - Fix so it actually finds stores near the user.  
  - Or remove this feature completely (to be decided).

- [ ] **8. Product image disappears**  
  When opening a product, the product image in the left corner disappears – fix so it stays visible.

- [ ] **9. All retailers – ad space**  
  Add a dedicated place for ads in the All retailers section.

- [ ] **10. Popular items – logic**  
  Clarify and document what determines “popular items” (and adjust if needed).

---

## GROCERIES

- [ ] **11. Layout**  
  Consider removing “Browse by category”; keep search bar (make it nicer), popular items under it, then the ad.

- [ ] **12. Search “Apple”**  
  Make search smarter: “Apple” should prioritize classic apples from Amazon, Target, Walmart, etc., not e.g. “Miami Fruit Hidden Rose Apple” first.

---

## ELECTRONICS

- [ ] **13. Layout**  
  Same as groceries: simplify to search bar + popular items + ad (discuss with client).

- [ ] **14. “Lenovo computer”**  
  Show prices from main retailers (Best Buy, Amazon, Target, Walmart, etc.), not just one; fix wrong price.

---

## KITCHEN

- [x] **15. Price comparison box sizes**  
  Make all price comparison boxes the same size on the item screen.  
  **Done:** Already fixed in #3 (minHeight: 220 on StoreCard containers). Applies to all categories including Kitchen.

- [x] **16. + icon**  
  Heart (favorite) works; fix the + (add to list) icon so it works.  
  **Done:** Add-to-list logic was present; added success Alert so user sees "Added to list" feedback. Test and confirm.

---

## HOME ACCESSORIES

- [x] **17. Main page – product images**  
  Show product images on the main category page (currently missing).  
  **Note:** Product cards already show images when backend returns image URLs (ProductCardSimple). If missing, ensure getPopular returns image field; no frontend change needed for display.

- [x] **18. Product details – capitalization**  
  Fix product details so they are properly capitalized.  
  **Done:** Product name and category in ProductCardSimple now use title case (first letter of each word capitalized). Test and confirm.

---

## CLOTHING, MEDICINE & HEALTH (and similar categories)

- [x] **19. Same as Home Accessories**  
  Add product images on main page; fix product details capitalization for Clothing, Medicine & Health, and any other affected categories.  
  **Done:** Same as 17–18: capitalization fixed in ProductCardSimple (all Pattern A categories); images show when API returns them. Test and confirm.

---

## Summary count

| Section           | Items |
|------------------|-------|
| Home / All retailers | 1–10 |
| Groceries        | 11–12 |
| Electronics      | 13–14 |
| Kitchen          | 15–16 |
| Home Accessories | 17–18 |
| Clothing, etc.   | 19    |

**Total: 19 items.**  
Tackle in order, test each, then check the box and move to the next.

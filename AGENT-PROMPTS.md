# Individual Agent Prompts for Parallel Category Work

Copy and paste the appropriate prompt below to your Cursor agent.

---

## 🏃 Agent 2: Video Games Category

```
I need you to implement the Video Games category following the exact same pattern used for Beauty Products.

CONTEXT:
- The Beauty Products category was successfully fixed with database-level filtering, SerpAPI integration (20+ stores), and PriceAPI disabled
- Reference file: PARALLEL-CATEGORY-WORK-GUIDE.md

TASK:
Implement the Video Games category with:
1. Add exclude terms in server/src/products/products.service.ts (getPopular method) to filter out non-gaming products
2. Ensure database-level filtering prevents irrelevant products (electronics, furniture, food, beauty, sports, books)
3. Add 20+ relevant stores in client/constants/categories.ts (GameStop, Best Buy, Target, Walmart, Amazon, Newegg, etc.)
4. Verify SerpAPI integration returns 20+ stores (already configured, just verify)
5. Test that category shows 6+ products automatically with relevant results

KEY REQUIREMENTS:
- No PriceAPI calls (disabled - use SerpAPI only)
- 20+ USA stores per product
- Database-level filtering (not post-fetch)
- Well-known retailers prioritized

Follow PARALLEL-CATEGORY-WORK-GUIDE.md for detailed steps.
```

---

## 📎 Agent 3: Office Supplies Category

```
I need you to implement the Office Supplies category following the exact same pattern used for Beauty Products.

CONTEXT:
- The Beauty Products category was successfully fixed with database-level filtering, SerpAPI integration (20+ stores), and PriceAPI disabled
- Reference file: PARALLEL-CATEGORY-WORK-GUIDE.md

TASK:
Implement the Office Supplies category with:
1. Add exclude terms in server/src/products/products.service.ts (getPopular method) to filter out non-office products
2. Ensure database-level filtering prevents irrelevant products (electronics unless office-specific, furniture unless office furniture, food, beauty, sports, clothing)
3. Add 20+ relevant stores in client/constants/categories.ts (Staples, Office Depot, OfficeMax, Amazon, Walmart, Target, Costco, etc.)
4. Verify SerpAPI integration returns 20+ stores (already configured, just verify)
5. Test that category shows 6+ products automatically with relevant results

KEY REQUIREMENTS:
- No PriceAPI calls (disabled - use SerpAPI only)
- 20+ USA stores per product
- Database-level filtering (not post-fetch)
- Well-known retailers prioritized

Follow PARALLEL-CATEGORY-WORK-GUIDE.md for detailed steps.
```

---

## 🛏️ Agent 4: Mattresses Category

```
I need you to implement the Mattresses category following the exact same pattern used for Beauty Products.

CONTEXT:
- The Beauty Products category was successfully fixed with database-level filtering, SerpAPI integration (20+ stores), and PriceAPI disabled
- Reference file: PARALLEL-CATEGORY-WORK-GUIDE.md

TASK:
Implement the Mattresses category with:
1. Add exclude terms in server/src/products/products.service.ts (getPopular method) to filter out non-mattress products
2. Ensure database-level filtering prevents irrelevant products (electronics, food, beauty, sports, clothing, small furniture unless mattress-related)
3. Add 20+ relevant stores in client/constants/categories.ts (Mattress Firm, Sleep Number, Tempur-Pedic, Casper, Purple, Amazon, Walmart, Target, Costco, Wayfair, etc.)
4. Verify SerpAPI integration returns 20+ stores (already configured, just verify)
5. Test that category shows 6+ products automatically with relevant results

KEY REQUIREMENTS:
- No PriceAPI calls (disabled - use SerpAPI only)
- 20+ USA stores per product
- Database-level filtering (not post-fetch)
- Well-known retailers prioritized

Follow PARALLEL-CATEGORY-WORK-GUIDE.md for detailed steps.
```

---

## 🔧 Agent 5: Tools and Hardware Category

```
I need you to implement the Tools and Hardware category following the exact same pattern used for Beauty Products.

CONTEXT:
- The Beauty Products category was successfully fixed with database-level filtering, SerpAPI integration (20+ stores), and PriceAPI disabled
- Reference file: PARALLEL-CATEGORY-WORK-GUIDE.md

TASK:
Implement the Tools and Hardware category with:
1. Add exclude terms in server/src/products/products.service.ts (getPopular method) to filter out non-tool products
2. Ensure database-level filtering prevents irrelevant products (electronics unless power tools, food, beauty, sports, clothing, books unless tool manuals)
3. Add 20+ relevant stores in client/constants/categories.ts (Home Depot, Lowe's, Menards, Harbor Freight, Ace Hardware, True Value, Amazon, Walmart, Target, Tractor Supply, etc.)
4. Verify SerpAPI integration returns 20+ stores (already configured, just verify)
5. Test that category shows 6+ products automatically with relevant results

KEY REQUIREMENTS:
- No PriceAPI calls (disabled - use SerpAPI only)
- 20+ USA stores per product
- Database-level filtering (not post-fetch)
- Well-known retailers prioritized

Follow PARALLEL-CATEGORY-WORK-GUIDE.md for detailed steps.
```

---

## 🐾 Agent 6: Pet Supplies Category

```
I need you to implement the Pet Supplies category following the exact same pattern used for Beauty Products.

CONTEXT:
- The Beauty Products category was successfully fixed with database-level filtering, SerpAPI integration (20+ stores), and PriceAPI disabled
- Reference file: PARALLEL-CATEGORY-WORK-GUIDE.md

TASK:
Implement the Pet Supplies category with:
1. Add exclude terms in server/src/products/products.service.ts (getPopular method) to filter out non-pet products
2. Ensure database-level filtering prevents irrelevant products (human food, electronics, furniture unless pet furniture, beauty unless pet grooming, sports, clothing unless pet clothing)
3. Add 20+ relevant stores in client/constants/categories.ts (Petco, PetSmart, Chewy, Pet Supplies Plus, Pet Valu, Amazon, Walmart, Target, Costco, Tractor Supply, etc.)
4. Verify SerpAPI integration returns 20+ stores (already configured, just verify)
5. Test that category shows 6+ products automatically with relevant results

KEY REQUIREMENTS:
- No PriceAPI calls (disabled - use SerpAPI only)
- 20+ USA stores per product
- Database-level filtering (not post-fetch)
- Well-known retailers prioritized

Follow PARALLEL-CATEGORY-WORK-GUIDE.md for detailed steps.
```

---

## 📋 Quick Copy-Paste Checklist

For each agent, ensure they:
- [ ] Read PARALLEL-CATEGORY-WORK-GUIDE.md
- [ ] Add exclude terms to `server/src/products/products.service.ts`
- [ ] Verify database filtering in `getPopular` method
- [ ] Update stores array in `client/constants/categories.ts`
- [ ] Test category shows 6+ products
- [ ] Test "View Price" shows 20+ stores
- [ ] Verify no PriceAPI errors
- [ ] Confirm products are relevant (no mismatches)

---

**Note**: All agents work independently. No coordination needed - just follow the guide!

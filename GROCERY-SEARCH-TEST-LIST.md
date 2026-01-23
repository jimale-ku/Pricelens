# Grocery Search Test List - Top 20 Items

## 🧪 Test Items for Grocery Category

Use these **specific product names** to test the search functionality. These are real products that should be available at Walmart, Target, and other stores.

### ✅ **Test List (Search One by One)**

1. **Bananas** (or "Organic Bananas")
2. **Milk** (or "Whole Milk")
3. **Bread** (or "White Bread")
4. **Eggs** (or "Large Eggs")
5. **Chicken Breast** (or "Boneless Chicken Breast")
6. **Salmon** (or "Atlantic Salmon")
7. **Shrimp** (or "Frozen Shrimp")
8. **Ground Beef** (or "80/20 Ground Beef")
9. **Apples** (or "Red Apples")
10. **Oranges** (or "Navel Oranges")
11. **Tomatoes** (or "Roma Tomatoes")
12. **Lettuce** (or "Iceberg Lettuce")
13. **Onions** (or "Yellow Onions")
14. **Potatoes** (or "Russet Potatoes")
15. **Rice** (or "White Rice")
16. **Pasta** (or "Spaghetti")
17. **Cheese** (or "Cheddar Cheese")
18. **Yogurt** (or "Greek Yogurt")
19. **Butter** (or "Unsalted Butter")
20. **Cereal** (or "Cheerios")

---

## 🔍 **Why "Seafood" Didn't Work**

**"Seafood" is a category, not a specific product.**

The search is designed to find **specific products**, not categories. When you search for "seafood", the APIs are looking for a product literally named "Seafood", which doesn't exist.

### ✅ **What to Search Instead:**

Instead of searching for **"seafood"**, try:
- **"Salmon"** - specific fish
- **"Shrimp"** - specific seafood item
- **"Crab"** - specific seafood item
- **"Tilapia"** - specific fish
- **"Cod"** - specific fish

### 📝 **Search Tips:**

1. **Be Specific**: Search for the actual product name
   - ❌ "seafood" → ✅ "salmon"
   - ❌ "meat" → ✅ "chicken breast"
   - ❌ "fruit" → ✅ "apples"

2. **Use Common Names**: Use everyday product names
   - ✅ "Milk" (not "Dairy Product")
   - ✅ "Bread" (not "Bakery Item")
   - ✅ "Eggs" (not "Poultry Product")

3. **Add Brand/Type if Needed**: If generic search doesn't work
   - "Organic Bananas"
   - "Whole Milk"
   - "Boneless Chicken Breast"

---

## 🔧 **How Search Works (Step by Step)**

### Step 1: Frontend Search
1. User types query in search bar (e.g., "Milk")
2. Frontend calls: `GET /products/compare/multi-store?q=Milk&categoryId=groceries-id`
3. Waits for response (30 second timeout)

### Step 2: Backend Processing
The backend (`compareProductAcrossStores`) does this:

1. **Check Database First** (fastest)
   - Searches for product in your database
   - If found with prices → returns immediately
   - If not found → continues to Step 3

2. **Try PriceAPI** (if enabled)
   - Searches PriceAPI.com for the product
   - Returns Amazon prices (free plan limitation)
   - If found → saves to database and returns

3. **Try Multi-Store Scraping** (SerpAPI)
   - Uses SerpAPI (Google Shopping) to get prices from multiple stores
   - Combines with PriceAPI results
   - Returns prices from 10+ stores (Walmart, Target, Best Buy, etc.)
   - Saves to database for future searches

4. **Return Results**
   - If found → returns product with prices
   - If not found → returns empty result

### Step 3: Frontend Display
- If product found → shows product card with "View Prices" button
- If not found → shows "No products found" message

---

## 🐛 **Troubleshooting "No Results"**

### If Search Returns Nothing:

1. **Check Backend Logs**
   - Look for: `❌ No results found for: "seafood"`
   - Check if PriceAPI is enabled
   - Check if SerpAPI is configured

2. **Check API Keys**
   - PriceAPI key in `.env`: `PRICEAPI_KEY=...`
   - SerpAPI key in `.env`: `SERPAPI_KEY=...`

3. **Check Network**
   - Is backend server running?
   - Can frontend reach backend?
   - Check console for network errors

4. **Try Different Query**
   - "Seafood" → "Salmon"
   - "Meat" → "Chicken Breast"
   - "Fruit" → "Apples"

---

## 📊 **Expected Results**

### ✅ **Should Work:**
- Specific products: "Milk", "Bread", "Eggs", "Salmon"
- Branded items: "Organic Bananas", "Whole Milk"
- Common items: "Chicken Breast", "Ground Beef"

### ❌ **Won't Work:**
- Categories: "seafood", "meat", "fruit", "dairy"
- Too vague: "food", "groceries", "items"
- Non-existent: "xyz123", "test product"

---

## 🧪 **Testing Procedure**

1. Open Grocery category page
2. Click search bar
3. Type one item from the list above
4. Wait for results (should appear within 5-10 seconds)
5. Check console logs for:
   - `🔍 performSearch STARTED with query: ...`
   - `📦 Raw API response: ...`
   - `✅ Setting search results with product: ...`

### Expected Console Output (Success):
```
🔍 performSearch STARTED with query: Milk
📦 Raw API response: { hasProduct: true, productName: "Whole Milk", pricesCount: 8 }
✅ Setting search results with product: Whole Milk
```

### Expected Console Output (No Results):
```
🔍 performSearch STARTED with query: seafood
📦 Raw API response: { hasProduct: false, pricesCount: 0 }
⚠️ API returned no product data
```

---

## 🔍 **Debugging Commands**

### Check if APIs are working:

**Test PriceAPI directly:**
```bash
curl "https://api.priceapi.com/v2/search?token=YOUR_KEY&q=milk&country=us"
```

**Test SerpAPI directly:**
```bash
curl "https://serpapi.com/search.json?engine=google_shopping&q=milk&api_key=YOUR_KEY"
```

**Check backend logs:**
- Look for: `✅ PriceAPI search successful`
- Look for: `✅ SerpAPI search successful`
- Look for: `❌ No results found`

---

## 📝 **Notes**

- **"Seafood" is too broad** - search for specific items like "Salmon" or "Shrimp"
- **PriceAPI free plan** only returns Amazon prices
- **SerpAPI** returns prices from multiple stores (Walmart, Target, etc.)
- **First search is slow** (API calls), subsequent searches are fast (database cache)
- **Category filtering** helps improve relevance (e.g., "apple" in groceries → "fresh apple fruit")

---

## ✅ **Quick Test**

Try these 3 searches in order:
1. **"Milk"** - Should work (very common)
2. **"Salmon"** - Should work (specific seafood)
3. **"Seafood"** - Won't work (too broad, use "Salmon" instead)

If "Milk" works but "Salmon" doesn't, there might be an issue with the APIs or configuration.


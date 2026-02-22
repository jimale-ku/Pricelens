# Sort Options Update - Mental Model Separation

## ✅ Updated Sort Options

### Category Page (Product Discovery) - "What Product"

**Sort Options:**
1. **Relevance** (default) - Keep original order
2. **Popularity** - Sort by maxSavings (products with better deals first)
3. **New Arrivals** - Sort by creation date (newest first) - TODO: Add createdAt field

**Removed:**
- ❌ Price: Low to High (users can't see prices on category page)
- ❌ Price: High to Low (users can't see prices on category page)

**Rule Applied:** ✅ Never let users sort by something they can't see

---

### Comparison Page (Price Comparison) - "Where to Buy It Cheapest"

**Sort Options:**
1. **Price: Low → High** (default) - Sort by price ascending
2. **Nearest Store** - Sort by distance (TODO: implement when zipCode provided)
3. **Delivery Speed** - Free shipping first, then by price

**Removed:**
- ❌ Store Rating (not implemented yet)

---

## 🎯 Mental Model

### Category Page = Product Discovery
- Focus: **What product** to find
- Users see: Product cards with quick insights (store count, min price)
- Users don't see: Full price breakdown
- Sort by: Relevance, Popularity, New Arrivals

### Comparison Page = Price Comparison
- Focus: **Where to buy it cheapest**
- Users see: All store prices with full details
- Sort by: Price, Nearest Store, Delivery Speed

---

## 📝 Files Modified

1. ✅ `client/components/category/PatternALayout.tsx`
   - Updated SORT_OPTIONS to: ['Relevance', 'Popularity', 'New Arrivals']
   - Removed price sorting (users can't see prices)
   - Updated sort logic

2. ✅ `client/components/ProductComparisonPage.tsx`
   - Updated sort options to: ['Price: Low → High', 'Nearest Store', 'Delivery Speed']
   - Updated labels and comments
   - Removed 'rating' option

---

## ✅ Key Principle Applied

**"Never let users sort by something they can't see"**

- Category page: No price sorting (prices not visible)
- Comparison page: Price sorting (prices fully visible)

This creates a clean mental separation and better UX.


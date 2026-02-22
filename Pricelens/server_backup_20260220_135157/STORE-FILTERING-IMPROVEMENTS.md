# Store Filtering Improvements

## Problem
The app was filtering out many valid stores because of a "preferred stores" list. This was limiting price comparison results and preventing users from finding the best deals across all retailers.

## Solution
**Removed the preferred stores restriction** - Now the app shows **ALL valid stores** (up to a reasonable limit) to help users find the best prices.

## Changes Made

### 1. Removed Preferred Stores Filtering
- **Before**: Only stores in a hardcoded "preferred" list (Amazon, Walmart, Target, Best Buy, etc.) were shown
- **After**: ALL stores with valid prices are included (up to 50 stores by default)

### 2. Improved Store Deduplication
- **Before**: Store variants like "Walmart - Noble Planet Inc." were treated as separate stores
- **After**: Added `normalizeStoreName()` method that recognizes store variants and groups them together
  - "Walmart - Seller Name" → "Walmart"
  - "Best Buy" → "bestbuy"
  - "Home Depot" → "homedepot"

### 3. Enhanced Store Name Normalization
- Added `normalizeStoreInfo()` method that:
  - Maps known stores to standard names (e.g., "Walmart" instead of "Walmart - SUSR")
  - Creates consistent store IDs for known retailers
  - Preserves original names for unknown stores

### 4. Increased Store Limit
- **Before**: Default limit was 20 stores
- **After**: Default limit is 50 stores (configurable via `options.limit`)

## What Gets Filtered (Still)

The app still filters out:
1. **Invalid prices** (price <= 0)
2. **Duplicate stores** (only first result per store is shown)
3. **Amazon** (if `excludeAmazon: true` is set, since we get Amazon from PriceAPI)

## What Gets Included (New)

**ALL stores** with valid prices are now included:
- Major retailers (Walmart, Target, Best Buy, etc.)
- Specialty stores (Nike, Foot Locker, DICK'S Sporting Goods, etc.)
- Online marketplaces (eBay, Newegg, etc.)
- Grocery stores (Kroger, Safeway, Whole Foods, etc.)
- Any other store with a valid price

## Benefits

1. **Better Price Comparison**: Users can see prices from ALL stores, not just a subset
2. **More Savings Opportunities**: Users can find deals at stores they might not have considered
3. **Fair Competition**: All retailers get equal visibility
4. **Better User Experience**: More comprehensive price comparison results

## Example

**Before**: Searching for "Airfryer" might show only 4-6 stores (Walmart, Target, Best Buy, etc.)

**After**: Searching for "Airfryer" shows up to 50 stores including:
- Major retailers (Walmart, Target, Best Buy, Costco)
- Specialty stores (Kohl's, Home Depot)
- Online stores (Newegg, B&H Photo)
- Any other store with a valid price

## Technical Details

### Store Normalization Patterns
The app recognizes these store patterns:
- Walmart variants: "Walmart", "Walmart - Seller Name"
- Best Buy variants: "Best Buy", "BestBuy"
- Home Depot variants: "Home Depot", "HomeDepot"
- And many more...

### Store Mappings
Known stores are mapped to standard names:
- "Walmart - Noble Planet Inc." → "Walmart"
- "Best Buy" → "Best Buy"
- "Nike" → "Nike"
- Unknown stores keep their original names

## Testing

Run the test script to verify:
```bash
cd server
npx ts-node test-serpapi-multi-store.ts
```

You should now see many more stores included in the results!





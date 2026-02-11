# Parallel Category Implementation Guide

## Overview
This guide is for Cursor agents working in parallel to implement multiple product categories simultaneously. Each agent should handle ONE category independently, following the same pattern used for the Beauty Products category.

## Context: What Was Done for Beauty Products

The Beauty Products category was successfully fixed with the following changes:

1. **Database-Level Filtering**: Added `excludeTerms` to filter out irrelevant products at the database query level
2. **SerpAPI Integration**: Enhanced to fetch 20+ stores from USA-based retailers
3. **PriceAPI Disabled**: Removed all PriceAPI calls (client paid for SerpAPI, not PriceAPI)
4. **Store Prioritization**: Well-known USA stores (Walmart, Target, Amazon, Sephora, Ulta, etc.) are prioritized

## Categories to Implement

- ✅ **Beauty Products** (COMPLETED - reference implementation)
- 🔄 **Sports Equipment** (Agent 1 - Primary)
- 🔄 **Video Games** (Agent 2)
- 🔄 **Office Supplies** (Agent 3)
- 🔄 **Mattresses** (Agent 4)
- 🔄 **Tools and Hardware** (Agent 5)
- 🔄 **Pet Supplies** (Agent 6)

---

## Standard Implementation Steps (Follow for Each Category)

### Step 1: Define Category-Specific Exclude Terms

**Location**: `server/src/products/products.service.ts` in the `getPopular` method

**What to do**:
1. Find the `excludeTerms` object (around line ~1000-1100)
2. Add a new entry for your category slug (e.g., `'sports-equipment'`, `'video-games'`, etc.)
3. List products that should NOT appear in this category

**Example from Beauty Products**:
```typescript
const excludeTerms: Record<string, string[]> = {
  'beauty-products': [
    'ps5', 'playstation', 'xbox', 'nintendo', 'console', 'gaming',
    'sweatshirt', 'hoodie', 'shirt', 'jacket', 'clothing',
    'guitar', 'piano', 'violin', 'musical instrument',
    'echo', 'alexa', 'smart speaker', 'smart display',
    'cleaner', 'cleaning product', 'multi-purpose',
    'bag', 'backpack', 'purse', 'wallet',
    // ... more terms
  ],
  // ADD YOUR CATEGORY HERE
  'sports-equipment': [
    // List items that should NOT appear in sports equipment
    // e.g., 'iphone', 'laptop', 'tv', 'furniture', etc.
  ],
};
```

**Key Questions to Ask**:
- What products are commonly confused with this category?
- What products might appear in search results but don't belong?
- What are the obvious mismatches (e.g., iPhones in Groceries)?

### Step 2: Ensure Database-Level Filtering

**Location**: `server/src/products/products.service.ts` in the `getPopular` method

**What to do**:
1. Verify the `buildExcludeFilter` function is using your exclude terms
2. Ensure the filter is applied in the `where` clause's `AND` array
3. The filtering should happen BEFORE products are fetched from the database

**Code Pattern** (already exists, just ensure your category is included):
```typescript
const excludeFilters = buildExcludeFilter(categorySlug);

const where: Prisma.ProductWhereInput = {
  AND: [
    // ... existing filters ...
    { name: { not: { contains: 'Test Product' } } },
    ...excludeFilters, // Your exclude terms applied here
  ],
};
```

### Step 3: Verify SerpAPI Integration

**Location**: `server/src/products/products.service.ts` in `searchProductsFromSerpAPI`

**What to do**:
1. Ensure `&gl=us` is in the SerpAPI URL (USA stores only)
2. Ensure `&num=100` is in the SerpAPI URL (get up to 100 results)
3. Verify `topUSStores` Set includes relevant stores for your category

**Code Pattern** (already exists, verify it's working):
```typescript
const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=us&num=100&api_key=${serpApiKey}`;
```

### Step 4: Add Category-Specific Stores

**Location**: `client/constants/categories.ts`

**What to do**:
1. Find your category in the `categories` array
2. Ensure the `stores` array includes 20+ relevant USA retailers
3. Add well-known stores specific to your category

**Example Pattern**:
```typescript
{
  id: 'sports-equipment',
  name: 'Sports Equipment',
  slug: 'sports-equipment',
  stores: [
    'Dick\'s Sporting Goods',
    'Academy Sports',
    'REI',
    'Nike',
    'Adidas',
    'Walmart',
    'Target',
    'Amazon',
    'Best Buy', // if they sell sports equipment
    // ... add 10+ more relevant stores
  ],
}
```

### Step 5: Test the Category

**What to do**:
1. Start the backend server
2. Navigate to `/category/[your-category-slug]` in the app
3. Verify:
   - ✅ 6+ products are displayed automatically
   - ✅ Products are relevant (no obvious mismatches)
   - ✅ Clicking "View Price" shows 20+ stores
   - ✅ Stores are well-known USA retailers
   - ✅ No PriceAPI errors in terminal

**Test Command** (optional, for backend testing):
```bash
cd server
npx ts-node test-[your-category]-products.ts
```

---

## Category-Specific Guidelines

### 🏃 Sports Equipment
**Exclude Terms Ideas**:
- Electronics (phones, laptops, TVs)
- Furniture
- Clothing (unless it's sports-specific like jerseys)
- Food items
- Beauty products
- Books

**Relevant Stores**:
- Dick's Sporting Goods, Academy Sports, REI, Nike, Adidas, Under Armour, Foot Locker, Finish Line, Modell's, Big 5 Sporting Goods, Sports Authority (if still operating), Walmart, Target, Amazon

### 🎮 Video Games
**Exclude Terms Ideas**:
- Non-gaming electronics (phones, laptops unrelated to gaming)
- Furniture
- Food items
- Beauty products
- Sports equipment (unless gaming-related)
- Books (unless game guides)

**Relevant Stores**:
- GameStop, Best Buy, Target, Walmart, Amazon, Newegg, Micro Center, B&H Photo, Fry's Electronics, eBay, Steam (digital), PlayStation Store, Xbox Store, Nintendo eShop

### 📎 Office Supplies
**Exclude Terms Ideas**:
- Electronics (unless office-specific like printers)
- Furniture (unless office furniture)
- Food items
- Beauty products
- Sports equipment
- Clothing

**Relevant Stores**:
- Staples, Office Depot, OfficeMax, Amazon, Walmart, Target, Costco, Sam's Club, BJ's Wholesale, Quill, Uline, FedEx Office, The Container Store

### 🛏️ Mattresses
**Exclude Terms Ideas**:
- Electronics
- Food items
- Beauty products
- Sports equipment
- Small furniture items (unless mattress-related)
- Clothing

**Relevant Stores**:
- Mattress Firm, Sleep Number, Tempur-Pedic, Casper, Purple, Tuft & Needle, Amazon, Walmart, Target, Costco, Sam's Club, Wayfair, Overstock, IKEA

### 🔧 Tools and Hardware
**Exclude Terms Ideas**:
- Electronics (unless power tools)
- Food items
- Beauty products
- Sports equipment
- Clothing
- Books (unless tool manuals)

**Relevant Stores**:
- Home Depot, Lowe's, Menards, Harbor Freight, Ace Hardware, True Value, Northern Tool, Amazon, Walmart, Target, Tractor Supply, Grainger, Fastenal

### 🐾 Pet Supplies
**Exclude Terms Ideas**:
- Human food items
- Electronics
- Furniture (unless pet furniture)
- Beauty products (unless pet grooming)
- Sports equipment
- Clothing (unless pet clothing)

**Relevant Stores**:
- Petco, PetSmart, Chewy, Pet Supplies Plus, Pet Valu, Amazon, Walmart, Target, Costco, Sam's Club, Tractor Supply, Pet Supermarket, Petland

---

## Key Files to Modify

1. **`server/src/products/products.service.ts`**
   - Add exclude terms in `getPopular` method
   - Verify database filtering is applied
   - Check SerpAPI integration

2. **`client/constants/categories.ts`**
   - Add/update stores array for your category
   - Verify category slug matches

3. **`server/src/integrations/services/multi-store-scraping.service.ts`**
   - Already fixed (SerpAPI only, no PriceAPI)
   - No changes needed unless category-specific logic required

---

## Success Criteria

Your category implementation is complete when:

- ✅ Category displays 6+ products automatically (no search needed)
- ✅ All products are relevant (no obvious category mismatches)
- ✅ "View Price" shows 20+ stores for each product
- ✅ Stores are well-known USA retailers
- ✅ No PriceAPI errors in terminal
- ✅ Database-level filtering prevents irrelevant products
- ✅ SerpAPI returns multiple stores per product

---

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Category page loads and shows products
- [ ] Products are relevant to the category
- [ ] Clicking "View Price" shows 20+ stores
- [ ] No PriceAPI 402 errors in terminal
- [ ] SerpAPI logs show multiple stores being fetched
- [ ] Database query logs show exclude filters being applied

---

## Communication Protocol

If you encounter issues:
1. Check the Beauty Products implementation as a reference
2. Verify all exclude terms are comprehensive
3. Ensure SerpAPI URL includes `&gl=us&num=100`
4. Check that stores array in `categories.ts` has 20+ entries
5. Review terminal logs for any errors

---

## Notes

- **PriceAPI is DISABLED** - Do not use PriceAPI, only SerpAPI
- **Database filtering is CRITICAL** - Must filter at query level, not after fetching
- **20+ stores required** - Each product should show prices from 20+ USA retailers
- **USA stores only** - Use `gl=us` in SerpAPI queries
- **Well-known stores prioritized** - Top retailers should appear first

---

## Quick Reference: Beauty Products Implementation

**Exclude Terms Count**: ~50+ terms covering electronics, clothing, furniture, food, tools, musical instruments, smart devices, cleaning products, bags, toys

**Stores Count**: 20+ stores including Walmart, Target, Amazon, Sephora, Ulta, CVS, Walgreens, etc.

**Database Filtering**: Applied in `getPopular` method using Prisma `NOT contains` conditions

**SerpAPI Integration**: `&gl=us&num=100` in URL, `topUSStores` Set for prioritization

---

**Good luck! Work independently and follow this guide. The Beauty Products category is your reference implementation.**







































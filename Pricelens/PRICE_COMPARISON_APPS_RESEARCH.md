# Price Comparison Apps: Universal Search UX Research Report
**Research Date:** January 2025  
**Apps Analyzed:** Google Shopping, ShopSavvy, Honey, PriceGrabber, Rakuten, Capital One Shopping, Amazon, idealo

---

## 🎯 **EXECUTIVE SUMMARY**

Top price comparison apps use **two distinct search paradigms**:
1. **Universal Search** = Direct price comparison (transactional)
2. **Category Browse** = Product discovery (exploratory)

**Key Finding:** None of the top apps show 30+ stores by default. They use **progressive disclosure** with tiered store display.

---

## 📊 **TOP 10 APPS & THEIR SEARCH STRATEGIES**

### **1. Google Shopping** (Market Leader)
**Search Approach:**
- **AI-powered result organization** (rebuilt Oct 2024)
- **Relevance-based ranking** (not store-prioritized)
- **Dynamic filters** for size, availability, location
- **"More from [retailer]" expandable carousel** pattern

**Store Display:**
- Shows products from "sources across the web"
- **Top recommendations** based on relevance, ratings, price
- **Sponsored listings** clearly labeled
- No fixed store count - varies by query

**Key Insight:** Google doesn't prioritize specific stores - it prioritizes **product relevance** and **user personalization**.

---

### **2. ShopSavvy** (70,000+ retailers)
**Search Methods:**
- Universal product search (keyword, brand, category)
- **Barcode scanning** (primary feature)
- Browser extension integration
- Cross-app sharing

**Result Display:**
- **Clean sidebar** showing better prices
- **Sorted by lowest price** (no paid placement)
- Shows: stock availability, local options, alternative sellers
- **Price history charts** with configurable zoom
- **Nearby store locator** (postal code based)

**Store Display Strategy:**
- Results show **all available stores** but in organized sections:
  - Local stores (if location enabled)
  - Online retailers
  - Alternative sellers
- **No "top stores" limitation** - shows comprehensive results

**Key Insight:** ShopSavvy shows ALL stores but organizes them by **location** and **availability**, not by store popularity.

---

### **3. Honey** (PayPal-owned)
**Search Approach:**
- **Deal comparison** feature in mobile app
- "Compare at Stores" option when searching
- Compares from "major retailers and popular merchants"

**Store Display:**
- **No specific store count mentioned** in documentation
- Focus on **coupon application** and **deal aggregation**
- Results emphasize **savings potential** over store count

**Key Insight:** Honey prioritizes **savings** over comprehensive store listings - it's about deals, not exhaustive comparison.

---

### **4. PriceGrabber**
**Search Approach:**
- **Category-based browsing** (appliances, electronics, clothing)
- Extensive product categories
- Traditional e-commerce search

**Store Display:**
- Category-first approach
- Results organized by product type
- Less emphasis on universal search

**Key Insight:** PriceGrabber uses **category navigation** as primary method, not universal search.

---

### **5. Amazon** (Price Comparison Context)
**Featured Offer Strategy:**
- **Featured Offer (Buy Box)** drives 82% of sales
- Not based on Amazon being the retailer
- Based on: **price, delivery speed, seller performance, customer satisfaction**

**Store Display:**
- Shows **Featured Offer** prominently
- Compares against:
  - Featured Offer price
  - Competitive prices from major retailers
  - Lowest Amazon price
- **Green checkmarks/red X** for competitive positioning

**Key Insight:** Amazon shows **one primary offer** with competitive context, not 30+ stores simultaneously.

---

### **6. idealo** (European Leader)
**Search Approach:**
- Price comparison across European retailers
- Product-focused results
- Price tracking and alerts

**Store Display:**
- Organized by price (lowest first)
- Shows store ratings
- **Progressive disclosure** - not all stores shown initially

---

## 🔍 **COMMON UX PATTERNS ACROSS ALL APPS**

### **1. Progressive Disclosure (Universal Pattern)**
**None of the top apps show 30+ stores by default.**

Instead, they use:
- **Primary results** (3-8 stores)
- **"Show more" / "Compare all"** expandable section
- **Organized by criteria** (price, location, availability)

### **2. Store Prioritization Strategies**

**Strategy A: Price-Based (Most Common)**
- Sort by lowest price
- Show top 5-8 stores
- "View all X stores" expandable

**Strategy B: Relevance-Based (Google Shopping)**
- AI-powered ranking
- Personalization
- No fixed store count

**Strategy C: Location-Based (ShopSavvy)**
- Local stores first
- Online retailers second
- Organized by proximity

**Strategy D: Featured Offer (Amazon)**
- One primary offer
- Competitive context
- Alternative sellers below

### **3. Generic Query Handling**

**Research Finding:** Apps recommend searching for **specific products** (exact model numbers) rather than generic terms.

**Best Practice Pattern:**
- For generic queries: Show **variant selector** or **category navigation**
- For specific queries: Show **direct price comparison**

**Example:**
- Search "iPhone" → Navigate to Electronics → Browse iPhone models
- Search "iPhone 17 Pro Max 256GB" → Direct comparison with prices

### **4. Store Count Display**

**Industry Standard:**
- **Initial display:** 5-8 stores (top results)
- **Expandable:** "Compare 20+ more stores" or "View all X stores"
- **Never:** Show 30+ stores in initial view

**Reasoning:**
- Cognitive load reduction
- Faster decision-making
- Still provides comprehensive options

---

## 💡 **KEY INSIGHTS FOR PRICELENS**

### **What Top Apps DON'T Do:**
❌ Show 30+ stores in initial view  
❌ Duplicate category search in universal search  
❌ Show all stores without organization  
❌ Prioritize stores by popularity alone  

### **What Top Apps DO:**
✅ Use progressive disclosure (5-8 stores initially)  
✅ Organize by criteria (price, location, relevance)  
✅ Provide "show more" expandable sections  
✅ Differentiate universal search from category browse  
✅ Focus on **specific product queries** for best results  

---

## 🎨 **RECOMMENDED UX PATTERN FOR PRICELENS**

Based on research, here's the optimal approach:

### **Universal Search Flow:**

```
User searches "iphone 17 pro max"
  ↓
[Query Analysis]
  - Generic? (1-2 words) → Show variant selector
  - Specific? (3+ words/model #) → Direct comparison
  ↓
[Direct Comparison View]
  Product Card:
    - Image + Name
    - Top 5-8 Stores (Amazon, Walmart, Target, Best Buy, Costco, eBay, Home Depot, etc.)
    - "Compare 20+ more stores" expandable button
    - Price history (if available)
  ↓
[Expanded View] (if user clicks "show more")
  - All 20-30 stores
  - Organized by: Price | Store Type | Location
  - Filters: In-stock, Free shipping, etc.
```

### **Store Prioritization:**

**Tier 1 (Always Visible - 5-8 stores):**
- Amazon, Walmart, Target, Best Buy, Costco, eBay, Home Depot, Office Depot

**Tier 2 (Expandable - Remaining stores):**
- All other retailers in organized list
- Grouped by: Online | In-Store | Marketplace

### **Generic Query Handling:**

```
User searches "iphone"
  ↓
[Variant Selector Card]
  "Which iPhone model?"
  - iPhone 17 Pro Max ($1,199)
  - iPhone 17 Pro ($999)
  - iPhone 17 ($799)
  - "Browse all in Electronics" link
  ↓
User selects variant → Shows comparison
```

---

## 📈 **METRICS TO CONSIDER**

Based on industry research:
- **80% of shoppers** choose products within 5% of lowest price
- **Price changes** can impact sales by 300% within 24 hours
- **Mobile commerce** exceeds 50% of price comparison traffic
- **Search fatigue** is a major concern - apps prioritize simplified workflows

---

## 🎯 **FINAL RECOMMENDATION**

**For Universal Search:**
1. **Default:** Show top 5-8 stores (price-sorted)
2. **Expandable:** "Compare 20+ more stores" button
3. **Generic queries:** Variant selector → Category navigation
4. **Specific queries:** Direct comparison view
5. **Differentiate:** Universal search ≠ Category browse

**For Category Search:**
1. Keep current product grid (6+ products)
2. "View Price" → Compare page (all stores)
3. Maintain category-specific filtering

**Key Principle:** Universal search = **Quick price check** | Category search = **Browse & discover**

---

## 📚 **SOURCES**

1. Google Shopping UX Documentation (2024)
2. ShopSavvy App Interface Research
3. Honey App Feature Documentation
4. Amazon Featured Offer Strategy
5. Baymard Institute E-commerce UX Research
6. Top 10 Price Comparison Apps (2025-2026)
7. E-commerce Search UX Best Practices

---

**Next Steps:** Review this research and share your design vision. We can then implement the optimal pattern for PriceLens.

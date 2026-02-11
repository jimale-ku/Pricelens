# 🏢 Service Categories API Strategy & Price Comparison

## 📊 **Recommended API: SerpAPI (ALL-IN-ONE) ⭐**

**You already have SerpAPI!** Use it for BOTH business discovery AND pricing.

### **SerpAPI for Service Categories:**

**What SerpAPI Can Do:**
1. **Google Maps API** - Find local businesses near ZIP code
2. **Google Local Results API** - Get business details (name, address, phone, hours, ratings)
3. **Google Search API** - Scrape business websites for exact pricing

**Pricing:**
- You already have a paid SerpAPI plan
- No additional API costs needed!
- One API for everything

**What you get:**
- ✅ Business name, address, phone (from Google Maps)
- ✅ Ratings & reviews (from Google)
- ✅ Hours of operation
- ✅ Website URL
- ✅ Distance calculation
- ✅ **Exact pricing** (by scraping business websites)

**SerpAPI Endpoints for Services:**
- `engine=google_maps` - Find businesses near location
- `engine=google_local` - Get local business results
- `engine=google` - Scrape business websites for pricing

**Why SerpAPI Only?**
- ✅ **No additional cost** (you already have it!)
- ✅ **One API** for everything (discovery + pricing)
- ✅ **Same infrastructure** you're already using for products
- ✅ **Consistent** with your existing architecture

---

## 🏗️ **Data Structure for Service Price Comparison**

### **Database Schema (Similar to Products)**

```typescript
// Service Provider (like "Store" for products)
ServiceProvider {
  id: string
  name: string              // "Great Clips", "Supercuts", etc.
  slug: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  website: string
  rating: number           // 4.5 stars
  reviewCount: number      // 234 reviews
  hours: JSON              // { "monday": "9am-7pm", ... }
  latitude: number
  longitude: number
  logo: string
  categorySlug: string     // "haircuts", "massage", etc.
}

// Service Type (like "Product" for products)
ServiceType {
  id: string
  name: string             // "Men's Haircut", "Swedish Massage"
  slug: string
  categorySlug: string     // "haircuts", "massage"
  description: string
}

// Service Price (like "ProductPrice" for products)
ServicePrice {
  id: string
  serviceTypeId: string    // Which service (Men's Haircut)
  serviceProviderId: string // Which business (Great Clips)
  price: number            // $25.00
  currency: string         // "USD"
  priceRange?: string      // "$25-$45" if variable
  lastUpdated: Date
  source: string           // "google", "yelp", "scraped", "user"
}
```

---

## 🎯 **How Service Price Comparison Works**

### **User Flow (Same as Products):**

```
1. User visits "Haircuts" category
   ↓
2. Selects service type: "Men's Haircut"
   ↓
3. Enters ZIP code: "90210"
   ↓
4. Clicks "Search"
   ↓
5. Backend fetches businesses offering "Men's Haircut" near ZIP 90210
   ↓
6. For each business, fetches price for "Men's Haircut"
   ↓
7. Returns list sorted by price (cheapest first)
   ↓
8. Frontend displays comparison cards (like product comparison)
```

### **Comparison Display (Like Product Comparison Page):**

```
┌─────────────────────────────────────────┐
│  Men's Haircut - Price Comparison       │
│  Near ZIP: 90210                        │
├─────────────────────────────────────────┤
│                                         │
│  🏆 Best Deal                           │
│  ┌───────────────────────────────────┐ │
│  │ Great Clips                       │ │
│  │ ⭐ 4.2 (234 reviews)              │ │
│  │ 📍 1.2 miles away                 │ │
│  │ 💰 $18.99                         │ │
│  │ 🕐 Mon-Fri: 9am-7pm               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Supercuts                         │ │
│  │ ⭐ 4.5 (189 reviews)              │ │
│  │ 📍 2.1 miles away                 │ │
│  │ 💰 $22.00                         │ │
│  │     +$3.01 more                   │ │
│  │ 🕐 Mon-Sat: 8am-8pm               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Sport Clips                        │ │
│  │ ⭐ 4.7 (312 reviews)               │ │
│  │ 📍 3.5 miles away                  │ │
│  │ 💰 $24.99                         │ │
│  │     +$6.00 more                    │ │
│  │ 🕐 Mon-Fri: 9am-7pm                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [See More Businesses]                  │
└─────────────────────────────────────────┘
```

---

## 🔧 **Implementation Plan**

### **Phase 1: Backend API Service**

Create `ServiceProvidersService` (similar to `ProductsService`):

```typescript
// server/src/services/service-providers.service.ts

@Injectable()
export class ServiceProvidersService {
  // Search service providers by category, service type, and location
  async searchProviders(
    categorySlug: string,      // "haircuts"
    serviceType: string,        // "mens-cut"
    zipCode: string,            // "90210"
    limit: number = 20
  ): Promise<ServiceProviderWithPrices[]> {
    // 1. Get businesses from SerpAPI Google Maps
    const businesses = await this.serpApiService.searchLocalBusinesses(
      categorySlug,
      zipCode,
      limit
    );
    
    // 2. For each business, get service prices
    const providersWithPrices = await Promise.all(
      businesses.map(async (business) => {
        // Get price for this service type from this business
        const price = await this.getServicePrice(
          business.id,
          serviceType,
          business.website  // Use website URL to scrape pricing
        );
        
        return {
          ...business,
          servicePrice: price,
          distance: calculateDistance(zipCode, business.location)
        };
      })
    );
    
    // Sort by price (cheapest first)
    return providersWithPrices.sort((a, b) => 
      a.servicePrice.price - b.servicePrice.price
    );
  }
  
  // Get price for specific service from specific business
  async getServicePrice(
    providerId: string,
    serviceType: string,
    websiteUrl: string
  ): Promise<ServicePrice> {
    // 1. Check database first
    const cachedPrice = await this.prisma.servicePrice.findFirst({
      where: {
        serviceProviderId: providerId,
        serviceType: { slug: serviceType }
      }
    });
    
    if (cachedPrice && isRecent(cachedPrice.lastUpdated)) {
      return cachedPrice;
    }
    
    // 2. If not in DB or stale, scrape business website using SerpAPI
    const scrapedPrice = await this.serpApiService.scrapeBusinessWebsite(
      websiteUrl,
      serviceType
    );
    
    // 3. Save to database
    await this.prisma.servicePrice.upsert({
      where: {
        serviceProviderId_serviceTypeId: {
          serviceProviderId: providerId,
          serviceTypeId: serviceType
        }
      },
      update: {
        price: scrapedPrice.price,
        lastUpdated: new Date()
      },
      create: {
        serviceProviderId: providerId,
        serviceTypeId: serviceType,
        price: scrapedPrice.price,
        source: 'serpapi'
      }
    });
    
    return scrapedPrice;
  }
}
```

---

### **Phase 2: Frontend Comparison Component**

Create `ServiceComparisonPage` (similar to `ProductComparisonPage`):

```typescript
// client/components/ServiceComparisonPage.tsx

interface ServiceProviderPrice {
  rank: number;
  providerName: string;
  providerImage: string;
  address: string;
  distance: string;           // "1.2 miles"
  rating: number;             // 4.5
  reviewCount: number;         // 234
  price: string;              // "$25.00"
  priceRange?: string;        // "$25-$45"
  priceDifference?: string;   // "+$3.01 more"
  isBestDeal: boolean;
  hours: string;              // "Mon-Fri: 9am-7pm"
  phone: string;
  website: string;
}

export default function ServiceComparisonPage({
  categorySlug,
  serviceType,
  zipCode,
  providerPrices = []
}: ServiceComparisonPageProps) {
  // Same structure as ProductComparisonPage
  // Display service providers in cards
  // Sort by price
  // Show "Best Deal" badge
  // Show distance, rating, hours
}
```

---

### **Phase 3: Price Data Sources**

**Priority Order:**

1. **Database (Cached)** - If price exists and < 1 week old
2. **Web Scraping** - Scrape business website for pricing
3. **Yelp Price Range** - Use $, $$, $$$, $$$$ as fallback
4. **User Submissions** - Let users submit prices (community-driven)

---

## 📱 **User Experience**

### **Step 1: Category Selection**
User clicks "Haircuts" → Pattern C layout loads

### **Step 2: Service Type Selection**
User selects "Men's Haircut" from service type buttons

### **Step 3: Location Input**
User enters ZIP code: "90210"

### **Step 4: Search**
User clicks "Search" → Backend fetches businesses + prices

### **Step 5: Comparison View**
User sees list of businesses sorted by price:
- Best Deal highlighted
- Distance shown
- Rating & reviews
- Hours
- Price difference from cheapest

### **Step 6: Business Details**
User clicks on a business card → See full details, map, reviews

---

## 🎯 **API Setup (SIMPLE - You Already Have It!)**

### **Use SerpAPI for Everything:**

1. **You already have SerpAPI key** ✅
2. **No additional setup needed!**
3. **Use existing SerpAPI integration**

### **SerpAPI Endpoints for Services:**

**1. Find Businesses (Google Maps):**
```
GET https://serpapi.com/search.json
?engine=google_maps
&q=haircuts+near+90210
&api_key=YOUR_KEY
```

**2. Get Business Details (Google Local):**
```
GET https://serpapi.com/search.json
?engine=google_local
&q=Great+Clips+90210
&api_key=YOUR_KEY
```

**3. Scrape Business Website (Google Search):**
```
GET https://serpapi.com/search.json
?engine=google
&q=site:greatclips.com+men's+haircut+price
&api_key=YOUR_KEY
```

**That's it!** One API, three endpoints, everything you need.

---

## 💡 **Key Differences from Products:**

| Products | Services |
|----------|---------|
| Compare prices from **stores** | Compare prices from **businesses** |
| Same product, different stores | Same service type, different businesses |
| Price is fixed per store | Price may vary (show range) |
| No location needed | **Location is required** (ZIP code) |
| Distance not relevant | **Distance matters** (show miles) |
| Hours not shown | **Hours shown** (when open) |
| Reviews not shown | **Reviews shown** (ratings) |

---

## ✅ **Summary**

**For Service Categories (Using SerpAPI Only):**
1. **Use SerpAPI Google Maps** to find businesses near ZIP code
2. **Use SerpAPI Google Local** to get business details (address, hours, ratings)
3. **Use SerpAPI Google Search** to scrape business websites for exact pricing
4. **Store in database** (same structure as products)
5. **Display comparison** (same UI pattern as products)

**Key Advantage:**
- ✅ **No additional API costs** (you already have SerpAPI!)
- ✅ **One API for everything** (discovery + pricing)
- ✅ **Consistent with products** (same infrastructure)

**Result:** Users can compare service prices from multiple businesses, just like they compare product prices from multiple stores! 🎉

**No need for Google Places API or Yelp API - SerpAPI does it all!**

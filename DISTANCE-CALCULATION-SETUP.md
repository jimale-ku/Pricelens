# 📍 Distance Calculation Setup Guide

## ✅ What's Been Fixed

### 1. **Removed Duplicate "All Categories" Text**
- ✅ Removed the highlighted "All Categories" text below dropdown (bad UX)
- ✅ Dropdown now only shows selected category in the button

### 2. **Fixed Dropdown Positioning**
- ✅ Changed from `position: 'absolute'` to relative positioning
- ✅ Dropdown list now appears directly below the button (not as popup)

### 3. **Updated Sort Options**
- ✅ Only 2 options now: "Lowest Price" and "Nearest Store"
- ✅ Removed: "Highest Price", "Name A-Z", "Name Z-A"

### 4. **Distance Calculation Logic Added**
- ✅ Created `client/utils/distanceCalculator.ts` utility
- ✅ Added distance state management
- ✅ Products now sort by distance when "Nearest Store" is selected
- ✅ Distance is calculated when ZIP code is entered

---

## 🔧 Google Maps API Integration

### **Recommended Approach: Google Maps Distance Matrix API**

**Why Distance Matrix API?**
- ✅ Calculates real travel distance (not just straight-line)
- ✅ Handles multiple stores at once (efficient)
- ✅ Returns distance in miles/km
- ✅ Free tier: $200 credit/month (good for testing)

### **Setup Steps:**

#### 1. **Get Google Maps API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Distance Matrix API"
4. Create API key
5. Add to `.env` file:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

#### 2. **Update `distanceCalculator.ts`**

Replace the mock implementation with real API calls:

```typescript
// In client/utils/distanceCalculator.ts

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * Convert ZIP code to coordinates using Google Geocoding API
 */
export async function zipToCoordinates(zipCode: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding ZIP code:', error);
    return null;
  }
}

/**
 * Get store coordinates from your database or Google Places API
 */
export async function getStoreCoordinates(storeName: string, zipCode: string): Promise<Coordinates | null> {
  // Option 1: Use your database (if you have store locations)
  // Option 2: Use Google Places API to find nearest store
  // For now, return from cache or database
  return STORE_COORDINATES[storeName.toLowerCase()] || null;
}

/**
 * Calculate distance using Google Distance Matrix API (more accurate)
 */
export async function getDistanceToStore(
  userZipCode: string,
  storeName: string
): Promise<number | null> {
  try {
    // Get store address (from your database or hardcoded)
    const storeAddress = getStoreAddress(storeName); // You need to implement this
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${userZipCode}&` +
      `destinations=${storeAddress}&` +
      `units=imperial&` +
      `key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.rows && data.rows[0] && data.rows[0].elements[0]) {
      const distanceText = data.rows[0].elements[0].distance.text; // e.g., "5.2 mi"
      const distanceValue = data.rows[0].elements[0].distance.value; // in meters
      
      // Convert meters to miles
      return distanceValue / 1609.34;
    }
    
    return null;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
}
```

#### 3. **Alternative: Simpler Approach (Haversine Formula)**

If you don't want to use Google Maps API, you can:
1. Store store coordinates in your database
2. Use Haversine formula (already implemented in `distanceCalculator.ts`)
3. Convert ZIP to coordinates using a free geocoding service

**Free Alternatives:**
- **ZIPCodeAPI.com** - Free tier: 10 requests/hour
- **OpenCage Geocoding** - Free tier: 2,500 requests/day
- **Mapbox Geocoding** - Free tier: 100,000 requests/month

---

## 📊 Current Implementation Status

### ✅ **Working:**
- Distance calculation utility created
- Sort by distance logic implemented
- Distance state management added
- Products sort by distance when "Nearest Store" is selected

### ⚠️ **Needs Setup:**
- Google Maps API key configuration
- Store location database (or API integration)
- ZIP code to coordinates conversion (currently using mock data)

### 🔄 **How It Works Now:**

1. **User enters ZIP code** → Triggers distance calculation
2. **User selects "Nearest Store"** → Products sort by distance
3. **Distance is calculated** → Using Haversine formula (straight-line distance)
4. **Products re-sort** → Nearest stores appear first

---

## 🎯 Next Steps

### **Option A: Quick Setup (Mock Data)**
1. Add store coordinates to `STORE_COORDINATES` in `distanceCalculator.ts`
2. Add ZIP codes to `ZIP_TO_COORDINATES`
3. Test with known locations

### **Option B: Production Setup (Google Maps API)**
1. Get Google Maps API key
2. Enable Distance Matrix API
3. Update `distanceCalculator.ts` with real API calls
4. Store store addresses in database
5. Test with real locations

### **Option C: Hybrid Approach**
1. Use Haversine formula for initial sorting (fast, free)
2. Use Google Maps API for accurate travel distance (when needed)
3. Cache results to reduce API calls

---

## 💡 Recommendations

**For MVP/Testing:**
- Use Haversine formula with hardcoded coordinates
- Fast, free, good enough for demo

**For Production:**
- Use Google Maps Distance Matrix API
- More accurate (real travel distance)
- Better user experience
- Costs ~$0.005 per request (very cheap)

**Cost Estimate:**
- 1,000 distance calculations = $5
- 10,000 distance calculations = $50
- Free tier covers most testing needs

---

## 📝 Files Modified

1. ✅ `client/components/category/PatternALayout.tsx`
   - Removed duplicate "All Categories" highlight
   - Fixed dropdown positioning
   - Added distance calculation logic
   - Updated sort options

2. ✅ `client/utils/distanceCalculator.ts` (NEW)
   - Distance calculation utility
   - Haversine formula implementation
   - Ready for Google Maps API integration

---

## 🧪 Testing

1. Enter a ZIP code (e.g., 90210)
2. Select "Nearest Store" from sort dropdown
3. Products should sort by distance
4. Distance should appear in product cards (when implemented)

---

**Ready to integrate Google Maps API? Let me know and I'll help set it up!** 🚀








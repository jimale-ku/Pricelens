# 🔌 Backend Connection Guide - Pattern A Categories

## ✅ **What I Just Built:**

I've connected the frontend to your backend API! Now Pattern A categories will:

1. **Fetch stores from backend** (`/stores` endpoint)
2. **Fetch products from backend** (`/products/popular?categorySlug=...` endpoint)
3. **Use PriceAPI data** (via backend's `/products/compare/multi-store`)
4. **Fallback gracefully** if backend is unavailable

---

## 🎯 **How It Works:**

### **Data Flow:**

```
User clicks category pill
    ↓
Frontend calls: GET /products/popular?categorySlug=groceries
    ↓
Backend checks database for products
    ↓
If no products: Backend can call PriceAPI
    ↓
Backend returns products with prices from stores
    ↓
Frontend displays products with real prices
```

### **Stores Flow:**

```
Frontend calls: GET /stores
    ↓
Backend returns all enabled stores from database
    ↓
Frontend filters/uses stores that have products in this category
    ↓
Shows store filters in UI
```

---

## 📋 **What Changed:**

### **1. New Service: `categoryService.ts`**
- `fetchCategoryStores()` - Gets stores from backend
- `fetchCategoryProducts()` - Gets popular products from backend
- `fetchCategoryData()` - Gets both in parallel

### **2. Updated: `[slug].tsx`**
- Now fetches stores and products from backend on mount
- Shows loading state while fetching
- Falls back to sample data if backend fails
- Uses real backend data when available

---

## 🧪 **Testing:**

### **Step 1: Make sure backend is running**
```bash
cd server
npm run start:dev
```

### **Step 2: Check API endpoint**
Open in browser: `http://192.168.201.100:3000/stores`
- Should return JSON array of stores

### **Step 3: Test category endpoint**
Open: `http://192.168.201.100:3000/products/popular?categorySlug=groceries&limit=6`
- Should return products (or empty array if no products yet)

### **Step 4: Test in app**
1. Open Expo Go
2. Click "Groceries" category
3. Should show loading spinner briefly
4. Then show products from backend (or fallback to samples)

---

## 🔧 **Backend Endpoints Used:**

### **1. Get Stores:**
```
GET /stores
Response: [
  {
    id: "uuid",
    name: "Walmart",
    slug: "walmart",
    logo: "https://...",
    enabled: true
  },
  ...
]
```

### **2. Get Popular Products:**
```
GET /products/popular?categorySlug=groceries&limit=6
Response: [
  {
    id: "uuid",
    name: "Organic Bananas",
    images: ["https://..."],
    category: { slug: "groceries" },
    prices: [
      {
        price: 0.49,
        store: { name: "Costco", slug: "costco" },
        isBestPrice: true
      },
      ...
    ]
  },
  ...
]
```

### **3. Search Products (PriceAPI):**
```
GET /products/compare/multi-store?q=bananas&searchType=auto
Response: {
  product: { name: "Bananas", ... },
  prices: [
    { store: { name: "Walmart" }, price: 0.49, ... },
    ...
  ]
}
```

---

## ⚙️ **How Backend Should Work:**

### **For `/products/popular` endpoint:**

1. **Check database first** - Look for products in this category
2. **If no products** - Can optionally call PriceAPI to fetch some
3. **Return products** - With prices from all stores
4. **Cache results** - So next request is faster

### **For `/stores` endpoint:**

1. **Return all enabled stores** - From database
2. **Frontend will filter** - Based on which stores have products

---

## 🚨 **Troubleshooting:**

### **No products showing?**
- Check backend logs for errors
- Verify `/products/popular?categorySlug=...` returns data
- Check if PriceAPI is configured in backend
- Backend might need to seed database with products first

### **No stores showing?**
- Check `/stores` endpoint returns data
- Verify stores are enabled in database
- Backend might need to seed stores first

### **Network errors?**
- Verify `API_BASE_URL` in `client/constants/api.ts` matches your backend IP
- Check backend is running on port 3000
- Verify same WiFi network
- Check firewall isn't blocking

---

## 📝 **Next Steps:**

### **1. Seed Backend Database (If Empty):**

You might need to:
- Add stores to database
- Add some products to database
- Or let PriceAPI populate products on first search

### **2. Backend Should Auto-Populate:**

When user searches:
- Backend calls PriceAPI
- Saves products to database (`autoSaveProductFromAPI`)
- Next time, products come from database (faster!)

### **3. Caching Strategy:**

Backend should:
- Cache PriceAPI results
- Update prices periodically
- Return cached data when available

---

## ✅ **Summary:**

**Frontend is now connected!** 

- ✅ Fetches stores from backend
- ✅ Fetches products from backend  
- ✅ Uses PriceAPI via backend
- ✅ Falls back gracefully if backend unavailable
- ✅ Shows loading states
- ✅ Handles errors

**Test it now** - Click a category and see if it loads from backend!














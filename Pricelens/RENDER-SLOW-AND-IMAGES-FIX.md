# Render Slow Performance & Missing Images - Fix Guide

## 🐌 Why Render is Slow

### **Render Free Tier Limitations:**

1. **Sleeping Service**
   - Sleeps after ~15 min inactivity
   - Cold start takes **30-60+ seconds**
   - First request is VERY slow

2. **Limited Resources**
   - Free tier: 512MB RAM, shared CPU
   - Slow database queries
   - Slow API responses

3. **No CDN**
   - All requests go through Render
   - No caching layer
   - Slow image loading

---

## 🖼️ Why Images Aren't Showing

### **Common Causes:**

1. **Product data has `images` array, not `image` string**
   - API returns: `{ images: ["url1", "url2"] }`
   - Component expects: `{ image: "url" }`
   - **Fix:** Transform `images[0]` to `image` in API response

2. **Invalid/Broken Image URLs**
   - URLs might be empty strings
   - URLs might be relative (not absolute)
   - URLs might be blocked by CORS

3. **Slow Loading = Timeout**
   - Render is slow → images timeout
   - Network timeout before image loads
   - Component shows placeholder instead

4. **Image URLs from External APIs**
   - Serper/SerpAPI might return broken URLs
   - External image servers might be slow
   - Images might be blocked

---

## 🔧 Quick Fixes

### **Fix 1: Transform Images Array → Single Image**

**In `server/src/products/products.service.ts`:**

Add this helper method:

```typescript
private transformProductImages(product: any) {
  // Convert images array to single image string
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    product.image = product.images[0];
  } else if (!product.image && product.images) {
    product.image = '';
  }
  return product;
}
```

Then use it in all product return methods:

```typescript
return products.map((p) => {
  const enriched = this.enrichProductWithPriceCalculations(p);
  return this.transformProductImages(enriched);
});
```

---

### **Fix 2: Add Image Fallback in API**

**In product service, ensure image always exists:**

```typescript
private ensureProductImage(product: any) {
  if (!product.image && product.images && product.images.length > 0) {
    product.image = product.images[0];
  }
  if (!product.image || product.image === '') {
    // Use placeholder or generate from product name
    product.image = `https://via.placeholder.com/400x400/1e2736/8b95a8?text=${encodeURIComponent(product.name || 'Product')}`;
  }
  return product;
}
```

---

### **Fix 3: Speed Up Render (Free Tier)**

**Option A: Keep It Awake**
- Use **UptimeRobot** (free): https://uptimerobot.com
- Monitor: `https://pricelens-1.onrender.com/stores`
- Check every 5 minutes
- Prevents sleeping = faster responses

**Option B: Optimize Database Queries**
- Add indexes to frequently queried fields
- Limit result sets (already doing `take: 20`)
- Use `select` instead of `include` when possible

**Option C: Add Caching**
- Cache product responses for 5-10 minutes
- Reduces database load
- Faster responses

---

### **Fix 4: Image Loading Timeout**

**In `ProductCardSimple.tsx`:**

Increase timeout or add retry:

```typescript
<Image
  source={{ uri: finalImageUri }}
  style={{ width: '100%', height: '100%' }}
  resizeMode="cover"
  onError={() => setImageError(true)}
  onLoad={() => setImageError(false)}
  // Add timeout
  timeout={10000} // 10 seconds
  // Add retry logic
/>
```

---

## 🚀 Immediate Actions

### **1. Check What API Returns:**

Test in browser:
```
https://pricelens-1.onrender.com/products/popular?categorySlug=groceries&limit=1
```

Look for:
- `images: [...]` array?
- `image: "..."` string?
- Empty/null image fields?

---

### **2. Fix Image Transformation:**

Add to `products.service.ts`:

```typescript
private normalizeProductImage(product: any) {
  // Handle images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    product.image = product.images[0];
  }
  
  // Ensure image is valid URL
  if (!product.image || typeof product.image !== 'string') {
    product.image = '';
  }
  
  // Remove empty images array if we have image string
  if (product.image && product.images) {
    delete product.images; // Optional: keep both or remove array
  }
  
  return product;
}
```

Apply to all product returns:
```typescript
return products.map((p) => {
  const enriched = this.enrichProductWithPriceCalculations(p);
  return this.normalizeProductImage(enriched);
});
```

---

### **3. Set Up UptimeRobot (Keep Render Awake):**

1. Go to: https://uptimerobot.com
2. Sign up (free)
3. Add monitor:
   - URL: `https://pricelens-1.onrender.com/stores`
   - Type: HTTP(s)
   - Interval: 5 minutes
4. Save

**Result:** Render stays awake = faster responses!

---

## 🔍 Debug Steps

### **Check 1: API Response Structure**

```bash
curl https://pricelens-1.onrender.com/products/popular?categorySlug=groceries&limit=1
```

Look for:
- `"images": [...]` → Need to transform
- `"image": "..."` → Already correct
- No image field → Need to add fallback

---

### **Check 2: Image URLs**

Open browser console in app:
- Check network tab
- See if image requests are failing
- Check error messages

---

### **Check 3: Render Logs**

1. Go to Render dashboard
2. Click your service
3. View **Logs** tab
4. Look for:
   - Slow queries
   - Errors
   - Timeouts

---

## ✅ Summary

**Slow Performance:**
- ✅ Render free tier sleeps → Use UptimeRobot
- ✅ Limited resources → Optimize queries
- ✅ No caching → Add response caching

**Missing Images:**
- ✅ Transform `images[]` → `image` string
- ✅ Add fallback for missing images
- ✅ Increase image loading timeout

**Quick Fix:**
1. Add image transformation in `products.service.ts`
2. Set up UptimeRobot to keep Render awake
3. Test API response structure

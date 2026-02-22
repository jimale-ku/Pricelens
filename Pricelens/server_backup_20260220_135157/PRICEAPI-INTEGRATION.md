# PriceAPI Integration Guide

## ✅ Integration Complete!

The PriceAPI integration has been activated. Here's how to use and test it.

---

## 🔑 Setup (Required)

### 1. Add API Key to Environment

Edit your `.env` file and add:

```env
PRICEAPI_KEY=your_actual_priceapi_key_here
```

Replace `your_actual_priceapi_key_here` with the key your client provided.

---

## 🧪 Testing the Integration

### Option 1: Quick Test Script

Run the standalone test script:

```bash
npm install --save-dev ts-node
ts-node test-priceapi.ts
```

This will test:
- ✅ API key validation
- ✅ Search for "iPhone 15"
- ✅ Search for "laptop" with price filters
- ✅ Search for "coffee beans"

### Option 2: Test via API Endpoints

Start your server:

```bash
npm run start:dev
```

Then test with curl or your API client:

**Test 1: Search across all stores**
```bash
curl "http://localhost:3000/products/search-stores?q=iphone"
```

**Test 2: Search with specific query**
```bash
curl "http://localhost:3000/products/search-stores?q=laptop"
```

**Test 3: Advanced product search**
```bash
curl "http://localhost:3000/products/search/advanced?search=headphones&minPrice=50&maxPrice=200"
```

### Option 3: Test via Swagger UI

1. Open http://localhost:3000/api
2. Navigate to "Products" section
3. Try the `/products/search-stores` endpoint
4. Enter a query like "iPhone" or "laptop"
5. Click "Execute"

---

## 📊 Expected Response Format

```json
{
  "query": "iphone",
  "results": [
    {
      "store": "walmart",
      "products": [
        {
          "name": "Apple iPhone 15 Pro Max",
          "price": 1199.99,
          "currency": "USD",
          "inStock": true,
          "url": "https://walmart.com/...",
          "image": "https://...",
          "shipping": 0
        }
      ]
    },
    {
      "store": "amazon",
      "products": [...]
    },
    {
      "store": "target",
      "products": [...]
    }
  ]
}
```

---

## 🔍 Verification Checklist

When you start the server with the API key configured, you should see:

```
✅ PriceAPI integration enabled
```

If you see:
```
⚠️  PriceAPI key not configured. Using mock data.
```

Then the API key is not set correctly in your `.env` file.

---

## 🚀 What Changed

### Files Modified:
1. **`src/integrations/services/priceapi.service.ts`**
   - ✅ Uncommented real API implementation
   - ✅ Enabled `searchProducts()` method
   - ✅ Enabled `getProductByUrl()` method

### How It Works:
1. When `PRICEAPI_KEY` is present in `.env`, the service automatically switches from mock mode to real API calls
2. The service makes HTTP requests to `https://api.priceapi.com/v2`
3. Results are parsed and formatted to match your internal data structure
4. Mock integrations are still available as fallback

---

## 📚 PriceAPI Documentation

For full API documentation, visit:
https://www.priceapi.com/documentation

### Supported Parameters:

**Search Products:**
- `q` - Search query (required)
- `stores` - Comma-separated store names (optional)
- `limit` - Max results per store (default: 20)
- `min_price` - Minimum price filter
- `max_price` - Maximum price filter

**Supported Stores:**
- walmart
- amazon
- target
- bestbuy
- homedepot
- And 100+ more...

---

## 🐛 Troubleshooting

### Issue: "PriceAPI key not configured"
**Solution:** Make sure `PRICEAPI_KEY` is in your `.env` file and restart the server

### Issue: "PriceAPI error: 401 Unauthorized"
**Solution:** Your API key is invalid or expired. Check with your client

### Issue: "PriceAPI error: 429 Too Many Requests"
**Solution:** You've hit the rate limit. Wait a few minutes or upgrade your plan

### Issue: No results returned
**Solution:** 
- Try a different search term
- Check if the stores you're searching support that product category
- Verify your API subscription includes those stores

---

## 💰 API Usage Monitoring

PriceAPI charges based on API calls. To monitor usage:

1. Log into your PriceAPI dashboard: https://www.priceapi.com/dashboard
2. Check your current usage and limits
3. Set up usage alerts to avoid overage charges

**Optimization Tips:**
- Cache results for 5-10 minutes using Redis
- Implement pagination to reduce API calls
- Use specific store filters instead of searching all stores
- Consider background jobs for bulk price updates

---

## 🔄 Reverting to Mock Data

If you need to temporarily disable PriceAPI:

1. Comment out or remove `PRICEAPI_KEY` from `.env`
2. Restart the server
3. The system will automatically fall back to mock integrations

---

## 📝 Next Steps

Now that PriceAPI is integrated:

1. ✅ Test thoroughly with various search queries
2. ✅ Monitor API usage and costs
3. ✅ Set up Redis caching to reduce API calls
4. ✅ Configure background jobs for automated price updates
5. ✅ Integrate with your frontend application
6. ✅ Set up error monitoring and alerting

---

**Questions?** Check the PriceAPI docs or contact their support.

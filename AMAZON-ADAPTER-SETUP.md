# 🛒 Amazon Adapter Setup Guide

## ✅ What Was Created

1. **Amazon Adapter** (`server/src/integrations/adapters/amazon/amazon.adapter.ts`)
   - Implements `IStoreAdapter` interface
   - Uses Amazon Product Advertising API 5.0
   - Handles AWS Signature Version 4 authentication
   - Normalizes Amazon responses to standard format

2. **Amazon Types** (`server/src/integrations/adapters/amazon/amazon.types.ts`)
   - TypeScript types for Amazon API responses
   - Ensures type safety

3. **Test File** (`server/test-amazon-adapter.ts`)
   - Standalone test script
   - Tests all adapter functionality

---

## 🔑 Getting Amazon API Credentials

### Step 1: Join Amazon Associates

1. **Visit**: https://affiliate-program.amazon.com/
2. **Sign up** for Amazon Associates (free)
3. **Wait for approval** (usually 1-3 days)

### Step 2: Get API Credentials

1. **Login** to Associates Central
2. **Go to**: Tools → Product Advertising API
3. **Click**: "Manage Your Account"
4. **Get credentials**:
   - Access Key ID
   - Secret Access Key
   - Associate Tag (your affiliate ID)

### Step 3: Add to Environment

Add to `server/.env`:

```env
# Amazon Product Advertising API
AMAZON_ACCESS_KEY_ID=your_access_key_here
AMAZON_SECRET_ACCESS_KEY=your_secret_key_here
AMAZON_ASSOCIATE_TAG=your_associate_tag_here
```

---

## 🧪 Testing the Adapter

### Option 1: Test Without Credentials (Check Setup)

```bash
cd server
npx ts-node test-amazon-adapter.ts
```

**Expected Output:**
```
🧪 Testing Amazon Adapter

📋 Test 1: Check if adapter is enabled
   Enabled: ❌

⚠️  Amazon adapter is not configured!
💡 Add to server/.env:
   AMAZON_ACCESS_KEY_ID=your_key
   AMAZON_SECRET_ACCESS_KEY=your_secret
   AMAZON_ASSOCIATE_TAG=your_tag
```

### Option 2: Test With Credentials (Full Test)

1. **Add credentials** to `server/.env`
2. **Run test**:
   ```bash
   cd server
   npx ts-node test-amazon-adapter.ts
   ```

**Expected Output:**
```
🧪 Testing Amazon Adapter

📋 Test 1: Check if adapter is enabled
   Enabled: ✅

📋 Test 2: Get store information
   Store: Amazon
   Type: affiliate
   Logo: https://logo.clearbit.com/amazon.com

📋 Test 3: Test connection
   Connection: ✅

📋 Test 4: Search products ("iPhone 15")
   Found: 5 products
   Time: 234ms

   First Product:
   - Name: Apple iPhone 15 128GB
   - Brand: Apple
   - Barcode: 194253123456
   - Prices: 1
   - Price: $799.00
   - In Stock: ✅
   - URL: https://www.amazon.com/...

📋 Test 5: Get health status
   Status: healthy
   Healthy: ✅
   Consecutive Failures: 0
```

---

## 🔧 How It Works

### **1. Authentication (AWS Signature Version 4)**

Amazon uses AWS Signature Version 4 for API authentication:

```
Request → Sign with secret key → Send to Amazon → Get response
```

The adapter handles all signing automatically - you just need credentials!

### **2. Search Flow**

```
User searches "iPhone 15"
    ↓
AmazonAdapter.searchProducts("iPhone 15")
    ↓
Create API request with AWS signature
    ↓
Send to Amazon Product Advertising API
    ↓
Get response with products
    ↓
Normalize to standard format
    ↓
Return NormalizedProduct[]
```

### **3. Data Normalization**

Amazon API returns:
```json
{
  "ItemInfo": {
    "Title": { "DisplayValue": "iPhone 15" },
    "ByLineInfo": { "Brand": { "DisplayValue": "Apple" } }
  },
  "Offers": {
    "Listings": [{
      "Price": { "Amount": 799.00, "Currency": "USD" }
    }]
  }
}
```

Adapter converts to:
```typescript
{
  name: "iPhone 15",
  brand: "Apple",
  prices: [{
    store: "Amazon",
    price: 799.00,
    currency: "USD",
    inStock: true
  }]
}
```

---

## 📊 What the Adapter Provides

### **Features:**
- ✅ **Product Search** - Search by keyword
- ✅ **Barcode Lookup** - Find product by UPC/EAN
- ✅ **Price Extraction** - Get current prices
- ✅ **Stock Status** - Check availability
- ✅ **Product Images** - Get product images
- ✅ **Affiliate Links** - Generate affiliate URLs
- ✅ **Error Handling** - Retry logic, health monitoring
- ✅ **Type Safety** - Full TypeScript support

### **Data Returned:**
- Product name, brand, model
- Barcode/UPC (for matching)
- Current price
- Stock availability
- Product images
- Affiliate links
- Prime eligibility
- Shipping info

---

## ⚠️ Important Notes

### **Rate Limits:**
- Amazon API has rate limits
- Free tier: ~1 request per second
- Adapter includes retry logic for rate limit errors

### **Associate Tag:**
- Required for affiliate links
- You earn commission on sales
- Must be approved Amazon Associate

### **API Costs:**
- **FREE** - No per-request charges
- Only requirement: Amazon Associates account

---

## 🐛 Troubleshooting

### **"Adapter is not configured"**
- Check `.env` file exists
- Verify all 3 variables are set:
  - `AMAZON_ACCESS_KEY_ID`
  - `AMAZON_SECRET_ACCESS_KEY`
  - `AMAZON_ASSOCIATE_TAG`
- Restart backend server

### **"Authentication failed" (401/403)**
- Check credentials are correct
- Verify Associate account is approved
- Check Associate Tag is correct

### **"Rate limit exceeded" (429)**
- Too many requests
- Adapter will retry automatically
- Consider adding delays between requests

### **"No products found"**
- Search query might be too specific
- Try broader search terms
- Check if product exists on Amazon

---

## ✅ Next Steps

1. **Get Amazon credentials** (if not already)
2. **Add to `.env`** file
3. **Run test** to verify it works
4. **Create next adapter** (Walmart, eBay, etc.)

---

## 📝 Summary

**Amazon Adapter is ready!** 🎉

- ✅ Implements `IStoreAdapter` interface
- ✅ Uses official Amazon Product Advertising API
- ✅ Handles authentication automatically
- ✅ Normalizes data to standard format
- ✅ Includes error handling and retries
- ✅ Test file included for verification

**Cost:** FREE (just need Amazon Associates account)

**Next:** Test it, then create more adapters! 🚀








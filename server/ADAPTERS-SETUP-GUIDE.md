# Store Adapters Setup Guide

This guide explains how to set up and test the store adapters for multi-store price comparison.

## Overview

We've created adapters for the following stores:

1. **Amazon** - Product Advertising API 5.0 (Affiliate)
2. **Walmart** - Walmart Open API (Free, 5,000 calls/day)
3. **eBay** - eBay Browse API (Free, 5,000 calls/day)
4. **Best Buy** - Best Buy Store API (Free)

Each adapter follows the same interface pattern, making it easy to add more stores in the future.

## Quick Start

### 1. Amazon Adapter

**Setup:**
1. Join Amazon Associates: https://affiliate-program.amazon.com/
2. Get API credentials from Associates Central
3. Add to `server/.env`:
   ```env
   AMAZON_ACCESS_KEY_ID=your_key
   AMAZON_SECRET_ACCESS_KEY=your_secret
   AMAZON_ASSOCIATE_TAG=your_tag
   AMAZON_REGION=us-east-1
   ```

**Test:**
```bash
cd server
npx ts-node test-amazon-adapter.ts
```

**Documentation:** See `AMAZON-ADAPTER-SETUP.md` for detailed instructions.

---

### 2. Walmart Adapter

**Setup:**
1. Sign up at: https://developer.walmart.com/
2. Get API key (Primary Key)
3. Add to `server/.env`:
   ```env
   WALMART_API_KEY=your_key
   WALMART_PARTNER_ID=your_partner_id  # Optional, for affiliate links
   ```

**Test:**
```bash
cd server
npx ts-node test-walmart-adapter.ts
```

**API Limits:** 5,000 calls/day (free tier)

---

### 3. eBay Adapter

**Setup:**
1. Sign up at: https://developer.ebay.com/
2. Create app, get Client ID (App ID)
3. Add to `server/.env`:
   ```env
   EBAY_CLIENT_ID=your_client_id
   EBAY_CLIENT_SECRET=your_client_secret  # Optional, for OAuth
   ```

**Test:**
```bash
cd server
npx ts-node test-ebay-adapter.ts
```

**Note:** eBay Browse API may require OAuth 2.0 for some endpoints. Check the eBay API documentation for the latest authentication requirements.

**API Limits:** 5,000 calls/day (free tier)

---

### 4. Best Buy Adapter

**Setup:**
1. Sign up at: https://developer.bestbuy.com/
2. Get API key
3. Add to `server/.env`:
   ```env
   BESTBUY_API_KEY=your_key
   ```

**Test:**
```bash
cd server
npx ts-node test-bestbuy-adapter.ts
```

**API Limits:** Rate limits apply (check Best Buy documentation)

---

## Testing All Adapters

Once you have credentials from your client, you can test all adapters:

```bash
cd server

# Test Amazon
npx ts-node test-amazon-adapter.ts

# Test Walmart
npx ts-node test-walmart-adapter.ts

# Test eBay
npx ts-node test-ebay-adapter.ts

# Test Best Buy
npx ts-node test-bestbuy-adapter.ts
```

## Adapter Architecture

All adapters follow the same pattern:

```
adapters/
├── base/
│   ├── abstract-store-adapter.ts  # Base class with common functionality
│   └── store-adapter.interface.ts # Interface all adapters implement
├── types/
│   └── index.ts                   # Shared types
├── amazon/
│   ├── amazon.adapter.ts          # Amazon-specific implementation
│   └── amazon.types.ts            # Amazon API types
├── walmart/
│   ├── walmart.adapter.ts
│   └── walmart.types.ts
├── ebay/
│   ├── ebay.adapter.ts
│   └── ebay.types.ts
└── bestbuy/
    ├── bestbuy.adapter.ts
    └── bestbuy.types.ts
```

## Common Features

All adapters provide:

- ✅ **Search Products** - Search by keyword
- ✅ **Get Product Price** - Get price by barcode/UPC
- ✅ **Health Status** - Monitor adapter health
- ✅ **Retry Logic** - Automatic retries with exponential backoff
- ✅ **Error Handling** - Standardized error format
- ✅ **Normalized Data** - Consistent format across all stores

## Next Steps

Once adapters are tested and working:

1. **Create Price Comparison Service** - Orchestrator that uses all adapters
2. **Implement Product Matching** - Match products across stores by barcode/MPN
3. **Add Background Jobs** - Refresh prices periodically
4. **Add Caching** - Cache results to reduce API calls
5. **Add More Stores** - Target, Costco, Newegg, etc.

## Troubleshooting

### Adapter Not Enabled

If an adapter shows as "not enabled", check:
- Environment variables are set in `server/.env`
- API keys are correct
- API credentials are active

### Authentication Errors

- **Amazon:** Verify Associate Tag is approved
- **Walmart:** Check API key is valid
- **eBay:** May need OAuth 2.0 setup
- **Best Buy:** Verify API key is active

### Rate Limit Errors

- Check API usage limits
- Implement caching to reduce calls
- Use background jobs to refresh data

## Support

For issues with specific adapters, check:
- Amazon: `AMAZON-ADAPTER-SETUP.md`
- Walmart: Walmart Developer Portal
- eBay: eBay Developer Portal
- Best Buy: Best Buy Developer Portal







# Store Adapters

This directory contains all store adapters for PriceLens.

## Architecture

Each store has its own adapter that implements the `IStoreAdapter` interface.

### Structure

```
adapters/
├── base/
│   ├── store-adapter.interface.ts    # Interface all adapters must implement
│   └── abstract-store-adapter.ts      # Base class with common functionality
├── amazon/
│   ├── amazon.adapter.ts              # Amazon adapter implementation
│   └── amazon.types.ts                # Amazon-specific types
├── walmart/
│   ├── walmart.adapter.ts             # Walmart adapter implementation
│   └── walmart.types.ts               # Walmart-specific types
└── types/
    └── index.ts                       # Shared types (NormalizedProduct, etc.)
```

## Creating a New Adapter

1. **Create adapter directory:**
   ```bash
   mkdir server/src/integrations/adapters/target
   ```

2. **Create adapter file:**
   ```typescript
   // target/target.adapter.ts
   import { Injectable } from '@nestjs/common';
   import { AbstractStoreAdapter } from '../base/abstract-store-adapter';
   import { StoreInfo, NormalizedProduct, NormalizedPrice } from '../types';

   @Injectable()
   export class TargetAdapter extends AbstractStoreAdapter {
     constructor() {
       super({
         id: 'target',
         name: 'Target',
         slug: 'target',
         logo: 'https://logo.clearbit.com/target.com',
         baseUrl: 'https://www.target.com',
         enabled: true,
         type: 'scraping', // or 'api', 'affiliate'
       });
     }

     isEnabled(): boolean {
       // Check if API key/scraper is configured
       return !!process.env.TARGET_API_KEY;
     }

     async searchProducts(query: string, options?: SearchOptions): Promise<NormalizedProduct[]> {
       // Implement Target-specific search logic
       // Return normalized products
     }

     async getProductPrice(barcode: string): Promise<NormalizedPrice[]> {
       // Implement Target-specific price lookup
       // Return normalized prices
     }
   }
   ```

3. **Register in module:**
   ```typescript
   // integrations.module.ts
   providers: [
     // ... other adapters
     TargetAdapter,
   ],
   exports: [
     // ... other adapters
     TargetAdapter,
   ],
   ```

## Adapter Responsibilities

Each adapter must:

1. ✅ **Search products** - Convert query to store search, return normalized products
2. ✅ **Get prices** - Lookup by barcode, return normalized prices
3. ✅ **Handle errors** - Use retry logic, record failures
4. ✅ **Normalize data** - Convert store format to standard format
5. ✅ **Report health** - Track success/failure rates

## Normalized Data Format

All adapters must return data in this format:

```typescript
NormalizedProduct {
  name: "iPhone 15",
  barcode: "194253123456",
  brand: "Apple",
  prices: [
    {
      store: "Target",
      storeId: "target",
      price: 799.99,
      currency: "USD",
      inStock: true,
      url: "https://target.com/...",
      fetchedAt: new Date()
    }
  ]
}
```

## Testing Adapters

```typescript
// Test adapter
const adapter = new TargetAdapter();
const isEnabled = adapter.isEnabled();
const health = adapter.getHealthStatus();
const products = await adapter.searchProducts("iPhone 15");
```








import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sortStoresByPriority } from './store-priority';

/**
 * Multi-Store Price Service
 *
 * Fetches real prices from multiple retailers (50+ stores).
 * Uses PricesAPI (pricesapi.io): search by barcode → get product id → get offers.
 * Popular US stores are sorted to the top (Walmart, Amazon, Target, etc.).
 *
 * Base URL (docs): https://api.pricesapi.io/api/v1
 * - GET /products/search?q=...  → product ids
 * - GET /products/:id/offers?country=us → real-time prices per store
 *
 * Free tier: 1,000 requests/month. Auth: x-api-key header.
 */

interface StorePrice {
  store: string;
  price: number;
  currency: string;
  url: string;
  inStock: boolean;
  image?: string;
}

interface MultiStorePriceResult {
  productName: string;
  productImage?: string;
  barcode?: string;
  prices: StorePrice[];
}

@Injectable()
export class MultiStorePriceService {
  private readonly logger = new Logger(MultiStorePriceService.name);
  private readonly pricesApiKey: string;
  private readonly pricesApiEnabled: boolean;
  private readonly baseUrl = 'https://api.pricesapi.io/api/v1';

  constructor(private config: ConfigService) {
    this.pricesApiKey = this.config.get('PRICESAPI_KEY', '');
    this.pricesApiEnabled = !!this.pricesApiKey;
    
    if (!this.pricesApiEnabled) {
      this.logger.warn('⚠️  PricesAPI key not configured. Multi-store prices will be limited.');
      this.logger.warn('💡 To enable: Add PRICESAPI_KEY to .env');
      this.logger.warn('💡 Sign up at: https://pricesapi.io (Free tier: 1,000 calls/month)');
    } else {
      this.logger.log('✅ PricesAPI integration enabled - Multi-store price fetching available');
    }
  }

  private pricesApiHeaders(): Record<string, string> {
    return {
      'x-api-key': this.pricesApiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Search for product prices: search by query → get first product id → fetch offers.
   * Prices are sorted with most popular US stores first.
   */
  async searchMultiStorePrices(
    query: string,
    options?: {
      country?: string;
      limit?: number;
    },
  ): Promise<MultiStorePriceResult | null> {
    if (!this.pricesApiEnabled) {
      this.logger.warn('PricesAPI not enabled - cannot fetch multi-store prices');
      return null;
    }

    try {
      const country = options?.country || 'us';
      const limit = Math.min(options?.limit || 10, 100);
      const searchUrl = `${this.baseUrl}/products/search?q=${encodeURIComponent(query)}&limit=${limit}`;

      this.logger.debug(`🔍 Searching PricesAPI for: "${query}"`);
      const searchRes = await fetch(searchUrl, { method: 'GET', headers: this.pricesApiHeaders() });
      if (!searchRes.ok) {
        const err = await searchRes.text();
        this.logger.error(`❌ PricesAPI search failed (${searchRes.status}): ${err?.slice(0, 200)}`);
        return null;
      }

      const searchData = await searchRes.json();
      const results = searchData?.data?.results;
      if (!Array.isArray(results) || results.length === 0) {
        this.logger.warn(`⚠️  No results from PricesAPI for: "${query}"`);
        return null;
      }

      const first = results[0];
      const productId = first.id;
      if (productId == null) {
        this.logger.warn('⚠️  PricesAPI search result has no id');
        return null;
      }

      const offersUrl = `${this.baseUrl}/products/${productId}/offers?country=${country}`;
      const offersRes = await fetch(offersUrl, { method: 'GET', headers: this.pricesApiHeaders() });
      if (!offersRes.ok) {
        const err = await offersRes.text();
        this.logger.error(`❌ PricesAPI offers failed (${offersRes.status}): ${err?.slice(0, 200)}`);
        return null;
      }

      const offersData = await offersRes.json();
      const payload = offersData?.data ?? offersData;
      const offers = payload?.offers ?? [];
      const prices: StorePrice[] = offers
        .map((o: any) => {
          const price = typeof o.price === 'number' ? o.price : parseFloat(o.price) || 0;
          if (price <= 0) return null;
          return {
            store: o.seller || o.store || 'Unknown Store',
            price,
            currency: o.currency || 'USD',
            url: o.url || o.seller_url || '',
            inStock: o.stock != null ? String(o.stock).toLowerCase() !== 'out of stock' : true,
            image: payload.image ?? o.image,
          };
        })
        .filter((p): p is StorePrice => p != null);

      const sorted = sortStoresByPriority(prices);
      this.logger.log(`✅ Found ${sorted.length} store prices for "${query}"`);

      return {
        productName: first.title || first.name || query,
        productImage: first.image ?? payload?.image,
        barcode: first.gtin ?? first.barcode,
        prices: sorted,
      };
    } catch (error: any) {
      this.logger.error(`❌ Error fetching multi-store prices: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get prices by barcode/UPC (accurate product match, not generic search).
   * Flow: search by barcode → take first product id → get real-time offers.
   * Popular US stores are sorted to the top.
   */
  async getPricesByBarcode(
    barcode: string,
    options?: {
      country?: string;
    },
  ): Promise<{ prices: StorePrice[]; productName?: string; productImage?: string }> {
    const empty = { prices: [] as StorePrice[] };
    if (!this.pricesApiEnabled) return empty;

    const clean = String(barcode).replace(/\D/g, '');
    if (clean.length < 8 || clean.length > 14) return empty;

    try {
      const country = options?.country || 'us';
      // Step 1: search by barcode (exact product match)
      const searchUrl = `${this.baseUrl}/products/search?q=${encodeURIComponent(clean)}&limit=1`;
      const searchRes = await fetch(searchUrl, { method: 'GET', headers: this.pricesApiHeaders() });
      if (!searchRes.ok) {
        const err = await searchRes.text();
        this.logger.warn(`PricesAPI barcode search ${searchRes.status} for ${clean}: ${err?.slice(0, 150)}`);
        return empty;
      }

      const searchData = await searchRes.json();
      const results = searchData?.data?.results;
      if (!Array.isArray(results) || results.length === 0) {
        this.logger.debug(`PricesAPI: no product found for barcode ${clean}`);
        return empty;
      }

      const product = results[0];
      const productId = product.id;
      if (productId == null) return empty;

      // Step 2: get offers for this product (real-time scraping, 5–30s)
      const offersUrl = `${this.baseUrl}/products/${productId}/offers?country=${country}`;
      const offersRes = await fetch(offersUrl, { method: 'GET', headers: this.pricesApiHeaders() });
      if (!offersRes.ok) {
        const err = await offersRes.text();
        this.logger.warn(`PricesAPI offers ${offersRes.status} for product ${productId}: ${err?.slice(0, 150)}`);
        return empty;
      }

      const offersData = await offersRes.json();
      const payload = offersData?.data ?? offersData;
      const offers = payload?.offers ?? [];
      const prices: StorePrice[] = offers
        .map((o: any) => {
          const price = typeof o.price === 'number' ? o.price : parseFloat(o.price) || 0;
          if (price <= 0) return null;
          return {
            store: o.seller || o.store || 'Unknown Store',
            price,
            currency: o.currency || 'USD',
            url: o.url || o.seller_url || '',
            inStock: o.stock != null ? String(o.stock).toLowerCase() !== 'out of stock' : true,
            image: payload?.image ?? o.image,
          };
        })
        .filter((p): p is StorePrice => p != null);

      const sorted = sortStoresByPriority(prices);
      this.logger.log(`✅ PricesAPI barcode: ${sorted.length} offers for ${clean}`);

      const img = payload?.image || product?.image;
      const productImage =
        img && typeof img === 'string' && img.startsWith('http') ? img : undefined;

      return {
        prices: sorted,
        productName: (product.title || product.name) ? String(product.title || product.name).trim() : undefined,
        productImage,
      };
    } catch (error: any) {
      this.logger.error(`❌ Error fetching prices by barcode: ${error.message}`);
      return empty;
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.pricesApiEnabled;
  }
}








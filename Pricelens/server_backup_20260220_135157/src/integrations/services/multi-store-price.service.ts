import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Multi-Store Price Service
 * 
 * Fetches real prices from multiple retailers:
 * - Walmart, Target, Costco, Best Buy, Amazon, etc.
 * 
 * Uses PricesAPI (pricesapi.io) which supports 100+ retailers
 * Free tier: 1,000 API calls/month
 * Paid: $29/month for 10,000 calls
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
  private readonly baseUrl = 'https://api.pricesapi.io';

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

  /**
   * Search for product prices across multiple stores using PricesAPI
   * 
   * PricesAPI supports: Walmart, Target, Costco, Best Buy, Amazon, Home Depot, etc.
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
      const limit = options?.limit || 10;
      
      const url = `${this.baseUrl}/v1/search?query=${encodeURIComponent(query)}&country=${country}&limit=${limit}`;
      
      this.logger.debug(`🔍 Searching PricesAPI for: "${query}"`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.pricesApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ PricesAPI request failed (${response.status}): ${errorText}`);
        return null;
      }

      const data = await response.json();
      
      // PricesAPI response structure:
      // {
      //   "results": [
      //     {
      //       "name": "Product Name",
      //       "image": "https://...",
      //       "prices": [
      //         {
      //           "store": "Walmart",
      //           "price": 19.99,
      //           "currency": "USD",
      //           "url": "https://walmart.com/...",
      //           "inStock": true
      //         },
      //         ...
      //       ]
      //     }
      //   ]
      // }

      if (!data.results || data.results.length === 0) {
        this.logger.warn(`⚠️  No results from PricesAPI for: "${query}"`);
        return null;
      }

      const firstResult = data.results[0];
      
      const prices: StorePrice[] = (firstResult.prices || []).map((p: any) => ({
        store: p.store || 'Unknown Store',
        price: parseFloat(p.price) || 0,
        currency: p.currency || 'USD',
        url: p.url || '',
        inStock: p.inStock !== false,
        image: p.image,
      }));

      this.logger.log(`✅ Found ${prices.length} store prices for "${query}"`);

      return {
        productName: firstResult.name || query,
        productImage: firstResult.image,
        barcode: firstResult.barcode,
        prices: prices.filter(p => p.price > 0), // Filter out invalid prices
      };
    } catch (error: any) {
      this.logger.error(`❌ Error fetching multi-store prices: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get prices for a specific product by barcode/UPC
   */
  async getPricesByBarcode(
    barcode: string,
    options?: {
      country?: string;
    },
  ): Promise<StorePrice[]> {
    if (!this.pricesApiEnabled) {
      return [];
    }

    try {
      const country = options?.country || 'us';
      const url = `${this.baseUrl}/v1/barcode/${barcode}?country=${country}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.pricesApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (!data.prices || data.prices.length === 0) {
        return [];
      }

      return data.prices.map((p: any) => ({
        store: p.store || 'Unknown Store',
        price: parseFloat(p.price) || 0,
        currency: p.currency || 'USD',
        url: p.url || '',
        inStock: p.inStock !== false,
        image: p.image,
      })).filter((p: StorePrice) => p.price > 0);
    } catch (error: any) {
      this.logger.error(`❌ Error fetching prices by barcode: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.pricesApiEnabled;
  }
}








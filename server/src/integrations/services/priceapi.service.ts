import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * PriceAPI Integration Service
 * 
 * This service is ready to integrate with PriceAPI.com when the client subscribes.
 * 
 * Setup Instructions:
 * 1. Client subscribes to PriceAPI.com ($200-500/month)
 * 2. Get API key from PriceAPI dashboard
 * 3. Add to .env: PRICEAPI_KEY=your_key_here
 * 4. Uncomment the implementation below
 * 5. Remove mock integrations from products.service.ts
 * 
 * Documentation: https://www.priceapi.com/documentation
 */

interface PriceAPIProduct {
  name: string;
  price: number;
  currency: string;
  store: string;
  url: string;
  image?: string;
  inStock: boolean;
  shipping?: number;
}

@Injectable()
export class PriceApiService {
  private readonly logger = new Logger(PriceApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.priceapi.com/v2';
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('PRICEAPI_KEY', '');
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      this.logger.warn('⚠️  PriceAPI key not configured. Using mock data.');
      this.logger.warn('💡 To enable: Add PRICEAPI_KEY to .env after client subscription');
    } else {
      this.logger.log('✅ PriceAPI integration enabled');
    }
  }

  /**
   * Search products across all stores
   * 
   * When enabled, this will call:
   * GET /search?q={query}&stores=walmart,amazon,target&key={apiKey}
   */
  async searchProducts(
    query: string,
    options?: {
      stores?: string[];
      limit?: number;
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<PriceAPIProduct[]> {
    if (!this.enabled) {
      return this.getMockResults(query);
    }

    try {
      // UNCOMMENT WHEN CLIENT SUBSCRIBES:
      /*
      const params = new URLSearchParams({
        q: query,
        key: this.apiKey,
        limit: (options?.limit || 20).toString(),
      });

      if (options?.stores?.length) {
        params.append('stores', options.stores.join(','));
      }

      if (options?.minPrice) {
        params.append('min_price', options.minPrice.toString());
      }

      if (options?.maxPrice) {
        params.append('max_price', options.maxPrice.toString());
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`PriceAPI error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.products.map((product: any) => ({
        name: product.name,
        price: product.price,
        currency: product.currency || 'USD',
        store: product.store,
        url: product.url,
        image: product.image,
        inStock: product.in_stock !== false,
        shipping: product.shipping_price,
      }));
      */

      // Remove this line when uncommenting above:
      return this.getMockResults(query);
    } catch (error) {
      this.logger.error('PriceAPI request failed', error);
      return [];
    }
  }

  /**
   * Get product details by URL
   * Useful for price tracking specific items
   */
  async getProductByUrl(url: string): Promise<PriceAPIProduct | null> {
    if (!this.enabled) {
      return null;
    }

    // UNCOMMENT WHEN CLIENT SUBSCRIBES:
    /*
    try {
      const params = new URLSearchParams({
        url,
        key: this.apiKey,
      });

      const response = await fetch(`${this.baseUrl}/product?${params}`);
      
      if (!response.ok) {
        return null;
      }

      const product = await response.json();
      
      return {
        name: product.name,
        price: product.price,
        currency: product.currency || 'USD',
        store: product.store,
        url: product.url,
        image: product.image,
        inStock: product.in_stock !== false,
        shipping: product.shipping_price,
      };
    } catch (error) {
      this.logger.error('PriceAPI product lookup failed', error);
      return null;
    }
    */

    return null;
  }

  /**
   * Mock results for development
   * Remove this method when PriceAPI is enabled
   */
  private getMockResults(query: string): PriceAPIProduct[] {
    const basePrice = Math.random() * 100 + 20;
    
    return [
      {
        name: `${query} - Walmart`,
        price: basePrice,
        currency: 'USD',
        store: 'walmart',
        url: 'https://walmart.com',
        inStock: true,
      },
      {
        name: `${query} - Amazon`,
        price: basePrice * 0.95,
        currency: 'USD',
        store: 'amazon',
        url: 'https://amazon.com',
        inStock: true,
      },
      {
        name: `${query} - Target`,
        price: basePrice * 1.05,
        currency: 'USD',
        store: 'target',
        url: 'https://target.com',
        inStock: Math.random() > 0.3,
      },
    ];
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

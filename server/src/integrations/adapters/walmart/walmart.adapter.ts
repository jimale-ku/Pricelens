/**
 * Walmart Store Adapter
 * 
 * Uses Walmart Open API
 * Free API with 5,000 calls/day limit
 * 
 * Documentation: https://developer.walmart.com/api/us/mp
 * 
 * Setup:
 * 1. Sign up at: https://developer.walmart.com/
 * 2. Get API key (Primary Key)
 * 3. Add to .env: WALMART_API_KEY=your_key
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractStoreAdapter } from '../base/abstract-store-adapter';
import {
  StoreInfo,
  NormalizedProduct,
  NormalizedPrice,
  SearchOptions,
  AdapterError,
} from '../types';
import { WalmartConfig, WalmartSearchResponse, WalmartItem } from './walmart.types';

@Injectable()
export class WalmartAdapter extends AbstractStoreAdapter {
  private readonly config: WalmartConfig | null;
  private readonly apiBaseUrl = 'https://api.walmartlabs.com/v1';

  constructor(private readonly configService: ConfigService) {
    super({
      id: 'walmart',
      name: 'Walmart',
      slug: 'walmart',
      logo: 'https://logo.clearbit.com/walmart.com',
      baseUrl: 'https://www.walmart.com',
      enabled: true,
      type: 'api',
    } as StoreInfo);

    // Load Walmart API configuration
    const apiKey = this.configService.get<string>('WALMART_API_KEY');

    if (apiKey) {
      this.config = {
        apiKey,
        partnerId: this.configService.get<string>('WALMART_PARTNER_ID'),
      };
      this.logger.log('✅ Walmart Open API configured');
    } else {
      this.config = null;
      this.logger.warn('⚠️  Walmart API key not configured');
      this.logger.warn('💡 Add to .env: WALMART_API_KEY=your_key');
      this.logger.warn('💡 Get API key from: https://developer.walmart.com/');
    }
  }

  /**
   * Check if adapter is enabled
   */
  isEnabled(): boolean {
    return this.config !== null;
  }

  /**
   * Search for products on Walmart
   */
  async searchProducts(
    query: string,
    options?: SearchOptions,
  ): Promise<NormalizedProduct[]> {
    if (!this.isEnabled()) {
      throw new AdapterError(
        'Walmart adapter is not configured. Add WALMART_API_KEY to .env',
        this.storeInfo.id,
        this.storeInfo.name,
        'auth',
        false,
      );
    }

    return this.retryWithBackoff(async () => {
      const limit = Math.min(options?.limit || 10, 25); // Walmart API max is 25
      const categoryId = this.mapCategoryToCategoryId(options?.category);

      const url = new URL(`${this.apiBaseUrl}/search`);
      url.searchParams.set('apiKey', this.config!.apiKey);
      url.searchParams.set('query', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('numItems', limit.toString());

      if (categoryId) {
        url.searchParams.set('categoryId', categoryId);
      }

      this.logger.debug(`🔍 Searching Walmart for: "${query}"`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Walmart API error (${response.status}): ${errorText}`);

        let errorType: AdapterError['errorType'] = 'unknown';
        if (response.status === 401 || response.status === 403) {
          errorType = 'auth';
        } else if (response.status === 429) {
          errorType = 'rate_limit';
        } else if (response.status >= 500) {
          errorType = 'network';
        }

        throw new AdapterError(
          `Walmart API request failed (${response.status}): ${errorText}`,
          this.storeInfo.id,
          this.storeInfo.name,
          errorType,
          response.status >= 500,
        );
      }

      const data: WalmartSearchResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        this.logger.warn(`No Walmart products found for: "${query}"`);
        return [];
      }

      return this.normalizeWalmartResponse(data.items, query);
    });
  }

  /**
   * Get product price by barcode/UPC
   */
  async getProductPrice(barcode: string): Promise<NormalizedPrice[]> {
    if (!this.isEnabled()) {
      throw new AdapterError(
        'Walmart adapter is not configured',
        this.storeInfo.id,
        this.storeInfo.name,
        'auth',
        false,
      );
    }

    return this.retryWithBackoff(async () => {
      // Walmart API doesn't have direct UPC lookup, so search by UPC
      const products = await this.searchProducts(barcode, { limit: 5 });

      // Extract prices from products
      const prices: NormalizedPrice[] = [];
      for (const product of products) {
        // Only include if barcode matches
        if (product.barcode === barcode) {
          prices.push(...product.prices);
        }
      }

      return prices;
    });
  }

  /**
   * Make API request to Walmart Open API
   */
  private async makeApiRequest(endpoint: string, params: Record<string, string>): Promise<any> {
    if (!this.config) {
      throw new Error('Walmart configuration not available');
    }

    const url = new URL(`${this.apiBaseUrl}${endpoint}`);
    url.searchParams.set('apiKey', this.config.apiKey);
    url.searchParams.set('format', 'json');

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Walmart API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Normalize Walmart API response to standard format
   */
  private normalizeWalmartResponse(
    items: WalmartItem[],
    query: string,
  ): NormalizedProduct[] {
    const products: NormalizedProduct[] = [];

    for (const item of items) {
      try {
        const product = this.normalizeWalmartItem(item);
        if (product && this.validateProduct(product)) {
          products.push(product);
        }
      } catch (error) {
        this.logger.warn(`Failed to normalize Walmart item ${item.itemId}:`, error);
      }
    }

    return products;
  }

  /**
   * Normalize single Walmart item to NormalizedProduct
   */
  private normalizeWalmartItem(item: WalmartItem): NormalizedProduct | null {
    if (!item.name || !item.salePrice) {
      return null;
    }

    // Extract category from categoryPath
    const categoryPath = item.categoryPath?.split('/') || [];
    const category = categoryPath[categoryPath.length - 1] || 'Uncategorized';

    // Extract image (prefer large, fallback to medium, then thumbnail)
    const image = item.largeImage || item.mediumImage || item.thumbnailImage;

    // Extract price
    const price = item.salePrice;
    const currency = 'USD';
    const shippingCost = item.standardShipRate || 0;
    const isInStock = item.availableOnline !== false && item.stock !== 'Not available';

    const { formattedPrice } = this.normalizePrice(price, currency);

    return {
      name: item.name,
      barcode: item.upc,
      brand: item.brandName,
      description: item.longDescription || item.shortDescription,
      image,
      images: image ? [image] : undefined,
      prices: [
        {
          store: this.storeInfo.name,
          storeId: this.storeInfo.id,
          price,
          currency,
          formattedPrice,
          inStock: isInStock,
          shippingCost,
          totalPrice: price + shippingCost,
          url: item.productUrl || item.productTrackingUrl,
          image,
          onSale: !!(item.msrp && item.msrp > price),
          originalPrice: item.msrp && item.msrp > price ? item.msrp : undefined,
          salePercentage:
            item.msrp && item.msrp > price
              ? Math.round(((item.msrp - price) / item.msrp) * 100)
              : undefined,
          fetchedAt: new Date(),
          metadata: {
            itemId: item.itemId,
            customerRating: item.customerRating,
            numReviews: item.numReviews,
            freeShipping: item.freeShippingOver35Dollars || item.freeShippingOver50Dollars,
            shipToStore: item.shipToStore,
          },
        },
      ],
      category,
      url: item.productUrl || item.productTrackingUrl,
      fetchedAt: new Date(),
      source: 'walmart-api',
    };
  }

  /**
   * Map category to Walmart Category ID
   * Walmart uses numeric category IDs
   */
  private mapCategoryToCategoryId(category?: string): string | null {
    if (!category) return null;

    // Walmart category IDs (common ones)
    const categoryMap: Record<string, string> = {
      electronics: '3944', // Electronics
      groceries: '976759', // Groceries
      kitchen: '1072864', // Kitchen & Dining
      clothing: '5438', // Clothing
      footwear: '5438_1045804', // Shoes
      books: '3920', // Books
      household: '4044', // Home
      medicine: '976760', // Health & Personal Care
      beauty: '1085666', // Beauty
      videogames: '2636', // Video Games
      sports: '4125', // Sports & Outdoors
      office: '1229749', // Office Products
      furniture: '4044_1060828', // Furniture
      tools: '1072864_1072865', // Tools
      pets: '5440', // Pet Supplies
    };

    return categoryMap[category.toLowerCase()] || null;
  }
}


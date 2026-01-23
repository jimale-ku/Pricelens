/**
 * Best Buy Store Adapter
 * 
 * Uses Best Buy Store API
 * Free API with rate limits
 * 
 * Documentation: https://developer.bestbuy.com/
 * 
 * Setup:
 * 1. Sign up at: https://developer.bestbuy.com/
 * 2. Get API key
 * 3. Add to .env: BESTBUY_API_KEY=your_key
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
import { BestBuyConfig, BestBuySearchResponse, BestBuyProduct } from './bestbuy.types';

@Injectable()
export class BestBuyAdapter extends AbstractStoreAdapter {
  private readonly config: BestBuyConfig | null;
  private readonly apiBaseUrl = 'https://api.bestbuy.com/v1';

  constructor(private readonly configService: ConfigService) {
    super({
      id: 'bestbuy',
      name: 'Best Buy',
      slug: 'bestbuy',
      logo: 'https://logo.clearbit.com/bestbuy.com',
      baseUrl: 'https://www.bestbuy.com',
      enabled: true,
      type: 'api',
    } as StoreInfo);

    // Load Best Buy API configuration
    const apiKey = this.configService.get<string>('BESTBUY_API_KEY');

    if (apiKey) {
      this.config = { apiKey };
      this.logger.log('✅ Best Buy Store API configured');
    } else {
      this.config = null;
      this.logger.warn('⚠️  Best Buy API key not configured');
      this.logger.warn('💡 Add to .env: BESTBUY_API_KEY=your_key');
      this.logger.warn('💡 Get API key from: https://developer.bestbuy.com/');
    }
  }

  /**
   * Check if adapter is enabled
   */
  isEnabled(): boolean {
    return this.config !== null;
  }

  /**
   * Search for products on Best Buy
   */
  async searchProducts(
    query: string,
    options?: SearchOptions,
  ): Promise<NormalizedProduct[]> {
    if (!this.isEnabled()) {
      throw new AdapterError(
        'Best Buy adapter is not configured. Add BESTBUY_API_KEY to .env',
        this.storeInfo.id,
        this.storeInfo.name,
        'auth',
        false,
      );
    }

    return this.retryWithBackoff(async () => {
      const limit = Math.min(options?.limit || 10, 100); // Best Buy API max is 100
      const categoryId = this.mapCategoryToCategoryId(options?.category);

      // Build search query
      let searchQuery = `search=${encodeURIComponent(query)}`;
      if (categoryId) {
        searchQuery += `&categoryPath.id=${categoryId}`;
      }

      const url = `${this.apiBaseUrl}/products(${searchQuery})?apiKey=${this.config!.apiKey}&format=json&pageSize=${limit}&show=sku,name,salePrice,regularPrice,onSale,image,largeImage,url,onlineAvailability,inStoreAvailability,upc,manufacturer,modelNumber,shortDescription,longDescription,features.feature,details.name,details.value,customerReviewAverage,customerReviewCount,freeShipping,shippingCost`;

      this.logger.debug(`🔍 Searching Best Buy for: "${query}"`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Best Buy API error (${response.status}): ${errorText}`);

        let errorType: AdapterError['errorType'] = 'unknown';
        if (response.status === 401 || response.status === 403) {
          errorType = 'auth';
        } else if (response.status === 429) {
          errorType = 'rate_limit';
        } else if (response.status >= 500) {
          errorType = 'network';
        }

        throw new AdapterError(
          `Best Buy API request failed (${response.status}): ${errorText}`,
          this.storeInfo.id,
          this.storeInfo.name,
          errorType,
          response.status >= 500,
        );
      }

      const data: BestBuySearchResponse = await response.json();

      if (!data.products || data.products.length === 0) {
        this.logger.warn(`No Best Buy products found for: "${query}"`);
        return [];
      }

      return this.normalizeBestBuyResponse(data.products, query);
    });
  }

  /**
   * Get product price by barcode/UPC
   */
  async getProductPrice(barcode: string): Promise<NormalizedPrice[]> {
    if (!this.isEnabled()) {
      throw new AdapterError(
        'Best Buy adapter is not configured',
        this.storeInfo.id,
        this.storeInfo.name,
        'auth',
        false,
      );
    }

    return this.retryWithBackoff(async () => {
      // Best Buy supports UPC search
      const url = `${this.apiBaseUrl}/products(upc=${barcode})?apiKey=${this.config!.apiKey}&format=json&show=sku,name,salePrice,regularPrice,onSale,image,url,onlineAvailability,upc`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new AdapterError(
          `Best Buy API request failed: ${response.statusText}`,
          this.storeInfo.id,
          this.storeInfo.name,
          'network',
          true,
        );
      }

      const data: BestBuySearchResponse = await response.json();
      const products = this.normalizeBestBuyResponse(data.products || [], barcode);

      // Extract prices from products
      const prices: NormalizedPrice[] = [];
      for (const product of products) {
        prices.push(...product.prices);
      }

      return prices;
    });
  }

  /**
   * Normalize Best Buy API response to standard format
   */
  private normalizeBestBuyResponse(
    products: BestBuyProduct[],
    query: string,
  ): NormalizedProduct[] {
    const normalizedProducts: NormalizedProduct[] = [];

    for (const product of products) {
      try {
        const normalized = this.normalizeBestBuyProduct(product);
        if (normalized && this.validateProduct(normalized)) {
          normalizedProducts.push(normalized);
        }
      } catch (error) {
        this.logger.warn(`Failed to normalize Best Buy product ${product.sku}:`, error);
      }
    }

    return normalizedProducts;
  }

  /**
   * Normalize single Best Buy product to NormalizedProduct
   */
  private normalizeBestBuyProduct(product: BestBuyProduct): NormalizedProduct | null {
    if (!product.name || !product.regularPrice) {
      return null;
    }

    const price = product.salePrice || product.regularPrice;
    const currency = 'USD';
    const shippingCost = product.shippingCost || 0;
    const isInStock = product.onlineAvailability !== false;

    // Extract image (prefer large, fallback to regular)
    const image = product.largeImage || product.image;

    // Extract category from type
    const category = this.extractCategoryFromType(product.type);

    const { formattedPrice } = this.normalizePrice(price, currency);

    return {
      name: product.name,
      barcode: product.upc,
      brand: product.manufacturer,
      model: product.modelNumber,
      description: product.longDescription || product.shortDescription,
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
          url: product.url,
          image,
          onSale: product.onSale,
          originalPrice: product.onSale ? product.regularPrice : undefined,
          salePercentage: product.onSale && product.percentSavings
            ? parseFloat(product.percentSavings.replace('%', ''))
            : undefined,
          fetchedAt: new Date(),
          metadata: {
            sku: product.sku,
            customerReviewAverage: product.customerReviewAverage,
            customerReviewCount: product.customerReviewCount,
            freeShipping: product.freeShipping,
            inStorePickup: product.inStorePickup,
            onlineAvailability: product.onlineAvailability,
            inStoreAvailability: product.inStoreAvailability,
          },
        },
      ],
      category,
      url: product.url,
      fetchedAt: new Date(),
      source: 'bestbuy-api',
    };
  }

  /**
   * Extract category from Best Buy product type
   */
  private extractCategoryFromType(type: string): string {
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('phone') || typeLower.includes('smartphone')) return 'Electronics';
    if (typeLower.includes('laptop') || typeLower.includes('computer')) return 'Electronics';
    if (typeLower.includes('tv') || typeLower.includes('television')) return 'Electronics';
    if (typeLower.includes('headphone') || typeLower.includes('audio')) return 'Electronics';
    if (typeLower.includes('game') || typeLower.includes('console')) return 'Video Games';
    if (typeLower.includes('camera')) return 'Electronics';
    if (typeLower.includes('appliance')) return 'Kitchen';
    
    return 'Electronics'; // Default for Best Buy (mostly electronics)
  }

  /**
   * Map category to Best Buy Category ID
   */
  private mapCategoryToCategoryId(category?: string): string | null {
    if (!category) return null;

    // Best Buy category IDs (common ones)
    const categoryMap: Record<string, string> = {
      electronics: 'abcat0500000', // Electronics
      videogames: 'abcat0700000', // Video Games
      kitchen: 'abcat0912000', // Major Appliances
      office: 'abcat0502000', // Computers & Tablets
      tools: 'abcat0913000', // Home Improvement
    };

    return categoryMap[category.toLowerCase()] || null;
  }
}


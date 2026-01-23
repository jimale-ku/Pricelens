/**
 * eBay Store Adapter
 * 
 * Uses eBay Browse API
 * Free API with 5,000 calls/day limit
 * 
 * Documentation: https://developer.ebay.com/api-docs/buy/browse/overview.html
 * 
 * Setup:
 * 1. Sign up at: https://developer.ebay.com/
 * 2. Create app, get Client ID (App ID)
 * 3. Add to .env: EBAY_CLIENT_ID=your_client_id
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
import { EbayConfig, EbaySearchResponse, EbayItem } from './ebay.types';

@Injectable()
export class EbayAdapter extends AbstractStoreAdapter {
  private readonly config: EbayConfig | null;
  private readonly apiBaseUrl = 'https://api.ebay.com/buy/browse/v1';
  private readonly marketplaceId = 'EBAY_US';

  constructor(private readonly configService: ConfigService) {
    super({
      id: 'ebay',
      name: 'eBay',
      slug: 'ebay',
      logo: 'https://logo.clearbit.com/ebay.com',
      baseUrl: 'https://www.ebay.com',
      enabled: true,
      type: 'api',
    } as StoreInfo);

    // Load eBay API configuration
    const clientId = this.configService.get<string>('EBAY_CLIENT_ID');

    if (clientId) {
      this.config = {
        clientId,
        clientSecret: this.configService.get<string>('EBAY_CLIENT_SECRET'),
        marketplaceId: this.marketplaceId,
      };
      this.logger.log('✅ eBay Browse API configured');
    } else {
      this.config = null;
      this.logger.warn('⚠️  eBay Client ID not configured');
      this.logger.warn('💡 Add to .env: EBAY_CLIENT_ID=your_client_id');
      this.logger.warn('💡 Get Client ID from: https://developer.ebay.com/');
    }
  }

  /**
   * Check if adapter is enabled
   */
  isEnabled(): boolean {
    return this.config !== null;
  }

  /**
   * Search for products on eBay
   */
  async searchProducts(
    query: string,
    options?: SearchOptions,
  ): Promise<NormalizedProduct[]> {
    if (!this.isEnabled()) {
      throw new AdapterError(
        'eBay adapter is not configured. Add EBAY_CLIENT_ID to .env',
        this.storeInfo.id,
        this.storeInfo.name,
        'auth',
        false,
      );
    }

    return this.retryWithBackoff(async () => {
      const limit = Math.min(options?.limit || 10, 200); // eBay API max is 200
      const categoryId = this.mapCategoryToCategoryId(options?.category);

      const url = new URL(`${this.apiBaseUrl}/item_summary/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('X-EBAY-C-MARKETPLACE-ID', this.marketplaceId);

      if (categoryId) {
        url.searchParams.set('category_ids', categoryId);
      }

      // Filter for Buy It Now items (more reliable pricing)
      url.searchParams.set('buyingOptions', 'FIXED_PRICE');

      this.logger.debug(`🔍 Searching eBay for: "${query}"`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.clientId}`, // eBay uses Client ID as Bearer token for Browse API
          'Accept': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': this.marketplaceId,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`eBay API error (${response.status}): ${errorText}`);

        let errorType: AdapterError['errorType'] = 'unknown';
        if (response.status === 401 || response.status === 403) {
          errorType = 'auth';
        } else if (response.status === 429) {
          errorType = 'rate_limit';
        } else if (response.status >= 500) {
          errorType = 'network';
        }

        throw new AdapterError(
          `eBay API request failed (${response.status}): ${errorText}`,
          this.storeInfo.id,
          this.storeInfo.name,
          errorType,
          response.status >= 500,
        );
      }

      const data: EbaySearchResponse = await response.json();

      if (!data.itemSummaries || data.itemSummaries.length === 0) {
        this.logger.warn(`No eBay products found for: "${query}"`);
        return [];
      }

      return this.normalizeEbayResponse(data.itemSummaries, query);
    });
  }

  /**
   * Get product price by barcode/UPC
   */
  async getProductPrice(barcode: string): Promise<NormalizedPrice[]> {
    if (!this.isEnabled()) {
      throw new AdapterError(
        'eBay adapter is not configured',
        this.storeInfo.id,
        this.storeInfo.name,
        'auth',
        false,
      );
    }

    return this.retryWithBackoff(async () => {
      // eBay supports GTIN search
      const url = new URL(`${this.apiBaseUrl}/item_summary/search`);
      url.searchParams.set('gtin', barcode);
      url.searchParams.set('limit', '10');
      url.searchParams.set('buyingOptions', 'FIXED_PRICE');
      url.searchParams.set('X-EBAY-C-MARKETPLACE-ID', this.marketplaceId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.clientId}`,
          'Accept': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': this.marketplaceId,
        },
      });

      if (!response.ok) {
        throw new AdapterError(
          `eBay API request failed: ${response.statusText}`,
          this.storeInfo.id,
          this.storeInfo.name,
          'network',
          true,
        );
      }

      const data: EbaySearchResponse = await response.json();
      const products = this.normalizeEbayResponse(data.itemSummaries || [], barcode);

      // Extract prices from products
      const prices: NormalizedPrice[] = [];
      for (const product of products) {
        prices.push(...product.prices);
      }

      return prices;
    });
  }

  /**
   * Normalize eBay API response to standard format
   */
  private normalizeEbayResponse(
    items: EbayItem[],
    query: string,
  ): NormalizedProduct[] {
    const products: NormalizedProduct[] = [];

    for (const item of items) {
      try {
        const product = this.normalizeEbayItem(item);
        if (product && this.validateProduct(product)) {
          products.push(product);
        }
      } catch (error) {
        this.logger.warn(`Failed to normalize eBay item ${item.itemId}:`, error);
      }
    }

    return products;
  }

  /**
   * Normalize single eBay item to NormalizedProduct
   */
  private normalizeEbayItem(item: EbayItem): NormalizedProduct | null {
    if (!item.title || !item.price?.value) {
      return null;
    }

    const price = parseFloat(item.price.value);
    const currency = item.price.currency || 'USD';

    // Extract shipping cost
    let shippingCost = 0;
    if (item.shippingOptions && item.shippingOptions.length > 0) {
      const shippingOption = item.shippingOptions[0];
      if (shippingOption.shippingCost?.value) {
        shippingCost = parseFloat(shippingOption.shippingCost.value);
      } else if (shippingOption.shippingCostType === 'FREE') {
        shippingCost = 0;
      }
    }

    // Extract image
    const image =
      item.image?.imageUrl ||
      item.thumbnailImages?.[0]?.imageUrl ||
      item.additionalImages?.[0]?.imageUrl;

    // Extract category
    const category = item.categories?.[0]?.categoryName || 'Uncategorized';

    // Check if in stock
    const isInStock =
      item.estimatedAvailabilities?.[0]?.estimatedAvailabilityStatus === 'IN_STOCK' ||
      item.buyingOptions?.includes('FIXED_PRICE') ||
      true; // Default to true if unknown

    const { formattedPrice } = this.normalizePrice(price, currency);

    // Check if on sale
    const originalPrice = item.marketingPrice?.originalPrice?.value
      ? parseFloat(item.marketingPrice.originalPrice.value)
      : undefined;
    const onSale = !!(originalPrice && originalPrice > price);
    const salePercentage = onSale
      ? Math.round(((originalPrice! - price) / originalPrice!) * 100)
      : undefined;

    return {
      name: item.title,
      barcode: item.gtin,
      brand: item.brand,
      description: item.shortDescription,
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
          url: item.itemWebUrl || item.itemAffiliateWebUrl || item.itemHref || '',
          image,
          onSale,
          originalPrice,
          salePercentage,
          fetchedAt: new Date(),
          metadata: {
            itemId: item.itemId,
            condition: item.condition,
            conditionId: item.conditionId,
            seller: item.seller?.username,
            feedbackScore: item.seller?.feedbackScore,
            feedbackPercentage: item.seller?.feedbackPercentage,
            buyingOptions: item.buyingOptions,
          },
        },
      ],
      category,
      url: item.itemWebUrl || item.itemAffiliateWebUrl || item.itemHref || '',
      fetchedAt: new Date(),
      source: 'ebay-api',
    };
  }

  /**
   * Map category to eBay Category ID
   */
  private mapCategoryToCategoryId(category?: string): string | null {
    if (!category) return null;

    // eBay category IDs (common ones)
    const categoryMap: Record<string, string> = {
      electronics: '58058', // Electronics
      groceries: '11700', // Food & Beverages
      kitchen: '20625', // Kitchen & Dining
      clothing: '11450', // Clothing, Shoes & Accessories
      footwear: '11450', // Shoes (under Clothing)
      books: '267', // Books
      household: '11700', // Home & Garden
      medicine: '26395', // Health & Beauty
      beauty: '26395', // Health & Beauty
      videogames: '1249', // Video Games & Consoles
      sports: '888', // Sporting Goods
      office: '11700', // Office Products
      furniture: '11700', // Furniture (under Home)
      tools: '11700', // Tools (under Home)
      pets: '1281', // Pet Supplies
    };

    return categoryMap[category.toLowerCase()] || null;
  }
}


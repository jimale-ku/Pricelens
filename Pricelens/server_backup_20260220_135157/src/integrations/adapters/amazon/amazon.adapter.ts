/**
 * Amazon Store Adapter
 * 
 * Uses Amazon Product Advertising API 5.0
 * Free API for affiliate partners
 * 
 * Documentation: https://webservices.amazon.com/paapi5/documentation/
 * 
 * Setup:
 * 1. Join Amazon Associates: https://affiliate-program.amazon.com/
 * 2. Get API credentials from Associates Central
 * 3. Add to .env:
 *    AMAZON_ACCESS_KEY_ID=your_key
 *    AMAZON_SECRET_ACCESS_KEY=your_secret
 *    AMAZON_ASSOCIATE_TAG=your_tag
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
import { AmazonConfig, AmazonSearchResponse, AmazonItem } from './amazon.types';
import * as crypto from 'crypto';

@Injectable()
export class AmazonAdapter extends AbstractStoreAdapter {
  private readonly config: AmazonConfig | null;
  private readonly apiEndpoint = 'https://webservices.amazon.com/paapi5/searchitems';
  private readonly region = 'us-east-1';
  private readonly service = 'ProductAdvertisingAPI';
  private readonly algorithm = 'AWS4-HMAC-SHA256';

  constructor(private readonly configService: ConfigService) {
    super({
      id: 'amazon',
      name: 'Amazon',
      slug: 'amazon',
      logo: 'https://logo.clearbit.com/amazon.com',
      baseUrl: 'https://www.amazon.com',
      enabled: true,
      type: 'affiliate',
    });

    // Load Amazon API configuration
    const accessKeyId = this.configService.get<string>('AMAZON_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AMAZON_SECRET_ACCESS_KEY');
    const associateTag = this.configService.get<string>('AMAZON_ASSOCIATE_TAG');

    if (accessKeyId && secretAccessKey && associateTag) {
      this.config = {
        accessKeyId,
        secretAccessKey,
        associateTag,
        marketplace: 'www.amazon.com',
        region: this.region,
      };
      this.logger.log('✅ Amazon Product Advertising API configured');
    } else {
      this.config = null;
      this.logger.warn('⚠️  Amazon API credentials not configured');
      this.logger.warn('💡 Add to .env: AMAZON_ACCESS_KEY_ID, AMAZON_SECRET_ACCESS_KEY, AMAZON_ASSOCIATE_TAG');
      this.logger.warn('💡 Get credentials from: https://affiliate-program.amazon.com/');
    }
  }

  /**
   * Check if adapter is enabled
   */
  isEnabled(): boolean {
    return this.config !== null;
  }

  /**
   * Search for products on Amazon
   */
  async searchProducts(
    query: string,
    options?: SearchOptions,
  ): Promise<NormalizedProduct[]> {
    if (!this.isEnabled()) {
      throw new AdapterError(
        'Amazon adapter is not configured. Add AMAZON_ACCESS_KEY_ID, AMAZON_SECRET_ACCESS_KEY, and AMAZON_ASSOCIATE_TAG to .env',
        this.storeInfo.id,
        this.storeInfo.name,
        'auth',
        false,
      );
    }

    return this.retryWithBackoff(async () => {
      const limit = Math.min(options?.limit || 10, 10); // Amazon API max is 10
      const searchIndex = this.mapCategoryToSearchIndex(options?.category);

      const requestBody = {
        PartnerTag: this.config!.associateTag,
        PartnerType: 'Associates',
        Keywords: query,
        SearchIndex: searchIndex || 'All',
        ItemCount: limit,
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.ByLineInfo',
          'ItemInfo.ExternalIds',
          'ItemInfo.ProductInfo',
          'ItemInfo.Title',
          'Offers.Listings.Price',
          'Offers.Listings.Availability',
          'Offers.Listings.Condition',
          'Offers.Listings.DeliveryInfo',
          'Offers.Summaries',
        ],
      };

      const response = await this.makeApiRequest(requestBody);
      return this.normalizeAmazonResponse(response, query);
    });
  }

  /**
   * Get product price by barcode/UPC
   */
  async getProductPrice(barcode: string): Promise<NormalizedPrice[]> {
    if (!this.isEnabled()) {
      throw new AdapterError(
        'Amazon adapter is not configured',
        this.storeInfo.id,
        this.storeInfo.name,
        'auth',
        false,
      );
    }

    return this.retryWithBackoff(async () => {
      // Search by barcode/UPC
      const requestBody = {
        PartnerTag: this.config!.associateTag,
        PartnerType: 'Associates',
        Keywords: barcode,
        SearchIndex: 'All',
        ItemCount: 5,
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.ByLineInfo',
          'ItemInfo.ExternalIds',
          'ItemInfo.Title',
          'Offers.Listings.Price',
          'Offers.Listings.Availability',
          'Offers.Listings.Condition',
          'Offers.Listings.DeliveryInfo',
        ],
      };

      const response = await this.makeApiRequest(requestBody);
      const products = this.normalizeAmazonResponse(response, barcode);

      // Extract prices from products
      const prices: NormalizedPrice[] = [];
      for (const product of products) {
        prices.push(...product.prices);
      }

      return prices;
    });
  }

  /**
   * Make API request to Amazon Product Advertising API
   * Uses AWS Signature Version 4 for authentication
   */
  private async makeApiRequest(requestBody: any): Promise<AmazonSearchResponse> {
    if (!this.config) {
      throw new Error('Amazon configuration not available');
    }

    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const date = timestamp.substr(0, 8);

    // Create canonical request
    const canonicalUri = '/paapi5/searchitems';
    const canonicalQuerystring = '';
    const host = 'webservices.amazon.com';
    const canonicalHeaders = `host:${host}\nx-amz-date:${timestamp}\n`;
    const signedHeaders = 'host;x-amz-date';
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(requestBody)).digest('hex');
    const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // Create string to sign
    const credentialScope = `${date}/${this.region}/${this.service}/aws4_request`;
    const stringToSign = `${this.algorithm}\n${timestamp}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

    // Calculate signature (AWS Signature Version 4)
    const kDate = crypto.createHmac('sha256', `AWS4${this.config.secretAccessKey}`).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(this.service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    // Create authorization header
    const authorization = `${this.algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Make request
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Amz-Date': timestamp,
          Authorization: authorization,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Amazon API error (${response.status}): ${errorText}`);

        let errorType: AdapterError['errorType'] = 'unknown';
        if (response.status === 401 || response.status === 403) {
          errorType = 'auth';
        } else if (response.status === 429) {
          errorType = 'rate_limit';
        } else if (response.status >= 500) {
          errorType = 'network';
        }

        throw new AdapterError(
          `Amazon API request failed (${response.status}): ${errorText}`,
          this.storeInfo.id,
          this.storeInfo.name,
          errorType,
          response.status >= 500, // Retryable for server errors
        );
      }

      const data: AmazonSearchResponse = await response.json();

      // Check for API errors in response
      if (data.SearchResult?.Items === undefined) {
        this.logger.warn('Amazon API returned no items');
        return { SearchResult: { Items: [] } };
      }

      return data;
    } catch (error: any) {
      if (error instanceof AdapterError) {
        throw error;
      }
      
      // Network or other errors
      throw new AdapterError(
        `Amazon API request failed: ${error.message}`,
        this.storeInfo.id,
        this.storeInfo.name,
        'network',
        true, // Retryable
        error,
      );
    }
  }

  /**
   * Normalize Amazon API response to standard format
   */
  private normalizeAmazonResponse(
    response: AmazonSearchResponse,
    query: string,
  ): NormalizedProduct[] {
    const items = response.SearchResult?.Items || [];
    const products: NormalizedProduct[] = [];

    for (const item of items) {
      try {
        const product = this.normalizeAmazonItem(item);
        if (product && this.validateProduct(product)) {
          products.push(product);
        }
      } catch (error) {
        this.logger.warn(`Failed to normalize Amazon item ${item.ASIN}:`, error);
      }
    }

    return products;
  }

  /**
   * Normalize single Amazon item to NormalizedProduct
   */
  private normalizeAmazonItem(item: AmazonItem): NormalizedProduct | null {
    if (!item.ItemInfo?.Title?.DisplayValue) {
      return null;
    }

    const title = item.ItemInfo.Title.DisplayValue;
    const brand = item.ItemInfo.ByLineInfo?.Brand?.DisplayValue || 
                  item.ItemInfo.ByLineInfo?.Manufacturer?.DisplayValue;
    
    // Extract barcode/UPC
    const barcode = 
      item.ItemInfo.ExternalIds?.UPCs?.DisplayValues?.[0] ||
      item.ItemInfo.ExternalIds?.EANs?.DisplayValues?.[0];

    // Extract image
    const image = item.Images?.Primary?.Large?.URL || 
                  item.Images?.Primary?.Medium?.URL;

    // Extract prices
    const prices = this.extractPrices(item);

    if (prices.length === 0) {
      return null; // Skip products without prices
    }

    return {
      name: title,
      barcode,
      brand,
      image,
      images: image ? [image] : undefined,
      prices,
      url: item.DetailPageURL,
      fetchedAt: new Date(),
      source: 'amazon-api',
    };
  }

  /**
   * Extract prices from Amazon item
   */
  private extractPrices(item: AmazonItem): NormalizedPrice[] {
    const prices: NormalizedPrice[] = [];

    // Use listings if available (more detailed)
    if (item.Offers?.Listings && item.Offers.Listings.length > 0) {
      for (const listing of item.Offers.Listings) {
        if (listing.Price?.Amount) {
          const price = listing.Price.Amount;
          const currency = listing.Price.Currency || 'USD';
          const shippingCost = listing.ShippingCharges?.Amount || 0;
          const isInStock = listing.Availability?.Type === 'NOW' || 
                          listing.Availability?.Type === 'BACKORDER';

          const { formattedPrice } = this.normalizePrice(price, currency);

          prices.push({
            store: this.storeInfo.name,
            storeId: this.storeInfo.id,
            price,
            currency,
            formattedPrice: listing.Price.DisplayAmount || formattedPrice,
            inStock: isInStock,
            shippingCost,
            totalPrice: price + shippingCost,
            url: item.DetailPageURL,
            image: item.Images?.Primary?.Large?.URL,
            onSale: listing.Condition?.Value === 'NewOther' || false,
            fetchedAt: new Date(),
            metadata: {
              asin: item.ASIN,
              condition: listing.Condition?.DisplayValue,
              isPrimeEligible: listing.DeliveryInfo?.IsPrimeEligible,
              isFreeShipping: listing.DeliveryInfo?.IsFreeShippingEligible,
            },
          });
        }
      }
    }
    // Fallback to summary if no listings
    else if (item.Offers?.Summaries && item.Offers.Summaries.length > 0) {
      const summary = item.Offers.Summaries[0];
      const lowestPrice = summary.LowestPrice?.Amount;
      
      if (lowestPrice) {
        const currency = summary.LowestPrice?.Currency || 'USD';
        const { formattedPrice } = this.normalizePrice(lowestPrice, currency);

        prices.push({
          store: this.storeInfo.name,
          storeId: this.storeInfo.id,
          price: lowestPrice,
          currency,
          formattedPrice,
          inStock: true, // Assume in stock if summary available
          url: item.DetailPageURL,
          image: item.Images?.Primary?.Large?.URL,
          fetchedAt: new Date(),
          metadata: {
            asin: item.ASIN,
            offerCount: summary.OfferCount,
          },
        });
      }
    }

    return prices;
  }

  /**
   * Map category to Amazon SearchIndex
   */
  private mapCategoryToSearchIndex(category?: string): string | null {
    if (!category) return null;

    const categoryMap: Record<string, string> = {
      electronics: 'Electronics',
      groceries: 'Grocery',
      kitchen: 'Kitchen',
      clothing: 'Fashion',
      footwear: 'Shoes',
      books: 'Books',
      household: 'HomeGarden',
      medicine: 'HealthPersonalCare',
      beauty: 'Beauty',
      videogames: 'VideoGames',
      sports: 'SportingGoods',
      office: 'OfficeProducts',
      furniture: 'Furniture',
      tools: 'Tools',
      pets: 'PetSupplies',
    };

    return categoryMap[category.toLowerCase()] || null;
  }
}








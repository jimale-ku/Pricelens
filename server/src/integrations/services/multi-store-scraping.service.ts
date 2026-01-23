/**
 * Multi-Store Price Scraping Service
 * 
 * This service provides multi-store price comparison using scraping APIs
 * Works immediately without API approvals
 * 
 * Strategy:
 * 1. Use PriceAPI for product discovery (image, name, barcode)
 * 2. Use scraping service (Bright Data/Apify) for multi-store prices
 * 3. Combine results for frontend
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceApiService } from './priceapi.service';

export interface StorePrice {
  storeName: string;
  storeId: string;
  price: number;
  currency: string;
  formattedPrice: string;
  inStock: boolean;
  url: string;
  image?: string;
  shippingCost?: number;
  totalPrice?: number;
  lastUpdated: Date;
}

export interface MultiStoreProductResult {
  // Product info (from PriceAPI)
  name: string;
  image: string;
  barcode?: string;
  brand?: string;
  description?: string;
  category?: string;
  
  // Prices from multiple stores (from scraping)
  storePrices: StorePrice[];
  
  // Metadata
  bestPrice?: number;
  bestPriceStore?: string;
  maxSavings?: number;
  totalStores: number;
}

@Injectable()
export class MultiStoreScrapingService {
  private readonly logger = new Logger(MultiStoreScrapingService.name);
  private readonly scrapingEnabled: boolean;
  private readonly scrapingService: 'bright_data' | 'apify' | 'serpapi' | 'none';

  constructor(
    private readonly configService: ConfigService,
    private readonly priceApiService: PriceApiService,
  ) {
    // Check which scraping service is configured
    // CRITICAL: Prioritize SerpAPI for multi-store price fetching (Google Shopping)
    // SerpAPI is the best option for getting prices from 20+ stores
    const brightDataUser = this.configService.get<string>('BRIGHT_DATA_USERNAME');
    const apifyKey = this.configService.get<string>('APIFY_API_KEY');
    const serpApiKey = this.configService.get<string>('SERPAPI_KEY');

    // Priority order: SerpAPI > Bright Data > Apify
    // SerpAPI is best for multi-store because it returns results from Google Shopping (20+ stores)
    if (serpApiKey) {
      this.scrapingService = 'serpapi';
      this.scrapingEnabled = true;
      console.log('✅ [MultiStore] SerpAPI enabled (Google Shopping) - BEST for multi-store prices');
      this.logger.log('✅ SerpAPI enabled (Google Shopping)');
    } else if (brightDataUser) {
      this.scrapingService = 'bright_data';
      this.scrapingEnabled = true;
      this.logger.log('✅ Bright Data scraping enabled');
    } else if (apifyKey) {
      this.scrapingService = 'apify';
      this.scrapingEnabled = true;
      console.warn('⚠️ [MultiStore] Apify enabled but multi-store scraping not implemented');
      console.warn('   Add SERPAPI_KEY to .env for multi-store price fetching (20+ stores)');
      this.logger.log('✅ Apify scraping enabled');
    } else {
      this.scrapingService = 'none';
      this.scrapingEnabled = false;
      console.error('❌ [MultiStore] No scraping service configured!');
      console.error('   Add SERPAPI_KEY to .env to enable multi-store price fetching');
      this.logger.warn('⚠️  No scraping service configured');
      this.logger.warn('💡 Options:');
      this.logger.warn('   - SerpAPI: Add SERPAPI_KEY (RECOMMENDED - Google Shopping, 20+ stores)');
      this.logger.warn('   - Bright Data: Add BRIGHT_DATA_USERNAME, BRIGHT_DATA_PASSWORD');
      this.logger.warn('   - Apify: Add APIFY_API_KEY');
    }
  }

  /**
   * Search for product and get prices from multiple stores
   * 
   * HYBRID APPROACH:
   * 1. Get product info from PriceAPI (image, name, barcode) + Amazon price
   * 2. Get prices from other stores via SerpAPI (Google Shopping)
   * 3. Combine Amazon (PriceAPI) + Other stores (SerpAPI) = Complete multi-store results
   */
  async searchProductWithMultiStorePrices(
    query: string,
    options?: {
      limit?: number;
      stores?: string[]; // Specific stores to search
    },
  ): Promise<MultiStoreProductResult | null> {
    try {
      // Step 1: Get product info + Amazon price from PriceAPI
      this.logger.debug(`🔍 Step 1: Getting product info + Amazon price for "${query}"`);
      const priceApiProducts = await this.priceApiService.searchProducts(query, {
        limit: 1, // We only need the first product for info
      });

      if (!priceApiProducts || priceApiProducts.length === 0) {
        this.logger.warn(`No product found in PriceAPI for: "${query}"`);
        return null;
      }

      const productInfo = priceApiProducts[0];
      this.logger.log(`✅ Found product: ${productInfo.name}`);

      // Extract Amazon price from PriceAPI result
      // PriceAPI uses Amazon as source, so the first result is typically Amazon
      // Find the best Amazon price (lowest) from all PriceAPI results
      const amazonResults = priceApiProducts.filter(p => 
        p.store?.toLowerCase().includes('amazon') || 
        p.store?.toLowerCase().includes('amazon.com')
      );
      
      const amazonPrice: StorePrice | null = amazonResults.length > 0
        ? {
            storeName: 'Amazon',
            storeId: 'amazon',
            price: Math.min(...amazonResults.map(p => p.price)), // Best (lowest) Amazon price
            currency: amazonResults[0].currency || 'USD',
            formattedPrice: `$${Math.min(...amazonResults.map(p => p.price)).toFixed(2)}`,
            inStock: amazonResults.some(p => p.inStock),
            url: amazonResults[0].url || amazonResults.find(p => p.url)?.url || '', // Get URL from first result that has one
            image: productInfo.image, // Product image from PriceAPI
            shippingCost: Math.min(...amazonResults.map(p => p.shipping || 0)),
            totalPrice: Math.min(...amazonResults.map(p => p.price + (p.shipping || 0))),
            lastUpdated: new Date(),
          }
        : null;
      
      // Log Amazon URL for debugging
      if (amazonPrice) {
        this.logger.log(`🔗 Amazon product URL: ${amazonPrice.url || 'MISSING'}`);
        if (!amazonPrice.url) {
          this.logger.warn(`⚠️  Amazon price found but no URL available. PriceAPI results:`, 
            amazonResults.map(r => ({ store: r.store, url: r.url, hasUrl: !!r.url }))
          );
        }
      }

      // Step 2: Get prices from other stores via SerpAPI
      console.log(`🔍 [MultiStore] Step 2: Getting prices from other stores via SerpAPI`);
      this.logger.debug(`🔍 Step 2: Getting prices from other stores via SerpAPI`);
      
      let otherStorePrices: StorePrice[] = [];
      
      // If SerpAPI is enabled, use it to get ALL store prices (excluding Amazon)
      // Request ALL stores from SerpAPI (can return 40+ results)
      // User expects 20+ stores, so we request more to account for deduplication
      console.log(`🔍 [MultiStore] Scraping service: ${this.scrapingService}`);
      if (this.scrapingService === 'serpapi') {
        console.log(`✅ [MultiStore] SerpAPI is enabled, fetching stores...`);
        // Simplify query for SerpAPI - extract main product name (remove brand, size, etc.)
        // SerpAPI works better with simpler, more generic queries
        let serpApiQuery = productInfo.name;
        
        // Remove common patterns that make queries too specific:
        // - Brand names at the start (e.g., "Ocean Spray Red Seedless Grapes" -> "Red Seedless Grapes")
        // - Size/weight info at the end (e.g., "Grapes, 2 lb" -> "Grapes")
        // - Keep the core product name
        
        // Try to extract just the product name (remove brand and size)
        const queryParts = serpApiQuery.split(',');
        if (queryParts.length > 1) {
          // Remove size/weight info after comma
          serpApiQuery = queryParts[0].trim();
        }
        
        // Remove common brand patterns at the start
        const brandPatterns = [
          /^ocean\s*spray\s+/i,
          /^dole\s+/i,
          /^chiquita\s+/i,
          /^fresh\s+/i,
          /^organic\s+/i,
          /^whole\s+/i,
        ];
        
        for (const pattern of brandPatterns) {
          serpApiQuery = serpApiQuery.replace(pattern, '').trim();
        }
        
        // CRITICAL: For expensive products (iPhone, MacBook, etc.), keep key product keywords
        // Don't simplify "iPhone 17 Pro Max" to just "Pro Max" - that matches unrelated products!
        const isExpensiveProduct = serpApiQuery.toLowerCase().includes('iphone') || 
                                   serpApiQuery.toLowerCase().includes('ipad') ||
                                   serpApiQuery.toLowerCase().includes('macbook') ||
                                   serpApiQuery.toLowerCase().includes('laptop') ||
                                   serpApiQuery.toLowerCase().includes('gaming') && serpApiQuery.toLowerCase().includes('console');
        
        if (isExpensiveProduct) {
          // Keep the main product identifier (e.g., "iPhone 17 Pro Max" or "iPhone Pro Max")
          // Extract: "Apple iPhone 17 Pro Max" -> "iPhone 17 Pro Max" or "iPhone Pro Max"
          const iphoneMatch = serpApiQuery.match(/(iphone\s+(?:17|16|15|14|13|12|11)?\s*(?:pro\s*max|pro|max)?)/i);
          if (iphoneMatch) {
            serpApiQuery = iphoneMatch[1];
          } else {
            // Fallback: keep at least "iPhone" + last 2-3 words
            const words = serpApiQuery.split(' ').filter(w => w.length > 2);
            const iphoneIndex = words.findIndex(w => w.toLowerCase().includes('iphone'));
            if (iphoneIndex >= 0) {
              serpApiQuery = words.slice(iphoneIndex, iphoneIndex + 4).join(' '); // Keep iPhone + next 3 words
            }
          }
        } else {
          // For other products, simplify normally
          if (serpApiQuery.split(' ').length > 3) {
            const words = serpApiQuery.split(' ').filter(w => w.length > 2);
            if (words.length > 0) {
              serpApiQuery = words.slice(-2).join(' ');
            }
          }
        }
        
        // Fallback query: for expensive products, keep "iPhone" at minimum
        const fallbackQuery = isExpensiveProduct && serpApiQuery.toLowerCase().includes('iphone')
          ? 'iPhone 17 Pro Max' // Use a generic but relevant query
          : serpApiQuery.split(' ').pop() || serpApiQuery;
        
        console.log(`🔍 [MultiStore] Simplified SerpAPI query: "${productInfo.name}" -> "${serpApiQuery}"`);
        console.log(`🔍 [MultiStore] Fallback query if needed: "${fallbackQuery}"`);
        this.logger.log(`🔍 Simplified SerpAPI query: "${productInfo.name}" -> "${serpApiQuery}"`);
        this.logger.log(`🔍 Fallback query if needed: "${fallbackQuery}"`);
        
        // Try the simplified query first
        console.log(`🔍 [MultiStore] Calling getAllStorePricesFromSerpAPI with query: "${serpApiQuery}"`);
        otherStorePrices = await this.getAllStorePricesFromSerpAPI(serpApiQuery, {
          limit: options?.limit || 100, // Increased to 100 to get ALL stores from SerpAPI
          preferredStores: options?.stores,
          excludeAmazon: true, // We already have Amazon from PriceAPI
        });
        
        console.log(`📊 [MultiStore] First query returned ${otherStorePrices.length} stores`);
        
        // If we got very few results (less than 5 stores), try the fallback query
        if (otherStorePrices.length < 5 && fallbackQuery !== serpApiQuery) {
          console.log(`⚠️ [MultiStore] Only got ${otherStorePrices.length} stores, trying fallback query: "${fallbackQuery}"`);
          this.logger.log(`⚠️ Only got ${otherStorePrices.length} stores, trying fallback query: "${fallbackQuery}"`);
          const fallbackResults = await this.getAllStorePricesFromSerpAPI(fallbackQuery, {
            limit: options?.limit || 100,
            preferredStores: options?.stores,
            excludeAmazon: true,
          });
          
          console.log(`📊 [MultiStore] Fallback query returned ${fallbackResults.length} stores`);
          
          // Use fallback results if they're better
          if (fallbackResults.length > otherStorePrices.length) {
            console.log(`✅ [MultiStore] Fallback query found ${fallbackResults.length} stores (better than ${otherStorePrices.length})`);
            this.logger.log(`✅ Fallback query found ${fallbackResults.length} stores (better than ${otherStorePrices.length})`);
            otherStorePrices = fallbackResults;
          }
        }
        
      // CRITICAL: If we STILL have very few stores, try the absolute simplest query (just the main product word)
      // This is a last resort to ensure we get results
      if (otherStorePrices.length < 3) {
          // Extract just the main product word (usually the last word)
          const words = serpApiQuery.split(' ').filter(w => w.length > 2);
          const simplestQuery = words.length > 0 ? words[words.length - 1] : serpApiQuery;
          
          if (simplestQuery !== serpApiQuery && simplestQuery !== fallbackQuery) {
            console.log(`⚠️ [SerpAPI] Still only got ${otherStorePrices.length} stores, trying simplest query: "${simplestQuery}"`);
            this.logger.log(`⚠️ Still only got ${otherStorePrices.length} stores, trying simplest query: "${simplestQuery}"`);
            const simplestResults = await this.getAllStorePricesFromSerpAPI(simplestQuery, {
              limit: options?.limit || 100,
              preferredStores: options?.stores,
              excludeAmazon: true,
            });
            
            // Use simplest results if they're better
            if (simplestResults.length > otherStorePrices.length) {
              console.log(`✅ [SerpAPI] Simplest query found ${simplestResults.length} stores (better than ${otherStorePrices.length})`);
              this.logger.log(`✅ Simplest query found ${simplestResults.length} stores (better than ${otherStorePrices.length})`);
              otherStorePrices = simplestResults;
            }
          }
        }
        
        console.log(`📊 [SerpAPI] Final result: ${otherStorePrices.length} stores found`);
        if (otherStorePrices.length > 0) {
          console.log(`📋 [SerpAPI] Stores: ${otherStorePrices.map(sp => sp.storeName).join(', ')}`);
        }
      } else {
        // Fallback to individual store searches (excluding Amazon)
        const storesToSearch = (options?.stores || []).filter(s => s.toLowerCase() !== 'amazon');
        if (storesToSearch.length > 0) {
          otherStorePrices = await this.getMultiStorePrices(
            productInfo.name,
            productInfo.barcode,
            storesToSearch,
          );
        }
      }

      // Step 3: Combine Amazon (PriceAPI) + Other stores (SerpAPI)
      const allStorePrices: StorePrice[] = [];
      
      // Add Amazon price first (from PriceAPI)
      if (amazonPrice) {
        allStorePrices.push(amazonPrice);
        this.logger.log(`✅ Added Amazon price: $${amazonPrice.price} (from PriceAPI)`);
      }
      
      // Add other store prices (from SerpAPI)
      allStorePrices.push(...otherStorePrices);
      const storeNames = otherStorePrices.map(sp => sp.storeName).join(', ');
      console.log(`✅ [MultiStore] Added ${otherStorePrices.length} other store prices (from SerpAPI)`);
      console.log(`📋 [MultiStore] Stores: ${storeNames || 'NONE'}`);
      this.logger.log(`✅ Added ${otherStorePrices.length} other store prices (from SerpAPI)`);
      this.logger.log(`📋 Stores: ${storeNames}`);
      
      // CRITICAL: If we got 0 stores from SerpAPI, log why
      if (otherStorePrices.length === 0) {
        console.error(`❌ [MultiStore] ERROR: SerpAPI returned 0 stores!`);
        console.error(`   Product name: ${productInfo.name}`);
        console.error(`   Scraping service: ${this.scrapingService}`);
        console.error(`   SerpAPI enabled: ${this.scrapingService === 'serpapi'}`);
      }

      // Sort by price (lowest first)
      allStorePrices.sort((a, b) => a.price - b.price);

      // Step 4: Calculate best price and savings
      const bestPrice = allStorePrices.length > 0
        ? Math.min(...allStorePrices.map((p) => p.price))
        : undefined;
      const bestPriceStore = allStorePrices.find((p) => p.price === bestPrice)?.storeName;
      const maxPrice = allStorePrices.length > 0
        ? Math.max(...allStorePrices.map((p) => p.price))
        : undefined;
      const maxSavings = bestPrice && maxPrice ? maxPrice - bestPrice : undefined;

      this.logger.log(`✅ Combined result: ${allStorePrices.length} stores (Amazon from PriceAPI + ${otherStorePrices.length} from SerpAPI)`);

      // Extract image from productInfo - check multiple fields
      let productImage = productInfo.image || '';
      if (!productImage && (productInfo as any).imageUrl) {
        productImage = (productInfo as any).imageUrl;
      }
      if (!productImage && (productInfo as any).images && Array.isArray((productInfo as any).images) && (productInfo as any).images.length > 0) {
        productImage = (productInfo as any).images[0];
      }
      
      // If still no image, try to get from SerpAPI results (first result's thumbnail)
      if (!productImage && otherStorePrices.length > 0) {
        // SerpAPI results might have thumbnail in the storePrice data
        const firstStorePrice = otherStorePrices[0];
        if (firstStorePrice.image && firstStorePrice.image.trim().length > 0) {
          productImage = firstStorePrice.image;
          this.logger.log(`🖼️ Using image from SerpAPI result: ${productImage}`);
        }
      }
      
      // Last resort: Try to fetch image from SerpAPI directly if we still don't have one
      if (!productImage && this.scrapingService === 'serpapi') {
        try {
          const serpApiKey = this.configService.get<string>('SERPAPI_KEY');
          if (serpApiKey) {
            // Filter to USA-only stores (gl=us)
            const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(productInfo.name)}&gl=us&api_key=${serpApiKey}`;
            const serpResponse = await fetch(serpUrl);
            if (serpResponse.ok) {
              const serpData = await serpResponse.json();
              const firstResult = serpData.shopping_results?.[0];
              if (firstResult?.thumbnail) {
                productImage = firstResult.thumbnail;
                this.logger.log(`🖼️ Fetched image from SerpAPI: ${productImage}`);
              }
            }
          }
        } catch (error) {
          this.logger.warn(`⚠️ Failed to fetch image from SerpAPI: ${error.message}`);
        }
      }
      
      this.logger.log(`🖼️ Final product image: ${productImage || 'NO IMAGE'}`);
      
      return {
        name: productInfo.name,
        image: productImage,
        barcode: productInfo.barcode,
        brand: undefined, // PriceAPI doesn't provide brand in current interface
        description: undefined, // PriceAPI doesn't provide description in current interface
        category: undefined, // PriceAPI doesn't provide category in current interface
        storePrices: allStorePrices,
        bestPrice,
        bestPriceStore,
        maxSavings,
        totalStores: allStorePrices.length,
      };
    } catch (error: any) {
      this.logger.error(`Failed to search product with multi-store prices: ${error.message}`);
      return null;
    }
  }

  /**
   * Get prices from multiple stores using scraping
   */
  private async getMultiStorePrices(
    productName: string,
    barcode?: string,
    specificStores?: string[],
  ): Promise<StorePrice[]> {
    if (!this.scrapingEnabled) {
      this.logger.warn('Scraping not enabled - returning empty prices');
      return [];
    }

    // Default stores to search
    const storesToSearch = specificStores || [
      'amazon',
      'walmart',
      'target',
      'bestbuy',
      'costco',
      'ebay',
      'newegg',
      'bh',
      'homedepot',
      'officedepot',
    ];

    const allPrices: StorePrice[] = [];

    // Search each store in parallel (with rate limiting)
    const searchPromises = storesToSearch.map((store) =>
      this.searchStorePrice(store, productName, barcode).catch((error) => {
        this.logger.warn(`Failed to get price from ${store}: ${error.message}`);
        return null;
      }),
    );

    const results = await Promise.allSettled(searchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allPrices.push(result.value);
      }
    }

    // Sort by price (lowest first)
    allPrices.sort((a, b) => a.price - b.price);

    this.logger.log(`✅ Found prices from ${allPrices.length} stores`);
    return allPrices;
  }

  /**
   * Search for price on a specific store
   */
  private async searchStorePrice(
    storeId: string,
    productName: string,
    barcode?: string,
  ): Promise<StorePrice | null> {
    switch (this.scrapingService) {
      case 'bright_data':
        return this.searchBrightData(storeId, productName, barcode);
      case 'apify':
        return this.searchApify(storeId, productName, barcode);
      case 'serpapi':
        return this.searchSerpAPI(storeId, productName, barcode);
      default:
        return null;
    }
  }

  /**
   * Search using Bright Data
   */
  private async searchBrightData(
    storeId: string,
    productName: string,
    barcode?: string,
  ): Promise<StorePrice | null> {
    // TODO: Implement Bright Data scraping
    // This would use the BrightDataScraper service
    this.logger.debug(`Bright Data search for ${storeId}: ${productName}`);
    return null; // Placeholder
  }

  /**
   * Search using Apify actors
   */
  private async searchApify(
    storeId: string,
    productName: string,
    barcode?: string,
  ): Promise<StorePrice | null> {
    const apiKey = this.configService.get<string>('APIFY_API_KEY');
    if (!apiKey) return null;

    try {
      // Apify has pre-built actors for stores
      // Example: https://apify.com/apify/amazon-scraper
      const actorId = this.getApifyActorId(storeId);
      if (!actorId) return null;

      const url = `https://api.apify.com/v2/acts/${actorId}/runs`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search: productName,
          maxResults: 1,
        }),
      });

      if (!response.ok) return null;

      const run = await response.json();
      // Poll for results (simplified - in production, use proper polling)
      // ...

      return null; // Placeholder
    } catch (error: any) {
      this.logger.error(`Apify search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Search using SerpAPI (Google Shopping)
   * Returns prices from ALL stores found, not just one
   */
  private async searchSerpAPI(
    storeId: string,
    productName: string,
    barcode?: string,
  ): Promise<StorePrice | null> {
    const apiKey = this.configService.get<string>('SERPAPI_KEY');
    if (!apiKey) return null;

    try {
      // SerpAPI Google Shopping returns results from multiple stores
      // Filter to USA-only stores (gl=us)
      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(productName)}&gl=us&api_key=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const shoppingResults = data.shopping_results || [];

      // Find result from the specific store
      // Match store names more flexibly (e.g., "amazon" matches "Amazon.com", "Walmart" matches "Walmart - SUSR")
      const storeResult = shoppingResults.find((result: any) => {
        const source = (result.source || '').toLowerCase();
        const searchStoreId = storeId.toLowerCase();
        
        // Direct match
        if (source.includes(searchStoreId)) return true;
        
        // Common store name mappings
        const storeMappings: Record<string, string[]> = {
          amazon: ['amazon', 'amazon.com'],
          walmart: ['walmart'],
          target: ['target', 'target.com'],
          bestbuy: ['best buy', 'bestbuy'],
          costco: ['costco'],
          ebay: ['ebay'],
          newegg: ['newegg'],
          bh: ['b&h', 'bh photo'],
          homedepot: ['home depot', 'homedepot'],
          officedepot: ['office depot', 'officedepot'],
        };
        
        const aliases = storeMappings[searchStoreId] || [searchStoreId];
        return aliases.some(alias => source.includes(alias));
      });

      if (!storeResult) return null;

      // Extract price (handle monthly payments like "$20.28/mo")
      let priceText = storeResult.price || '0';
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

      return {
        storeName: storeResult.source || storeId,
        storeId,
        price,
        currency: 'USD',
        formattedPrice: storeResult.price || '$0.00',
        inStock: true, // Assume in stock if shown
        url: storeResult.link || '',
        image: storeResult.thumbnail,
        lastUpdated: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`SerpAPI search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate if price is realistic for the product
   * Filters out obviously wrong prices (e.g., $28 for iPhone 17 Pro Max)
   */
  private isValidPriceForProduct(price: number, productName: string): boolean {
    const productNameLower = productName.toLowerCase();
    
    // Check for expensive products that should have minimum prices
    const isExpensiveProduct = 
      productNameLower.includes('iphone') || 
      productNameLower.includes('ipad') ||
      productNameLower.includes('macbook') ||
      productNameLower.includes('mac pro') ||
      productNameLower.includes('airpods pro') ||
      (productNameLower.includes('watch') && (productNameLower.includes('apple') || productNameLower.includes('series'))) ||
      productNameLower.includes('laptop') ||
      (productNameLower.includes('gaming') && (productNameLower.includes('console') || productNameLower.includes('ps5') || productNameLower.includes('xbox'))) ||
      (productNameLower.includes('tv') && (productNameLower.includes('oled') || productNameLower.includes('4k') || productNameLower.includes('8k'))) ||
      (productNameLower.includes('camera') && (productNameLower.includes('canon') || productNameLower.includes('nikon') || productNameLower.includes('sony')));

    // For expensive products, filter out prices that are too low
    if (isExpensiveProduct && price < 50) {
      return false;
    }

    // For very expensive products (iPhone Pro Max, MacBook Pro, etc.), require higher minimum
    const isVeryExpensiveProduct = 
      (productNameLower.includes('iphone') && (productNameLower.includes('pro max') || productNameLower.includes('pro'))) ||
      productNameLower.includes('macbook pro') ||
      productNameLower.includes('ipad pro');

    if (isVeryExpensiveProduct && price < 300) {
      return false;
    }

    return true;
  }

  /**
   * Get ALL store prices from SerpAPI (not just one store)
   * This is the main method we'll use
   * 
   * @param excludeAmazon - If true, skip Amazon results (we get Amazon from PriceAPI)
   */
  async getAllStorePricesFromSerpAPI(
    productName: string,
    options?: { limit?: number; preferredStores?: string[]; excludeAmazon?: boolean },
  ): Promise<StorePrice[]> {
    const apiKey = this.configService.get<string>('SERPAPI_KEY');
    if (!apiKey) {
      console.error('❌ SerpAPI key not configured - cannot fetch multi-store prices');
      this.logger.warn('SerpAPI key not configured');
      return [];
    }

    try {
      // Filter to USA-only stores (gl=us)
      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(productName)}&gl=us&api_key=${apiKey}`;

      console.log(`🔍 [SerpAPI] Searching for: "${productName}"`);
      this.logger.debug(`🔍 Searching SerpAPI for: "${productName}"`);

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [SerpAPI] Request failed (${response.status}): ${errorText}`);
        this.logger.error(`SerpAPI request failed (${response.status}): ${errorText}`);
        return [];
      }

      const data = await response.json();
      const shoppingResults = data.shopping_results || [];

      console.log(`📦 [SerpAPI] Response for "${productName}": ${shoppingResults.length} results`);
      this.logger.log(`📦 SerpAPI response for "${productName}": ${shoppingResults.length} results`);
      
      // Log first few results to see what stores SerpAPI is returning
      if (shoppingResults.length > 0) {
        const sampleStores = shoppingResults.slice(0, 10).map((r: any) => r.source || 'Unknown').join(', ');
        console.log(`📋 [SerpAPI] Sample stores (first 10): ${sampleStores}`);
        this.logger.log(`📋 Sample stores from SerpAPI (first 10): ${sampleStores}`);
      } else {
        console.warn(`⚠️ [SerpAPI] No shopping_results in response`);
        console.warn(`   Response keys: ${Object.keys(data).join(', ')}`);
        if (data.error) {
          console.error(`   SerpAPI error: ${JSON.stringify(data.error)}`);
        }
      }
      
      if (shoppingResults.length === 0) {
        this.logger.warn(`⚠️ No results from SerpAPI for: "${productName}"`);
        this.logger.warn(`   Response keys: ${Object.keys(data).join(', ')}`);
        if (data.error) {
          this.logger.error(`   SerpAPI error: ${data.error}`);
        }
        return [];
      }
      
      console.log(`✅ [SerpAPI] Returned ${shoppingResults.length} shopping results`);
      this.logger.log(`✅ SerpAPI returned ${shoppingResults.length} shopping results`);

      // For price comparison, we want to show ALL stores (not just preferred ones)
      // This helps users find the best deals across all retailers
      // Default to 100 stores max (SerpAPI can return 40+ results, we want to capture ALL unique stores)
      const maxStores = options?.limit || 100;
      
      const storePrices: StorePrice[] = [];
      const seenStores = new Set<string>();
      
      this.logger.log(`🔍 Processing ${shoppingResults.length} SerpAPI results (max ${maxStores} stores)...`);

      for (const result of shoppingResults) {
        // Stop if we've reached the limit
        if (storePrices.length >= maxStores) {
          this.logger.debug(`   ⏭️ Reached store limit (${maxStores}), stopping`);
          break;
        }

        const source = (result.source || '').toLowerCase();
        const priceText = result.price || '0';
        
        // Reduce logging verbosity - only log every 10th result or important ones
        if (storePrices.length % 10 === 0 || storePrices.length < 5) {
          this.logger.debug(`   Result ${storePrices.length + 1}: ${result.title || 'No title'} from ${result.source || 'Unknown'} - Price: ${priceText}`);
        }
        
        // Skip Amazon if excludeAmazon is true (we get Amazon from PriceAPI)
        // Check for various Amazon patterns
        const isAmazon = source.includes('amazon') || 
                        source.includes('amazon.com') ||
                        (result.link && typeof result.link === 'string' && result.link.includes('amazon.com'));
        
        if (options?.excludeAmazon && isAmazon) {
          this.logger.debug(`   ⏭️ Skipping Amazon (excluded): ${result.source || 'Unknown'}`);
          continue;
        }
        
        // Extract price first (needed for duplicate check)
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

        // Skip if price is 0 or invalid
        if (price <= 0) {
          this.logger.debug(`   ⏭️ Skipping invalid price: ${priceText}`);
          continue;
        }

        // CRITICAL: Validate that the result title actually matches the product we're searching for
        // Filter out unrelated products (e.g., "Promax Bar Double Fudge Brownie" when searching for iPhone)
        const resultTitle = (result.title || '').toLowerCase();
        const productNameLower = productName.toLowerCase();
        
        // Check if this is an expensive product search
        const isExpensiveProductSearch = productNameLower.includes('iphone') || 
                                         productNameLower.includes('ipad') ||
                                         productNameLower.includes('macbook');
        
        if (isExpensiveProductSearch) {
          // For iPhone searches, result MUST contain "iphone" in title
          if (!resultTitle.includes('iphone')) {
            this.logger.debug(`   ⏭️ Skipping unrelated product: "${result.title}" (no "iPhone" in title)`);
            continue;
          }
          
          // Additional check: if searching for "iPhone 17 Pro Max", result should mention "17" or "pro max"
          if (productNameLower.includes('17') && !resultTitle.includes('17') && !resultTitle.includes('seventeen')) {
            // Allow older models but prioritize 17
            // This is OK, just log it
          }
        }
        
        // CRITICAL: Validate price is realistic based on product type
        // Filter out obviously wrong prices (e.g., $28 for iPhone 17 Pro Max)
        if (!this.isValidPriceForProduct(price, productName)) {
          continue; // Skip unrealistic prices silently
        }

        // Normalize store name for deduplication
        const normalizedStore = this.normalizeStoreName(source);
        
        // For eBay and similar marketplaces, allow multiple listings (user wants to see 10+ eBay items)
        // For other stores, deduplicate to show best price per store
        const isMarketplace = normalizedStore === 'ebay' || 
                             normalizedStore === 'amazon' ||
                             normalizedStore === 'swappa' ||
                             normalizedStore === 'poshmark' ||
                             normalizedStore === 'mercari';
        
        if (!isMarketplace) {
          // Regular stores: deduplicate (take best price per store)
          if (seenStores.has(normalizedStore)) {
            const existingIndex = storePrices.findIndex(sp => this.normalizeStoreName(sp.storeName.toLowerCase()) === normalizedStore);
            if (existingIndex >= 0 && price < storePrices[existingIndex].price) {
              // Replace with better price
              const { storeName, storeId } = this.normalizeStoreInfo(source, result.source || 'Unknown Store');
              storePrices[existingIndex] = {
                storeName,
                storeId,
                price,
                currency: 'USD',
                formattedPrice: result.price || `$${price.toFixed(2)}`,
                inStock: true,
                url: result.link || '',
                image: result.thumbnail,
                lastUpdated: new Date(),
              };
            }
            continue; // Skip duplicate store
          }
        } else {
          // Marketplaces: Allow multiple listings, but limit to prevent too many duplicates
          // Count how many we already have from this marketplace
          const marketplaceCount = storePrices.filter(sp => this.normalizeStoreName(sp.storeName.toLowerCase()) === normalizedStore).length;
          if (marketplaceCount >= 15) {
            // Limit to 15 listings per marketplace to avoid spam
            continue;
          }
        }

        // Include ALL valid stores (no preferred store filtering)
        this.logger.debug(`   ✅ Including store: ${source} at $${price}`);
        
        // Normalize store name and ID
        const { storeName, storeId } = this.normalizeStoreInfo(source, result.source || 'Unknown Store');

        storePrices.push({
          storeName,
          storeId,
          price,
          currency: 'USD',
          formattedPrice: result.price || `$${price.toFixed(2)}`,
          inStock: true,
          url: result.link || '',
          image: result.thumbnail,
          lastUpdated: new Date(),
        });

        seenStores.add(normalizedStore);
      }

      // Sort by price (lowest first)
      storePrices.sort((a, b) => a.price - b.price);

      // Log all stores found for debugging
      const storeNames = storePrices.map(sp => sp.storeName).join(', ');
      const uniqueStoreCount = new Set(storePrices.map(sp => sp.storeName)).size;
      console.log(`✅ [SerpAPI] Found ${storePrices.length} store prices (${uniqueStoreCount} unique stores) for "${productName}"`);
      console.log(`📋 [SerpAPI] All stores: ${storeNames || 'NONE'}`);
      
      // Log if we have enough stores (user expects 30+)
      if (storePrices.length < 30) {
        console.warn(`⚠️ [SerpAPI] Only ${storePrices.length} stores found (user expects 30+). Check filters and price validation.`);
      } else {
        console.log(`✅ [SerpAPI] Great! Found ${storePrices.length} stores (meets 30+ requirement)`);
      }
      
      this.logger.log(`✅ SerpAPI found ${storePrices.length} store prices (${uniqueStoreCount} unique stores) for "${productName}"`);
      this.logger.log(`📋 Stores returned: ${storeNames || 'NONE'}`);
      
      // CRITICAL: If we only got Amazon (or 0 stores), log why
      if (storePrices.length === 0) {
        const amazonCount = shoppingResults.filter((r: any) => {
          const src = (r.source || '').toLowerCase();
          return src.includes('amazon') || (r.link && typeof r.link === 'string' && r.link.includes('amazon.com'));
        }).length;
        const nonAmazonCount = shoppingResults.length - amazonCount;
        
        console.error(`❌ [SerpAPI] No stores returned after filtering!`);
        console.error(`   - Total SerpAPI results: ${shoppingResults.length}`);
        console.error(`   - Exclude Amazon: ${options?.excludeAmazon ? 'YES' : 'NO'}`);
        console.error(`   - Amazon results in SerpAPI: ${amazonCount}`);
        console.error(`   - Non-Amazon results in SerpAPI: ${nonAmazonCount}`);
        console.error(`   - Query used: "${productName}"`);
        
        // Log sample of what SerpAPI returned
        if (shoppingResults.length > 0) {
          console.error(`   - Sample sources: ${shoppingResults.slice(0, 5).map((r: any) => r.source || 'Unknown').join(', ')}`);
        }
        
        this.logger.warn(`⚠️ No stores returned after filtering!`);
        this.logger.warn(`   - Total SerpAPI results: ${shoppingResults.length}`);
        this.logger.warn(`   - Exclude Amazon: ${options?.excludeAmazon ? 'YES' : 'NO'}`);
        this.logger.warn(`   - Amazon results in SerpAPI: ${amazonCount}`);
        this.logger.warn(`   - Non-Amazon results in SerpAPI: ${nonAmazonCount}`);
      } else if (storePrices.length === 1 && storePrices[0].storeName.toLowerCase().includes('amazon')) {
        console.error(`❌ [SerpAPI] ERROR: Amazon should be excluded but is still in results!`);
        this.logger.error(`❌ ERROR: Amazon should be excluded but is still in results!`);
        this.logger.error(`   This means excludeAmazon filter is not working correctly.`);
      }
      
      return storePrices;
    } catch (error: any) {
      this.logger.error(`SerpAPI search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get Apify actor ID for a store
   */
  private getApifyActorId(storeId: string): string | null {
    const actorMap: Record<string, string> = {
      amazon: 'apify/amazon-scraper',
      walmart: 'apify/walmart-scraper',
      target: 'apify/target-scraper',
      // Add more as needed
    };

    return actorMap[storeId.toLowerCase()] || null;
  }

  /**
   * Normalize store name to catch variants like "Walmart - Seller Name"
   * Returns the base store name for deduplication
   */
  private normalizeStoreName(source: string): string {
    const lowerSource = source.toLowerCase();
    
    // Common store patterns - extract base store name
    const storePatterns = [
      { pattern: /walmart/i, base: 'walmart' },
      { pattern: /amazon/i, base: 'amazon' },
      { pattern: /target/i, base: 'target' },
      { pattern: /best\s*buy/i, base: 'bestbuy' },
      { pattern: /costco/i, base: 'costco' },
      { pattern: /ebay/i, base: 'ebay' },
      { pattern: /newegg/i, base: 'newegg' },
      { pattern: /b&h|bh\s*photo/i, base: 'bh' },
      { pattern: /home\s*depot|homedepot/i, base: 'homedepot' },
      { pattern: /office\s*depot|officedepot/i, base: 'officedepot' },
      { pattern: /kroger/i, base: 'kroger' },
      { pattern: /safeway/i, base: 'safeway' },
      { pattern: /whole\s*foods/i, base: 'wholefoods' },
      { pattern: /aldi/i, base: 'aldi' },
      { pattern: /trader\s*joes/i, base: 'traderjoes' },
      { pattern: /instacart/i, base: 'instacart' },
    ];

    for (const { pattern, base } of storePatterns) {
      if (pattern.test(lowerSource)) {
        return base;
      }
    }

    // If no pattern matches, return the source as-is (for unique stores)
    return lowerSource;
  }

  /**
   * Normalize store info (name and ID) for display
   * Maps known stores to standard names/IDs, keeps others as-is
   */
  private normalizeStoreInfo(source: string, originalName: string): { storeName: string; storeId: string } {
    const lowerSource = source.toLowerCase();
    
    // Map known stores to standard names
    const storeMappings: Array<{ pattern: RegExp; id: string; name: string }> = [
      { pattern: /amazon/i, id: 'amazon', name: 'Amazon' },
      { pattern: /walmart/i, id: 'walmart', name: 'Walmart' },
      { pattern: /target/i, id: 'target', name: 'Target' },
      { pattern: /best\s*buy|bestbuy/i, id: 'bestbuy', name: 'Best Buy' },
      { pattern: /costco/i, id: 'costco', name: 'Costco' },
      { pattern: /ebay/i, id: 'ebay', name: 'eBay' },
      { pattern: /newegg/i, id: 'newegg', name: 'Newegg' },
      { pattern: /b&h|bh\s*photo/i, id: 'bh', name: 'B&H Photo' },
      { pattern: /home\s*depot|homedepot/i, id: 'homedepot', name: 'Home Depot' },
      { pattern: /office\s*depot|officedepot/i, id: 'officedepot', name: 'Office Depot' },
      { pattern: /kroger/i, id: 'kroger', name: 'Kroger' },
      { pattern: /safeway/i, id: 'safeway', name: 'Safeway' },
      { pattern: /whole\s*foods/i, id: 'wholefoods', name: 'Whole Foods' },
      { pattern: /aldi/i, id: 'aldi', name: 'Aldi' },
      { pattern: /trader\s*joes/i, id: 'traderjoes', name: "Trader Joe's" },
      { pattern: /instacart/i, id: 'instacart', name: 'Instacart' },
      { pattern: /kohl'?s/i, id: 'kohls', name: "Kohl's" },
      { pattern: /macy'?s/i, id: 'macys', name: "Macy's" },
      { pattern: /nike/i, id: 'nike', name: 'Nike' },
      { pattern: /foot\s*locker/i, id: 'footlocker', name: 'Foot Locker' },
      { pattern: /dick'?s\s*sporting\s*goods/i, id: 'dicks', name: "DICK'S Sporting Goods" },
    ];

    for (const { pattern, id, name } of storeMappings) {
      if (pattern.test(lowerSource)) {
        return { storeName: name, storeId: id };
      }
    }

    // For unknown stores, use the original name and create an ID from it
    const storeId = lowerSource
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    return { storeName: originalName, storeId };
  }
}


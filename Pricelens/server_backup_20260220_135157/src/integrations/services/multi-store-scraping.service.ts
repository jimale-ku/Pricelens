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
  private readonly scrapingService: 'bright_data' | 'apify' | 'serpapi' | 'serper' | 'none';
  private readonly serperApiKey: string;

  /**
   * USA-only store names/patterns (allowlist).
   * Only stores matching these are included when filtering for USA.
   */
  private readonly USA_STORE_PATTERNS = [
    'amazon.com', 'amazon ', 'walmart', 'target', 'best buy', 'bestbuy', 'costco',
    "sam's club", 'sams club', 'samsclub',
    'albertsons', 'giant food', 'giant eagle', 'meijer', 'instacart', 'jewel osco',
    'tom thumb', 'lowes foods', 'food lion', 'harris teeter', 'stop & shop', 'stop and shop',
    'wegmans', 'publix', 'whole foods', 'wholefoods', 'trader joe', 'traderjoe', 'aldi', 'sprouts',
    'weee', 'good eggs', 'fresh direct', 'freshcentral', 'county market', 'azure standard',
    'home depot', 'homedepot', 'lowes', 'kroger', 'safeway', 'ebay', "macy's", 'macys',
    'nordstrom', 'jcpenney', "j.c. penney", 'kohl', 'bed bath', 'bedbath', 'wayfair',
    'overstock', 'newegg', 'micro center', 'microcenter', 'office depot', 'officedepot',
    'staples', 'officemax', 'petco', 'petsmart', "dick's", 'dicks', 'rei', 'bass pro',
    'basspro', 'cabelas', 'gamestop', 'ulta', 'quill', 'uline', 'fedex office',
    'container store', 'bh photo', 'b&h', 'walgreens', 'cvs', 'rite aid',
    'dollar general', 'dollargeneral', 'dollar tree', 'dollartree', 'family dollar',
    'ace hardware', 'true value', 'napa auto', 'autozone', 'o\'reilly', 'oreilly',
    'advance auto', 'pep boys', 'nordstrom rack', 'tj maxx', 'marshalls', 'homegoods',
    'ross ', 'burlington', 'big lots', 'five below', 'at home', 'ikea', 'crate and barrel',
    'williams-sonoma', 'pottery barn', 'west elm', 'anthropologie', 'urban outfitters',
    // US electronics / audio retailers
    'sweetwater', 'jlab', 'soundcore', 'bose', 'monoprice', 'wyze', 'redragon',
    'audio advisor', 'tozo', 'focus camera', 'stones ace', 'ugreen',
    // US grocery / produce / delivery (Serper often returns these)
    'melissa\'s', 'melissas', 'miami fruit', 'miamifruit', 'bevmo', 'locavore', 'cooklist',
    'schnuck', 'thrive market', 'central market', 'hannaford', 'brookshires', 'gopuff',
    'food depot', 'the orchard', 'wilson farm', 'lambs fresh', 'fresh central', 'nude foods',
    'iheartfruit', 'fresh by 4roots', 'kesar grocery', 'monika\'s organics', 'farm to people',
    'pure & good', 'suji fresh', 'concord market', 'super1foods', 'golden door', 'foodservicedirect',
    'tootyfruity', 'round eye', 'officecrave',
  ];

  /**
   * Non-USA patterns to exclude (e.g. international Amazon/localized stores).
   */
  private readonly NON_USA_PATTERNS = [
    '.co.uk', '.de', '.fr', '.it', '.es', '.ca', '.com.br', '.com.mx', '.in', '.co.jp',
    'amazon.co.', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.ca',
    'ebay.co.uk', 'ebay.de', 'ebay.fr', 'aliexpress', 'alibaba', 'wish.com',
  ];

  /**
   * Returns true if the store is considered a USA store (for price comparison).
   * Used to filter so only USA store prices are returned.
   * Exposed for use by products.service when building product lists.
   */
  isUSAStore(storeName: string): boolean {
    if (!storeName || typeof storeName !== 'string') return false;
    const name = storeName.toLowerCase().trim();
    for (const pattern of this.NON_USA_PATTERNS) {
      if (name.includes(pattern.toLowerCase())) return false;
    }
    for (const pattern of this.USA_STORE_PATTERNS) {
      if (name.includes(pattern.toLowerCase())) return true;
    }
    // Allow generic "Amazon" / "Walmart" etc. without domain
    if (name.startsWith('amazon') || name === 'amazon') return true;
    if (name.startsWith('walmart') || name === 'walmart') return true;
    if (name.startsWith('target') || name === 'target') return true;
    if (name.startsWith('ebay') || name === 'ebay') return true;
    if (name.startsWith('costco') || name === 'costco') return true;
    if (name.startsWith('best buy') || name.startsWith('bestbuy')) return true;
    if (name.startsWith('home depot') || name.startsWith('homedepot')) return true;
    if (name.startsWith('lowes')) return true;
    if (name.startsWith('kroger')) return true;
    if (name.startsWith('newegg')) return true;
    if (name.includes("sam's") || name.includes('sams club')) return true;
    if (name.startsWith('albertsons')) return true;
    if (name.includes('giant food') || name.includes('giant eagle')) return true;
    if (name.startsWith('meijer')) return true;
    if (name.startsWith('instacart')) return true;
    if (name.includes('jewel osco')) return true;
    if (name.includes('tom thumb')) return true;
    if (name.includes('lowes foods')) return true;
    if (name.includes('food lion')) return true;
    // Unknown store: exclude to be safe (USA-only)
    return false;
  }

  /**
   * Get priority score for well-known US stores (lower number = higher priority)
   * Well-known stores should appear first, then sorted by price within each priority group
   */
  private getStorePriority(storeName: string): number {
    const name = storeName.toLowerCase().trim();
    
    // Tier 1: Top-tier US retailers (highest priority - 0-9)
    if (name.includes('amazon')) return 1;
    if (name.includes('walmart')) return 2;
    if (name.includes('target')) return 3;
    if (name.includes('best buy') || name.includes('bestbuy')) return 4;
    if (name.includes('costco')) return 5;
    if (name.includes('home depot') || name.includes('homedepot')) return 6;
    if (name.includes('lowes')) return 7;
    if (name.includes('kroger')) return 8;
    if (name.includes('safeway')) return 9;
    
    // Tier 2: Major US retailers (10-19)
    if (name.includes('ebay')) return 10;
    if (name.includes('macys') || name.includes("macy's")) return 11;
    if (name.includes('nordstrom')) return 12;
    if (name.includes('jcpenney') || name.includes("j.c. penney")) return 13;
    if (name.includes('kohl')) return 14;
    if (name.includes('bed bath') || name.includes('bedbath')) return 15;
    if (name.includes('wayfair')) return 16;
    if (name.includes('overstock')) return 17;
    if (name.includes('newegg')) return 18;
    if (name.includes('micro center') || name.includes('microcenter')) return 19;
    
    // Tier 3: Other well-known US stores (20-29)
    if (name.includes('office depot') || name.includes('officedepot')) return 20;
    if (name.includes('staples')) return 21;
    if (name.includes('officemax')) return 22;
    if (name.includes('petco')) return 23;
    if (name.includes('petsmart')) return 24;
    if (name.includes('dicks') || name.includes("dick's")) return 25;
    if (name.includes('rei')) return 26;
    if (name.includes('bass pro') || name.includes('basspro')) return 27;
    if (name.includes('cabelas')) return 28;
    if (name.includes('gamestop')) return 29;
    if (name.includes('ulta')) return 30;
    
    // Tier 4: Regional/Other stores (31-40)
    if (name.includes('quill')) return 31;
    if (name.includes('uline')) return 32;
    if (name.includes('fedex office')) return 33;
    if (name.includes('container store')) return 34;
    if (name.includes('publix')) return 35;
    if (name.includes('wegmans')) return 36;
    if (name.includes('whole foods') || name.includes('wholefoods')) return 37;
    if (name.includes('trader joe') || name.includes('traderjoe')) return 38;
    if (name.includes('aldi')) return 39;
    if (name.includes('sprouts')) return 40;
    
    // Default: Unknown/Other stores (lowest priority - 100+)
    return 100;
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly priceApiService: PriceApiService,
  ) {
    // Check which scraping service is configured
    // Priority: SerpAPI > Serper > Bright Data > Apify
    const brightDataUser = this.configService.get<string>('BRIGHT_DATA_USERNAME');
    const apifyKey = this.configService.get<string>('APIFY_API_KEY');
    const serpApiKey = this.configService.get<string>('SERPAPI_KEY');
    const serperApiKey = this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY || '';
    this.serperApiKey = serperApiKey; // Only use explicit SERPER_API_KEY, not SERPAPI_KEY

    // Priority: SerpAPI (serpapi.com) > Serper (serper.dev) > Bright Data > Apify
    if (serpApiKey) {
      this.scrapingService = 'serpapi';
      this.scrapingEnabled = true;
      console.log('✅ [MultiStore] SerpAPI enabled (Google Shopping) - BEST for multi-store prices');
      this.logger.log('✅ SerpAPI enabled (Google Shopping)');
    } else if (this.serperApiKey) {
      this.scrapingService = 'serper';
      this.scrapingEnabled = true;
      console.log('✅ [MultiStore] Serper Shopping enabled (Google Shopping) - multi-store prices');
      this.logger.log('✅ Serper Shopping enabled (Google Shopping)');
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
      console.error('   Add SERPER_API_KEY or SERPAPI_KEY to .env to enable multi-store price fetching');
      this.logger.warn('⚠️  No scraping service configured');
      this.logger.warn('💡 Options:');
      this.logger.warn('   - Serper: Add SERPER_API_KEY or SERPAPI_KEY (Google Shopping via serper.dev)');
      this.logger.warn('   - SerpAPI: Add SERPAPI_KEY (serpapi.com - different from Serper)');
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
      // Use Serper or SerpAPI for Google Shopping (multi-store prices)
      const apiLabel = this.scrapingService === 'serper' ? 'Serper' : 'SerpAPI';
      console.log(`ℹ️ Using ${apiLabel} for "${query}" (multi-store prices)`);
      this.logger.log(`ℹ️ Using ${apiLabel} for "${query}" (multi-store prices)`);
      
      // Get ALL store prices from SerpAPI (including Amazon)
      const allStorePrices = await this.getAllStorePricesFromSerpAPI(query, {
        limit: options?.limit || 100, // Get up to 100 stores
        preferredStores: options?.stores,
        excludeAmazon: false, // Include Amazon from SerpAPI
      });
      
      if (!allStorePrices || allStorePrices.length === 0) {
        this.logger.warn(`No stores found for: "${query}"`);
        return null;
      }
      
      // Get product info from first SerpAPI result
      const firstStore = allStorePrices[0];
      const productInfo = {
        name: query, // Use query as product name
        image: firstStore.image || '',
        barcode: undefined,
      };
      
      // Calculate best price and savings from all stores
      const bestPrice = allStorePrices.length > 0
        ? Math.min(...allStorePrices.map((p) => p.price))
        : undefined;
      const bestPriceStore = allStorePrices.find((p) => p.price === bestPrice)?.storeName;
      const maxPrice = allStorePrices.length > 0
        ? Math.max(...allStorePrices.map((p) => p.price))
        : undefined;
      const maxSavings = bestPrice && maxPrice ? maxPrice - bestPrice : undefined;

      // Sort by store priority (well-known stores first) then by price
      allStorePrices.sort((a, b) => {
        const priorityA = this.getStorePriority(a.storeName);
        const priorityB = this.getStorePriority(b.storeName);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB; // Lower priority number = higher priority
        }
        
        // If same priority, sort by price (lowest first)
        return a.price - b.price;
      });

      // Extract image from first store price (SerpAPI results include images)
      let productImage = allStorePrices[0]?.image || '';
      
      // If no image, try to fetch from Serper or SerpAPI
      if (!productImage && (this.scrapingService === 'serper' || this.scrapingService === 'serpapi')) {
        try {
          if (this.scrapingService === 'serpapi') {
            const serpApiKey = this.configService.get<string>('SERPAPI_KEY');
            if (serpApiKey) {
              const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=us&num=100&api_key=${serpApiKey}`;
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
          } else if (this.scrapingService === 'serper' && this.serperApiKey) {
            const serperResults = await this.fetchSerperShopping(query);
            const first = serperResults[0] as any;
            if (first?.thumbnail) {
              productImage = first.thumbnail;
              this.logger.log(`🖼️ Fetched image from Serper: ${productImage}`);
            }
          }
        } catch (error: any) {
          this.logger.warn(`⚠️ Failed to fetch image: ${error?.message || error}`);
        }
      }

      this.logger.log(`✅ Found ${allStorePrices.length} stores for: "${query}"`);
      console.log(`✅ Found ${allStorePrices.length} stores: ${allStorePrices.slice(0, 10).map(sp => sp.storeName).join(', ')}${allStorePrices.length > 10 ? '...' : ''}`);
      
      return {
        name: productInfo.name,
        image: productImage,
        barcode: productInfo.barcode,
        brand: undefined,
        description: undefined,
        category: undefined,
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
   * Search using Serper or SerpAPI (Google Shopping)
   * Returns price from the requested store if found.
   */
  private async searchSerpAPI(
    storeId: string,
    productName: string,
    barcode?: string,
  ): Promise<StorePrice | null> {
    const useSerpAPI = this.scrapingService === 'serpapi';
    const useSerper = this.scrapingService === 'serper';
    if (!useSerper && !useSerpAPI) return null;

    try {
      let shoppingResults: any[];
      if (useSerpAPI) {
        const apiKey = this.configService.get<string>('SERPAPI_KEY');
        const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(productName)}&gl=us&num=100&api_key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        shoppingResults = data.shopping_results || [];
      } else if (useSerper) {
        shoppingResults = await this.fetchSerperShopping(productName);
      } else {
        return null;
      }

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
          staples: ['staples'],
          officemax: ['officemax', 'office max'],
          quill: ['quill'],
          uline: ['uline'],
          fedexoffice: ['fedex office', 'fedexoffice'],
          containerstore: ['container store', 'containerstore'],
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

    // iPhone Pro Max should be at least $600 (even used/refurbished)
    // iPhone Pro should be at least $500
    // Regular iPhone should be at least $300
    // CRITICAL: These are hard minimums - if price is below, it's definitely wrong product
    if (productNameLower.includes('iphone')) {
      if (productNameLower.includes('pro max')) {
        if (price < 600) {
          this.logger.warn(`   ⏭️ REJECTING iPhone Pro Max price: $${price} (minimum: $600) - product: "${productName}"`);
          console.warn(`   ⚠️ [Price Validation] REJECTING iPhone Pro Max price $${price} (minimum: $600) for product: "${productName}"`);
          return false;
        }
      } else if (productNameLower.includes('pro') && !productNameLower.includes('max')) {
        if (price < 500) {
          this.logger.warn(`   ⏭️ REJECTING iPhone Pro price: $${price} (minimum: $500) - product: "${productName}"`);
          console.warn(`   ⚠️ [Price Validation] REJECTING iPhone Pro price $${price} (minimum: $500) for product: "${productName}"`);
          return false;
        }
      } else {
        // Regular iPhone (not Pro)
        if (price < 300) {
          this.logger.warn(`   ⏭️ REJECTING iPhone price: $${price} (minimum: $300) - product: "${productName}"`);
          console.warn(`   ⚠️ [Price Validation] REJECTING iPhone price $${price} (minimum: $300) for product: "${productName}"`);
          return false;
        }
      }
    } else if (isVeryExpensiveProduct && price < 300) {
      this.logger.warn(`   ⏭️ REJECTING expensive product price: $${price} (minimum: $300) - product: "${productName}"`);
      console.warn(`   ⚠️ [Price Validation] REJECTING expensive product price $${price} (minimum: $300) for product: "${productName}"`);
      return false;
    }

    // Office supply price validation
    // Printers should be at least $50 (even basic models)
    if (productNameLower.includes('printer') && !productNameLower.includes('ink') && !productNameLower.includes('toner') && !productNameLower.includes('cartridge')) {
      if (price < 50) {
        this.logger.warn(`   ⏭️ REJECTING printer price: $${price} (minimum: $50) - product: "${productName}"`);
        console.warn(`   ⚠️ [Price Validation] REJECTING printer price $${price} (minimum: $50) for product: "${productName}"`);
        return false;
      }
    }
    
    // Scanners should be at least $50
    if (productNameLower.includes('scanner') && !productNameLower.includes('document') && !productNameLower.includes('sheet')) {
      if (price < 50) {
        this.logger.warn(`   ⏭️ REJECTING scanner price: $${price} (minimum: $50) - product: "${productName}"`);
        console.warn(`   ⚠️ [Price Validation] REJECTING scanner price $${price} (minimum: $50) for product: "${productName}"`);
        return false;
      }
    }
    
    // Office chairs should be at least $30
    if (productNameLower.includes('office chair') || (productNameLower.includes('chair') && productNameLower.includes('office'))) {
      if (price < 30) {
        this.logger.warn(`   ⏭️ REJECTING office chair price: $${price} (minimum: $30) - product: "${productName}"`);
        console.warn(`   ⚠️ [Price Validation] REJECTING office chair price $${price} (minimum: $30) for product: "${productName}"`);
        return false;
      }
    }
    
    // File cabinets should be at least $40
    if (productNameLower.includes('file cabinet') || (productNameLower.includes('cabinet') && productNameLower.includes('file'))) {
      if (price < 40) {
        this.logger.warn(`   ⏭️ REJECTING file cabinet price: $${price} (minimum: $40) - product: "${productName}"`);
        console.warn(`   ⚠️ [Price Validation] REJECTING file cabinet price $${price} (minimum: $40) for product: "${productName}"`);
        return false;
      }
    }
    
    // Desks should be at least $50
    if (productNameLower.includes('desk') && !productNameLower.includes('organizer') && !productNameLower.includes('pad')) {
      if (price < 50) {
        this.logger.warn(`   ⏭️ REJECTING desk price: $${price} (minimum: $50) - product: "${productName}"`);
        console.warn(`   ⚠️ [Price Validation] REJECTING desk price $${price} (minimum: $50) for product: "${productName}"`);
        return false;
      }
    }
    
    // Mattress price validation
    // Mattresses should be at least $50 (even basic/cheap mattresses)
    // Mattress toppers/pads can be cheaper, so allow those
    if (productNameLower.includes('mattress') && 
        !productNameLower.includes('topper') && 
        !productNameLower.includes('pad') && 
        !productNameLower.includes('protector') && 
        !productNameLower.includes('cover')) {
      if (price < 50) {
        this.logger.warn(`   ⏭️ REJECTING mattress price: $${price} (minimum: $50) - product: "${productName}"`);
        console.warn(`   ⚠️ [Price Validation] REJECTING mattress price $${price} (minimum: $50) for product: "${productName}"`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get ALL store prices from SerpAPI (not just one store)
   * This is the main method we'll use
   * 
   * @param excludeAmazon - If true, skip Amazon results (we get Amazon from PriceAPI)
   */
  /**
   * Fetch Google Shopping results from Serper (google.serper.dev/shopping).
   * Returns array in same shape as SerpAPI shopping_results for reuse of parsing logic.
   */
  private async fetchSerperShopping(productName: string): Promise<any[]> {
    const res = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: {
        'X-API-KEY': this.serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: productName,
        gl: 'us',
        num: 100,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Serper Shopping request failed (${res.status}): ${text}`);
      return [];
    }
    const data = await res.json();
    const shopping = data.shopping || [];
    // Normalize to SerpAPI-like shape: { title, source, price, link, thumbnail }
    return shopping.map((r: any) => ({
      title: r.title,
      source: r.source || r.merchant || 'Unknown',
      price: r.price || r.extractedPrice || '',
      link: r.link,
      thumbnail: r.image,
    }));
  }

  async getAllStorePricesFromSerpAPI(
    productName: string,
    options?: { limit?: number; preferredStores?: string[]; excludeAmazon?: boolean },
  ): Promise<StorePrice[]> {
    const useSerpAPI = this.scrapingService === 'serpapi';
    const useSerper = this.scrapingService === 'serper';
    const apiKey = this.configService.get<string>('SERPAPI_KEY');
    
    if (!useSerper && !useSerpAPI) {
      console.error('❌ No Serper or SerpAPI key configured - cannot fetch multi-store prices');
      this.logger.warn('Serper/SerpAPI key not configured');
      return [];
    }

    try {
      let shoppingResults: any[] = [];

      if (useSerpAPI) {
        const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(productName)}&gl=us&num=100&api_key=${apiKey}`;
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
        shoppingResults = data.shopping_results || [];
      } else if (useSerper) {
        console.log(`🔍 [Serper] Searching for: "${productName}"`);
        this.logger.debug(`🔍 Searching Serper Shopping for: "${productName}"`);
        shoppingResults = await this.fetchSerperShopping(productName);
        if (shoppingResults.length === 0) {
          this.logger.warn(`⚠️ No results from Serper for: "${productName}"`);
          return [];
        }
        console.log(`📦 [Serper] Response for "${productName}": ${shoppingResults.length} results`);
      } else {
        // This shouldn't happen due to the check above, but TypeScript needs this
        console.error('❌ Neither SerpAPI nor Serper is configured');
        return [];
      }

      const apiLabel = useSerpAPI ? 'SerpAPI' : 'Serper';
      console.log(`📦 [${apiLabel}] Response for "${productName}": ${shoppingResults.length} results`);
      this.logger.log(`📦 ${apiLabel} response for "${productName}": ${shoppingResults.length} results`);

      if (shoppingResults.length > 0) {
        const sampleStores = shoppingResults.slice(0, 10).map((r: any) => r.source || 'Unknown').join(', ');
        console.log(`📋 [${apiLabel}] Sample stores (first 10): ${sampleStores}`);
        this.logger.log(`📋 Sample stores from ${apiLabel} (first 10): ${sampleStores}`);
      }

      if (shoppingResults.length === 0) {
        this.logger.warn(`⚠️ No results from ${apiLabel} for: "${productName}"`);
        return [];
      }

      console.log(`✅ [${apiLabel}] Returned ${shoppingResults.length} shopping results`);
      this.logger.log(`✅ ${apiLabel} returned ${shoppingResults.length} shopping results`);

      // For price comparison, we want to show ALL stores (not just preferred ones)
      // This helps users find the best deals across all retailers
      // Default to 100 stores max (SerpAPI can return 40+ results, we want to capture ALL unique stores)
      const maxStores = options?.limit || 100;
      
      const storePrices: StorePrice[] = [];
      const seenStores = new Set<string>();
      
      // OPTIMIZATION: Calculate productNameLower ONCE before the loop (not on every iteration)
      const productNameLower = productName.toLowerCase();
      
      // OPTIMIZATION: Pre-calculate product keywords ONCE before the loop
      const productKeywords = productNameLower
        .split(/\s+/)
        .filter(word => word.length > 1 && !['for', 'the', 'and', 'or', 'with', 'in', 'on', 'at'].includes(word));
      
      // OPTIMIZATION: Pre-calculate product type checks ONCE
      // NOTE: Printers, scanners, and office supplies are NOT electronics for filtering purposes
      // They need flexible matching, not strict electronics matching
      const isElectronics = (productNameLower.includes('iphone') || 
                            productNameLower.includes('samsung') || 
                            productNameLower.includes('galaxy') ||
                            productNameLower.includes('laptop') ||
                            productNameLower.includes('tablet') ||
                            productNameLower.includes('tv') ||
                            productNameLower.includes('television')) &&
                            // Exclude office supplies from electronics strict matching
                            !productNameLower.includes('printer') &&
                            !productNameLower.includes('scanner') &&
                            !productNameLower.includes('stapler');
      
      this.logger.log(`🔍 Processing ${shoppingResults.length} ${apiLabel} results (max ${maxStores} stores) for product: "${productName}"...`);
      console.log(`🔍 [${apiLabel}] Processing ${shoppingResults.length} results for product: "${productName}"`);

      for (const result of shoppingResults) {
        // Stop if we've reached the limit
        if (storePrices.length >= maxStores) {
          this.logger.debug(`   ⏭️ Reached store limit (${maxStores}), stopping`);
          break;
        }
        const resultTitle = (result.title || '').toLowerCase();
        const source = (result.source || '').toLowerCase();
        const priceText = result.price || '0';
        
        // USA-only: include only stores that are known USA retailers
        if (!this.isUSAStore(result.source || result.link || '')) {
          this.logger.debug(`   ⏭️ Skipping non-USA store: ${result.source || 'Unknown'}`);
          continue;
        }
        
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
        // CRITICAL: Handle monthly payments - if price text contains "/mo" or "/month", it's likely a payment plan
        // For expensive products, monthly payments are misleading (e.g., "$28/mo" for iPhone)
        const isMonthlyPayment = priceText.toLowerCase().includes('/mo') || 
                                 priceText.toLowerCase().includes('/month') ||
                                 priceText.toLowerCase().includes('monthly');
        
        if (isMonthlyPayment && productNameLower.includes('iphone')) {
          // For iPhones, skip monthly payment plans - they're misleading
          // The actual phone price is much higher than the monthly payment
          this.logger.debug(`   ⏭️ Skipping monthly payment plan: "${result.title}" - ${priceText} (not the actual phone price)`);
          continue;
        }
        
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

        // Skip if price is 0 or invalid
        if (price <= 0) {
          this.logger.debug(`   ⏭️ Skipping invalid price: ${priceText}`);
          continue;
        }

        // CRITICAL: Validate that the result title actually matches the product we're searching for
        // This is the KEY fix - we must ensure prices belong to the CORRECT product
        
        // OPTIMIZATION: productKeywords already calculated before the loop
        
        // CRITICAL: Filter out accessories (cases, covers, screen protectors, etc.)
        // When the search IS for a charger/cable/adapter, do NOT filter those out.
        const productIsChargerOrCable = /\b(charger|charging|cable|adapter|power adapter|wall charger|usb-c charger|gan charger)\b/i.test(productNameLower);
        const accessoryKeywordsBase = ['case', 'cover', 'screen protector', 'protector', 'tempered glass',
                                       'skin', 'sticker', 'stand', 'holder', 'mount', 'grip', 'ring', 'pop socket', 'wallet', 'holster',
                                       'bumper', 'frame', 'shell', 'sleeve', 'pouch', 'bag', 'strap', 'lanyard',
                                       'accessory', 'accessories', 'parts', 'repair', 'replacement'];
        const accessoryKeywords = productIsChargerOrCable
          ? accessoryKeywordsBase
          : [...accessoryKeywordsBase, 'charger', 'cable', 'adapter', 'dock'];
        const officeAccessoryKeywords = ['ink cartridge', 'ink', 'toner', 'printer paper', 'paper',
                                        'refill', 'cartridge', 'ribbon', 'label', 'sticker', 'tape',
                                        'pen refill', 'pencil lead', 'eraser', 'correction tape',
                                        'binder insert', 'sheet protector', 'divider'];
        const isAccessory = accessoryKeywords.some(keyword => resultTitle.includes(keyword));
        
        // For office supplies, check if result is an accessory (e.g., ink when searching for printer)
        // RELAXED: Be less strict for office supplies to avoid filtering out valid stores
        const isOfficeAccessory = (() => {
          // If searching for printer, filter out accessories but NOT actual printers
          if (productNameLower.includes('printer') && !productNameLower.includes('ink') && !productNameLower.includes('toner')) {
            // RELAXED: Only filter if result is CLEARLY just an accessory (no printer in title at all)
            // Be more lenient - if title mentions "printer" even slightly, include it
            const accessoryOnlyTerms = ['ink cartridge', 'toner cartridge', 'printer paper', 'paper refill', 'ink refill', 'toner refill'];
            const hasAccessoryTerm = accessoryOnlyTerms.some(term => resultTitle.includes(term));
            
            // RELAXED: Only filter if it's clearly ONLY an accessory with NO printer mention
            // If title has "printer" anywhere, it's probably a printer, not just an accessory
            if (hasAccessoryTerm && !resultTitle.includes('printer') && !resultTitle.includes('all-in-one')) {
              return true;
            }
            
            // RELAXED: Don't filter if title contains printer-related terms (might be a printer with accessories mentioned)
            if (resultTitle.includes('printer') || resultTitle.includes('all-in-one') || resultTitle.includes('inkjet')) {
              return false; // It's a printer, not just an accessory
            }
            
            // If title is just "ink cartridge" or "toner cartridge" without any printer mention, it's an accessory
            if ((resultTitle.includes('ink cartridge') || resultTitle.includes('toner cartridge')) && 
                !resultTitle.includes('printer') && !resultTitle.includes('all-in-one')) {
              return true;
            }
            
            // Don't filter out actual printers (even if they have "inkjet" in name)
            return false;
          }
          
          // If searching for scanner and result is paper/document feeder, it might be accessory
          if (productNameLower.includes('scanner') && !productNameLower.includes('document')) {
            if (resultTitle.includes('paper') && !resultTitle.includes('scanner')) {
              return true; // Paper is accessory, not the scanner itself
            }
          }
          
          // If searching for pen and result is refill/ink cartridge, it's an accessory
          if (productNameLower.includes('pen') && !productNameLower.includes('refill')) {
            if (resultTitle.includes('refill') || (resultTitle.includes('ink') && resultTitle.includes('cartridge') && !resultTitle.includes('pen'))) {
              return true;
            }
          }
          
          return false;
        })();
        if (isAccessory) {
          this.logger.debug(`   ⏭️ Skipping accessory: "${result.title}" (contains accessory keyword)`);
          continue;
        }
        
        // Skip office supply accessories
        if (isOfficeAccessory) {
          this.logger.debug(`   ⏭️ Skipping office accessory: "${result.title}" (e.g., ink/toner when searching for printer)`);
          console.log(`   ⏭️ [Office] Skipping accessory: "${result.title}" - not the actual product`);
          continue;
        }
        
        // OPTIMIZATION: isElectronics already calculated before the loop
        if (isElectronics) {
          // STRICT matching for electronics (iPhone, Samsung, etc.)
          // For "iPhone 17 Pro Max", result MUST contain "iphone"
          // For "Samsung Galaxy S24", result MUST contain "samsung" AND "galaxy"
          const mainProductWords = productKeywords.filter(word => 
            word.length > 3 && // Skip short words like "17", "pro", "max"
            !['inch', 'gb', 'tb', 'pro', 'max', 'mini', 'plus', 'ultra'].includes(word)
          );
          
          if (mainProductWords.length > 0) {
            // Result must contain at least one main product word
            const hasMainWord = mainProductWords.some(word => resultTitle.includes(word));
            if (!hasMainWord) {
              this.logger.debug(`   ⏭️ Skipping unrelated product: "${result.title}" (doesn't contain main product words: ${mainProductWords.join(', ')})`);
              continue;
            }
          } else {
            // Fallback: For short queries like "iPhone 17 Pro Max", check for brand/model
            if (productNameLower.includes('iphone')) {
              if (!resultTitle.includes('iphone')) {
                this.logger.debug(`   ⏭️ Skipping unrelated product: "${result.title}" (no "iPhone" in title)`);
                continue;
              }
            }
          }
          
          // For specific models (e.g., "iPhone 17 Pro Max"), ensure result mentions key identifiers
          // Extract model number (e.g., "17") and variant (e.g., "pro max")
          const modelNumberMatch = productNameLower.match(/\b(\d+)\b/);
          const hasProMax = productNameLower.includes('pro max');
          const hasPro = productNameLower.includes('pro') && !productNameLower.includes('pro max');
          
          if (modelNumberMatch) {
            const modelNumber = modelNumberMatch[1];
            // If searching for "iPhone 17", result should contain "17" or be clearly the same generation
            // But allow some flexibility for older/newer models
            if (!resultTitle.includes(modelNumber) && !resultTitle.includes('seventeen')) {
              // Check if it's a close model (e.g., 16 for 17 search is OK, but not 12)
              const closeModels = {
                '17': ['16', '18', '15'],
                '16': ['17', '15', '18'],
                '15': ['16', '14', '17'],
              };
              const closeModelNumbers = closeModels[modelNumber as keyof typeof closeModels] || [];
              const isCloseModel = closeModelNumbers.some(num => resultTitle.includes(num));
              
              if (!isCloseModel && hasProMax) {
                // For "iPhone 17 Pro Max", be strict - must have "17" or close model
                this.logger.debug(`   ⏭️ Skipping wrong model: "${result.title}" (searching for ${modelNumber}, no match found)`);
                continue;
              }
            }
          }
          
          // For "Pro Max" variants, ensure result mentions "pro max" or at least "pro"
          if (hasProMax) {
            if (!resultTitle.includes('pro max') && !resultTitle.includes('promax')) {
              // Allow "pro" if it's clearly a Pro Max variant
              if (!resultTitle.includes('pro') || resultTitle.includes('pro ')) {
                this.logger.debug(`   ⏭️ Skipping wrong variant: "${result.title}" (searching for Pro Max, but result doesn't match)`);
                continue;
              }
            }
          } else if (hasPro) {
            // For "Pro" (not Pro Max), ensure result mentions "pro" but not "max"
            if (!resultTitle.includes('pro')) {
              this.logger.debug(`   ⏭️ Skipping wrong variant: "${result.title}" (searching for Pro, but result doesn't match)`);
              continue;
            }
            // If result has "max", it's probably Pro Max, not Pro
            if (resultTitle.includes('max') && !resultTitle.includes('pro max')) {
              this.logger.debug(`   ⏭️ Skipping wrong variant: "${result.title}" (searching for Pro, but result is Max)`);
              continue;
            }
          }
        } else {
          // FLEXIBLE matching for non-electronics (mattresses, furniture, office supplies, etc.)
          // RELAXED: For office supplies (printers, scanners, etc.), be more lenient
          const isOfficeSupply = productNameLower.includes('printer') || 
                                 productNameLower.includes('scanner') ||
                                 productNameLower.includes('stapler') ||
                                 productNameLower.includes('desk') ||
                                 productNameLower.includes('chair') ||
                                 productNameLower.includes('cabinet');
          
          if (isOfficeSupply) {
            // RELAXED: For office supplies, just check for brand or main product type
            // Don't require exact keyword match - be more flexible
            const hasPrinterTerm = productNameLower.includes('printer') && 
                                  (resultTitle.includes('printer') || resultTitle.includes('inkjet') || resultTitle.includes('laser'));
            const hasScannerTerm = productNameLower.includes('scanner') && resultTitle.includes('scanner');
            const hasOfficeTerm = (productNameLower.includes('desk') && resultTitle.includes('desk')) ||
                                (productNameLower.includes('chair') && resultTitle.includes('chair')) ||
                                (productNameLower.includes('cabinet') && resultTitle.includes('cabinet'));
            
            // If searching for printer/scanner/office furniture, check for product type match
            if (hasPrinterTerm || hasScannerTerm || hasOfficeTerm) {
              // Good match - include it
            } else {
              // Check if it contains at least one main keyword (more lenient)
              const mainKeywords = productKeywords.filter(word => word.length > 3); // Longer keywords only
              const hasKeyword = mainKeywords.some(keyword => resultTitle.includes(keyword));
              if (!hasKeyword) {
                this.logger.debug(`   ⏭️ Skipping unrelated office product: "${result.title}" (doesn't contain keywords: ${mainKeywords.slice(0, 3).join(', ')})`);
                continue;
              }
            }
          } else {
            // For other non-electronics, use standard keyword matching
            const mainKeywords = productKeywords.filter(word => word.length > 2);
            if (mainKeywords.length > 0) {
              const hasKeyword = mainKeywords.some(keyword => resultTitle.includes(keyword));
              if (!hasKeyword) {
                this.logger.debug(`   ⏭️ Skipping unrelated product: "${result.title}" (doesn't contain keywords: ${mainKeywords.slice(0, 3).join(', ')})`);
                continue;
              }
            }
          }
        }
        
        // CRITICAL: Validate price is realistic based on product type
        // Filter out obviously wrong prices (e.g., $28 for iPhone 17 Pro Max)
        // This is the FINAL check - if price doesn't match product type, reject it
        // OPTIMIZATION: Only log validation for rejected prices (reduce logging overhead)
        const isValidPrice = this.isValidPriceForProduct(price, productName);
        if (!isValidPrice) {
          console.log(`   🔍 [Validation] REJECTED price $${price} for "${result.title}" - doesn't match product type`);
        }
        if (!isValidPrice) {
          this.logger.warn(`   ⏭️ REJECTING unrealistic price: $${price} for "${result.title}" from ${source} (product: "${productName}")`);
          console.warn(`   ⚠️ [SerpAPI] REJECTING price $${price} for "${result.title}" from ${source} - doesn't match product type "${productName}"`);
          continue; // Skip unrealistic prices
        }
        
        // FINAL VALIDATION: Double-check that result title and price make sense together
        // This is CRITICAL - catches cases where SerpAPI returns wrong product matches
        // Test results showed 3 bad prices ($94, $34.99, $96) that need to be filtered
        // Note: productNameLower is already declared at the top of the loop
        if (productNameLower.includes('iphone') && productNameLower.includes('pro max')) {
          // iPhone Pro Max should be expensive - if price is too low, result is probably wrong
          // Even used/refurbished iPhone Pro Max should be $600+
          if (price < 600) {
            this.logger.warn(`   ⏭️ REJECTING unrealistic price (double-check): "${result.title}" from ${source} - $${price} (iPhone Pro Max minimum: $600)`);
            console.warn(`   ⚠️ [SerpAPI] REJECTING price $${price} for "${result.title}" from ${source} - iPhone Pro Max minimum is $600`);
            continue;
          }
        } else if (productNameLower.includes('iphone') && productNameLower.includes('pro') && !productNameLower.includes('max')) {
          // iPhone Pro (not Max) should be $500+
          if (price < 500) {
            this.logger.warn(`   ⏭️ REJECTING unrealistic price: "${result.title}" from ${source} - $${price} (iPhone Pro minimum: $500)`);
            console.warn(`   ⚠️ [SerpAPI] Rejecting unrealistic price: $${price} for "${result.title}" from ${source}`);
            continue;
          }
        } else if (productNameLower.includes('iphone')) {
          // Regular iPhone should be $300+
          if (price < 300) {
            this.logger.warn(`   ⏭️ REJECTING unrealistic price: "${result.title}" from ${source} - $${price} (iPhone minimum: $300)`);
            console.warn(`   ⚠️ [SerpAPI] Rejecting unrealistic price: $${price} for "${result.title}" from ${source}`);
            continue;
          }
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
        // Sort by store priority (well-known stores first) then by price
        storePrices.sort((a, b) => {
          const priorityA = this.getStorePriority(a.storeName);
          const priorityB = this.getStorePriority(b.storeName);
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB; // Lower priority number = higher priority
          }
          
          // If same priority, sort by price (lowest first)
          return a.price - b.price;
        });

      // Log all stores found for debugging
      const storeNames = storePrices.map(sp => sp.storeName).join(', ');
      const uniqueStoreCount = new Set(storePrices.map(sp => sp.storeName)).size;
      console.log(`✅ [${apiLabel}] Found ${storePrices.length} store prices (${uniqueStoreCount} unique stores) for "${productName}"`);
      console.log(`📋 [${apiLabel}] All stores: ${storeNames || 'NONE'}`);

      const totalResults = shoppingResults.length;
      const filteredCount = totalResults - storePrices.length;
      console.log(`📊 [${apiLabel}] Statistics for "${productName}":`);
      console.log(`   - Total ${apiLabel} results: ${totalResults}`);
      console.log(`   - Stores after filtering: ${storePrices.length}`);
      console.log(`   - Filtered out: ${filteredCount} results`);
      console.log(`   - Filter rate: ${((filteredCount / totalResults) * 100).toFixed(1)}%`);

      if (storePrices.length < 20) {
        console.warn(`⚠️ [${apiLabel}] Only ${storePrices.length} stores found (user expects 20+).`);
        console.warn(`   - This might be due to:`);
        console.warn(`     1. Too many results filtered as accessories`);
        console.warn(`     2. Price validation rejecting too many stores`);
        console.warn(`     3. Product matching being too strict`);
        console.warn(`     4. ${apiLabel} returning fewer results for this product`);
      } else {
        console.log(`✅ [${apiLabel}] Great! Found ${storePrices.length} stores (meets 20+ requirement)`);
      }

      this.logger.log(`✅ ${apiLabel} found ${storePrices.length} store prices (${uniqueStoreCount} unique stores) for "${productName}"`);
      this.logger.log(`📋 Stores returned: ${storeNames || 'NONE'}`);
      
      // CRITICAL: If we only got Amazon (or 0 stores), log why
      if (storePrices.length === 0) {
        const amazonCount = shoppingResults.filter((r: any) => {
          const src = (r.source || '').toLowerCase();
          return src.includes('amazon') || (r.link && typeof r.link === 'string' && r.link.includes('amazon.com'));
        }).length;
        const nonAmazonCount = shoppingResults.length - amazonCount;
        
        console.error(`❌ [${apiLabel}] No stores returned after filtering!`);
        console.error(`   - Total ${apiLabel} results: ${shoppingResults.length}`);
        console.error(`   - Exclude Amazon: ${options?.excludeAmazon ? 'YES' : 'NO'}`);
        console.error(`   - Amazon results: ${amazonCount}`);
        console.error(`   - Non-Amazon results: ${nonAmazonCount}`);
        console.error(`   - Query used: "${productName}"`);
        if (shoppingResults.length > 0) {
          console.error(`   - Sample sources: ${shoppingResults.slice(0, 5).map((r: any) => r.source || 'Unknown').join(', ')}`);
        }
        this.logger.warn(`⚠️ No stores returned after filtering!`);
        this.logger.warn(`   - Total ${apiLabel} results: ${shoppingResults.length}`);
        this.logger.warn(`   - Exclude Amazon: ${options?.excludeAmazon ? 'YES' : 'NO'}`);
        this.logger.warn(`   - Amazon results: ${amazonCount}`);
        this.logger.warn(`   - Non-Amazon results: ${nonAmazonCount}`);
      } else if (storePrices.length === 1 && storePrices[0].storeName.toLowerCase().includes('amazon')) {
        console.error(`❌ [${apiLabel}] ERROR: Amazon should be excluded but is still in results!`);
        this.logger.error(`❌ ERROR: Amazon should be excluded but is still in results!`);
        this.logger.error(`   This means excludeAmazon filter is not working correctly.`);
      }
      
      return storePrices;
    } catch (error: any) {
      this.logger.error(`Shopping API search failed: ${error.message}`);
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
      { pattern: /staples/i, base: 'staples' },
      { pattern: /officemax/i, base: 'officemax' },
      { pattern: /quill/i, base: 'quill' },
      { pattern: /uline/i, base: 'uline' },
      { pattern: /fedex\s*office/i, base: 'fedexoffice' },
      { pattern: /container\s*store/i, base: 'containerstore' },
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
      { pattern: /staples/i, id: 'staples', name: 'Staples' },
      { pattern: /officemax/i, id: 'officemax', name: 'OfficeMax' },
      { pattern: /quill/i, id: 'quill', name: 'Quill' },
      { pattern: /uline/i, id: 'uline', name: 'Uline' },
      { pattern: /fedex\s*office/i, id: 'fedexoffice', name: 'FedEx Office' },
      { pattern: /container\s*store/i, id: 'containerstore', name: 'The Container Store' },
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


import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { WalmartMockIntegration } from '../integrations/services/walmart-mock.integration';
import { AmazonMockIntegration } from '../integrations/services/amazon-mock.integration';
import { TargetMockIntegration } from '../integrations/services/target-mock.integration';
import { PriceApiService } from '../integrations/services/priceapi.service';
import { MultiStorePriceService } from '../integrations/services/multi-store-price.service';
import { BarcodeLookupService } from '../integrations/services/barcode-lookup.service';
import { MultiStoreScrapingService } from '../integrations/services/multi-store-scraping.service';
import { GoogleShoppingScraperService } from '../integrations/services/google-shopping-scraper.service';
import { StoreLocationsService } from '../store-locations/store-locations.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  // Only log in development mode to improve production performance
  private readonly isDev = process.env.NODE_ENV !== 'production';
  
  // Helper to conditionally log (only in dev mode)
  private devLog(...args: any[]) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  /** Clearbit logo URL using main store name (e.g. "Walmart - SUSR" -> walmart.com) so logos load. */
  private getClearbitLogoUrl(storeName: string): string {
    const main = (storeName || '').trim().split(/\s*[-–|]\s*/)[0].trim() || storeName;
    const domain = main.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
    return domain ? `https://logo.clearbit.com/${domain}.com` : `https://logo.clearbit.com/placeholder.com`;
  }

  /** Extract hostname from product/store URL for logo (e.g. https://www.walmart.com/ip/... -> walmart.com). Scales to any store. */
  private extractDomainFromUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
    try {
      const host = new URL(url).hostname || '';
      const lower = host.toLowerCase();
      return lower.replace(/^www\./, '') || null;
    } catch {
      return null;
    }
  }

  /** Logo URL for a store: Clearbit by domain when we have URL (real brand logo), else Clearbit from name. */
  private getStoreLogoUrlForSave(storeName: string, productOrWebsiteUrl?: string | null): string {
    const domain = this.extractDomainFromUrl(productOrWebsiteUrl);
    if (domain) return `https://logo.clearbit.com/${domain}`;
    return this.getClearbitLogoUrl(storeName);
  }
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly walmartIntegration: WalmartMockIntegration,
    private readonly amazonIntegration: AmazonMockIntegration,
    private readonly targetIntegration: TargetMockIntegration,
    private readonly priceApiService: PriceApiService,
    private readonly multiStorePriceService: MultiStorePriceService,
    private readonly barcodeLookupService: BarcodeLookupService,
    private readonly multiStoreScrapingService: MultiStoreScrapingService,
    private readonly googleShoppingScraper: GoogleShoppingScraperService,
    private readonly storeLocationsService: StoreLocationsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper method to add price calculations (lowest, highest, savings) to products
   */
  private enrichProductWithPriceCalculations(product: any) {
    if (product.prices && product.prices.length > 0) {
      const prices = product.prices.map((p) => Number(p.price));
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const savings = highestPrice - lowestPrice;

      return {
        ...product,
        lowestPrice,
        highestPrice,
        savings,
      };
    }
    return product;
  }

  /**
   * Normalize product image - convert images array to single image string
   * Frontend expects 'image' string, but database has 'images' array
   */
  private normalizeProductImage(product: any) {
    // If product has images array but no image string, use first image
    if (!product.image && product.images && Array.isArray(product.images) && product.images.length > 0) {
      product.image = product.images[0];
    }
    
    // Ensure image is a valid string (not null/undefined)
    if (!product.image || typeof product.image !== 'string') {
      product.image = '';
    }
    
    // Clean up: remove empty string images
    if (product.image === '') {
      product.image = null;
    }
    
    return product;
  }

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto,
      include: {
        category: true,
        prices: {
          include: { store: true },
        },
      },
    });
  }

  async findAll(categoryId?: string) {
    const products = await this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
        _count: {
          select: { prices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => {
      const enriched = this.enrichProductWithPriceCalculations(p);
      return this.normalizeProductImage(enriched);
    });
  }

  async findOne(id: string) {
    // Placeholder products (from getPopular when API/scraper returns 0) are not in DB; return synthetic product so client doesn't 404
    const placeholder = this.parseAndGetPlaceholderProduct(id);
    if (placeholder) {
      return placeholder;
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 30, // Last 30 price points
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Increment view count
    await this.prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const enriched = this.enrichProductWithPriceCalculations(product);
    return this.normalizeProductImage(enriched);
  }

  /**
   * Parse placeholder id (e.g. placeholder-mattresses-2-1770157125916) and return a synthetic product for findOne.
   * Returns null if id is not a placeholder id.
   */
  private parseAndGetPlaceholderProduct(id: string): any | null {
    if (!id || !id.startsWith('placeholder-')) return null;
    const parts = id.split('-');
    if (parts.length < 4) return null;
    const timestamp = parts.pop();
    const indexStr = parts.pop();
    if (!timestamp || !/^\d+$/.test(timestamp) || !indexStr || !/^\d+$/.test(indexStr)) return null;
    const categorySlug = parts.slice(1).join('-');
    const index = parseInt(indexStr, 10);
    return this.getOnePlaceholderProduct(categorySlug, index, id);
  }

  /**
   * Build one placeholder product in the same shape as findOne (category, prices with store, enriched).
   */
  private getOnePlaceholderProduct(categorySlug: string, index: number, id: string): any {
    const placeholders: Record<string, { names: string[]; image: string }> = {
      mattresses: {
        names: ['Memory Foam Mattress', 'Hybrid Mattress', 'Innerspring Mattress', 'Mattress Topper', 'Cooling Gel Mattress', 'Bed in a Box'],
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400',
      },
      electronics: {
        names: ['Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', 'Webcam', 'Monitor', 'Headphones'],
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
      },
      groceries: {
        names: ['Organic Milk', 'Whole Grain Bread', 'Fresh Eggs', 'Bananas', 'Chicken Breast', 'Salmon'],
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      },
      kitchen: {
        names: ['Blender', 'Air Fryer', 'Coffee Maker', 'Toaster', 'Instant Pot', 'Stand Mixer'],
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      },
    };
    const config = placeholders[categorySlug] || {
      names: [`${categorySlug.replace(/-/g, ' ')} product 1`, `${categorySlug.replace(/-/g, ' ')} product 2`, `${categorySlug.replace(/-/g, ' ')} product 3`, `${categorySlug.replace(/-/g, ' ')} product 4`, `${categorySlug.replace(/-/g, ' ')} product 5`, `${categorySlug.replace(/-/g, ' ')} product 6`],
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    };
    const name = config.names[index] ?? config.names[0];
    const categoryName = categorySlug.replace(/-/g, ' ');
    const synthetic = {
      id,
      name,
      images: [config.image],
      image: config.image,
      categoryId: categorySlug,
      category: { id: categorySlug, slug: categorySlug, name: categoryName },
      prices: [{ price: 99.99, store: { id: 'placeholder-store', name: 'View prices at store' } }],
      priceHistory: [],
      viewCount: 0,
      lowestPrice: 99.99,
      highestPrice: 99.99,
      savings: 0,
    };
    return this.enrichProductWithPriceCalculations(synthetic);
  }

  async search(query: string, categoryId?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        AND: [
          categoryId ? { categoryId } : {},
          {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { brand: { contains: query } },
              { barcode: { equals: query } },
            ],
          },
        ],
      },
      include: {
        category: true,
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
      },
      take: 20,
    });

    // Increment search count for all results
    const productIds = products.map((p) => p.id);
    if (productIds.length > 0) {
      await this.prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { searchCount: { increment: 1 } },
      });
    }

    return products.map((p) => {
      const enriched = this.enrichProductWithPriceCalculations(p);
      return this.normalizeProductImage(enriched);
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        prices: {
          include: { store: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Advanced search with filters, sorting, and store selection
   */
  async advancedSearch(searchDto: AdvancedSearchDto) {
    const {
      query,
      categorySlug,
      subcategory,
      stores,
      sortBy = 'relevance',
      minPrice,
      maxPrice,
    } = searchDto;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      AND: [
        // Category filter
        categorySlug
          ? {
              category: {
                slug: categorySlug,
              },
            }
          : {},
        // Subcategory filter
        subcategory
          ? {
              subcategory: {
                contains: subcategory,
              },
            }
          : {},
        // Search query
        {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { brand: { contains: query } },
            { barcode: { equals: query } },
          ],
        },
        // Price range filter
        minPrice || maxPrice
          ? {
              prices: {
                some: {
                  AND: [
                    minPrice ? { price: { gte: minPrice } } : {},
                    maxPrice ? { price: { lte: maxPrice } } : {},
                  ],
                },
              },
            }
          : {},
        // Store filter
        stores && stores.length > 0
          ? {
              prices: {
                some: {
                  store: {
                    slug: {
                      in: stores,
                    },
                  },
                },
              },
            }
          : {},
      ],
    };

    // Build orderBy clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'price_low':
        orderBy = { prices: { _count: 'desc' } }; // Fallback, we'll sort in memory
        break;
      case 'price_high':
        orderBy = { prices: { _count: 'desc' } };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'relevance':
      default:
        orderBy = { searchCount: 'desc' };
        break;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
          ...(stores && stores.length > 0
            ? {
                where: {
                  store: {
                    slug: {
                      in: stores,
                    },
                  },
                },
              }
            : {}),
        },
      },
      orderBy,
      take: 50,
    });

    // Sort by price if needed (in-memory since Prisma doesn't support relation sorting easily)
    let sortedProducts = products;
    if (sortBy === 'price_low') {
      sortedProducts = products.sort((a, b) => {
        const aLowest = Math.min(...a.prices.map((p) => Number(p.price)));
        const bLowest = Math.min(...b.prices.map((p) => Number(p.price)));
        return aLowest - bLowest;
      });
    } else if (sortBy === 'price_high') {
      sortedProducts = products.sort((a, b) => {
        const aHighest = Math.max(...a.prices.map((p) => Number(p.price)));
        const bHighest = Math.max(...b.prices.map((p) => Number(p.price)));
        return bHighest - aHighest;
      });
    }

    // Increment search counts
    const productIds = sortedProducts.map((p) => p.id);
    if (productIds.length > 0) {
      await this.prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { searchCount: { increment: 1 } },
      });
    }

    return {
      products: sortedProducts.map((p) => {
        const enriched = this.enrichProductWithPriceCalculations(p);
        return this.normalizeProductImage(enriched);
      }),
      count: sortedProducts.length,
      filters: {
        categorySlug,
        subcategory,
        stores,
        sortBy,
        minPrice,
        maxPrice,
      },
    };
  }

  /**
   * Get popular/trending products based on search and view counts.
   * Used for "Popular Items" section in category pages.
   */
  async getPopular(categorySlug?: string, limit: number = 6, storeSlugs?: string[], subcategory?: string, page: number = 1) {
    // If subcategory is specified, ensure we get at least 6 products
    const minLimit = subcategory ? Math.max(limit, 6) : limit;
    
    // CRITICAL: Ensure category exists in database before querying products
    let categoryId: string | undefined;
    if (categorySlug) {
      let category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      
      // If category doesn't exist, create it (for categories defined in frontend but not yet in DB)
      if (!category) {
        this.devLog(`⚠️ Category "${categorySlug}" not found in database, creating it...`);
        // Get category name from frontend constants (fallback to capitalized slug)
        const categoryNameMap: Record<string, string> = {
          'kitchen': 'Kitchen & Appliances',
          'home-accessories': 'Home Accessories & Decor',
          'beauty-products': 'Beauty Products',
          'video-games': 'Video Games',
          'sports-equipment': 'Sports Equipment',
          'home-decor': 'Home Accessories & Decor', // Merged into Home Accessories
          'furniture': 'Furniture',
          'pet-supplies': 'Pet Supplies',
          'books': 'Books',
          'office': 'Office Supplies',
          'household': 'Household Items',
          'mattresses': 'Mattresses',
        };
        const categoryName = categoryNameMap[categorySlug] || categorySlug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        
        category = await this.prisma.category.create({
          data: {
            name: categoryName,
            slug: categorySlug,
            icon: '📦',
            description: `Compare prices for ${categoryName.toLowerCase()}`,
            enabled: true,
          },
        });
        this.devLog(`✅ Created category "${categorySlug}" (${category.id})`);
      }
      categoryId = category.id;
    }
    
    // Define exclude terms for category filtering (MUST be defined before building WHERE clause)
    const excludeTerms: Record<string, string[]> = {
      'beauty-products': [
        'ps5', 'playstation', 'xbox', 'nintendo', 'console', 'controller', 'gaming', 'video game', 'game console',
        'shirt', 't-shirt', 'sweatshirt', 'sweat shirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion', 'outfit',
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'headphones', 'earbuds',
        'furniture', 'chair', 'table', 'sofa', 'bed', 'desk', 'wardrobe',
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage',
        'tool', 'hardware', 'screwdriver', 'hammer', 'drill',
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music',
        // Electronics and smart devices
        'echo', 'alexa', 'smart speaker', 'smart display', 'smart home', 'amazon echo', 'google home', 'nest',
        'speaker', 'bluetooth speaker', 'wireless speaker',
        // Cleaning products (not beauty)
        'cleaner', 'multi-purpose cleaner', 'pink stuff', 'cleaning', 'detergent', 'soap dispenser',
        // Bags and accessories (not beauty products)
        'bag', 'crossbody', 'backpack', 'purse', 'wallet', 'handbag', 'tote bag',
        // Toys and collectibles
        'figurine', 'toy', 'collectible', 'youtooz', 'pop vinyl',
      ],
      beauty: [
        'ps5', 'playstation', 'xbox', 'nintendo', 'console', 'controller', 'gaming', 'video game', 'game console',
        'shirt', 't-shirt', 'sweatshirt', 'sweat shirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion', 'outfit',
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'headphones', 'earbuds',
        'furniture', 'chair', 'table', 'sofa', 'bed', 'desk', 'wardrobe',
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage',
        'tool', 'hardware', 'screwdriver', 'hammer', 'drill',
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music',
        // Electronics and smart devices
        'echo', 'alexa', 'smart speaker', 'smart display', 'smart home', 'amazon echo', 'google home', 'nest',
        'speaker', 'bluetooth speaker', 'wireless speaker',
        // Cleaning products (not beauty)
        'cleaner', 'multi-purpose cleaner', 'pink stuff', 'cleaning', 'detergent', 'soap dispenser',
        // Bags and accessories (not beauty products)
        'bag', 'crossbody', 'backpack', 'purse', 'wallet', 'handbag', 'tote bag',
        // Toys and collectibles
        'figurine', 'toy', 'collectible', 'youtooz', 'pop vinyl',
      ],
      'sports-equipment': [
        // Electronics (unless sports-specific like fitness trackers)
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'monitor', 'keyboard', 'mouse',
        // Furniture (unless sports-specific like exercise benches)
        'sofa', 'couch', 'chair', 'table', 'desk', 'wardrobe', 'dresser', 'cabinet',
        // Food items
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty',
        // Clothing (unless sports-specific like jerseys, but exclude general clothing and fashion items)
        'dress', 'suit', 'formal wear', 'casual wear', 'fashion', 'apparel', 'fashion shoe', 'dress shoe', 'heels', 'high heels', 'pumps', 'loafers', 'oxfords', 'dress boots', 'casual shoe', 'fashion sneaker', // Keep jerseys, sports bras, athletic shoes, running shoes, etc.
        // Books (unless sports-related)
        'novel', 'fiction', 'biography', 'textbook', 'book', 'magazine',
        // Office supplies
        'printer', 'scanner', 'stapler', 'paper clips', 'notebook', 'pen', 'pencil',
        // Tools (unless sports-specific)
        'screwdriver', 'hammer', 'drill', 'wrench', 'toolbox', 'hardware',
      ],
      'pet-supplies': [
        // Electronics
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'monitor', 'keyboard', 'mouse',
        // Food items (human food, not pet food)
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal', 'coffee', 'tea', 'bread', 'milk', 'cheese',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty', 'perfume',
        // Sports equipment
        'basketball', 'football', 'soccer', 'baseball', 'tennis', 'racket', 'dumbbell', 'barbell', 'yoga mat', 'gym equipment',
        // Clothing
        'shirt', 't-shirt', 'sweatshirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion',
        // Video games and entertainment
        'video game', 'game', 'steam', 'nintendo switch', 'playstation', 'xbox',
        // Toys and collectibles (human toys, not pet toys)
        'toy', 'figurine', 'collectible', 'youtooz', 'pop vinyl', 'lego', 'action figure',
        // Musical instruments
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music',
        // Tools
        'screwdriver', 'hammer', 'drill', 'wrench', 'toolbox', 'hardware', 'power tool', 'saw', 'nail gun',
        // Home appliances
        'refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave',
        // Office supplies
        'printer', 'scanner', 'stapler', 'paper clips', 'notebook', 'pen', 'pencil',
        // Furniture
        'sofa', 'couch', 'wardrobe', 'dresser', 'nightstand', 'dining table', 'dining chair', 'bookshelf', 'cabinet', 'bed', 'mattress',
        // Cleaning products
        'cleaner', 'multi-purpose cleaner', 'detergent', 'soap', 'mop', 'broom', 'vacuum cleaner', 'spray', 'wipe', 'disinfectant',
      ],
      office: [
        // Electronics (unless office-specific like printers, scanners, monitors - but exclude gaming/entertainment)
        'ps5', 'playstation 5', 'xbox series', 'nintendo switch', 'console', 'gaming console', 'video game console',
        'iphone', 'samsung galaxy', 'smartphone', 'mobile phone', 'tv', 'television', 'smart tv',
        // Furniture (unless office furniture - exclude home furniture)
        'sofa', 'couch', 'bed frame', 'mattress', 'wardrobe', 'dresser', 'nightstand', 'dining table', 'dining chair',
        // Food items
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal', 'coffee maker', 'kettle',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty product', 'perfume',
        // Sports equipment
        'basketball', 'football', 'soccer ball', 'baseball', 'tennis racket', 'dumbbell', 'barbell', 'yoga mat', 'gym equipment',
        // Clothing
        't-shirt', 'sweatshirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion',
        // Video games and entertainment (be specific to avoid filtering office products)
        'video game', 'steam deck', 'nintendo switch', 'playstation 5', 'xbox series x',
        // Toys and collectibles
        'toy', 'figurine', 'collectible', 'youtooz', 'pop vinyl', 'lego set',
        // Musical instruments
        'guitar', 'piano', 'violin', 'drum set', 'musical instrument',
        // Tools (unless office-specific like paper cutters, label makers)
        'screwdriver', 'hammer', 'power drill', 'wrench set', 'toolbox', 'hardware', 'circular saw', 'nail gun',
        // Home appliances (unless office-specific)
        'refrigerator', 'washing machine', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave',
        // Cleaning products (unless office-specific) - be more specific
        'multi-purpose cleaner', 'laundry detergent', 'dish soap', 'mop', 'broom', 'vacuum cleaner',
      ],
      mattresses: [
        // Electronics
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'monitor', 'keyboard', 'mouse',
        // Food items
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty',
        // Sports equipment
        'basketball', 'football', 'soccer', 'baseball', 'tennis', 'racket', 'dumbbell', 'barbell', 'yoga mat', 'gym equipment',
        // Clothing
        'shirt', 't-shirt', 'sweatshirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion',
        // Video games and entertainment
        'video game', 'game', 'steam', 'nintendo switch', 'playstation', 'xbox',
        // Toys and collectibles
        'toy', 'figurine', 'collectible', 'youtooz', 'pop vinyl', 'lego',
        // Musical instruments
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music',
        // Tools
        'screwdriver', 'hammer', 'drill', 'wrench', 'toolbox', 'hardware', 'power tool', 'saw', 'nail gun',
        // Home appliances
        'refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave',
        // Office supplies
        'printer', 'scanner', 'stapler', 'paper clips', 'notebook', 'pen', 'pencil',
        // Other furniture (but keep bed frames, headboards, etc. that are mattress-related)
        'sofa', 'couch', 'wardrobe', 'dresser', 'nightstand', 'dining table', 'dining chair', 'bookshelf', 'cabinet',
        // Pet supplies
        'dog food', 'cat food', 'pet toy', 'pet bed', 'leash', 'pet',
        // Cleaning products (comprehensive list to catch all variations - MUST be exhaustive)
        'cleaner', 'multi-purpose cleaner', 'multi purpose cleaner', 'multipurpose cleaner', 'pink stuff', 'cleaning', 'detergent', 'soap', 'mop', 'broom', 'vacuum cleaner', 'spray', 'wipe', 'disinfectant', 'sanitizer', 'cleaning product', 'cleaning solution', 'all-purpose cleaner', 'all purpose cleaner', 'allpurpose cleaner', 'surface cleaner', 'glass cleaner', 'bathroom cleaner', 'kitchen cleaner', 'floor cleaner', 'carpet cleaner', 'upholstery cleaner', 'stain remover', 'degreaser', 'scrub', 'scrubber', 'cleansing', 'cleanser', 'clean', 'cleans', 'cleaned', 'cleaning supplies', 'household cleaner', 'household cleaning', 'general cleaner', 'general purpose cleaner', 'multi-use cleaner', 'multi use cleaner', 'all-in-one cleaner', 'all in one cleaner',
      ],
      'video-games': [
        // CRITICAL: Exclude consoles and hardware - these belong in electronics, not video games
        // Video games category should ONLY show actual games (software), not hardware
        'ps5', 'playstation 5', 'playstation 5 console', 'ps5 console', 'playstation console',
        'xbox series x', 'xbox series s', 'xbox console', 'xbox one', 'xbox 360',
        'nintendo switch console', 'nintendo switch oled', 'nintendo switch lite', 'nintendo switch', 'nintendo wii', 'nintendo wii u',
        'console', 'gaming console', 'video game console', 'game console', 'console system',
        'controller', 'gaming controller', 'xbox controller', 'playstation controller', 'nintendo controller',
        'gaming headset', 'gaming keyboard', 'gaming mouse', 'gaming monitor', 'gaming chair',
        'gaming pc', 'gaming laptop', 'gaming desktop',
        // Electronics (unless gaming-specific, but consoles are excluded above)
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'monitor', 'keyboard', 'mouse',
        // Furniture
        'furniture', 'chair', 'table', 'sofa', 'bed', 'desk', 'wardrobe',
        // Food items
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty',
        // Sports equipment
        'basketball', 'football', 'soccer', 'baseball', 'tennis', 'racket', 'dumbbell', 'barbell', 'yoga mat', 'gym equipment',
        // Clothing
        'shirt', 't-shirt', 'sweatshirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion',
        // Books (unless game guides)
        'book', 'novel', 'textbook', 'manual',
        // Musical instruments
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music',
        // Tools
        'screwdriver', 'hammer', 'drill', 'wrench', 'toolbox', 'hardware',
        // Home appliances
        'refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave',
        // Office supplies
        'printer', 'scanner', 'stapler', 'paper clips', 'notebook', 'pen', 'pencil',
      ],
    };
    
    // ALLOW LIST (Whitelist) approach for specific categories - ONLY allow products that match keywords
    // This is much cleaner than excluding hundreds of irrelevant items
    const categoryAllowLists: Record<string, string[]> = {
      mattresses: [
        // Core keywords (most important - should catch most mattress products)
        'mattress', 'bed', 'sleep',
        // Specific types
        'memory foam', 'spring mattress', 'hybrid mattress', 'latex mattress', 
        'mattress topper', 'mattress pad', 'bed mattress', 'box spring', 'bedding',
        'mattress protector', 'mattress cover', 'mattress encasement',
        'adjustable base', 'bed base', 'foundation', 'bed frame', 'headboard', 'footboard',
        'mattress set', 'bed set', 'sleep system', 'mattress in a box', 'bed in a box',
        'innerspring', 'pocket coil', 'gel memory foam', 'cooling mattress', 'firm mattress',
        'soft mattress', 'medium mattress', 'plush mattress', 'euro top', 'pillow top',
        // Brand names that are mattress-specific (to catch products like "Casper Mattress", "Purple Mattress")
        'casper', 'purple', 'tempur', 'saatva', 'nectar', 'leesa', 'tuft', 'needle',
      ],
      'pet-supplies': [
        // Core keywords (most important - should catch most pet supply products)
        'pet', 'dog', 'cat', 'puppy', 'kitten', 'canine', 'feline',
        // Pet food (various formats)
        'dog food', 'cat food', 'pet food', 'dog treats', 'cat treats', 'pet treats', 'kibble', 'wet food', 'dry food', 'food', 'treats',
        // Pet toys (various formats)
        'dog toy', 'cat toy', 'pet toy', 'chew toy', 'interactive toy', 'toy',
        // Pet beds and accessories
        'dog bed', 'cat bed', 'pet bed', 'dog crate', 'cat carrier', 'pet carrier', 'bed', 'crate', 'carrier',
        // Pet collars and leashes
        'dog leash', 'cat leash', 'pet leash', 'dog collar', 'cat collar', 'pet collar', 'harness', 'leash', 'collar',
        // Pet bowls and feeders
        'dog bowl', 'cat bowl', 'pet bowl', 'water bowl', 'food bowl', 'feeder', 'automatic feeder', 'bowl',
        // Pet care and grooming
        'pet shampoo', 'dog shampoo', 'cat shampoo', 'pet brush', 'dog brush', 'cat brush', 'grooming', 'shampoo', 'brush',
        // Pet supplies general
        'pet supplies', 'pet care', 'pet accessories', 'pet products', 'supplies', 'care', 'accessories',
        // Brand names that are pet-specific
        'purina', 'pedigree', 'whiskas', 'friskies', 'iams', 'hills', 'royal canin', 'blue buffalo', 'wellness', 'taste of the wild', 'science diet', 'nutro', 'orijen', 'acana',
      ],
    };
    
    // Build ALLOW LIST filter for database query (ONLY allow products that match keywords)
    const buildAllowListFilter = (catSlug?: string): any[] => {
      if (!catSlug) return [];
      const allowKeywords = categoryAllowLists[catSlug] || [];
      if (allowKeywords.length === 0) return []; // No allow list = use exclude list instead
      
      // Build OR conditions: product name MUST contain AT LEAST ONE of these keywords
      // Note: Case-insensitivity will be handled in application logic after fetching
      // Prisma's contains is case-sensitive by default, so we'll filter after fetching
      return [{
        OR: allowKeywords.map(keyword => ({
          name: {
            contains: keyword,
          },
        })),
      }];
    };
    
    // Build exclude terms filter for database query (for categories without allow lists)
    const buildExcludeFilter = (catSlug?: string): any[] => {
      if (!catSlug) return [];
      // If category has an allow list, don't use exclude list
      if (categoryAllowLists[catSlug]) return [];
      
      const categoryExcludeTerms = excludeTerms[catSlug] || [];
      if (categoryExcludeTerms.length === 0) return [];
      
      // Build NOT conditions for each exclude term
      // Note: Case-insensitivity will be handled in application logic after fetching
      return categoryExcludeTerms.map(term => ({
        name: {
          not: {
            contains: term,
          },
        },
      }));
    };
    
    const allowListFilters = buildAllowListFilter(categorySlug);
    const excludeFilters = buildExcludeFilter(categorySlug);
    
    const where: Prisma.ProductWhereInput = {
      AND: [
        // Category filter - use categoryId if we have it, otherwise use slug
        categorySlug
      ? categoryId
        ? { categoryId }
        : {
          category: {
            slug: categorySlug,
          },
        }
          : {},
        // Subcategory filter
        subcategory
          ? {
              subcategory: {
                contains: subcategory,
              },
            }
          : {},
        // Store filter - only show products that have prices from selected stores
        storeSlugs && storeSlugs.length > 0
          ? {
              prices: {
                some: {
                  store: {
                    slug: {
                      in: storeSlugs,
                    },
                  },
                },
              },
            }
          : {},
        // EXCLUDE TEST PRODUCTS - Filter out products with "Test Product" in the name
        {
          name: {
            not: {
              contains: 'Test Product',
            },
          },
        },
        // ALLOW LIST: For mattresses, ONLY allow products that match mattress keywords
        // EXCLUDE LIST: For other categories, exclude irrelevant products
        ...allowListFilters,
        ...excludeFilters,
      ],
    };

    // First, try to get products with images prioritized (but don't require images)
    // CRITICAL: Ensure test products are excluded at database level
    // NOTE: We don't require images here - products without images will show placeholders
    const finalWhere: Prisma.ProductWhereInput = {
      AND: [
        ...(Array.isArray(where.AND) ? where.AND : []),
        // Double-check: Explicitly exclude test products
        {
          name: {
            not: {
              contains: 'Test Product',
            },
          },
        },
      ],
    };
    
    this.devLog(`🔍 Database query filter for ${categorySlug}:`, JSON.stringify(finalWhere, null, 2));
    if (categorySlug === 'mattresses') {
      this.devLog(`🛏️ [MATTRESSES] Allow list filters:`, JSON.stringify(allowListFilters, null, 2));
      this.devLog(`🛏️ [MATTRESSES] Allow list keywords:`, categoryAllowLists.mattresses);
    }
    if (categorySlug === 'pet-supplies') {
      this.devLog(`🐾 [PET-SUPPLIES] Allow list filters:`, JSON.stringify(allowListFilters, null, 2));
      this.devLog(`🐾 [PET-SUPPLIES] Allow list keywords:`, categoryAllowLists['pet-supplies']);
    }
    
    // For allow-list categories, we need to apply case-insensitive filtering after fetching
    // because Prisma doesn't support mode: 'insensitive' in this version
    const needsCaseInsensitiveFilter = categorySlug && categoryAllowLists[categorySlug];
    
    let productsWithImages = await this.prisma.product.findMany({
      where: finalWhere,
      include: {
        category: true,
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
      },
      orderBy: [
        { searchCount: 'desc' },
        { viewCount: 'desc' },
      ],
      take: minLimit * 2, // Get more to filter
    });
    
    // Apply case-insensitive allow list filtering after fetching (for mattresses, pet-supplies, and video-games)
    // For video-games, use lenient logic (allow if not console/hardware, even without allow list match)
    if (needsCaseInsensitiveFilter && categorySlug) {
      const allowKeywords = categoryAllowLists[categorySlug] || [];
      const lowerKeywords = allowKeywords.map(k => k.toLowerCase());
      const beforeCount = productsWithImages.length;
      productsWithImages = productsWithImages.filter(product => {
        const productNameLower = (product.name || '').toLowerCase();
        const matchesAllowList = lowerKeywords.some(keyword => productNameLower.includes(keyword));
        
        // SPECIAL CASE for video-games: Be lenient - allow if not console/hardware, even without allow list match
        if (categorySlug === 'video-games' && !matchesAllowList) {
          // Check if it's clearly a console or hardware (should be excluded)
          const isConsole = productNameLower.includes('console') ||
                           productNameLower.includes('ps5') ||
                           productNameLower.includes('playstation 5') ||
                           (productNameLower.includes('playstation') && !productNameLower.includes('game') && !productNameLower.includes('disc')) ||
                           productNameLower.includes('xbox series') ||
                           productNameLower.includes('xbox one') ||
                           productNameLower.includes('xbox 360') ||
                           (productNameLower.includes('xbox') && !productNameLower.includes('game') && !productNameLower.includes('disc')) ||
                           productNameLower.includes('nintendo switch console') ||
                           productNameLower.includes('nintendo switch oled') ||
                           productNameLower.includes('nintendo switch lite') ||
                           (productNameLower.includes('nintendo switch') && !productNameLower.includes('game') && !productNameLower.includes('cartridge')) ||
                           productNameLower.includes('nintendo wii') ||
                           productNameLower.includes('nintendo wii u') ||
                           productNameLower.includes('gaming console') ||
                           productNameLower.includes('game console');
          
          const isHardware = productNameLower.includes('controller') ||
                            productNameLower.includes('gaming headset') ||
                            productNameLower.includes('gaming keyboard') ||
                            productNameLower.includes('gaming mouse') ||
                            productNameLower.includes('gaming monitor') ||
                            productNameLower.includes('gaming chair') ||
                            productNameLower.includes('gaming pc') ||
                            productNameLower.includes('gaming laptop') ||
                            productNameLower.includes('gaming desktop');
          
          // If it's NOT a console/hardware, allow it (might be a game title without "game" keyword)
          if (!isConsole && !isHardware) {
            return true; // Allow it - it's likely a game
          }
          // If it IS a console/hardware, reject it
          return false;
        }
        
        // For other categories (mattresses, pet-supplies), require allow list match
        return matchesAllowList;
      });
      const emoji = categorySlug === 'mattresses' ? '🛏️' : categorySlug === 'pet-supplies' ? '🐾' : categorySlug === 'video-games' ? '🎮' : '✅';
      this.devLog(`${emoji} [${categorySlug}] Applied case-insensitive allow list filter: ${beforeCount} → ${productsWithImages.length} products`);
    }

    const toNumberOrNull = (val: any): number | null => {
      if (val == null) return null;
      if (typeof val === 'number') return Number.isFinite(val) ? val : null;
      if (typeof val === 'string') {
        const n = Number.parseFloat(val);
        return Number.isFinite(n) ? n : null;
      }
      // Prisma Decimal (or similar) support
      if (typeof val?.toNumber === 'function') {
        const n = val.toNumber();
        return Number.isFinite(n) ? n : null;
      }
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    };

    const hasRealPrices = (product: any): boolean => {
      const prices = product?.prices;
      if (!prices || !Array.isArray(prices) || prices.length === 0) return false;
      return prices.some((p: any) => {
        const n = toNumberOrNull(p?.price);
        return typeof n === 'number' && n > 0;
      });
    };

    // Helper function to check if product should be allowed (for allow-list categories) or excluded (for exclude-list categories)
    const shouldAllowProduct = (productName: string, catSlug?: string): boolean => {
      if (!catSlug) return true; // No category = allow
      
      const productNameLower = productName.toLowerCase();
      
      // ALLOW LIST approach: For mattresses and pet-supplies, ONLY allow if it matches keywords
      const categoryAllowLists: Record<string, string[]> = {
        mattresses: [
          // Core keywords (most important - should catch most mattress products)
          'mattress', 'bed', 'sleep',
          // Specific types
          'memory foam', 'spring mattress', 'hybrid mattress', 'latex mattress', 
          'mattress topper', 'mattress pad', 'bed mattress', 'box spring', 'bedding',
          'mattress protector', 'mattress cover', 'mattress encasement',
          'adjustable base', 'bed base', 'foundation', 'bed frame', 'headboard', 'footboard',
          'mattress set', 'bed set', 'sleep system', 'mattress in a box', 'bed in a box',
          'innerspring', 'pocket coil', 'gel memory foam', 'cooling mattress', 'firm mattress',
          'soft mattress', 'medium mattress', 'plush mattress', 'euro top', 'pillow top',
          // Brand names that are mattress-specific
          'casper', 'purple', 'tempur', 'saatva', 'nectar', 'leesa', 'tuft', 'needle',
        ],
        'pet-supplies': [
          // Core keywords (most important - should catch most pet supply products)
          'pet', 'dog', 'cat', 'puppy', 'kitten', 'canine', 'feline',
          // Pet food (various formats)
          'dog food', 'cat food', 'pet food', 'dog treats', 'cat treats', 'pet treats', 'kibble', 'wet food', 'dry food', 'food', 'treats',
          // Pet toys (various formats)
          'dog toy', 'cat toy', 'pet toy', 'chew toy', 'interactive toy', 'toy',
          // Pet beds and accessories
          'dog bed', 'cat bed', 'pet bed', 'dog crate', 'cat carrier', 'pet carrier', 'bed', 'crate', 'carrier',
          // Pet collars and leashes
          'dog leash', 'cat leash', 'pet leash', 'dog collar', 'cat collar', 'pet collar', 'harness', 'leash', 'collar',
          // Pet bowls and feeders
          'dog bowl', 'cat bowl', 'pet bowl', 'water bowl', 'food bowl', 'feeder', 'automatic feeder', 'bowl',
          // Pet care and grooming
          'pet shampoo', 'dog shampoo', 'cat shampoo', 'pet brush', 'dog brush', 'cat brush', 'grooming', 'shampoo', 'brush',
          // Pet supplies general
          'pet supplies', 'pet care', 'pet accessories', 'pet products', 'supplies', 'care', 'accessories',
          // Brand names that are pet-specific
          'purina', 'pedigree', 'whiskas', 'friskies', 'iams', 'hills', 'royal canin', 'blue buffalo', 'wellness', 'taste of the wild', 'science diet', 'nutro', 'orijen', 'acana',
        ],
        'video-games': [
          // CRITICAL: Video games category should ONLY show actual games (software), not consoles/hardware
          // Core keywords for video games (actual games, not hardware)
          'video game', 'game', 'pc game', 'steam game', 'epic game',
          // Platform-specific games (but NOT the console itself)
          'playstation game', 'ps4 game', 'ps5 game', 'xbox game', 'xbox one game', 'xbox series game',
          'nintendo switch game', 'nintendo game', 'wii game', 'wii u game',
          // Game types
          'action game', 'adventure game', 'rpg', 'role-playing game', 'strategy game', 'simulation game',
          'sports game', 'racing game', 'fighting game', 'shooter game', 'puzzle game', 'indie game',
          // Digital distribution platforms (games, not hardware)
          'steam', 'epic games', 'origin', 'uplay', 'gog', 'battle.net',
          // Game formats
          'game disc', 'game cartridge', 'game download', 'digital game', 'physical game',
          // Popular game franchises (these are actual games)
          'call of duty', 'fifa', 'madden', 'nba 2k', 'grand theft auto', 'gta', 'minecraft', 'fortnite',
          'assassin\'s creed', 'the elder scrolls', 'skyrim', 'fallout', 'red dead redemption',
          'god of war', 'spider-man', 'horizon', 'uncharted', 'the last of us',
          'halo', 'gears of war', 'forza', 'gears', 'sea of thieves',
          'zelda', 'mario', 'pokemon', 'animal crossing', 'super smash bros', 'splatoon',
          // Game accessories that are game-related (not console hardware)
          'game guide', 'strategy guide', 'game case', 'game storage',
        ],
      };
      
      const allowKeywords = categoryAllowLists[catSlug];
      if (allowKeywords && allowKeywords.length > 0) {
        // ALLOW LIST: Product must contain at least one keyword
        const matches = allowKeywords.some(keyword => productNameLower.includes(keyword.toLowerCase()));
        
        // SPECIAL CASE for video-games: Be more lenient - if product doesn't match allow list,
        // still allow it if it doesn't match exclude terms (consoles/hardware)
        // This prevents over-filtering of valid game titles that don't contain "game" keyword
        if (catSlug === 'video-games' && !matches) {
          // Check if it's clearly a console or hardware (should be excluded)
          const isConsole = productNameLower.includes('console') ||
                           productNameLower.includes('ps5') ||
                           productNameLower.includes('playstation 5') ||
                           (productNameLower.includes('playstation') && !productNameLower.includes('game') && !productNameLower.includes('disc')) ||
                           productNameLower.includes('xbox series') ||
                           productNameLower.includes('xbox one') ||
                           productNameLower.includes('xbox 360') ||
                           (productNameLower.includes('xbox') && !productNameLower.includes('game') && !productNameLower.includes('disc')) ||
                           productNameLower.includes('nintendo switch console') ||
                           productNameLower.includes('nintendo switch oled') ||
                           productNameLower.includes('nintendo switch lite') ||
                           (productNameLower.includes('nintendo switch') && !productNameLower.includes('game') && !productNameLower.includes('cartridge')) ||
                           productNameLower.includes('nintendo wii') ||
                           productNameLower.includes('nintendo wii u') ||
                           productNameLower.includes('gaming console') ||
                           productNameLower.includes('game console');
          
          const isHardware = productNameLower.includes('controller') ||
                            productNameLower.includes('gaming headset') ||
                            productNameLower.includes('gaming keyboard') ||
                            productNameLower.includes('gaming mouse') ||
                            productNameLower.includes('gaming monitor') ||
                            productNameLower.includes('gaming chair') ||
                            productNameLower.includes('gaming pc') ||
                            productNameLower.includes('gaming laptop') ||
                            productNameLower.includes('gaming desktop');
          
          // If it's NOT a console/hardware, allow it (might be a game title without "game" keyword)
          if (!isConsole && !isHardware) {
            return true; // Allow it - it's likely a game
          }
          // If it IS a console/hardware, reject it
          return false;
        }
        
        // For other categories with allow lists, require a match
        return matches;
      }
      
      // EXCLUDE LIST approach: For other categories, exclude if it matches exclude terms
      // BUT: pet-supplies uses ALLOW LIST, so skip exclude check for pet-supplies
      if (catSlug === 'pet-supplies') {
        // pet-supplies uses ALLOW LIST only - if we got here, it didn't match allow list
        // So it should be excluded
        return false;
      }
      
      const categoryExcludeTerms = excludeTerms[catSlug] || [];
      
      // If category has no exclude terms defined, be lenient - allow the product
      // This prevents over-filtering for categories like kitchen, electronics, etc.
      // CRITICAL: This ensures categories without exclude lists (kitchen, electronics, etc.) show products
      if (categoryExcludeTerms.length === 0) {
        this.devLog(`✅ Allowing "${productName}" for ${catSlug} - category has no exclude terms (lenient mode)`);
        return true; // No exclude terms = allow product
      }
      
      const lowerExcludeTerms = categoryExcludeTerms.map(t => t.toLowerCase());
      
      // For categories with exclude terms, use normal exclude logic
      const shouldExclude = lowerExcludeTerms.some(term => productNameLower.includes(term));
      if (shouldExclude) {
        this.devLog(`🚫 Filtering out "${productName}" for ${catSlug} - matches exclude term`);
      }
      return !shouldExclude;
    };

    // Filter products that actually have valid images AND real prices AND exclude test products AND category-irrelevant products
    const productsWithValidImages = productsWithImages.filter(p => {
      const productName = (p.name || '').toLowerCase();
      
      // EXCLUDE TEST PRODUCTS
      if (productName.includes('test product')) {
        console.log(`🚫 Filtering out test product: "${p.name}"`);
        return false;
      }
      
      // EXCLUDE CATEGORY-IRRELEVANT PRODUCTS (e.g., PS5 in beauty, shirts in beauty, cleaners in mattresses)
      if (categorySlug) {
        const categoryExcludeTerms = excludeTerms[categorySlug] || [];
        const lowerExcludeTerms = categoryExcludeTerms.map(t => t.toLowerCase());
        if (!shouldAllowProduct(productName, categorySlug)) {
          this.devLog(`🚫 Filtered out "${p.name}" from ${categorySlug} - does not match allow list or matches exclude list`);
          console.warn(`🚫 [${categorySlug}] FILTERING OUT product: "${p.name}"`);
          return false;
        }
      }
      
      // CRITICAL: Only include products with REAL prices from stores (no fake prices in production)
      const productHasRealPrices = hasRealPrices(p);
      
      if (!productHasRealPrices) {
        console.log(`🚫 Filtering out "${p.name}" - no real prices from stores`);
        return false;
      }
      
      // Don't filter out products without images - frontend will show placeholders
      // Only require real prices (products must have prices from stores)
      return productHasRealPrices; // Must have real prices (images optional - frontend handles placeholders)
    });

    // Start with products that have valid images
    // DEDUPLICATE: Remove duplicate products by name (case-insensitive)
    const uniqueProducts = new Map<string, any>();
    for (const product of productsWithValidImages) {
      const productName = (product.name || '').toLowerCase().trim();
      if (!uniqueProducts.has(productName)) {
        uniqueProducts.set(productName, product);
      }
    }
    let initialDeduplicatedProducts = Array.from(uniqueProducts.values());
    
    // CRITICAL: If database is completely empty (0 products), we MUST fetch from Serper/SerpAPI
    const productApiKey = this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY || this.configService.get<string>('SERPAPI_KEY');
    if (initialDeduplicatedProducts.length === 0 && categorySlug) {
      if (productApiKey) {
        this.devLog(`🚨 DATABASE IS EMPTY for ${categorySlug} - immediately fetching from Serper/SerpAPI`);
        // This will be handled by the API fetch logic below, but we log it here for visibility
      } else {
        console.error(`❌ CRITICAL: Database is empty for ${categorySlug} but SERPER_API_KEY and SERPAPI_KEY are missing!`);
      }
    }
    
    let finalProducts = initialDeduplicatedProducts.slice(0, limit);
    
    // If we don't have enough products with images, get more
    if (finalProducts.length < limit) {
      const remainingNeeded = minLimit - finalProducts.length;
      // Ensure test products are excluded in additional query too
      const additionalWhere: Prisma.ProductWhereInput = {
        ...where,
        AND: [
          ...(Array.isArray(where.AND) ? where.AND : []),
          {
            name: {
              not: {
                contains: 'Test Product',
              },
            },
          },
        ],
      };
      const additionalProducts = await this.prisma.product.findMany({
        where: additionalWhere,
        include: {
          category: true,
          prices: {
            include: { store: true },
            orderBy: { price: 'asc' },
          },
        },
        orderBy: [
          { searchCount: 'desc' },
          { viewCount: 'desc' },
        ],
        take: remainingNeeded * 2, // Get more to filter
        skip: productsWithValidImages.length,
      });

      // Filter additional products for valid images AND exclude category-irrelevant products
      const additionalWithImages = additionalProducts.filter(p => {
        const productName = (p.name || '').toLowerCase();
        
        // EXCLUDE TEST PRODUCTS
        if (productName.includes('test product')) {
          return false;
        }
        
        // EXCLUDE CATEGORY-IRRELEVANT PRODUCTS
        if (categorySlug) {
          const categoryExcludeTerms = excludeTerms[categorySlug] || [];
          const lowerExcludeTerms = categoryExcludeTerms.map(t => t.toLowerCase());
          if (lowerExcludeTerms.some(term => productName.includes(term))) {
            this.devLog(`🚫 Filtered out "${p.name}" from ${categorySlug} - contains exclude term`);
            return false;
          }
        }
        
        // Don't filter out products without images - frontend will show placeholders
        // Only check for real prices
        
        // Accept any http(s) image including placeholders (frontend can display them)
        const validImage = p.images.some((img: string) => 
          img && typeof img === 'string' && 
          img.trim().length > 0 && 
          (img.startsWith('http://') || img.startsWith('https://')) &&
          !img.includes('example.com') // Only exclude test URLs
        );
        
        return validImage;
      });
      
      // Combine products with images
      finalProducts = [...productsWithValidImages, ...additionalWithImages].slice(0, limit);
    }
    
    // Check if any products still need images and fetch replacements from PriceAPI
    const productsNeedingReplacement = finalProducts.filter(p => {
      // Don't filter out products without images - frontend will show placeholders
      // Continue to check for real prices
      
      const validImage = p.images.some((img: string) => 
        img && typeof img === 'string' && 
        img.trim().length > 0 && 
        (img.startsWith('http://') || img.startsWith('https://')) &&
        !img.includes('placeholder') &&
        !img.includes('via.placeholder')
      );
      
      return !validImage;
    });

    // If we have products without images and PriceAPI is enabled, fetch replacements
    if (productsNeedingReplacement.length > 0 && this.priceApiService.isEnabled() && categorySlug) {
      console.log(`🖼️ Found ${productsNeedingReplacement.length} products without images, fetching replacements from PriceAPI...`);
      
      // Get category-specific search terms
      const categorySearchTerms: Record<string, string[]> = {
        electronics: ['laptop', 'smartphone', 'headphones', 'tablet', 'smartwatch', 'tv', 'monitor', 'keyboard', 'mouse', 'speaker'],
        // IMPORTANT: Avoid ambiguous grocery terms like "apple" (can return iPhones on SerpAPI).
        groceries: [
          'apple fruit',
          'banana fruit',
          'whole milk gallon',
          'sandwich bread loaf',
          'large eggs dozen',
          'chicken breast',
          'navel orange fruit',
          'roma tomato',
          'romaine lettuce',
          'cheddar cheese',
        ],
        kitchen: ['blender', 'microwave', 'coffee maker', 'toaster', 'mixer', 'air fryer', 'pressure cooker', 'rice cooker'],
        clothing: ['t-shirt', 'jeans', 'dress', 'jacket', 'sweater', 'shirt', 'pants', 'shorts'],
        footwear: ['sneakers', 'boots', 'sandals', 'heels', 'flip flops', 'running shoes'],
        books: ['novel', 'fiction book', 'mystery book', 'biography', 'self-help book'],
        household: ['detergent', 'paper towels', 'trash bags', 'cleaning supplies', 'batteries'],
        medicine: ['vitamins', 'pain reliever', 'bandages', 'first aid kit'],
        'beauty-products': ['shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation'],
        beauty: ['shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'mascara', 'eyeshadow', 'blush', 'concealer'],
        'video-games': [
          // CRITICAL: Start with GENERIC terms first to ensure we get results, then specific titles
          // Generic terms (most likely to return results from SerpAPI)
          'video game', 'game', 'pc game', 'steam game', 'epic game',
          'playstation game', 'xbox game', 'nintendo switch game',
          // Popular game franchises (specific titles - these may not always return results)
          'call of duty', 'fifa', 'madden', 'nba 2k', 'grand theft auto', 'minecraft', 'fortnite',
          'assassin\'s creed', 'the elder scrolls', 'skyrim', 'fallout', 'god of war', 'spider-man',
          'halo', 'gears of war', 'forza', 'zelda', 'mario', 'pokemon', 'animal crossing',
        ],
        sports: ['basketball', 'football', 'tennis racket', 'yoga mat', 'dumbbells'],
        'sports-equipment': ['basketball', 'football', 'tennis racket', 'yoga mat', 'dumbbells', 'running shoes', 'soccer ball', 'baseball bat', 'golf clubs', 'treadmill', 'exercise bike', 'weights', 'resistance bands', 'jump rope'],
        office: ['printer', 'scanner', 'stapler', 'paper clips', 'notebook'],
        furniture: ['sofa', 'chair', 'table', 'desk', 'bed', 'wardrobe'],
        mattresses: ['mattress', 'memory foam mattress', 'spring mattress', 'hybrid mattress', 'latex mattress', 'mattress topper', 'mattress pad', 'bed mattress'],
        'home-accessories': ['wall art', 'picture frame', 'plant', 'throw pillow', 'decorative bowl', 'lamp', 'vase', 'candle', 'pillow', 'blanket', 'curtain', 'rug', 'mirror'],
        tools: ['drill', 'hammer', 'screwdriver', 'wrench', 'toolbox'],
        'pet-supplies': ['dog food', 'cat food', 'pet food', 'dog toy', 'cat toy', 'pet toy', 'dog bed', 'cat bed', 'pet bed', 'dog leash', 'cat leash', 'pet leash', 'dog collar', 'cat collar', 'pet collar', 'dog bowl', 'cat bowl', 'pet bowl', 'dog crate', 'cat carrier', 'pet carrier', 'dog treats', 'cat treats', 'pet treats'],
      };
      
      const searchTerms = categorySearchTerms[categorySlug] || ['product', 'item'];
      const replacementProducts: any[] = [];
      const seenProductNames = new Set(finalProducts.map(p => (p.name || '').toLowerCase().trim()));
      
      // Fetch replacement products from PriceAPI
      for (const term of searchTerms.slice(0, productsNeedingReplacement.length * 2)) {
        if (replacementProducts.length >= productsNeedingReplacement.length) break;
        
        try {
          const apiResults = await this.priceApiService.searchProducts(term, { limit: 2 });
          if (apiResults && apiResults.length > 0) {
            for (const apiProduct of apiResults) {
              if (replacementProducts.length >= productsNeedingReplacement.length) break;
              
              // Check for valid image
              const productImage = apiProduct.image || (apiProduct as any).imageUrl || (apiProduct as any).images?.[0] || '';
              if (!productImage || !productImage.startsWith('http')) {
                continue; // Skip products without valid images
              }
              
              // Check for duplicates
              const normalizedName = (apiProduct.name || '').toLowerCase().trim();
              if (seenProductNames.has(normalizedName)) {
                continue;
              }
              
              try {
                // Save to database
                const savedProduct = await this.autoSaveProductFromAPI(
                  apiProduct,
                  apiProduct.barcode || null,
                  [apiProduct],
                  categorySlug,
                  subcategory,
                );
                
                if (savedProduct) {
                  replacementProducts.push(savedProduct);
                  seenProductNames.add(normalizedName);
                  console.log(`✅ Replaced product without image: "${apiProduct.name}"`);
                }
              } catch (error) {
                console.log(`⚠️ Could not save replacement product: ${error.message}`);
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ PriceAPI search failed for ${term}: ${error.message}`);
        }
      }
      
      // Replace products without images with fetched ones
      if (replacementProducts.length > 0) {
        let replacementIndex = 0;
        finalProducts = finalProducts.map(p => {
          const needsReplacement = productsNeedingReplacement.some(pr => pr.id === p.id);
          if (needsReplacement && replacementIndex < replacementProducts.length) {
            const replacement = replacementProducts[replacementIndex++];
            console.log(`🔄 Replacing "${p.name}" with "${replacement.name}"`);
            return replacement;
          }
          return p;
        });
        
        // If we still need more products, add remaining replacements
        while (finalProducts.length < limit && replacementIndex < replacementProducts.length) {
          finalProducts.push(replacementProducts[replacementIndex++]);
        }
      }
    }
    
    // FINAL VALIDATION: Filter out products without real prices and test products before returning
    // NOTE: Don't filter out products without images - frontend will show placeholders
    const productsWithValidImagesFinal = finalProducts.filter(p => {
      // EXCLUDE TEST PRODUCTS
      const productName = (p.name || '').toLowerCase();
      if (productName.includes('test product')) {
        console.log(`🚫 Filtering out test product: "${p.name}"`);
        return false;
      }
      
      // CRITICAL: Only include products with REAL prices from stores (no fake prices in production)
      const productHasRealPrices = hasRealPrices(p);
      
      if (!productHasRealPrices) {
        console.log(`🚫 Filtering out "${p.name}" - no real prices from stores`);
        return false;
      }
      
      // Don't filter out products without images - frontend will show placeholders
      return productHasRealPrices; // Only require real prices (images optional)
    });
    
    // DEDUPLICATE: Remove duplicate products by name (case-insensitive) to prevent showing same product multiple times
    // ALSO FILTER OUT CATEGORY-IRRELEVANT PRODUCTS (guitars, PS5, etc.) BEFORE checking if we need to fetch from APIs
    const uniqueFinalProducts = new Map<string, any>();
    for (const product of productsWithValidImagesFinal) {
      const productName = (product.name || '').toLowerCase().trim();
      
      // ALLOW LIST or EXCLUDE LIST: Check if product should be allowed BEFORE DEDUPLICATION
      if (categorySlug && !shouldAllowProduct(productName, categorySlug)) {
        this.devLog(`🚫 Filtered out "${product.name}" from ${categorySlug} - does not match allow list or matches exclude list (before deduplication)`);
        continue; // Skip this product
      }
      
      if (!uniqueFinalProducts.has(productName)) {
        uniqueFinalProducts.set(productName, product);
      } else {
        console.log(`🔄 Removing duplicate product: "${product.name}"`);
      }
    }
    const deduplicatedProducts = Array.from(uniqueFinalProducts.values());
    
    // CRITICAL: If database is empty (0 products) OR we don't have enough products, fetch from SerpAPI
    // Client paid for SerpAPI, so use it when database is empty or insufficient
    const databaseIsEmpty = deduplicatedProducts.length === 0;
    const needsMoreProductsFromAPI = deduplicatedProducts.length < limit;
    
    if ((databaseIsEmpty || needsMoreProductsFromAPI) && categorySlug) {
      // Enable product API when either Serper or SerpAPI key is set (so Serper-only env works)
      const productApiEnabled = !!(this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY || this.configService.get<string>('SERPAPI_KEY'));
      
      if (databaseIsEmpty) {
        this.devLog(`🚨 DATABASE IS EMPTY for ${categorySlug} - fetching from Serper/SerpAPI`);
      } else {
        this.devLog(`🔍 API Status Check for ${categorySlug}: Serper/SerpAPI=${productApiEnabled}`);
        this.devLog(`🖼️ Only ${deduplicatedProducts.length}/${limit} products have valid images, fetching ${limit - deduplicatedProducts.length} more from Serper/SerpAPI...`);
      }
      
      if (productApiEnabled) {
      
      const categorySearchTerms: Record<string, string[]> = {
        electronics: ['laptop', 'smartphone', 'headphones', 'tablet', 'smartwatch', 'tv', 'monitor', 'keyboard', 'mouse', 'speaker'],
        // IMPORTANT: Avoid ambiguous grocery terms like "apple" (can return iPhones on SerpAPI).
        groceries: [
          'apple fruit',
          'banana fruit',
          'whole milk gallon',
          'sandwich bread loaf',
          'large eggs dozen',
          'chicken breast',
          'navel orange fruit',
          'roma tomato',
          'romaine lettuce',
          'cheddar cheese',
        ],
        kitchen: ['blender', 'microwave', 'coffee maker', 'toaster', 'mixer', 'air fryer', 'pressure cooker', 'rice cooker'],
        clothing: ['t-shirt', 'jeans', 'dress', 'jacket', 'sweater', 'shirt', 'pants', 'shorts'],
        footwear: ['sneakers', 'boots', 'sandals', 'heels', 'flip flops', 'running shoes'],
        books: ['novel', 'fiction book', 'mystery book', 'biography', 'self-help book'],
        household: ['detergent', 'paper towels', 'trash bags', 'cleaning supplies', 'batteries'],
        medicine: ['vitamins', 'pain reliever', 'bandages', 'first aid kit'],
        'beauty-products': ['shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation'],
        beauty: ['shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'mascara', 'eyeshadow', 'blush', 'concealer'],
        'video-games': [
          // CRITICAL: Start with GENERIC terms first to ensure we get results, then specific titles
          // Generic terms (most likely to return results from SerpAPI)
          'video game', 'game', 'pc game', 'steam game', 'epic game',
          'playstation game', 'xbox game', 'nintendo switch game',
          // Popular game franchises (specific titles - these may not always return results)
          'call of duty', 'fifa', 'madden', 'nba 2k', 'grand theft auto', 'minecraft', 'fortnite',
          'assassin\'s creed', 'the elder scrolls', 'skyrim', 'fallout', 'god of war', 'spider-man',
          'halo', 'gears of war', 'forza', 'zelda', 'mario', 'pokemon', 'animal crossing',
        ],
        sports: ['basketball', 'football', 'tennis racket', 'yoga mat', 'dumbbells'],
        'sports-equipment': ['basketball', 'football', 'tennis racket', 'yoga mat', 'dumbbells', 'running shoes', 'soccer ball', 'baseball bat', 'golf clubs', 'treadmill', 'exercise bike', 'weights', 'resistance bands', 'jump rope'],
        office: ['printer', 'scanner', 'stapler', 'paper clips', 'notebook'],
        furniture: ['sofa', 'chair', 'table', 'desk', 'bed', 'wardrobe'],
        mattresses: ['mattress', 'memory foam mattress', 'spring mattress', 'hybrid mattress', 'latex mattress', 'mattress topper', 'mattress pad', 'bed mattress'],
        'home-accessories': ['wall art', 'picture frame', 'plant', 'throw pillow', 'decorative bowl', 'lamp', 'vase', 'candle', 'pillow', 'blanket', 'curtain', 'rug', 'mirror'],
        tools: ['drill', 'hammer', 'screwdriver', 'wrench', 'toolbox'],
        'pet-supplies': ['dog food', 'cat food', 'pet food', 'dog toy', 'cat toy', 'pet toy', 'dog bed', 'cat bed', 'pet bed', 'dog leash', 'cat leash', 'pet leash', 'dog collar', 'cat collar', 'pet collar', 'dog bowl', 'cat bowl', 'pet bowl', 'dog crate', 'cat carrier', 'pet carrier', 'dog treats', 'cat treats', 'pet treats'],
      };
      
      const searchTerms = categorySearchTerms[categorySlug] || ['product', 'item'];
      const additionalProducts: any[] = [];
      const seenNames = new Set(deduplicatedProducts.map(p => (p.name || '').toLowerCase().trim()));
      // Track used images to prevent duplicates
      const seenImages = new Set<string>();
      const needed = limit - deduplicatedProducts.length;
      
      // Fetch MORE products than needed to account for filtering (fetch 2x to ensure we get enough after filtering)
      const fetchTarget = Math.max(needed * 2, 10); // Fetch at least 10 products to ensure we get enough
      this.devLog(`📊 Fetching strategy: Need ${needed} products, will fetch up to ${fetchTarget} to account for filtering`);
      
      // Helper function to save product from API result
      const saveProductFromAPI = async (apiProduct: any, source: 'priceapi' | 'serpapi') => {
        if (additionalProducts.length >= fetchTarget) return;
        
        // EXCLUDE TEST PRODUCTS - Check name first before processing
        const productName = (apiProduct.name || apiProduct.title || '').toLowerCase().trim();
        if (productName.includes('test product')) {
          console.log(`🚫 Skipping test product from API: "${apiProduct.name || apiProduct.title}"`);
          return;
        }
        
        // ALLOW LIST or EXCLUDE LIST: Check if product should be allowed before saving
        if (categorySlug && !shouldAllowProduct(productName, categorySlug)) {
          this.devLog(`🚫 Filtered out "${apiProduct.name || apiProduct.title}" from ${categorySlug} API fetch - does not match allow list or matches exclude list`);
          return;
        }
        
        // Extract image from multiple possible fields - SerpAPI provides thumbnail or image
        // CRITICAL: Always extract image from SerpAPI - it should have thumbnail field
        let productImage = apiProduct.thumbnail || apiProduct.image || (apiProduct as any).imageUrl || (apiProduct as any).images?.[0] || '';
        
        // If image is missing, try to get it from the first shopping result
        if (!productImage || typeof productImage !== 'string' || !productImage.trim()) {
          // SerpAPI shopping_results should always have thumbnail - log warning
          console.log(`⚠️ Product "${apiProduct.name || apiProduct.title}" missing image from SerpAPI - this shouldn't happen`);
          // Skip products without images - user wants real images only
          return;
        }
        
        // Ensure image URL is valid (starts with http/https)
        if (!productImage.startsWith('http://') && !productImage.startsWith('https://')) {
          // Try to fix protocol-relative URLs
          if (productImage.startsWith('//')) {
            productImage = `https:${productImage}`;
          } else {
            console.log(`⚠️ Invalid image URL format for "${apiProduct.name || apiProduct.title}": ${productImage}`);
            return; // Skip invalid image URLs
          }
        }
        
        // Only exclude test URLs, not placeholders (but user wants real images, so we'll skip placeholders)
        if (productImage.includes('example.com')) {
          console.log(`🚫 Skipping product with test image URL: "${apiProduct.name || apiProduct.title}"`);
          return;
        }
        
        const normalizedName = productName;
        if (seenNames.has(normalizedName)) return;
        
        // CRITICAL: Ensure unique images - don't use same image for different products
        const normalizedImage = productImage ? productImage.trim().toLowerCase() : '';
        if (normalizedImage && seenImages.has(normalizedImage)) {
          console.log(`🔄 Skipping product "${apiProduct.name || apiProduct.title}" - image already used by another product`);
          return;
        }
        
        try {
          // Ensure category exists before saving product
          let targetCategory = categoryId ? await this.prisma.category.findUnique({ where: { id: categoryId } }) : null;
          if (!targetCategory && categorySlug) {
            const categoryNameMap: Record<string, string> = {
              'kitchen': 'Kitchen & Appliances',
              'home-accessories': 'Home Accessories & Decor',
              'beauty-products': 'Beauty Products',
              beauty: 'Beauty Products',
              'video-games': 'Video Games',
              'home-decor': 'Home Accessories & Decor', // Merged into Home Accessories
              'pet-supplies': 'Pet Supplies',
            };
            const categoryName = categoryNameMap[categorySlug] || categorySlug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            targetCategory = await this.prisma.category.upsert({
              where: { slug: categorySlug },
              update: {},
              create: {
                name: categoryName,
                slug: categorySlug,
                icon: '📦',
                description: `Compare prices for ${categoryName.toLowerCase()}`,
                enabled: true,
              },
            });
            this.devLog(`✅ Ensured category "${categorySlug}" exists for API product`);
          }
          
          // Convert SerpAPI format to PriceAPI-like format for saving
          // CRITICAL: SerpAPI products have MULTIPLE store prices - include them ALL for price comparison
          // CRITICAL: Ensure image is properly extracted - SerpAPI provides thumbnail field
          const serpApiImage = apiProduct.thumbnail || apiProduct.image || '';
          const productToSave = source === 'serpapi' ? {
            name: apiProduct.name || apiProduct.title,
            image: serpApiImage, // Use thumbnail first (SerpAPI's primary image field)
            images: serpApiImage ? [serpApiImage] : [], // Ensure images array is set
            price: apiProduct.price || 0,
            url: apiProduct.url || apiProduct.link || '',
            store: apiProduct.store || 'Unknown',
            barcode: null,
            // Include ALL store prices from SerpAPI (Walmart, Target, Best Buy, etc.)
            // This is critical - SerpAPI returns prices from 20+ stores, we need to save them all
            storePrices: apiProduct.storePrices || [],
          } : apiProduct;
          
          // Log how many stores we're saving for SerpAPI products
          if (source === 'serpapi' && productToSave.storePrices && productToSave.storePrices.length > 0) {
            console.log(`🛒 SerpAPI product "${productToSave.name}" has ${productToSave.storePrices.length} store prices: ${productToSave.storePrices.map((sp: any) => sp.store).join(', ')}`);
          }
          
          const savedProduct = await this.autoSaveProductFromAPI(
            productToSave,
            productToSave.barcode || null,
            [productToSave],
            categorySlug,
            subcategory,
          );
          
          if (savedProduct) {
            // CRITICAL: Only add products with REAL prices from stores AND valid images
            const productHasRealPrices = hasRealPrices(savedProduct);
            
            if (!productHasRealPrices) {
              console.log(`🚫 Skipping "${productToSave.name || productToSave.title}" - no real prices saved from ${source.toUpperCase()}`);
              return;
            }
            
            const savedImage = savedProduct.images && Array.isArray(savedProduct.images) && savedProduct.images.length > 0
              ? savedProduct.images[0]
              : null;
            // ACCEPT ALL VALID IMAGES - including placeholders if that's what SerpAPI returned
            // User wants images shown, so accept any valid HTTP URL
            if (savedImage && typeof savedImage === 'string' && savedImage.startsWith('http') && !savedImage.includes('example.com')) {
              // Track this image to prevent duplicates
              seenImages.add(savedImage.trim().toLowerCase());
              additionalProducts.push(savedProduct);
              seenNames.add(normalizedName);
              console.log(`✅ Added product with REAL prices and UNIQUE image from ${source.toUpperCase()}: "${productToSave.name || productToSave.title}" (${additionalProducts.length}/${fetchTarget}, need ${needed})`);
            } else {
              console.log(`⚠️ Saved product missing image, skipping: "${productToSave.name || productToSave.title}"`);
              console.log(`   Image value: ${savedImage} (type: ${typeof savedImage})`);
              console.log(`   Images array: ${JSON.stringify(savedProduct.images)}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not save product from ${source}: ${error.message}`);
        }
      };
      
      // When DB is empty, cap terms so first load returns faster (e.g. groceries: 4 Serper calls ~10–15s vs 10 calls ~30s+)
      const maxTermsToSearch = databaseIsEmpty
        ? Math.min(4, searchTerms.length)
        : Math.min(searchTerms.length, Math.max(needed * 3, 10));
      this.devLog(`🔍 Will search ${maxTermsToSearch} terms to find ${needed} products${databaseIsEmpty ? ' (DB empty, capped for faster first load)' : ''}`);
      
      for (const term of searchTerms.slice(0, maxTermsToSearch)) {
        if (additionalProducts.length >= fetchTarget) break;
        
        // PRIMARY: Try SerpAPI first (multi-store results)
        // Fetch MORE products per term to account for filtering
        if (productApiEnabled) {
          try {
            const productsPerTerm = Math.min(5, Math.ceil(fetchTarget / maxTermsToSearch) + 2); // Fetch more per term
            const serpApiResults = await this.searchProductsFromSerpAPI(term, productsPerTerm, categorySlug);
            if (serpApiResults && serpApiResults.length > 0) {
              // Filter results by category to remove irrelevant products (guitars, etc.)
              const filteredResults = categorySlug 
                ? this.filterSerpAPIResultsByCategory(serpApiResults, categorySlug, term)
                : serpApiResults;
              
              this.devLog(`🛒 SerpAPI found ${serpApiResults.length} products, ${filteredResults.length} after category filtering for "${term}"`);
              for (const apiProduct of filteredResults) {
                await saveProductFromAPI(apiProduct, 'serpapi');
                if (additionalProducts.length >= fetchTarget) break;
              }
            }
          } catch (error) {
            console.log(`⚠️ SerpAPI search failed for ${term}: ${error.message}`);
          }
        }
        
        // CRITICAL: Client paid for SerpAPI, NOT PriceAPI - skip PriceAPI completely
        // PriceAPI is showing 402 errors (not enough free credits) - use SerpAPI only
        // FALLBACK: Use PriceAPI only if SerpAPI is disabled (shouldn't happen - client paid for SerpAPI)
        const priceApiEnabled = this.priceApiService.isEnabled();
        if (false && additionalProducts.length < fetchTarget && priceApiEnabled) {
          try {
            const remainingTerms = Math.max(1, maxTermsToSearch - searchTerms.indexOf(term));
            const priceApiLimit = Math.min(5, Math.max(2, Math.ceil((fetchTarget - additionalProducts.length) / remainingTerms)));
            const priceApiResults = await this.priceApiService.searchProducts(term, { limit: priceApiLimit });
            if (priceApiResults && priceApiResults.length > 0) {
              this.devLog(`📦 PriceAPI found ${priceApiResults.length} products (Amazon only) for "${term}"`);
              for (const apiProduct of priceApiResults) {
                await saveProductFromAPI(apiProduct, 'priceapi');
                if (additionalProducts.length >= fetchTarget) break;
              }
            }
          } catch (error: any) {
            // Silently skip PriceAPI if it's not paid for (402) - client paid for SerpAPI, not PriceAPI
            if (error?.message?.includes('402') || error?.message?.includes('not enough free credits')) {
              console.log(`ℹ️ PriceAPI not available (not paid). Using SerpAPI only for "${term}"`);
            } else {
              console.log(`⚠️ PriceAPI search failed for ${term}: ${error.message}`);
            }
          }
        }
      }
      
      // Combine products with valid images and deduplicate again
      const combinedProducts = [...deduplicatedProducts, ...additionalProducts];
      const uniqueCombined = new Map<string, any>();
      for (const product of combinedProducts) {
        const productName = (product.name || '').toLowerCase().trim();
        
        // ALLOW LIST or EXCLUDE LIST: Check if product should be allowed
        if (categorySlug && !shouldAllowProduct(productName, categorySlug)) {
          this.devLog(`🚫 Filtered out "${product.name}" from combined list - does not match allow list or matches exclude list`);
          continue;
        }
        
        if (!uniqueCombined.has(productName)) {
          // CRITICAL: Only include products with REAL prices from stores (no fake prices in production)
          const productHasRealPrices = hasRealPrices(product);
          
          if (!productHasRealPrices) {
            console.log(`🚫 Filtering out "${product.name}" - no real prices from stores`);
            continue; // Skip products without real prices
          }
          
          uniqueCombined.set(productName, product);
        } else {
          console.log(`🔄 Removing duplicate in combined list: "${product.name}"`);
        }
      }
      finalProducts = Array.from(uniqueCombined.values()).slice(0, limit);
      this.devLog(`✅ Final product count with images (deduplicated): ${finalProducts.length}/${limit}`);
    } else {
      // Use deduplicatedProducts - it's declared at line 1305, before this if/else block
      // Both deduplicatedProducts and initialDeduplicatedProducts should be available here
      // Use deduplicatedProducts if available (from the newer code path), otherwise use initialDeduplicatedProducts
      const productsToUse = typeof deduplicatedProducts !== 'undefined' && deduplicatedProducts.length > 0
        ? deduplicatedProducts
        : initialDeduplicatedProducts;
      finalProducts = productsToUse.slice(0, limit);
    }
    } // Close the outer if block from line 589
    
    // CRITICAL: Update products with placeholder images to fetch real images from SerpAPI
    // First, enrich all products
    const enrichedProducts = finalProducts.map((p) => {
      const enriched = this.enrichProductWithPriceCalculations(p);
      return this.normalizeProductImage(enriched);
    });
    
    // Find products with placeholder images
    const productsNeedingImages = enrichedProducts.filter(p => {
      const hasPlaceholderImage = p.images && Array.isArray(p.images) && p.images.length > 0 &&
        p.images.some((img: string) => 
          img && typeof img === 'string' && 
          (img.includes('via.placeholder') || img.includes('placeholder.com'))
        );
      return hasPlaceholderImage;
    });
    
    // Fetch real images in parallel for products with placeholders
    if (productsNeedingImages.length > 0 && categorySlug) {
      const productApiKey = this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY || this.configService.get<string>('SERPAPI_KEY');
      if (productApiKey) {
        this.devLog(`🖼️ Fetching real images for ${productsNeedingImages.length} products with placeholders...`);
        
        // Fetch images in parallel (but limit concurrency to avoid rate limits)
        const imageUpdates = await Promise.allSettled(
          productsNeedingImages.map(async (product) => {
            try {
              const serpApiResults = await this.searchProductsFromSerpAPI(product.name, 1, categorySlug);
              if (serpApiResults && serpApiResults.length > 0) {
                const firstResult = serpApiResults[0];
                if (firstResult.image && firstResult.image.startsWith('http') && !firstResult.image.includes('placeholder')) {
                  return { productId: product.id, productName: product.name, image: firstResult.image };
                }
              }
            } catch (error) {
              // Silently fail - product will show placeholder
            }
            return null;
          })
        );
        
        // Update products with real images
        const imageUpdateMap = new Map<string, string>();
        for (const result of imageUpdates) {
          if (result.status === 'fulfilled' && result.value) {
            const { productId, productName, image } = result.value;
            imageUpdateMap.set(productId, image);
            
            // Update in database for future requests
            try {
              await this.prisma.product.update({
                where: { id: productId },
                data: { images: [image] },
              });
              this.devLog(`✅ Updated product "${productName}" with real image from SerpAPI`);
            } catch (dbError) {
              // Ignore database update errors
            }
          }
        }
        
        // Update enriched products with real images
        enrichedProducts.forEach(product => {
          const realImage = imageUpdateMap.get(product.id);
          if (realImage) {
            product.images = [realImage];
            product.image = realImage;
          }
        });
      }
    }

    // Log what we found (only in dev mode)
    this.devLog(`📚 getPopular results for categorySlug="${categorySlug}": ${enrichedProducts.length}/${limit} products`);
    
    if (enrichedProducts.length === 0) {
      console.warn(`⚠️ NO PRODUCTS RETURNED for ${categorySlug}! Database is empty - should have fetched from SerpAPI above.`);
      
      // CRITICAL: If we still have 0 products after Serper/SerpAPI fetch attempt, try one more time
      const productApiKeyRetry = this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY || this.configService.get<string>('SERPAPI_KEY');
      if (productApiKeyRetry && categorySlug) {
        console.log(`🔄 Retrying Serper/SerpAPI fetch for ${categorySlug} (database is empty)...`);
      }
    }

    // CRITICAL: Client paid for SerpAPI, NOT PriceAPI - skip PriceAPI fallback completely
    // The SerpAPI fetch should have happened above if database was empty or insufficient
    // Only use PriceAPI if SerpAPI is completely disabled (shouldn't happen)
    const needsMoreProductsFinal = enrichedProducts.length < minLimit;
    
    // DISABLED: PriceAPI fallback - client paid for SerpAPI, use SerpAPI only
    if (false && needsMoreProductsFinal && this.priceApiService.isEnabled() && categorySlug) {
      // TypeScript safety: categorySlug is guaranteed to be defined here (checked in if condition)
      const safeCategorySlugForSearch: string = categorySlug || ''; // Ensure it's always a string
      
      console.log(`📡 Not enough products in database (${enrichedProducts.length}/${limit}) for ${safeCategorySlugForSearch}${subcategory ? `, subcategory="${subcategory}"` : ''}, fetching from PriceAPI...`);
      
      // For books and household categories, ensure we always try to fetch even if database has 0 products
      if (safeCategorySlugForSearch === 'books' && enrichedProducts.length === 0) {
        console.log(`📚 Books category: Database has 0 products, fetching from PriceAPI with book search terms...`);
      }
      if (safeCategorySlugForSearch === 'household' && enrichedProducts.length === 0) {
        console.log(`🏠 Household category: Database has 0 products, fetching from PriceAPI with household search terms...`);
      }
      
      // Get category-specific search terms with subcategory mapping
      const categorySearchTerms: Record<string, Array<{ term: string; subcategory?: string }>> = {
        electronics: [
          { term: 'laptop', subcategory: 'laptops' },
          { term: 'smartphone', subcategory: 'tablets' },
          { term: 'headphones', subcategory: 'headphones' },
          { term: 'tablet', subcategory: 'tablets' },
          { term: 'smartwatch', subcategory: 'accessories' },
          { term: 'tv', subcategory: 'tvs' },
        ],
        groceries: [
          { term: 'apple', subcategory: 'produce' },
          { term: 'banana', subcategory: 'produce' },
          { term: 'milk', subcategory: 'dairy' },
          { term: 'bread', subcategory: 'bakery' },
          { term: 'eggs', subcategory: 'dairy' },
          { term: 'chicken', subcategory: 'meat' },
        ],
        books: [
          // Mystery & Thriller - 8 diverse search terms
          { term: 'mystery novel', subcategory: 'mystery' },
          { term: 'thriller book', subcategory: 'mystery' },
          { term: 'detective novel', subcategory: 'mystery' },
          { term: 'crime thriller', subcategory: 'mystery' },
          { term: 'suspense novel', subcategory: 'mystery' },
          { term: 'psychological thriller', subcategory: 'mystery' },
          { term: 'mystery bestseller', subcategory: 'mystery' },
          { term: 'thriller bestseller', subcategory: 'mystery' },
          // Fiction - 8 diverse search terms
          { term: 'fiction novel', subcategory: 'fiction' },
          { term: 'best selling fiction', subcategory: 'fiction' },
          { term: 'literary fiction', subcategory: 'fiction' },
          { term: 'contemporary fiction', subcategory: 'fiction' },
          { term: 'fiction bestseller', subcategory: 'fiction' },
          { term: 'award winning fiction', subcategory: 'fiction' },
          { term: 'fiction book', subcategory: 'fiction' },
          { term: 'novel fiction', subcategory: 'fiction' },
          // Biography - 8 diverse search terms
          { term: 'biography book', subcategory: 'biography' },
          { term: 'autobiography', subcategory: 'biography' },
          { term: 'memoir', subcategory: 'biography' },
          { term: 'biography bestseller', subcategory: 'biography' },
          { term: 'celebrity biography', subcategory: 'biography' },
          { term: 'historical biography', subcategory: 'biography' },
          { term: 'biography memoir', subcategory: 'biography' },
          { term: 'autobiography book', subcategory: 'biography' },
          // Science Fiction - 8 diverse search terms
          { term: 'science fiction book', subcategory: 'sci-fi' },
          { term: 'sci-fi novel', subcategory: 'sci-fi' },
          { term: 'science fiction', subcategory: 'sci-fi' },
          { term: 'sci-fi bestseller', subcategory: 'sci-fi' },
          { term: 'fantasy sci-fi', subcategory: 'sci-fi' },
          { term: 'space opera', subcategory: 'sci-fi' },
          { term: 'dystopian fiction', subcategory: 'sci-fi' },
          { term: 'sci-fi book', subcategory: 'sci-fi' },
          // Romance - 8 diverse search terms
          { term: 'romance novel', subcategory: 'romance' },
          { term: 'romance book', subcategory: 'romance' },
          { term: 'romance bestseller', subcategory: 'romance' },
          { term: 'contemporary romance', subcategory: 'romance' },
          { term: 'romantic fiction', subcategory: 'romance' },
          { term: 'romance novel bestseller', subcategory: 'romance' },
          { term: 'love story', subcategory: 'romance' },
          { term: 'romance fiction', subcategory: 'romance' },
          // History - 8 diverse search terms
          { term: 'history book', subcategory: 'history' },
          { term: 'historical non-fiction', subcategory: 'history' },
          { term: 'world history', subcategory: 'history' },
          { term: 'american history', subcategory: 'history' },
          { term: 'history bestseller', subcategory: 'history' },
          { term: 'military history', subcategory: 'history' },
          { term: 'history book bestseller', subcategory: 'history' },
          { term: 'historical book', subcategory: 'history' },
          // Self-Help - 8 diverse search terms
          { term: 'self help book', subcategory: 'self-help' },
          { term: 'self-help bestseller', subcategory: 'self-help' },
          { term: 'personal development', subcategory: 'self-help' },
          { term: 'motivational book', subcategory: 'self-help' },
          { term: 'self improvement', subcategory: 'self-help' },
          { term: 'self-help book', subcategory: 'self-help' },
          { term: 'personal growth', subcategory: 'self-help' },
          { term: 'self help bestseller', subcategory: 'self-help' },
          // Non-Fiction - 8 diverse search terms
          { term: 'non fiction book', subcategory: 'non-fiction' },
          { term: 'non-fiction', subcategory: 'non-fiction' },
          { term: 'non-fiction bestseller', subcategory: 'non-fiction' },
          { term: 'nonfiction book', subcategory: 'non-fiction' },
          { term: 'non-fiction book', subcategory: 'non-fiction' },
          { term: 'nonfiction bestseller', subcategory: 'non-fiction' },
          { term: 'non fiction bestseller', subcategory: 'non-fiction' },
          { term: 'non-fiction book bestseller', subcategory: 'non-fiction' },
        ],
        household: [
          { term: 'laundry detergent' },
          { term: 'paper towels' },
          { term: 'trash bags' },
          { term: 'cleaning supplies' },
          { term: 'storage bins' },
          { term: 'light bulbs' },
          { term: 'batteries' },
          { term: 'dish soap' },
          { term: 'sponges' },
          { term: 'toilet paper' },
          { term: 'air freshener' },
          { term: 'broom' },
        ],
        office: [
          { term: 'printer paper' },
          { term: 'stapler' },
          { term: 'paper clips' },
          { term: 'notebook' },
          { term: 'pen' },
          { term: 'pencil' },
          { term: 'folder' },
          { term: 'binder' },
          { term: 'envelope' },
          { term: 'sticky notes' },
          { term: 'tape' },
          { term: 'scissors' },
          { term: 'desk organizer' },
          { term: 'file cabinet' },
          { term: 'office chair' },
          { term: 'desk lamp' },
          { term: 'whiteboard' },
          { term: 'marker' },
          { term: 'highlighters' },
          { term: 'calculator' },
        ],
        mattresses: [
          { term: 'memory foam mattress' },
          { term: 'spring mattress' },
          { term: 'hybrid mattress' },
          { term: 'latex mattress' },
          { term: 'mattress queen' },
          { term: 'mattress king' },
          { term: 'mattress full' },
          { term: 'mattress twin' },
          { term: 'mattress topper' },
          { term: 'mattress pad' },
          { term: 'bed mattress' },
          { term: 'mattress box spring' },
        ],
        'pet-supplies': [
          { term: 'dog food' },
          { term: 'cat food' },
          { term: 'pet food' },
          { term: 'dog toy' },
          { term: 'cat toy' },
          { term: 'pet toy' },
          { term: 'dog bed' },
          { term: 'cat bed' },
          { term: 'pet bed' },
          { term: 'dog leash' },
          { term: 'cat leash' },
          { term: 'pet leash' },
          { term: 'dog collar' },
          { term: 'cat collar' },
          { term: 'pet collar' },
          { term: 'dog bowl' },
          { term: 'cat bowl' },
          { term: 'pet bowl' },
          { term: 'dog crate' },
          { term: 'cat carrier' },
          { term: 'pet carrier' },
          { term: 'dog treats' },
          { term: 'cat treats' },
          { term: 'pet treats' },
        ],
        // Add more categories as needed
      };
      
      // Filter search terms by subcategory if specified
      // Note: categorySlug is already guaranteed to be defined (checked in outer if condition)
      // Use the safe variable we created above
      let searchTerms: Array<{ term: string; subcategory?: string }> = [];
      if (safeCategorySlugForSearch && categorySearchTerms[safeCategorySlugForSearch]) {
        searchTerms = categorySearchTerms[safeCategorySlugForSearch];
      } else {
        searchTerms = [{ term: 'product' }];
      }
      
      if (subcategory) {
        console.log(`🔍 Filtering search terms for subcategory: "${subcategory}"`);
        const originalCount = searchTerms.length;
        searchTerms = searchTerms.filter(st => 
          st.subcategory && st.subcategory.toLowerCase() === (subcategory || '').toLowerCase()
        );
        console.log(`   - Filtered from ${originalCount} to ${searchTerms.length} terms`);
        // If no matching terms found, use all terms but filter results by subcategory
        if (searchTerms.length === 0 && safeCategorySlugForSearch && categorySearchTerms[safeCategorySlugForSearch]) {
          console.log(`   ⚠️ No matching search terms found, using all terms for category`);
          searchTerms = categorySearchTerms[safeCategorySlugForSearch];
        } else if (searchTerms.length === 0) {
          searchTerms = [{ term: 'product' }];
        }
      }
      
      if (categorySlug === 'books') {
        console.log(`📚 Using ${searchTerms.length} search terms for books:`, searchTerms.map(st => st.term).join(', '));
      } else {
        console.log(`📡 Using ${searchTerms.length} search terms for ${categorySlug}:`, searchTerms.map(st => st.term).join(', '));
      }
      
      const allResults: any[] = [];
      const seenProductNames = new Set<string>(); // Track product names to avoid duplicates
      const seenProductImages = new Set<string>(); // Track product images to avoid duplicates
      
      // Fetch products from PriceAPI - fetch enough to get at least 6 unique products
      // For books: fetch 1 product per search term, but ensure diversity
      const productsPerTerm = 1; // Fetch 1 product per search term for diversity
      // For books category, search more terms to ensure we get at least 6 products
      const maxTermsToSearch = categorySlug === 'books' 
        ? Math.min(searchTerms.length, 12) // Search up to 12 terms for books to get 6 products
        : Math.max(searchTerms.length, minLimit * 2); // For other categories, use default logic
      
      console.log(`📚 Will search ${maxTermsToSearch} terms for ${categorySlug} (need ${minLimit} products)`);
      
      for (const { term, subcategory: termSubcategory } of searchTerms.slice(0, maxTermsToSearch)) {
        // Stop if we have enough unique products
        if (allResults.length >= minLimit) {
          console.log(`✅ Got enough products (${allResults.length}/${minLimit}), stopping search`);
          break;
        }
        
        try {
          console.log(`🔍 Searching PriceAPI for "${term}" (${allResults.length}/${minLimit} products so far)...`);
          const apiResults = await this.priceApiService.searchProducts(term, { limit: 3 }); // Fetch 3 to have options
          console.log(`📦 PriceAPI returned ${apiResults?.length || 0} results for "${term}"`);
          if (apiResults && apiResults.length > 0) {
            // Auto-save products to database with correct category and subcategory
            for (const apiProduct of apiResults) {
              // Skip if we already have enough products
              if (allResults.length >= minLimit) break;
              
              // Check for duplicates by name (normalized)
              const normalizedName = (apiProduct.name || '').toLowerCase().trim();
              if (seenProductNames.has(normalizedName)) {
                console.log(`⏭️ Skipping duplicate product by name: "${apiProduct.name}"`);
                continue;
              }
              
              // Check for duplicates by image URL and validate image
              const productImage = apiProduct.image || (apiProduct as any).imageUrl || (apiProduct as any).images?.[0] || '';
              if (productImage && seenProductImages.has(productImage)) {
                console.log(`⏭️ Skipping duplicate product by image: "${apiProduct.name}"`);
                continue;
              }
              
              // CRITICAL: Ensure product has valid image - skip if no image
              // For books category, be slightly more lenient (some books might not have images from PriceAPI)
              if (!productImage || typeof productImage !== 'string' || !productImage.trim() || !productImage.startsWith('http')) {
                if (categorySlug === 'books') {
                  // For books, log but don't skip - we'll try to use a placeholder or fetch image later
                  console.log(`⚠️ Book "${apiProduct.name}" has no valid image, but continuing for books category...`);
                  // Still skip for now, but log it so we know what's happening
                  continue;
                } else {
                  console.log(`⏭️ Skipping product without valid image: "${apiProduct.name}"`);
                  continue;
                }
              }
              
              try {
                // Use subcategory from query param if provided, otherwise use term's subcategory
                const finalSubcategory = subcategory || termSubcategory;
                const savedProduct = await this.autoSaveProductFromAPI(
                  apiProduct,
                  apiProduct.barcode || null,
                  [apiProduct],
                  categorySlug, // Pass categorySlug so products are saved to correct category
                  finalSubcategory, // Pass subcategory mapping
                );
                if (savedProduct) {
                  allResults.push(savedProduct);
                  seenProductNames.add(normalizedName);
                  if (productImage) {
                    seenProductImages.add(productImage);
                  }
                  console.log(`✅ Added unique product: "${apiProduct.name}" (${allResults.length}/${limit})`);
                }
              } catch (error) {
                console.log(`⚠️  Could not auto-save product: ${error.message}`);
              }
            }
          }
        } catch (error) {
          console.log(`⚠️  PriceAPI search failed for ${term}: ${error.message}`);
        }
      }
      
      // If we got products from PriceAPI, combine with existing products and return
      if (allResults.length > 0) {
        console.log(`✅ Got ${allResults.length} unique products from PriceAPI`);
        
        // Deduplicate: Remove products from allResults that are already in enrichedProducts
        const existingProductNames = new Set(
          enrichedProducts.map(p => (p.name || '').toLowerCase().trim())
        );
        const uniqueNewProducts = allResults.filter(p => {
          const productName = (p.name || '').toLowerCase().trim();
          return !existingProductNames.has(productName);
        });
        
        console.log(`📦 Deduplicated: ${allResults.length} -> ${uniqueNewProducts.length} new unique products`);
        
        // Combine existing products with new ones, but prioritize existing ones
        const combined = [...enrichedProducts, ...uniqueNewProducts]
          .slice(0, minLimit) // Ensure we don't return more than requested
          .map((p) => {
            const enriched = this.enrichProductWithPriceCalculations(p);
            return this.normalizeProductImage(enriched);
          });
        
        // If subcategory was specified, filter the combined results
        let finalProducts = combined;
        if (subcategory) {
          finalProducts = combined.filter(p => {
            const productSubcategory = p.subcategory?.toLowerCase() || '';
            const matches = productSubcategory.includes((subcategory || '').toLowerCase());
            if (!matches) {
              console.log(`   ⏭️ Filtering out product "${p.name}" - subcategory "${productSubcategory}" doesn't match "${subcategory}"`);
            }
            return matches;
          });
        }
        
        // Ensure we have at least 6 products if subcategory is specified
        if (subcategory && finalProducts.length < 6 && uniqueNewProducts.length > 0) {
          // Try to get more products by searching more terms
          console.log(`📚 Need more products (${finalProducts.length}/6), searching additional terms...`);
          // The loop above should have already tried to get enough, but if we still need more,
          // we'll return what we have (the frontend will show them)
        }
        
        console.log(`📦 Returning ${finalProducts.length} products (${enrichedProducts.length} from DB + ${uniqueNewProducts.length} from PriceAPI)`);
        return {
          products: finalProducts,
          count: finalProducts.length,
          categorySlug,
        };
      } else {
        console.log(`⚠️ No products found from PriceAPI for ${categorySlug}`);
        // For books and household categories, if PriceAPI returned nothing, try SerpAPI as fallback
        if (categorySlug === 'books' || categorySlug === 'household') {
          const categoryName = categorySlug === 'books' ? 'books' : 'household items';
          console.warn(`⚠️ ${categoryName} category: PriceAPI returned no products. Trying Serper/SerpAPI as fallback...`);
          
          // Try Serper/SerpAPI - it has better coverage for these categories
          const productApiKeyBooks = this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY || this.configService.get<string>('SERPAPI_KEY');
          if (productApiKeyBooks) {
            try {
              console.log(`📚 Trying Serper/SerpAPI for ${categoryName} category with search terms: ${searchTerms.slice(0, 6).map(st => st.term).join(', ')}`);
              
              // Use first 6 search terms to get diverse products
              const serpApiProducts: any[] = [];
              for (const { term } of searchTerms.slice(0, 6)) {
                if (serpApiProducts.length >= minLimit) break;
                
                try {
                  const serpApiResults = await this.searchProductsFromSerpAPI(term, 1, categorySlug);
                  if (serpApiResults && serpApiResults.length > 0) {
                    for (const serpProduct of serpApiResults) {
                      if (serpApiProducts.length >= minLimit) break;
                      
                      // Auto-save to database
                      try {
                        const savedProduct = await this.autoSaveProductFromAPI(
                          {
                            name: serpProduct.name,
                            image: serpProduct.image,
                            price: serpProduct.price,
                            store: serpProduct.store,
                            url: serpProduct.url,
                            barcode: null,
                          },
                          null,
                          [serpProduct],
                          categorySlug,
                          undefined,
                        );
                        if (savedProduct) {
                          serpApiProducts.push(savedProduct);
                          console.log(`✅ Added ${categoryName} from SerpAPI: "${serpProduct.name}" (${serpApiProducts.length}/${minLimit})`);
                        }
                      } catch (error) {
                        console.log(`⚠️ Could not save ${categoryName} from SerpAPI: ${error.message}`);
                      }
                    }
                  }
                } catch (error) {
                  console.log(`⚠️ SerpAPI search failed for "${term}": ${error.message}`);
                }
              }
              
              if (serpApiProducts.length > 0) {
                console.log(`✅ Got ${serpApiProducts.length} ${categoryName} from SerpAPI fallback`);
                const finalSerpProducts = serpApiProducts
                  .slice(0, minLimit)
                  .map((p) => {
                    const enriched = this.enrichProductWithPriceCalculations(p);
                    return this.normalizeProductImage(enriched);
                  });
                
                return {
                  products: finalSerpProducts,
                  count: finalSerpProducts.length,
                  categorySlug,
                };
              }
            } catch (error) {
              console.log(`⚠️ SerpAPI fallback for ${categoryName} failed: ${error.message}`);
            }
          }
          
          console.warn(`⚠️ ${categoryName} category: Both PriceAPI and SerpAPI returned no products. This might indicate:`);
          console.warn(`   1. APIs don't have ${categoryName} in their database`);
          console.warn(`   2. Search terms might not be matching API products`);
          console.warn(`   3. Products might be missing required fields (images, prices)`);
        }
      }
    }
    
    // Return existing products even if we didn't get more from PriceAPI
    // Filter by subcategory if specified
    let filteredEnrichedProducts = enrichedProducts;
    if (subcategory && enrichedProducts.length > 0) {
      filteredEnrichedProducts = enrichedProducts.filter(p => {
        const productSubcategory = p.subcategory?.toLowerCase() || '';
        return productSubcategory.includes(subcategory.toLowerCase());
      });
      console.log(`📦 Filtered ${enrichedProducts.length} products to ${filteredEnrichedProducts.length} matching subcategory "${subcategory}"`);
    }

    // If we have fewer products than needed and PriceAPI is enabled, fetch more
    if (filteredEnrichedProducts.length < limit && this.priceApiService.isEnabled() && subcategory) {
      console.log(`📡 Need more products (${filteredEnrichedProducts.length}/${limit}), fetching from PriceAPI...`);
      
      // Map subcategory to search terms
      const subcategorySearchTerms: Record<string, string[]> = {
        'jeans': ['jeans', 'denim jeans', 'blue jeans'],
        't-shirts': ['t-shirt', 't shirt', 'tshirt'],
        'jackets': ['jacket', 'coat', 'outerwear'],
        'dresses': ['dress', 'women dress', 'casual dress'],
        'activewear': ['activewear', 'athletic wear', 'sportswear'],
        'hoodies': ['hoodie', 'hooded sweatshirt', 'sweatshirt'],
        'dress-shirts': ['dress shirt', 'button down shirt', 'formal shirt'],
        'sweaters': ['sweater', 'knit sweater', 'pullover'],
      };
      
      const searchTerms = subcategorySearchTerms[subcategory.toLowerCase()] || [subcategory];
      const productsPerTerm = Math.ceil((limit - filteredEnrichedProducts.length) / searchTerms.length);
      const newProducts: any[] = [];
      
      for (const term of searchTerms) {
        if (newProducts.length >= (limit - filteredEnrichedProducts.length)) break;
        
        try {
          const apiResults = await this.priceApiService.searchProducts(term, { limit: productsPerTerm });
          if (apiResults && apiResults.length > 0) {
            for (const apiProduct of apiResults) {
              try {
                const savedProduct = await this.autoSaveProductFromAPI(
                  apiProduct,
                  apiProduct.barcode || null,
                  [apiProduct],
                  categorySlug,
                  subcategory,
                );
                if (savedProduct) {
                  newProducts.push(savedProduct);
                  if (newProducts.length >= (limit - filteredEnrichedProducts.length)) break;
                }
              } catch (error) {
                console.log(`⚠️ Could not auto-save product: ${error.message}`);
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ PriceAPI search failed for ${term}: ${error.message}`);
        }
      }
      
      if (newProducts.length > 0) {
        filteredEnrichedProducts = [...filteredEnrichedProducts, ...newProducts];
        console.log(`✅ Added ${newProducts.length} new products from PriceAPI`);
      }
    }

    // Filter products to only include those with valid images AND real prices
    let finalEnrichedProducts = filteredEnrichedProducts.map((p) => {
      const enriched = this.enrichProductWithPriceCalculations(p);
      return this.normalizeProductImage(enriched);
    });
    
    // Return first page immediately with whatever store count we have (3–20 from Serper grouping).
    // Do NOT block on fetching 20+ stores here – that caused very slow loading and timeouts.
    // When user clicks "View prices", compare/multi-store fetches 20+ stores on demand (Serper).
    // Optionally prefetch 20+ stores in the background for this page so data is ready when they click (fire-and-forget).
    if (categorySlug && categorySlug !== 'hotels' && categorySlug !== 'tires' && categorySlug !== 'airfare' && categorySlug !== 'rental-cars' && this.multiStoreScrapingService && page === 1) {
      const productsNeedingStores = finalEnrichedProducts.filter((p: any) => {
        const storePrices = p.storePrices || p.prices || [];
        const uniqueStores = new Set(storePrices.map((sp: any) => sp.store?.name || sp.storeName || 'Unknown'));
        return uniqueStores.size < 20;
      });
      if (productsNeedingStores.length > 0) {
        console.log(`📡 [${categorySlug}] Prefetching 20+ stores for ${productsNeedingStores.length} products in background (response not blocked).`);
        void this.prefetchMultiStorePricesInBackground(productsNeedingStores).catch((err) => {
          this.devLog(`⚠️ Background prefetch failed: ${err?.message || err}`);
        });
      }
    }

    const finalProductsWithImages = finalEnrichedProducts.filter((p: any) => {
      // Don't filter out products without images - frontend will show placeholders
      // Only require real prices (products must have prices from stores)
      
      // Must have real prices (enriched products have storePrices, not prices)
      // Check both storePrices (from compareMultiStore) and prices (from database)
      const toNumberOrNull = (val: any): number | null => {
        if (val === null || val === undefined) return null;
        if (typeof val === 'number') return isNaN(val) ? null : val;
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? null : parsed;
        }
        if (val && typeof val === 'object' && 'toNumber' in val) {
          return (val as any).toNumber();
        }
        return null;
      };
      
      const storePrices = p.storePrices || p.prices || [];
      const hasRealPrices = storePrices.length > 0 && storePrices.some((sp: any) => {
        const price = toNumberOrNull(sp.price || sp);
        return price !== null && price > 0;
      });
      
      if (!hasRealPrices) {
        this.devLog(`🚫 Filtering out "${p.name}" - no real prices (storePrices: ${storePrices.length})`);
        return false;
      }
      
      return true; // Product has real prices - allow it (images optional)
    });

    // When Puppeteer/SerpAPI returns 0 (e.g. Google shows Deals not query results), show placeholders so category page isn't empty
    let productsToPaginate = finalProductsWithImages;
    if (productsToPaginate.length === 0 && categorySlug && page === 1) {
      productsToPaginate = this.getPlaceholderProductsForCategory(categorySlug, limit);
      console.log(`📦 [${categorySlug}] Showing ${productsToPaginate.length} placeholder products (no results from scraper/API). Check back later or try SerpAPI when credits renew.`);
    }

    // Apply pagination
    const skipCount = (page - 1) * limit;
    const totalProducts = productsToPaginate.length;
    const paginatedProducts = productsToPaginate.slice(skipCount, skipCount + limit);
    const hasMore = skipCount + limit < totalProducts;
    
    console.log(`📄 Pagination: page ${page}, limit ${limit}, skip ${skipCount}, total ${totalProducts}, returning ${paginatedProducts.length}, hasMore: ${hasMore}`);
    
    // Log warning if we don't have enough products
    if (paginatedProducts.length < limit && categorySlug && page === 1) {
      console.warn(`⚠️ Only ${paginatedProducts.length}/${limit} products returned for ${categorySlug}. This may indicate:`);
      console.warn(`   1. Not enough products in database`);
      console.warn(`   2. API fetching didn't return enough valid products`);
      console.warn(`   3. Products were filtered out (missing images/prices)`);
    }
    
    return {
      products: paginatedProducts,
      count: paginatedProducts.length,
      total: totalProducts,
      page,
      limit,
      hasMore,
      categorySlug,
    };
  }

  /**
   * Search external store integrations for live product results.
   * This is useful for discovering new products not yet in our database.
   * 
   * Uses PriceAPI when available, falls back to mock integrations otherwise.
   * 
   * WHY THIS METHOD?
   * - Frontend can show live store results before we catalog them
   * - Helps populate database with new products
   * - Users see real-time prices from stores
   * 
   * WHY PARALLEL SEARCH?
   * - Faster response time (100-200ms instead of 300-600ms sequential)
   * - User sees results from all 3 stores simultaneously
   * - Better UX - no waiting for stores one by one
   */
  async searchExternalStores(query: string) {
    // If PriceAPI is enabled, use it for real data from 100+ stores
    if (this.priceApiService.isEnabled()) {
      const results = await this.priceApiService.searchProducts(query, {
        stores: ['walmart', 'amazon', 'target'],
        limit: 10,
      });

      // Group results by store
      const walmart = results.filter(p => p.store.toLowerCase() === 'walmart');
      const amazon = results.filter(p => p.store.toLowerCase() === 'amazon');
      const target = results.filter(p => p.store.toLowerCase() === 'target');

      return {
        walmart: walmart.map(p => ({
          externalId: `${p.store}-${Date.now()}`,
          name: p.name,
          price: p.price,
          shippingCost: p.shipping || 0,
          currency: p.currency,
          inStock: p.inStock,
          productUrl: p.url,
          imageUrl: p.image,
        })),
        amazon: amazon.map(p => ({
          externalId: `${p.store}-${Date.now()}`,
          name: p.name,
          price: p.price,
          shippingCost: p.shipping || 0,
          currency: p.currency,
          inStock: p.inStock,
          productUrl: p.url,
          imageUrl: p.image,
        })),
        target: target.map(p => ({
          externalId: `${p.store}-${Date.now()}`,
          name: p.name,
          price: p.price,
          shippingCost: p.shipping || 0,
          currency: p.currency,
          inStock: p.inStock,
          productUrl: p.url,
          imageUrl: p.image,
        })),
        totalResults: results.length,
        query,
        searchedAt: new Date().toISOString(),
        storesSearched: ['walmart', 'amazon', 'target'],
        usingRealAPI: true,
      };
    }

    // Fall back to mock integrations if PriceAPI is not configured
    const [walmartResults, amazonResults, targetResults] = await Promise.all([
      this.walmartIntegration.searchProducts(query, { limit: 10 }),
      this.amazonIntegration.searchProducts(query, { limit: 10 }),
      this.targetIntegration.searchProducts(query, { limit: 10 }),
    ]);

    const totalResults =
      walmartResults.length + amazonResults.length + targetResults.length;

    return {
      walmart: walmartResults,
      amazon: amazonResults,
      target: targetResults,
      totalResults,
      query,
      // Metadata for frontend
      searchedAt: new Date().toISOString(),
      storesSearched: ['walmart', 'amazon', 'target'],
      usingRealAPI: false,
    };
  }

  /**
   * Compare product prices across multiple stores
   * Supports both barcode (GTIN) and keyword search
   * Returns data formatted for your frontend card layout
   * 
   * WORKFLOW:
   * 1. Check database first (instant if product exists)
   * 2. If not found, search PriceAPI and auto-save product with barcode
   * 3. Future searches will use the saved barcode for better results
   */
  
  /**
   * Fast product search - returns products immediately without waiting for all store prices
   * Used for instant search results. Store prices are fetched when user clicks "View Price"
   */
  async fastProductSearch(
    searchQuery: string,
    searchType: 'term' | 'gtin' | 'auto' = 'auto',
    categoryId?: string,
    limit: number = 6,
    categorySlug?: string,
    page: number = 1,
  ) {
    // Validate input
    if (!searchQuery || typeof searchQuery !== 'string') {
      throw new Error('Search query is required');
    }
    
    const cleanQuery = searchQuery.trim();
    
    // Minimum query length: 3 characters to avoid irrelevant results
    if (cleanQuery.length < 3) {
      this.devLog(`⚠️ Query too short (${cleanQuery.length} < 3), returning empty results`);
      return [];
    }
    
    this.devLog(`🚀 Fast search: "${cleanQuery}" (limit: ${limit}, categoryId: ${categoryId || 'none'}, categorySlug: ${categorySlug || 'none'})`);
    
    // Get category info if categoryId or categorySlug is provided
    let category: { id: string; slug: string; name: string } | null = null;
    if (categoryId) {
      category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, slug: true, name: true },
      });
      if (!category) {
        this.devLog(`⚠️ Category ID ${categoryId} not found, trying categorySlug...`);
      }
    }
    
    // If categoryId didn't work or wasn't provided, try categorySlug
    if (!category && categorySlug) {
      category = await this.prisma.category.findFirst({
        where: { slug: categorySlug },
        select: { id: true, slug: true, name: true },
      });
      if (category) {
        this.devLog(`✅ Found category by slug "${categorySlug}": ${category.name} (ID: ${category.id})`);
      } else {
        this.devLog(`⚠️ Category slug "${categorySlug}" not found, ignoring category filter`);
      }
    }
    
    // Use category.id for database queries if we found a category
    // CRITICAL: For "all-retailers", don't filter by category - search across ALL categories
    const finalCategoryId = category && category.slug !== 'all-retailers' ? category.id : undefined;
    
    const products: any[] = [];
    
    // CRITICAL: Check database FIRST - only use SerpAPI if database doesn't have the item
    // Search database for products FIRST (filtered by category if found, but NOT for all-retailers)
    // Note: Hierarchical ordering will be applied after fetching
    // Fetch enough results to support pagination (fetch more than needed for proper sorting)
    const dbProducts = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { brand: { contains: cleanQuery, mode: 'insensitive' } },
          { barcode: cleanQuery },
        ],
        ...(finalCategoryId ? { categoryId: finalCategoryId } : {}),
        // Exclude test products
        name: {
          not: {
            contains: 'Test Product',
          },
        },
        // Must have images
        images: {
          isEmpty: false,
        },
      },
      include: {
        category: true,
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
      },
      orderBy: [
        { searchCount: 'desc' },
        { viewCount: 'desc' },
      ],
      take: limit * 3, // Fetch more for proper sorting
    });
    
    // Transform database products to match expected format (include brand for popular-brand ordering)
    for (const dbProduct of dbProducts) {
      products.push({
        id: dbProduct.id,
        name: dbProduct.name,
        brand: (dbProduct as any).brand ?? undefined,
        image: dbProduct.images && dbProduct.images.length > 0 ? dbProduct.images[0] : '',
        category: dbProduct.category?.name || 'Uncategorized',
        categorySlug: dbProduct.category?.slug || null,
        barcode: dbProduct.barcode || null,
        storePrices: [], // No prices in fast search - fetched when user clicks "View Price"
      });
    }
    
    this.devLog(`📊 Database search found ${dbProducts.length} products for "${cleanQuery}"`);
    
    // CRITICAL: Use Serper/SerpAPI when we need more results OR when we want popular brands first
    // For any search where we have a known product type (laptop, TV, phone, headphones, etc.), always fetch a large pool so we can show known brands first, not random/unknown brands
    const hasBrandList = (this.getPopularBrandsForCategory(categorySlug || '', cleanQuery).length > 0);
    const wantsPopularBrands = (categorySlug === 'all-retailers' || categorySlug === 'electronics') && hasBrandList;
    const needsMoreResults = products.length < limit || wantsPopularBrands;
    const productApiKeyFast = this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY || this.configService.get<string>('SERPAPI_KEY');
    const productApiEnabledFast = !!productApiKeyFast;
    
    this.devLog(`🔑 Serper/SerpAPI Status: ${productApiEnabledFast ? '✅ ENABLED' : '❌ DISABLED'} (key: ${productApiKeyFast ? 'present' : 'missing'})`);
    if (wantsPopularBrands) {
      this.devLog(`📌 Popular-brands-first: will fetch large SerpAPI pool for "${cleanQuery}" in ${categorySlug} so known brands (Apple, Samsung, etc.) appear first`);
    }
    
    if (needsMoreResults && productApiEnabledFast) {
      if (wantsPopularBrands && products.length >= limit) {
        this.devLog(`🔍 Fetching from Serper/SerpAPI for popular-brand ordering...`);
      } else {
        this.devLog(`🔍 Database has ${products.length}/${limit} products, fetching ${limit - products.length} more from Serper/SerpAPI...`);
      }
      
      // For "all-retailers", use SerpAPI to search across ALL categories (no filtering)
      if (categorySlug === 'all-retailers') {
      try {
        this.devLog(`🔍 Using SerpAPI for all-retailers search: "${cleanQuery}" (page ${page})`);
        
        // Fetch a large pool when we want popular brands first (laptop, TV, phone, headphones, etc.) so known brands can be sorted to the top
        const serpApiLimit = wantsPopularBrands ? Math.min(limit * 12, 80) : limit * 5;
        const serpApiResults = await this.searchProductsFromSerpAPI(cleanQuery, serpApiLimit);
        
        if (serpApiResults && serpApiResults.length > 0) {
          // For all-retailers, don't filter by category - show all results from all categories
          for (const product of serpApiResults) {
            const productName = product.name || 'Unknown Product';
            const productImage = product.image || `https://via.placeholder.com/150?text=${encodeURIComponent(productName.substring(0, 20))}`;
            products.push({
              id: `serpapi-${Date.now()}-${Math.random()}`,
              name: productName,
              image: productImage,
              category: product.store || 'Uncategorized',
              categorySlug: null, // All-retailers shows products from all categories
              barcode: null,
              storePrices: [],
            });
          }
          this.devLog(`✅ SerpAPI returned ${serpApiResults.length} products for all-retailers search`);
        } else {
          this.devLog(`⚠️ SerpAPI/Serper returned no results for "${cleanQuery}" in all-retailers. Using suggestion products.`);
          if (page === 1) {
            const fallback = this.getFallbackProductsForFastSearch(cleanQuery, 'all-retailers', 'All Retailers', limit);
            for (const p of fallback) products.push(p);
            if (fallback.length > 0) {
              this.devLog(`📦 Showing ${fallback.length} suggestion products. Add SERPAPI_KEY or top up Serper for live results.`);
            }
          }
        }
      } catch (error: any) {
        this.devLog(`❌ SerpAPI all-retailers search failed: ${error.message}`);
        this.devLog(`   Error stack: ${error.stack}`);
      }
      } else if (category && category.slug !== 'all-retailers') {
      // Use SerpAPI (paid plan) for category-specific searches - provides better multi-store results
      const categoryName = category.name;
      const currentCategorySlug = category.slug;
      try {
        // Enhance query with category context to get relevant results from SerpAPI
        const enhancedQuery = this.enhanceQueryForCategory(cleanQuery, currentCategorySlug);
        this.devLog(`🔍 Using SerpAPI (paid plan) for category search: "${cleanQuery}" → "${enhancedQuery}" in "${categoryName}" (page ${page})`);
        
        // Fetch a large pool when we want popular brands first so known brands (Apple, Samsung, Sony, etc.) can be sorted to the top
        const serpApiLimit = wantsPopularBrands ? Math.min(limit * 12, 80) : limit * 5;
        const serpApiResults = await this.searchProductsFromSerpAPI(enhancedQuery, serpApiLimit, currentCategorySlug);
        
        if (serpApiResults && serpApiResults.length > 0) {
          // Filter results by category-specific keywords to avoid irrelevant items (backup filter)
          const filteredResults = this.filterSerpAPIResultsByCategory(serpApiResults, currentCategorySlug, cleanQuery);
          
          // Add ALL filtered results (pagination will be handled later)
          for (const product of filteredResults) {
            const productName = product.name || 'Unknown Product';
            const productImage = product.image || `https://via.placeholder.com/150?text=${encodeURIComponent(productName.substring(0, 20))}`;
            products.push({
              id: `serpapi-${Date.now()}-${Math.random()}`,
              name: productName,
              image: productImage,
              category: categoryName,
              categorySlug: categorySlug,
              barcode: null, // SerpAPI doesn't provide barcode in fast search
              storePrices: [], // No prices in fast search - fetched when user clicks "View Price"
            });
          }
          this.devLog(`✅ SerpAPI returned ${filteredResults.length} filtered products (from ${serpApiResults.length} total) for category "${categoryName}"`);
        } else {
          this.devLog(`⚠️ SerpAPI/Serper returned no results for "${enhancedQuery}" (e.g. not enough credits). Using suggestion products.`);
          // When API is out of credits or fails, show suggestion products so the app doesn't show "no products"
          if (page === 1) {
            const fallback = this.getFallbackProductsForFastSearch(cleanQuery, categorySlug, categoryName, limit);
            for (const p of fallback) products.push(p);
            if (fallback.length > 0) {
              this.devLog(`📦 Showing ${fallback.length} suggestion products. Add SERPAPI_KEY or top up Serper credits for live results.`);
            }
          }
        }
      } catch (error: any) {
        this.devLog(`❌ SerpAPI fast search failed: ${error.message}`);
        this.devLog(`   Error stack: ${error.stack}`);
        // Don't throw - continue with database results
      }
      } else if (!category) {
      // No category specified - use SerpAPI to search across all categories
      try {
        this.devLog(`🔍 Using SerpAPI for general search (no category): "${cleanQuery}" (page ${page})`);
        
        const serpApiLimit = limit * 5; // Fetch 5 pages worth for pagination
        const serpApiResults = await this.searchProductsFromSerpAPI(cleanQuery, serpApiLimit);
        
        if (serpApiResults && serpApiResults.length > 0) {
          for (const product of serpApiResults) {
            products.push({
              id: `serpapi-${Date.now()}-${Math.random()}`,
              name: product.name || 'Unknown Product',
              image: product.image || '',
              category: product.store || 'Uncategorized',
              categorySlug: null,
              barcode: null,
              storePrices: [],
            });
          }
          this.devLog(`✅ SerpAPI returned ${serpApiResults.length} products for general search`);
        } else {
          this.devLog(`⚠️ SerpAPI returned no results for "${cleanQuery}"`);
        }
      } catch (error: any) {
        this.devLog(`❌ SerpAPI general search failed: ${error.message}`);
        this.devLog(`   Error stack: ${error.stack}`);
      }
      } else if (!productApiEnabledFast && needsMoreResults) {
        this.devLog(`⚠️ Serper/SerpAPI is DISABLED - SERPER_API_KEY and SERPAPI_KEY are missing or empty`);
        this.devLog(`   Database has ${products.length}/${limit} products, but product API cannot be used to fetch more`);
        this.devLog(`   Add SERPER_API_KEY or SERPAPI_KEY to your .env to enable Serper/SerpAPI`);
      }
    } else {
      this.devLog(`✅ Database has ${products.length} products (enough results), skipping Serper/SerpAPI`);
    }
    
    // Calculate pagination
    const skipCount2 = (page - 1) * limit;
    
    // Deduplicate products by name (case-insensitive) - database products come first, then SerpAPI
    const seenNames = new Set<string>();
    const uniqueProducts: any[] = [];
    for (const p of products) {
      const nameLower = (p.name || '').toLowerCase();
      if (!seenNames.has(nameLower)) {
        seenNames.add(nameLower);
        uniqueProducts.push(p);
      }
    }
    
    // Final filter: If categorySlug is known, ensure all products match it
    const filteredProducts = category 
      ? uniqueProducts.filter(p => !p.categorySlug || p.categorySlug === category.slug)
      : uniqueProducts;
    
    // Apply hierarchical ordering to final results
    const orderedProducts = this.applyHierarchicalOrdering(filteredProducts, cleanQuery, categorySlug || undefined);
    
    // Return paginated results
    const paginatedResults = orderedProducts.slice(skipCount2, skipCount2 + limit);
    const hasMore = orderedProducts.length > skipCount2 + limit;
    
    this.devLog(`✅ Fast search returned ${paginatedResults.length} products (page ${page}, from ${orderedProducts.length} total, hasMore: ${hasMore})`);
    
    // If no results and it's page 1, log warning
    if (paginatedResults.length === 0 && page === 1) {
      this.devLog(`⚠️ No products found for query "${cleanQuery}" in category "${categorySlug || 'all'}"`);
    }
    
    return paginatedResults;
  }
  
  /**
   * Returns true if the search query suggests electronics (headphones, laptop, phone, etc.)
   * Used to apply popular-brand ordering even when categorySlug was not sent by the client.
   */
  private looksLikeElectronicsQuery(lowerQuery: string): boolean {
    const terms = ['headphone', 'earbud', 'earphone', 'laptop', 'computer', 'phone', 'smartphone', 'tablet', 'ipad', 'tv', 'television', 'watch', 'smartwatch', 'monitor', 'camera', 'console', 'playstation', 'xbox', 'nintendo'];
    return terms.some((t) => lowerQuery.includes(t));
  }

  /**
   * Apply hierarchical ordering to search results
   * Generic search → Models (newest first)
   * Model search → Variants
   * Specific search → Specs/colors
   * 
   * Also applies brand prioritization for all categories with well-known brands
   */
  private applyHierarchicalOrdering(
    products: any[],
    query: string,
    categorySlug?: string,
  ): any[] {
    const lowerQuery = query.toLowerCase();
    
    // For electronics, handle iPhone searches hierarchically
    if (categorySlug === 'electronics' && lowerQuery.includes('iphone')) {
      return this.orderIphoneResults(products, lowerQuery);
    }
    
    // For groceries "apple" search: prioritize classic apples (Gala, Honeycrisp, etc.) from major retailers
    if (categorySlug === 'groceries' && (lowerQuery === 'apple' || lowerQuery.includes('apple'))) {
      return this.orderGroceriesAppleResults(products);
    }
    
    // Groceries: specificity order = most common (fresh produce) first, then less common (bread, etc.), then niche (shake, smoothie)
    if (categorySlug === 'groceries') {
      return this.orderGroceriesBySpecificity(products, lowerQuery);
    }
    
    // Apply general brand prioritization for all categories with well-known brands
    // This ensures popular brands show first for any branded items (laptops, phones, TVs, headphones, etc.)
    // Works for both specific categories (electronics, clothing, kitchen) and "all-retailers"
    const slugForOrdering = categorySlug || (this.looksLikeElectronicsQuery(lowerQuery) ? 'all-retailers' : undefined);
    if (slugForOrdering) {
      const ordered = this.orderByPopularBrands(products, slugForOrdering, lowerQuery);
      this.devLog(`📌 Brand ordering applied for categorySlug="${slugForOrdering}", query="${lowerQuery}" (${products.length} products)`);
      return ordered;
    }
    
    // For other cases without category, maintain current order (already sorted by relevance)
    return products;
  }
  
  /**
   * Order groceries by specificity: most common (fresh produce/grocery item) first, then less common, then niche (shake, smoothie, recipe).
   * So "banana" shows the fruit first, not banana shake.
   */
  private orderGroceriesBySpecificity(products: any[], query: string): any[] {
    const produceWords = ['banana', 'apple', 'orange', 'grape', 'strawberry', 'mango', 'pineapple', 'avocado', 'tomato', 'potato', 'onion', 'lettuce'];
    const isProduceQuery = produceWords.some((w) => query.includes(w));
    const typicalBoost = ['fresh', 'organic', 'produce', 'fruit', 'per lb', 'bunch', 'bag of', 'whole ', 'raw '];
    const nichePenalty = ['shake', 'smoothie', 'smoothie recipe', 'drink recipe', 'milkshake', 'protein shake', 'beverage'];
    return products.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const score = (name: string) => {
        let s = 0;
        if (isProduceQuery) {
          for (const t of typicalBoost) if (name.includes(t)) s += 2;
          for (const t of nichePenalty) if (name.includes(t)) s -= 3;
        }
        return s;
      };
      return score(bName) - score(aName);
    });
  }

  /**
   * Order groceries "apple" results: classic apple types + major retailers first (not Miami Fruit, etc.)
   */
  private orderGroceriesAppleResults(products: any[]): any[] {
    const classicAppleTypes = ['gala', 'honeycrisp', 'fuji', 'red delicious', 'granny smith', 'pink lady', 'organic apple', 'fresh apple'];
    const majorRetailers = ['walmart', 'target', 'amazon', 'costco', 'kroger', 'aldi', 'whole foods', 'safeway'];
    
    return products.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aStore = (a.category || a.store || '').toLowerCase();
      const bStore = (b.category || b.store || '').toLowerCase();
      
      const aIsClassic = classicAppleTypes.some(t => aName.includes(t));
      const bIsClassic = classicAppleTypes.some(t => bName.includes(t));
      const aIsMajorRetailer = majorRetailers.some(r => aName.includes(r) || aStore.includes(r));
      const bIsMajorRetailer = majorRetailers.some(r => bName.includes(r) || bStore.includes(r));
      const aIsExotic = aName.includes('miami fruit') || aName.includes('hidden rose') || aName.includes('exotic');
      const bIsExotic = bName.includes('miami fruit') || bName.includes('hidden rose') || bName.includes('exotic');
      
      // Exotic/specialty last
      if (aIsExotic && !bIsExotic) return 1;
      if (!aIsExotic && bIsExotic) return -1;
      // Classic types first
      if (aIsClassic && !bIsClassic) return -1;
      if (!aIsClassic && bIsClassic) return 1;
      // Then major retailer
      if (aIsMajorRetailer && !bIsMajorRetailer) return -1;
      if (!aIsMajorRetailer && bIsMajorRetailer) return 1;
      return 0;
    });
  }
  
  /**
   * Get brand priority for a product (lower = more popular). Returns Infinity if no known brand matched.
   * Uses: (1) product.brand if set, (2) brand at start/after space or dash in name, (3) brand anywhere in name, (4) first word of name = brand.
   */
  private getBrandPriority(product: { name?: string; brand?: string }, popularBrands: string[]): number {
    const name = (product.name || '').toLowerCase();
    const brandField = (product as any).brand ? String((product as any).brand).toLowerCase() : '';
    if (!popularBrands.length) return Infinity;
    for (let i = 0; i < popularBrands.length; i++) {
      const brand = popularBrands[i].toLowerCase();
      const brandEscaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Explicit brand field (from DB) takes precedence
      if (brandField && (brandField === brand || brandField.includes(brand) || brand.includes(brandField))) return i;
      if (!name) continue;
      if (new RegExp(`(^|\\s|-)${brandEscaped}`, 'i').test(name)) return i;
      if (name.includes(brand)) return i;
      const firstWord = name.split(/\s+/)[0]?.replace(/[®™©]/g, '').trim() || '';
      if (firstWord === brand) return i;
    }
    return Infinity;
  }

  /**
   * Explicit filter: split list into known brands vs unknown, sort known by priority, put known first.
   * So page 1 and page 2 are filled with known brands when available. Logs counts for debugging.
   */
  private filterAndOrderByPopularBrands(products: any[], categorySlug: string, query: string): any[] {
    const popularBrands = this.getPopularBrandsForCategory(categorySlug, query);
    if (!popularBrands || popularBrands.length === 0) return products;

    const withPriority = products.map((p) => ({ product: p, priority: this.getBrandPriority(p, popularBrands) }));
    const known = withPriority.filter((x) => x.priority !== Infinity).sort((a, b) => a.priority - b.priority).map((x) => x.product);
    const unknown = withPriority.filter((x) => x.priority === Infinity).map((x) => x.product);
    const ordered = [...known, ...unknown];
    this.devLog(`📌 Popular brands filter: ${known.length} known, ${unknown.length} unknown → page 1 & 2 show known brands first`);
    return ordered;
  }

  /**
   * General brand prioritization for all categories
   * Returns products ordered by popular brands for the given category
   */
  private orderByPopularBrands(products: any[], categorySlug: string, query: string): any[] {
    return this.filterAndOrderByPopularBrands(products, categorySlug, query);
  }
  
  /**
   * Get popular brands for a category based on query context
   * Returns array of brand names in priority order (most popular first)
   */
  private getPopularBrandsForCategory(categorySlug: string, query: string): string[] {
    const lowerQuery = query.toLowerCase();
    
    // Electronics category - brand prioritization by product type
    if (categorySlug === 'electronics' || categorySlug === 'all-retailers') {
      // Laptops
      if (lowerQuery.includes('laptop') || lowerQuery.includes('computer') || lowerQuery.includes('notebook') || lowerQuery.includes('macbook')) {
        return ['Apple', 'MacBook', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Microsoft', 'Surface', 'MSI', 'Razer'];
      }
      
      // Smartphones
      if (lowerQuery.includes('phone') || lowerQuery.includes('smartphone') || lowerQuery.includes('iphone') || lowerQuery.includes('galaxy')) {
        return ['Apple', 'iPhone', 'Samsung', 'Galaxy', 'Google', 'Pixel', 'OnePlus', 'Xiaomi', 'Motorola', 'Nokia'];
      }
      
      // Tablets
      if (lowerQuery.includes('tablet') || lowerQuery.includes('ipad')) {
        return ['Apple', 'iPad', 'Samsung', 'Galaxy Tab', 'Microsoft', 'Surface', 'Amazon', 'Fire', 'Lenovo'];
      }
      
      // TVs
      if (lowerQuery.includes('tv') || lowerQuery.includes('television') || lowerQuery.includes('smart tv')) {
        return ['Samsung', 'LG', 'Sony', 'TCL', 'Vizio', 'Hisense', 'Roku', 'Amazon', 'Fire TV'];
      }
      
      // Headphones/Earbuds - client wants Apple, Bose, Sony first (most popular/well-known)
      if (lowerQuery.includes('headphone') || lowerQuery.includes('earbud') || lowerQuery.includes('earphone')) {
        return [
          'Apple', 'AirPods', 'Beats',           // Tier 1: Apple (index 0-2)
          'Bose', 'QuietComfort', 'QC',          // Tier 2: Bose (index 3-5)
          'Sony', 'WH-1000', 'WF-1000', 'XM',   // Tier 3: Sony (index 6-9)
          'Sennheiser', 'Momentum', 'JBL', 'Samsung', 'Galaxy Buds', 'Jabra', 'Anker', 'Soundcore', 'Skullcandy', 'Audio-Technica', 'ATH-',
        ];
      }
      
      // Smartwatches
      if (lowerQuery.includes('watch') || lowerQuery.includes('smartwatch') || lowerQuery.includes('fitness tracker')) {
        return ['Apple', 'Apple Watch', 'Samsung', 'Galaxy Watch', 'Fitbit', 'Garmin', 'Amazfit', 'Xiaomi', 'Huawei'];
      }
      
      // Monitors
      if (lowerQuery.includes('monitor') || lowerQuery.includes('display')) {
        return ['Dell', 'LG', 'Samsung', 'ASUS', 'Acer', 'HP', 'BenQ', 'ViewSonic', 'AOC'];
      }
      
      // Cameras
      if (lowerQuery.includes('camera') || lowerQuery.includes('dslr') || lowerQuery.includes('mirrorless')) {
        return ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Olympus', 'GoPro'];
      }
      
      // Gaming consoles
      if (lowerQuery.includes('console') || lowerQuery.includes('playstation') || lowerQuery.includes('xbox') || lowerQuery.includes('nintendo')) {
        return ['Sony', 'PlayStation', 'Microsoft', 'Xbox', 'Nintendo', 'Switch'];
      }
      
      // General electronics (if no specific product type detected)
      return ['Apple', 'Samsung', 'Sony', 'LG', 'Microsoft', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Google'];
    }
    
    // Clothing category
    if (categorySlug === 'clothing') {
      return ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Levi\'s', 'Calvin Klein', 'Tommy Hilfiger', 'Ralph Lauren', 'Gap', 'Old Navy', 'H&M', 'Zara'];
    }
    
    // Kitchen category
    if (categorySlug === 'kitchen') {
      return ['KitchenAid', 'Cuisinart', 'Instant Pot', 'Ninja', 'Breville', 'Vitamix', 'Keurig', 'Hamilton Beach', 'Black+Decker', 'Oster'];
    }
    
    // Home Accessories
    if (categorySlug === 'home-accessories') {
      return ['IKEA', 'Home Depot', 'Lowe\'s', 'Target', 'Wayfair', 'Amazon Basics', 'Simplehuman', 'OXO', 'Rubbermaid'];
    }
    
    // Medicine & Health
    if (categorySlug === 'medicine-health') {
      return ['Johnson & Johnson', 'Tylenol', 'Advil', 'Aleve', 'Bayer', 'CVS', 'Walgreens', 'Nature Made', 'Centrum'];
    }
    
    // Books
    if (categorySlug === 'books') {
      // For books, prioritize major publishers and popular authors
      return ['Penguin', 'Random House', 'HarperCollins', 'Simon & Schuster', 'Macmillan'];
    }
    
    // For "all-retailers" without specific product type, return general popular brands
    if (categorySlug === 'all-retailers') {
      return ['Apple', 'Samsung', 'Sony', 'Nike', 'LG', 'Microsoft', 'Dell', 'HP'];
    }
    
    // No brand prioritization for other categories
    return [];
  }
  
  /**
   * Order headphones by popular brands (Apple, Bose, Sony, etc.) - like Google search
   * @deprecated Use orderByPopularBrands instead - kept for backward compatibility
   * This now delegates to the general brand ordering system
   */
  private orderHeadphonesByPopularBrands(products: any[], query: string): any[] {
    // Use the general brand ordering system for headphones
    return this.orderByPopularBrands(products, 'electronics', query);
  }
  
  /**
   * Order iPhone results hierarchically
   */
  private orderIphoneResults(products: any[], query: string): any[] {
    // Extract model number if present
    const modelMatch = query.match(/iphone\s*(\d+)/);
    const variantMatch = query.match(/iphone\s*\d+\s*(pro\s*max|pro|mini|plus|standard)/i);
    const specMatch = query.match(/(\d+gb|\d+\s*gb|black|white|gold|silver|blue|red|purple)/i);
    
    if (specMatch) {
      // Very specific search (includes specs/colors) - prioritize exact matches
      return products.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aMatches = aName.includes(query);
        const bMatches = bName.includes(query);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    } else if (variantMatch) {
      // Model + variant search (e.g., "iphone 17 pro") - show all variants of that model
      const variant = variantMatch[1].toLowerCase();
      return products.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        // Prioritize exact variant match
        const aHasVariant = aName.includes(variant);
        const bHasVariant = bName.includes(variant);
        if (aHasVariant && !bHasVariant) return -1;
        if (!aHasVariant && bHasVariant) return 1;
        // Then by model number (newer first)
        return this.compareIphoneModels(aName, bName);
      });
    } else if (modelMatch) {
      // Model search (e.g., "iphone 17") - show all variants of that model
      const modelNum = modelMatch[1];
      return products.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        // Check if both are same model
        const aIsModel = aName.includes(`iphone ${modelNum}`);
        const bIsModel = bName.includes(`iphone ${modelNum}`);
        if (aIsModel && !bIsModel) return -1;
        if (!aIsModel && bIsModel) return 1;
        // Order variants: Pro Max > Pro > Plus > Standard > Mini
        return this.compareIphoneVariants(aName, bName);
      });
    } else {
      // Generic "iphone" search - show all models from newest to oldest
      return products.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        return this.compareIphoneModels(aName, bName);
      });
    }
  }
  
  /**
   * Compare iPhone models (newer first: 17 > 16 > 15...)
   */
  private compareIphoneModels(aName: string, bName: string): number {
    const aModelMatch = aName.match(/iphone\s*(\d+)/);
    const bModelMatch = bName.match(/iphone\s*(\d+)/);
    
    if (aModelMatch && bModelMatch) {
      const aModel = parseInt(aModelMatch[1]);
      const bModel = parseInt(bModelMatch[1]);
      return bModel - aModel; // Newer first
    }
    if (aModelMatch) return -1;
    if (bModelMatch) return 1;
    return 0;
  }
  
  /**
   * Compare iPhone variants (Pro Max > Pro > Plus > Standard > Mini)
   */
  private compareIphoneVariants(aName: string, bName: string): number {
    const variantOrder = ['pro max', 'pro', 'plus', 'standard', 'mini'];
    const aVariant = variantOrder.findIndex(v => aName.includes(v));
    const bVariant = variantOrder.findIndex(v => bName.includes(v));
    
    if (aVariant !== -1 && bVariant !== -1) {
      return aVariant - bVariant; // Lower index = higher priority
    }
    if (aVariant !== -1) return -1;
    if (bVariant !== -1) return 1;
    return 0;
  }

  /**
   * Build a shorter query for multi-store fallback when full product name returns too few stores.
   * e.g. "Lenovo IdeaPad Slim 3i 15.6\" Full HD..." -> "Lenovo laptop"
   */
  private buildShortProductQueryForMultiStore(fullName: string): string | null {
    const lower = (fullName || '').toLowerCase();
    const brands = ['lenovo', 'dell', 'hp', 'asus', 'acer', 'apple', 'samsung', 'microsoft', 'sony', 'lg', 'lg', 'tcl', 'hisense', 'jbl', 'bose', 'anker', 'logitech', 'razer', 'msi'];
    const types: Array<{ keywords: string[]; term: string }> = [
      { keywords: ['laptop', 'notebook', 'ideapad', 'thinkpad', 'inspiron', 'pavilion'], term: 'laptop' },
      { keywords: ['tv', 'television', 'oled', 'qled'], term: 'TV' },
      { keywords: ['headphone', 'earbud', 'earphone', 'airpod'], term: 'headphones' },
      { keywords: ['monitor', 'display'], term: 'monitor' },
      { keywords: ['tablet', 'ipad'], term: 'tablet' },
      { keywords: ['phone', 'iphone', 'galaxy', 'pixel'], term: 'phone' },
      { keywords: ['keyboard', 'mouse'], term: 'keyboard' },
    ];
    const brand = brands.find(b => lower.includes(b));
    const typeEntry = types.find(t => t.keywords.some(k => lower.includes(k)));
    if (brand && typeEntry) return `${brand} ${typeEntry.term}`;
    if (brand) return `${brand} laptop`;
    return null;
  }

  async compareProductAcrossStores(
    searchQuery: string,
    searchType: 'term' | 'gtin' | 'auto' = 'auto',
    categoryId?: string,
  ) {
    // Validate input
    if (!searchQuery || typeof searchQuery !== 'string') {
      console.error('❌ Invalid searchQuery:', searchQuery);
      throw new Error('Search query is required');
    }
    
    // Auto-detect if it's a barcode (numeric, 8-14 digits)
    const isBarcode =
      searchType === 'gtin' ||
      (searchType === 'auto' && /^\d{8,14}$/.test(searchQuery.trim()));
    
    const key = isBarcode ? 'gtin' : 'term';
    let cleanQuery = searchQuery.trim();

    // Fix common typos and expand short queries
    if (!isBarcode && cleanQuery.length < 4) {
      const typoMap: Record<string, string> = {
        'cuo': 'cup',
        'cupp': 'cup',
        'cuup': 'cup',
        'knif': 'knife',
        'kniv': 'knife',
        'spon': 'spoon',
        'fork': 'fork', // already correct
        'pan': 'pan', // already correct
        'pot': 'pot', // already correct
        'bow': 'bowl',
        'plte': 'plate',
        'mug': 'mug', // already correct
      };
      
      const lowerQuery = cleanQuery.toLowerCase();
      if (typoMap[lowerQuery]) {
        this.devLog(`🔧 Fixed typo: "${cleanQuery}" → "${typoMap[lowerQuery]}"`);
        cleanQuery = typoMap[lowerQuery];
      }
    }

    // Expand common kitchen item queries for better results
    if (!isBarcode && categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      
      if (category && category.slug) {
        const categorySlug = category.slug.toLowerCase();
        const lowerQuery = cleanQuery.toLowerCase();
        
        // Kitchen & Appliances: Expand common terms
        if (categorySlug === 'kitchen' || categorySlug === 'kitchen-appliances') {
          const kitchenExpansions: Record<string, string> = {
            'cup': 'coffee cup',
            'mug': 'coffee mug',
            'knife': 'kitchen knife',
            'spoon': 'kitchen spoon',
            'fork': 'dining fork',
            'plate': 'dinner plate',
            'bowl': 'mixing bowl',
            'pan': 'frying pan',
            'pot': 'cooking pot',
            'blender': 'kitchen blender',
            'mixer': 'stand mixer',
            'toaster': 'toaster oven',
          };
          
          if (kitchenExpansions[lowerQuery]) {
            this.devLog(`🔍 Expanded kitchen query: "${cleanQuery}" → "${kitchenExpansions[lowerQuery]}"`);
            cleanQuery = kitchenExpansions[lowerQuery];
          }
        }
        
        // Add category-specific keywords to disambiguate
        const categoryKeywords: Record<string, string[]> = {
          groceries: ['fruit', 'fresh', 'organic', 'produce', 'food'],
          electronics: ['device', 'tech', 'gadget', 'electronic'],
          'kitchen-appliances': ['appliance', 'kitchen', 'cooking'],
          'kitchen': ['kitchen', 'cooking', 'appliance'],
        };
        
        // For generic grocery products, add "whole" or "fresh" to get the actual grocery item first (not recipe/drink)
        // Specificity: most common (fruit, dairy, meat) first; avoid banana shake when user wants banana the fruit
        if (categorySlug === 'groceries') {
          const genericGroceryProducts: Record<string, string> = {
            'milk': 'whole milk',
            'bread': 'white bread',
            'eggs': 'large eggs',
            'cheese': 'cheddar cheese',
            'butter': 'unsalted butter',
            'rice': 'white rice',
            'pasta': 'spaghetti pasta',
            'chicken': 'chicken breast',
            'beef': 'ground beef',
          };
          // Produce: fresh fruit/veg so we get grocery produce, not shake/smoothie/recipe
          const produceToGrocery: Record<string, string> = {
            'banana': 'fresh banana',
            'bananas': 'fresh bananas',
            'apple': 'fresh apple fruit',
            'apples': 'fresh apples',
            'orange': 'fresh orange',
            'oranges': 'fresh oranges',
            'grape': 'fresh grapes',
            'grapes': 'fresh grapes',
            'strawberry': 'fresh strawberries',
            'strawberries': 'fresh strawberries',
            'mango': 'fresh mango',
            'mangoes': 'fresh mangoes',
            'pineapple': 'fresh pineapple',
            'avocado': 'fresh avocado',
            'tomato': 'fresh tomato',
            'tomatoes': 'fresh tomatoes',
            'lettuce': 'fresh lettuce',
            'onion': 'fresh onion',
            'onions': 'fresh onions',
            'potato': 'fresh potato',
            'potatoes': 'fresh potatoes',
          };
          if (genericGroceryProducts[lowerQuery]) {
            cleanQuery = genericGroceryProducts[lowerQuery];
            this.devLog(`🔍 Enhanced generic grocery query: "${searchQuery.trim()}" → "${cleanQuery}"`);
          } else if (produceToGrocery[lowerQuery]) {
            cleanQuery = produceToGrocery[lowerQuery];
            this.devLog(`🔍 Produce query (grocery first): "${searchQuery.trim()}" → "${cleanQuery}"`);
          } else if (lowerQuery === 'apple') {
            cleanQuery = 'fresh apple fruit';
          }
        }
        
        const keywords = categoryKeywords[categorySlug] || [];
        if (keywords.length > 0 && !cleanQuery.toLowerCase().includes(keywords[0])) {
          // For groceries, add "fruit" or "fresh" to disambiguate "apple" from "Apple iPhone"
          if (categorySlug === 'groceries' && lowerQuery === 'apple') {
            cleanQuery = 'fresh apple fruit';
          } else if (keywords.length > 0 && cleanQuery.length < 10) {
            // Only add keyword if query is short (to avoid over-qualifying long queries)
            // Don't add if query already contains category context
            const hasContext = keywords.some(kw => lowerQuery.includes(kw));
            if (!hasContext) {
              cleanQuery = `${cleanQuery} ${keywords[0]}`;
            }
          }
        }
        this.devLog(`🔍 Enhanced query for category "${category?.name || 'unknown'}": "${cleanQuery}"`);
      }
    }

    // Step 1: Check if product exists in our database (with category filter if provided)
    // Try multiple search strategies for better matching (original query + enhanced query)
    const searchTerms = [searchQuery.trim()];
    if (cleanQuery !== searchQuery.trim()) {
      searchTerms.push(cleanQuery);
    }
    
    // Build OR conditions explicitly for TypeScript
    const orConditions: any[] = [];
    for (const term of searchTerms) {
      orConditions.push(
        { name: { contains: term } },
        { brand: { contains: term } },
        { description: { contains: term } }
      );
    }
    
    const dbProduct = await this.prisma.product.findFirst({
      where: {
        AND: [
          isBarcode
            ? { barcode: cleanQuery }
            : { OR: orConditions },
          categoryId ? { categoryId } : {},
        ],
      },
      include: {
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
        category: true,
      },
    });

    // If found in database, try barcode-based price lookup first (exact product = correct prices)
    // Then fall back to SerpAPI for fresh multi-store results
    if (dbProduct && dbProduct.prices && dbProduct.prices.length > 0) {
      const uniqueStores = new Set(dbProduct.prices.map((p: any) => p.store?.name || p.storeId));
      const storeCount = uniqueStores.size;

      // CORRECT PRICES: When we have a barcode, try non-Google barcode APIs first (Barcode Lookup, then PricesAPI)
      const dbBarcode = dbProduct.barcode || (isBarcode ? cleanQuery : null);
      if (dbBarcode) {
        const result = await this.getBarcodePricesFromProviders(dbBarcode);
        if (result.prices.length > 0) {
          console.log(`✅ [Barcode] ${result.source} returned ${result.prices.length} stores for UPC ${dbBarcode} (exact product prices)`);
          const productName = result.productName ?? dbProduct.name;
          const productImage = result.productImage ?? dbProduct.images?.[0] ?? dbProduct.image;
          const syntheticProduct = {
            id: dbProduct.id,
            name: productName,
            description: dbProduct.description,
            images: productImage ? [productImage] : (dbProduct.images ?? []),
            image: productImage ?? dbProduct.images?.[0],
            barcode: dbBarcode,
            category: dbProduct.category,
            prices: result.prices.map((p: any) => ({
              price: p.price,
              currency: p.currency || 'USD',
              inStock: p.inStock !== false,
              shippingCost: 0,
              productUrl: p.url,
              store: { id: null, name: p.store, websiteUrl: p.url || '', logo: null },
            })),
          };
          return this.formatMultiStoreResponse(syntheticProduct, result.source);
        }
      }

      // Accurate prices: try PricesAPI by product name (same product → real store offers, 50+ stores)
      if (this.multiStorePriceService?.isEnabled()) {
        const productNameForSearch = dbProduct.name || cleanQuery;
        const multiResult = await this.multiStorePriceService.searchMultiStorePrices(productNameForSearch, {
          country: 'us',
          limit: 100,
        });
        if (multiResult?.prices?.length > 0) {
          console.log(`✅ [PricesAPI] ${multiResult.prices.length} stores for "${productNameForSearch}" (product-name search)`);
          const syntheticProduct = {
            id: dbProduct.id,
            name: multiResult.productName ?? dbProduct.name,
            description: dbProduct.description,
            images: multiResult.productImage ? [multiResult.productImage] : (dbProduct.images ?? []),
            image: multiResult.productImage ?? dbProduct.images?.[0],
            barcode: dbProduct.barcode,
            category: dbProduct.category,
            prices: multiResult.prices.map((p: any) => ({
              price: p.price,
              currency: p.currency || 'USD',
              inStock: p.inStock !== false,
              shippingCost: 0,
              productUrl: p.url,
              store: { id: null, name: p.store, websiteUrl: p.url || '', logo: null },
            })),
          };
          return this.formatMultiStoreResponse(syntheticProduct, 'pricesapi-search');
        }
      }

      // ALWAYS fetch fresh prices - user expects 20+ stores, not just what's in database
      console.log(`🔄 Fetching fresh prices from SerpAPI for "${dbProduct.name}" (database has ${storeCount} stores, user expects 20+)...`);
      console.log(`   Current stores in DB: ${dbProduct.prices.map((p: any) => p.store?.name || 'Unknown').join(', ')}`);
      
      // Fetch fresh prices from SerpAPI (data is stale or doesn't exist)
      if (this.multiStoreScrapingService) {
        this.devLog(`🔍 Product found in database with ${storeCount} stores. Fetching multi-store prices for comprehensive comparison...`);
        this.devLog(`🔍 Using query: "${cleanQuery}"`);
        
        try {
          // CRITICAL: Use the actual product name from database to ensure we get prices for the CORRECT product
          // This prevents price mixing - we search SerpAPI for the exact product we have in the database
          const serpApiQuery = dbProduct.name || cleanQuery;
          this.devLog(`🔍 SerpAPI search query for product "${dbProduct.name}": "${serpApiQuery}"`);
          
          // Ensure we're searching for the correct product by using the database product name
          // This is critical to prevent prices from different products being mixed up
          
          // Request 100 stores so we get as many as possible; primary query = exact product (accuracy)
          let multiStoreResult = await this.multiStoreScrapingService.searchProductWithMultiStorePrices(
            serpApiQuery,
            { limit: 100 }
          );
          
          // Find more stores: merge with a second query (short/variant). Keep primary query's price when same store (accuracy).
          const shortQuery = (serpApiQuery.length > 20) ? this.buildShortProductQueryForMultiStore(serpApiQuery) : null;
          const count = multiStoreResult ? multiStoreResult.storePrices.length : 0;
          if (count < 50 && shortQuery && shortQuery !== serpApiQuery) {
            this.devLog(`🔍 ${count} stores from primary query, fetching more with: "${shortQuery}"`);
            const fallbackResult = await this.multiStoreScrapingService.getAllStorePricesFromSerpAPI(shortQuery, { limit: 100 });
            if (fallbackResult && fallbackResult.length > 0) {
              const primaryByStore = new Map<string, any>();
              (multiStoreResult!.storePrices || []).forEach((p: any) => {
                const k = (p.storeName || '').toLowerCase().trim();
                if (k && !primaryByStore.has(k)) primaryByStore.set(k, p);
              });
              fallbackResult.forEach((p: any) => {
                const k = (p.storeName || '').toLowerCase().trim();
                if (k && !primaryByStore.has(k)) primaryByStore.set(k, p);
              });
              const merged = Array.from(primaryByStore.values()).sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
              multiStoreResult = { ...multiStoreResult!, storePrices: merged };
              this.devLog(`✅ Merged to ${merged.length} stores (primary + extra from variant query)`);
            }
          }
          
          this.devLog(`📦 Multi-store result: ${multiStoreResult ? multiStoreResult.storePrices.length : 0} stores found`);
          
          // CRITICAL FIX: Always use SerpAPI results if available, even if same or fewer stores
          // SerpAPI results are fresher and more accurate than database
          if (multiStoreResult && multiStoreResult.storePrices.length > 0) {
            const serpApiStoreCount = multiStoreResult.storePrices.length;
            this.devLog(`✅ Found ${serpApiStoreCount} store prices from SerpAPI (database had ${storeCount}). Using SerpAPI results (fresher prices)...`);
            
            // Update product with new store prices from SerpAPI
            // CRITICAL: Validate prices are realistic for the product type
            // This prevents prices from accessories or wrong products from being saved
            const validatedPrices = multiStoreResult.storePrices.filter((storePrice: any) => {
              const price = Number(storePrice.price) || 0;
              
              // Only filter out obviously invalid prices (negative, zero, or absurdly high)
              if (price <= 0 || price > 100000) {
                this.devLog(`⚠️ Skipping invalid price for "${dbProduct.name}" at ${storePrice.storeName}: $${price}`);
                return false;
              }
              
              // Additional validation: Check if price is realistic for this product type
              // This catches cases where SerpAPI returns prices for accessories or wrong products
              const productNameLower = (dbProduct.name || '').toLowerCase();
              
              // iPhone Pro Max should be at least $600 (even used/refurbished)
              if (productNameLower.includes('iphone') && productNameLower.includes('pro max')) {
                if (price < 600) {
                  console.warn(`⚠️ Skipping unrealistic price for "${dbProduct.name}" at ${storePrice.storeName}: $${price} (likely an accessory or wrong product)`);
                  return false;
                }
              }
              // iPhone Pro should be at least $500
              else if (productNameLower.includes('iphone') && productNameLower.includes('pro') && !productNameLower.includes('max')) {
                if (price < 500) {
                  console.warn(`⚠️ Skipping unrealistic price for "${dbProduct.name}" at ${storePrice.storeName}: $${price} (likely an accessory or wrong product)`);
                  return false;
                }
              }
              // Regular iPhone should be at least $300
              else if (productNameLower.includes('iphone') && !productNameLower.includes('pro')) {
                if (price < 300) {
                  console.warn(`⚠️ Skipping unrealistic price for "${dbProduct.name}" at ${storePrice.storeName}: $${price} (likely an accessory or wrong product)`);
                  return false;
                }
              }
              
              return true;
            });
            
            this.devLog(`✅ Using ${validatedPrices.length}/${multiStoreResult.storePrices.length} prices from SerpAPI for "${dbProduct.name}"`);
            
            if (validatedPrices.length === 0) {
              console.warn(`⚠️ No valid prices from SerpAPI for "${dbProduct.name}" - using database prices instead`);
              // Return database product if all SerpAPI prices were invalid
              return this.formatMultiStoreResponse(dbProduct, 'database');
            }
            
            for (const storePrice of validatedPrices) {
              // Find or create store
              let store = await this.prisma.store.findFirst({
                where: { name: { equals: storePrice.storeName } },
              });
              
              if (!store) {
                store = await this.prisma.store.create({
                  data: {
                    name: storePrice.storeName,
                    slug: storePrice.storeId || storePrice.storeName.toLowerCase().replace(/\s+/g, '-'),
                    logo: this.getStoreLogoUrlForSave(storePrice.storeName, storePrice.url),
                    websiteUrl: storePrice.url || `https://www.${storePrice.storeName.toLowerCase().replace(/\s+/g, '')}.com`,
                    enabled: true,
                  },
                });
              }
              
              // CRITICAL: Ensure we're saving price for the CORRECT product
              // Double-check product ID matches to prevent price mixing
              if (!dbProduct.id) {
                console.error(`❌ Cannot save price - product ID is missing for "${dbProduct.name}"`);
                continue;
              }
              
              // Check if price already exists
              const existingPrice = await this.prisma.productPrice.findFirst({
                where: {
                  productId: dbProduct.id,
                  storeId: store.id,
                },
              });
              
              // Use upsert to handle race conditions
              // CRITICAL: Always use dbProduct.id to ensure price is saved to correct product
              await this.prisma.productPrice.upsert({
                where: {
                  productId_storeId: {
                    productId: dbProduct.id, // Ensure correct product ID
                    storeId: store.id,
                  },
                },
                    update: {
                      price: storePrice.price,
                      currency: storePrice.currency || 'USD',
                      shippingCost: storePrice.shippingCost || 0,
                      inStock: storePrice.inStock,
                      productUrl: storePrice.url,
                      lastUpdated: new Date(), // Update timestamp when refreshing prices
                    },
                create: {
                  productId: dbProduct.id, // Ensure correct product ID
                  storeId: store.id,
                  price: storePrice.price,
                  currency: storePrice.currency || 'USD',
                  shippingCost: storePrice.shippingCost || 0,
                  inStock: storePrice.inStock,
                  productUrl: storePrice.url,
                  lastUpdated: new Date(), // Set timestamp when creating new price
                },
              });
              
              if (existingPrice) {
                // Update existing price if new price is different
                // Convert Prisma Decimal to number for comparison
                const existingPriceNum = Number(existingPrice.price);
                const newPriceNum = Number(storePrice.price);
                if (existingPriceNum !== newPriceNum) {
                  await this.prisma.productPrice.update({
                    where: { id: existingPrice.id },
                    data: {
                      price: storePrice.price,
                      inStock: storePrice.inStock,
                      lastUpdated: new Date(), // Update timestamp when price changes
                      productUrl: storePrice.url || existingPrice.productUrl,
                    },
                  });
                }
              }
            }
            
            // Reload product with updated prices
            const updatedProduct = await this.prisma.product.findUnique({
              where: { id: dbProduct.id },
              include: {
                prices: {
                  include: { store: true },
                  orderBy: { price: 'asc' },
                },
                category: true,
              },
            });
            
            // Always return updated product with SerpAPI prices (even if same count, they're fresher)
            if (updatedProduct) {
              this.devLog(`✅ Returning product with ${updatedProduct.prices.length} store prices from SerpAPI (database had ${storeCount}, now has ${updatedProduct.prices.length})`);
              return this.formatMultiStoreResponse(updatedProduct, 'database-updated');
            }
          }
        } catch (error) {
          console.error(`❌ Failed to fetch multi-store prices for "${dbProduct.name}": ${error.message}`);
          console.error(`   Error stack: ${error.stack}`);
          console.error(`   Product ID: ${dbProduct.id}, Database stores: ${storeCount}`);
          // Continue to return database product if multi-store fetch fails
        }
      } else {
        console.warn(`⚠️ Multi-store scraping service not configured for product "${dbProduct.name}". Add SERPER_API_KEY or SERPAPI_KEY to .env to enable multi-store price fetching.`);
        console.warn(`   Product ID: ${dbProduct.id}, Database stores: ${storeCount}`);
      }
      
      // Fallback: Return database product if multi-store fetch failed or wasn't configured
      console.log(`⚠️ Returning database product "${dbProduct.name}" with ${storeCount} stores (multi-store fetch may have failed or not configured)`);
      console.log(`   Product ID: ${dbProduct.id}`);
      console.log(`   Stores in database: ${dbProduct.prices.map((p: any) => p.store?.name || 'Unknown').join(', ')}`);
      return this.formatMultiStoreResponse(dbProduct, 'database');
    }

    // Step 2: If not in database, search via APIs
    // PRIORITY: Use SerpAPI ONLY (client paid for SerpAPI, not PriceAPI)
    // Disable PriceAPI to avoid 402 errors and focus on SerpAPI which returns 20+ stores
    let priceApiResults: any[] = [];
    let priceApiFailed = true; // Always skip PriceAPI - client paid for SerpAPI
    const priceApiEnabled = false; // Disabled - client paid for SerpAPI, not PriceAPI
    
    // Skip PriceAPI completely - use SerpAPI directly
    console.log(`ℹ️ Using SerpAPI directly for "${cleanQuery}" (PriceAPI disabled - client paid for SerpAPI)...`);
    if (false) { // Never execute PriceAPI code
      // PriceAPI is enabled - try it first
      try {
        priceApiResults = await this.priceApiService.searchProducts(cleanQuery, {
          limit: 20, // Get more results to find the best match
        });
      } catch (error: any) {
        // PriceAPI failed (e.g., 402 no credits) - log and fallback to SerpAPI
        console.warn(`⚠️ PriceAPI failed for "${cleanQuery}": ${error.message}`);
        console.warn(`   Falling back to SerpAPI directly...`);
        priceApiFailed = true;
        priceApiResults = [];
      }
    }

    // If PriceAPI returned results, use them
    if (priceApiResults && priceApiResults.length > 0) {
      try {
        // Prioritize generic products over branded/specific variants
        // For generic queries like "milk", prefer "Milk" over "Chocolate Milk" or "Organic Milk"
        const lowerQuery = cleanQuery.toLowerCase().trim();
        const isGenericQuery = lowerQuery.length < 15 && !lowerQuery.includes(' ') || 
                               ['milk', 'bread', 'eggs', 'cheese', 'butter', 'rice', 'pasta', 
                                'apples', 'bananas', 'oranges', 'tomatoes', 'lettuce', 'onions'].includes(lowerQuery);
        
        let selectedProduct = priceApiResults[0];
        
        if (isGenericQuery) {
          // Find the most generic match (exact match or closest to query)
          const exactMatch = priceApiResults.find(p => 
            p.name.toLowerCase().trim() === lowerQuery ||
            p.name.toLowerCase().trim() === `${lowerQuery} ` ||
            p.name.toLowerCase().trim() === ` ${lowerQuery}`
          );
          
          if (exactMatch) {
            selectedProduct = exactMatch;
          }
          
          if (!exactMatch) {
            // Find product with shortest name that contains the query (most generic)
            const genericMatches = priceApiResults.filter(p => {
              const productName = p.name.toLowerCase();
              // Must contain the query word, but prefer shorter names (more generic)
              return productName.includes(lowerQuery) && 
                     !productName.includes('chocolate') &&
                     !productName.includes('organic') &&
                     !productName.includes('flavored') &&
                     !productName.includes('sweetened');
            });
            
            if (genericMatches.length > 0) {
              // Sort by name length (shorter = more generic) and take the first
              genericMatches.sort((a, b) => a.name.length - b.name.length);
              selectedProduct = genericMatches[0];
            }
          }
        }
        
        const firstProduct = selectedProduct;
        
        // Extract barcode from selected result if available
        const extractedBarcode = firstProduct.barcode || (isBarcode ? cleanQuery : null);
          
          // CRITICAL: Try to get multi-store prices using HYBRID approach (PriceAPI + SerpAPI)
          // This combines Amazon from PriceAPI + other stores from SerpAPI
          // IMPORTANT: Use SerpAPI directly (getAllStorePricesFromSerpAPI) instead of searchProductWithMultiStorePrices
          // because searchProductWithMultiStorePrices tries PriceAPI again, which fails when out of credits
          if (this.multiStoreScrapingService) {
            try {
              // Request 100 stores to ensure we get ALL stores from SerpAPI
              // SerpAPI can return 40+ results, and we want to capture ALL unique stores
              // User expects 20+ stores, so we request more to account for deduplication
              // CRITICAL: Use the product name from PriceAPI result to ensure we get prices for the CORRECT product
              const productQuery = firstProduct.name || cleanQuery;
              this.devLog(`🔍 Fetching multi-store prices from SerpAPI for product: "${productQuery}" (original query: "${cleanQuery}")`);
              
              // Use SerpAPI directly to get other stores (excluding Amazon since we have it from PriceAPI)
              const serpApiStorePrices = await this.multiStoreScrapingService.getAllStorePricesFromSerpAPI(
                productQuery,
                { limit: 100, excludeAmazon: true } // Exclude Amazon since we already have it from PriceAPI
              );
              
              // Combine Amazon price from PriceAPI + other stores from SerpAPI
              const allStorePrices: any[] = [];
              
              // Add Amazon price from PriceAPI first (if available)
              // PriceAPI results have price, store, currency, inStock, url, image, shipping fields
              if (firstProduct && firstProduct.price) {
                allStorePrices.push({
                  storeName: firstProduct.store || 'Amazon',
                  storeId: 'amazon',
                  price: firstProduct.price,
                  currency: firstProduct.currency || 'USD',
                  formattedPrice: `$${firstProduct.price.toFixed(2)}`,
                  inStock: firstProduct.inStock !== false,
                  url: firstProduct.url || '',
                  image: firstProduct.image,
                  shippingCost: firstProduct.shipping || 0,
                  totalPrice: firstProduct.price + (firstProduct.shipping || 0),
                  lastUpdated: new Date(),
                });
              }
              
              // Add other stores from SerpAPI
              allStorePrices.push(...serpApiStorePrices);
              
              // Sort by store priority (well-known stores first) then by price
              this.sortStoresByPriorityAndPrice(allStorePrices);
              
              if (allStorePrices.length > 0) {
                this.devLog(`✅ Found ${allStorePrices.length} store prices (Amazon from PriceAPI + ${serpApiStorePrices.length} others from SerpAPI)!`);
                
                // Save multi-store prices to database
                const productName = firstProduct.name;
                const productImage = firstProduct.image;
                const barcode = extractedBarcode;
                
                // Find or create product
                let product = await this.prisma.product.findFirst({
                  where: barcode ? { barcode } : { name: { contains: productName } },
                  include: {
                    prices: { include: { store: true } },
                    category: true,
                  },
                });
                
                if (!product) {
                  // Create product if doesn't exist
                  // Use categoryId if provided, otherwise default to electronics
                  const category = categoryId 
                    ? await this.prisma.category.findUnique({ where: { id: categoryId } })
                    : await this.prisma.category.findFirst({ where: { slug: 'electronics' } });
                  product = await this.prisma.product.create({
                    data: {
                      name: productName,
                      images: productImage ? [productImage] : [],
                      barcode: barcode || null,
                      categoryId: category?.id || (await this.prisma.category.findFirst())?.id || '',
                    },
                    include: {
                      prices: { include: { store: true } },
                      category: true,
                    },
                  });
                }
                
                // Add prices from all stores
                // CRITICAL: Only save prices that are valid and belong to this product
                // Trust SerpAPI prices - only filter out obviously invalid data
                const validStorePrices = allStorePrices.filter((sp: any) => {
                  const price = Number(sp.price) || 0;
                  // Only filter out obviously invalid prices (negative, zero, absurdly high)
                  return price > 0 && price <= 100000;
                });
                
                this.devLog(`✅ Saving ${validStorePrices.length}/${allStorePrices.length} valid prices to database for product "${productName}"`);
                
                for (const storePrice of validStorePrices) {
                  // Find or create store
                  let store = await this.prisma.store.findFirst({
                    where: { name: { equals: storePrice.storeName } },
                  });
                  
                  if (!store) {
                    store = await this.prisma.store.create({
                      data: {
                        name: storePrice.storeName,
                        slug: storePrice.storeId || storePrice.storeName.toLowerCase().replace(/\s+/g, '-'),
                        logo: this.getStoreLogoUrlForSave(storePrice.storeName, storePrice.url),
                        websiteUrl: storePrice.url,
                        enabled: true,
                      },
                    });
                  }
                  
                  // CRITICAL: Ensure we're saving price for the CORRECT product
                  if (!product.id) {
                    console.error(`❌ Cannot save price - product ID is missing for "${productName}"`);
                    continue;
                  }
                  
                  // Check if price already exists
                  const existingPrice = await this.prisma.productPrice.findFirst({
                    where: {
                      productId: product.id,
                      storeId: store.id,
                    },
                  });
                  
                  // Use upsert to handle race conditions (multiple requests creating same price simultaneously)
                  // CRITICAL: Always use product.id to ensure price is saved to correct product
                  await this.prisma.productPrice.upsert({
                    where: {
                      productId_storeId: {
                        productId: product.id, // Ensure correct product ID
                        storeId: store.id,
                      },
                    },
                    update: {
                      price: storePrice.price,
                      currency: storePrice.currency || 'USD',
                      inStock: storePrice.inStock,
                      productUrl: storePrice.url || null,
                      shippingCost: storePrice.shippingCost || 0,
                      lastUpdated: new Date(), // Update timestamp when refreshing prices
                    },
                    create: {
                      productId: product.id, // Ensure correct product ID
                      storeId: store.id,
                      price: storePrice.price,
                      currency: storePrice.currency || 'USD',
                      inStock: storePrice.inStock,
                      productUrl: storePrice.url || null,
                      shippingCost: storePrice.shippingCost || 0,
                      lastUpdated: new Date(), // Set timestamp when creating new price
                    },
                  });
                  
                  if (existingPrice) {
                    // Update existing price if URL is missing or price changed
                    if (!existingPrice.productUrl && storePrice.url) {
                      await this.prisma.productPrice.update({
                        where: { id: existingPrice.id },
                        data: {
                          productUrl: storePrice.url,
                          price: storePrice.price, // Also update price in case it changed
                          inStock: storePrice.inStock,
                        },
                      });
                    }
                  }
                }
                
                // Reload product with all prices
                const updatedProduct = await this.prisma.product.findFirst({
                  where: { id: product.id },
                  include: {
                    prices: {
                      include: { store: true },
                      orderBy: { price: 'asc' },
                    },
                    category: true,
                  },
                });
                
                if (updatedProduct && updatedProduct.prices.length > 0) {
                  return this.formatMultiStoreResponse(updatedProduct, 'hybrid-priceapi-serpapi');
                }
              }
            } catch (error) {
              console.error(`⚠️  Error fetching multi-store prices: ${error.message}`);
              // Continue with PriceAPI results if multi-store fetch fails
            }
          }
          
          // Fallback: Try old PricesAPI service if available
          if (this.multiStorePriceService?.isEnabled()) {
            try {
              const multiStoreResult = await this.multiStorePriceService.searchMultiStorePrices(
                cleanQuery,
                { limit: 10 }
              );
              
              if (multiStoreResult && multiStoreResult.prices.length > 0) {
                // ... (keep existing PricesAPI logic here if needed)
              }
            } catch (error) {
              console.error(`⚠️  PricesAPI fallback failed: ${error.message}`);
            }
          }
          
          // CRITICAL: If we have a barcode, search database for prices from ALL stores
          if (extractedBarcode) {
            const multiStoreProduct = await this.prisma.product.findFirst({
              where: { barcode: extractedBarcode },
              include: {
                prices: {
                  include: { store: true },
                  orderBy: { price: 'asc' },
                },
                category: true,
              },
            });
            
            // If database has prices from multiple stores, use that!
            if (multiStoreProduct && multiStoreProduct.prices && multiStoreProduct.prices.length > 0) {
              return this.formatMultiStoreResponse(multiStoreProduct, 'database');
            }
          }
        
        // Auto-save product to database for future searches
        try {
          const savedProduct = await this.autoSaveProductFromAPI(
            firstProduct,
            extractedBarcode,
            priceApiResults,
              undefined, // No categorySlug for search queries
          );
          
          if (savedProduct && savedProduct.name) {
            // Return the saved product with all its prices
              // NOTE: Initially only has Amazon prices, but barcode allows future multi-store lookup
            return this.formatMultiStoreResponse(savedProduct, 'priceapi-saved');
          }
        } catch (error) {
            console.error(`⚠️  Could not auto-save product: ${error.message}`);
            // Continue to return API results even if save fails
        }

          // Fallback: return API results directly (only Amazon for now)
        return {
          product: {
            id: `temp-${Date.now()}`, // Generate temp ID for products not yet in database
            name: firstProduct.name,
            description: null,
              image: firstProduct.image || null, // Ensure image is passed through
            barcode: extractedBarcode,
            category: null, // No category for PriceAPI-only results (no category context)
          },
          prices: priceApiResults.map((item, index) => {
            // For now, use store homepage URL instead of specific product URL
            const storeName = item.store.toLowerCase();
            let storeUrl = item.url; // Try to use URL from PriceAPI first
            
            // Generate store homepage if URL is missing
            if (!storeUrl) {
              if (storeName.includes('amazon')) {
                storeUrl = 'https://www.amazon.com';
              } else if (storeName.includes('walmart')) {
                storeUrl = 'https://www.walmart.com';
              } else if (storeName.includes('target')) {
                storeUrl = 'https://www.target.com';
              } else if (storeName.includes('best buy') || storeName.includes('bestbuy')) {
                storeUrl = 'https://www.bestbuy.com';
              } else {
                storeUrl = `https://www.${item.store.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com`;
              }
            }
            
            return {
              rank: index + 1,
              store: {
                name: item.store,
                logo: this.getStoreLogoUrlForSave(item.store, storeUrl),
                url: storeUrl, // Store website URL
              },
              price: item.price,
              currency: item.currency,
              inStock: item.inStock,
              shippingCost: item.shipping || 0,
              totalPrice: item.price + (item.shipping || 0),
              savings: index === 0 ? 0 : item.price - priceApiResults[0].price,
              isBestPrice: index === 0,
              productUrl: storeUrl, // Use store homepage for now
            };
          }),
          metadata: {
            source: 'priceapi',
            totalStores: priceApiResults.length,
            lowestPrice: Math.min(...priceApiResults.map((r) => r.price)),
            highestPrice: Math.max(...priceApiResults.map((r) => r.price)),
            maxSavings:
              Math.max(...priceApiResults.map((r) => r.price)) -
              Math.min(...priceApiResults.map((r) => r.price)),
            searchedAt: new Date().toISOString(),
              note: extractedBarcode 
                ? `Product saved with barcode ${extractedBarcode}. Add prices from other stores to database for multi-retailer comparison.`
                : 'No barcode found. Add barcode manually to enable multi-store price lookup.',
          },
        };
      } catch (error) {
        console.error(`❌ PriceAPI processing failed for "${cleanQuery}":`, error.message);
        // Continue to try SerpAPI fallback
      }
    }

    // Step 2b: CORRECT PRICES – When query is a barcode, try non-Google barcode APIs first (Barcode Lookup, then PricesAPI)
    if (isBarcode && cleanQuery) {
      const result = await this.getBarcodePricesFromProviders(cleanQuery);
      if (result.prices.length > 0) {
        console.log(`✅ [Barcode] ${result.source} returned ${result.prices.length} stores for UPC ${cleanQuery} (exact product prices)`);
        const productName = result.productName ?? `Product (UPC: ${cleanQuery})`;
        const productImage = result.productImage ?? result.prices[0]?.image;
        const syntheticProduct = {
          id: `barcode-${cleanQuery}`,
          name: productName,
          description: null,
          images: productImage ? [productImage] : [],
          image: productImage,
          barcode: cleanQuery,
          category: null,
          prices: result.prices.map((p: any) => ({
            price: p.price,
            currency: p.currency || 'USD',
            inStock: p.inStock !== false,
            shippingCost: 0,
            productUrl: p.url,
            store: { id: null, name: p.store, websiteUrl: p.url || '', logo: null },
          })),
        };
        return this.formatMultiStoreResponse(syntheticProduct, result.source);
      }
    }

    // Step 2c: Try PricesAPI by product name (accurate multi-store, 50+ stores) before Serper
    if (!isBarcode && this.multiStorePriceService?.isEnabled()) {
      const multiResult = await this.multiStorePriceService.searchMultiStorePrices(cleanQuery, {
        country: 'us',
        limit: 100,
      });
      if (multiResult?.prices?.length > 0) {
        console.log(`✅ [PricesAPI] ${multiResult.prices.length} stores for "${cleanQuery}" (search)`);
        const syntheticProduct = {
          id: `pricesapi-${Date.now()}`,
          name: multiResult.productName ?? cleanQuery,
          description: null,
          images: multiResult.productImage ? [multiResult.productImage] : [],
          image: multiResult.productImage ?? null,
          barcode: multiResult.barcode ?? null,
          category: null,
          prices: multiResult.prices.map((p: any) => ({
            price: p.price,
            currency: p.currency || 'USD',
            inStock: p.inStock !== false,
            shippingCost: 0,
            productUrl: p.url,
            store: { id: null, name: p.store, websiteUrl: p.url || '', logo: null },
          })),
        };
        return this.formatMultiStoreResponse(syntheticProduct, 'pricesapi-search');
      }
    }

    // Step 3: Fallback to SerpAPI when PricesAPI/Barcode Lookup have no results
    // SerpAPI returns 20+ stores from well-known USA retailers (Walmart, Target, Amazon, etc.)
    if ((priceApiFailed || !priceApiResults || priceApiResults.length === 0) && this.multiStoreScrapingService) {
      console.log(`🚀 Using SerpAPI directly for "${cleanQuery}" (PriceAPI disabled - client paid for SerpAPI)...`);
      if (false) { // Never execute this branch
        console.log(`🔄 PriceAPI unavailable or returned no results. Trying SerpAPI directly for "${cleanQuery}"...`);
      }
      try {
        // Use SerpAPI directly (skip PriceAPI which already failed)
        let serpApiStorePrices = await this.multiStoreScrapingService.getAllStorePricesFromSerpAPI(
          cleanQuery,
          { limit: 100, excludeAmazon: false } // Include Amazon since PriceAPI failed
        );
        
        // Find more stores: merge with variant query when primary returns few (keep primary for accuracy)
        if (serpApiStorePrices && serpApiStorePrices.length < 50 && cleanQuery.length > 20) {
          const shortQuery = this.buildShortProductQueryForMultiStore(cleanQuery);
          if (shortQuery && shortQuery !== cleanQuery) {
            const extra = await this.multiStoreScrapingService.getAllStorePricesFromSerpAPI(shortQuery, { limit: 100, excludeAmazon: false });
            if (extra && extra.length > 0) {
              const byStore = new Map<string, any>();
              serpApiStorePrices.forEach((p: any) => { const k = (p.storeName || '').toLowerCase().trim(); if (k) byStore.set(k, p); });
              extra.forEach((p: any) => { const k = (p.storeName || '').toLowerCase().trim(); if (k && !byStore.has(k)) byStore.set(k, p); });
              serpApiStorePrices = Array.from(byStore.values()).sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
              console.log(`✅ Merged to ${serpApiStorePrices.length} stores (primary + variant query)`);
            }
          }
        }
        
        if (serpApiStorePrices && serpApiStorePrices.length > 0) {
          console.log(`✅ SerpAPI found ${serpApiStorePrices.length} stores for "${cleanQuery}"`);
          
          // Sort by store priority (well-known stores first) then by price
          this.sortStoresByPriorityAndPrice(serpApiStorePrices);
          
          // Extract product info from first SerpAPI result (they all have the same product)
          const firstStorePrice = serpApiStorePrices[0];
          // Try to get product name from SerpAPI result title, or use search query
          // SerpAPI results have a title field that contains the product name
          const productName = cleanQuery; // Use the search query as product name (can be improved by extracting from SerpAPI title)
          const productImage = firstStorePrice.image || null;
          const barcode = null; // SerpAPI doesn't provide barcode
          
          // Find or create product
          let product = await this.prisma.product.findFirst({
            where: { name: { contains: productName } },
            include: {
              prices: { include: { store: true } },
              category: true,
            },
          });
          
          if (!product) {
            // Get category
            const category = categoryId 
              ? await this.prisma.category.findUnique({ where: { id: categoryId } })
              : await this.prisma.category.findFirst({ where: { slug: 'electronics' } });
            
            product = await this.prisma.product.create({
              data: {
                name: productName,
                images: productImage ? [productImage] : [],
                barcode: barcode || null,
                categoryId: category?.id || (await this.prisma.category.findFirst())?.id || '',
              },
              include: {
                prices: { include: { store: true } },
                category: true,
              },
            });
          }
          
          // Save prices
          for (const storePrice of serpApiStorePrices) {
            let store = await this.prisma.store.findFirst({
              where: { name: { equals: storePrice.storeName } },
            });
            
            if (!store) {
              store = await this.prisma.store.create({
                data: {
                  name: storePrice.storeName,
                  slug: storePrice.storeId || storePrice.storeName.toLowerCase().replace(/\s+/g, '-'),
                  logo: this.getStoreLogoUrlForSave(storePrice.storeName, storePrice.url),
                  websiteUrl: storePrice.url,
                  enabled: true,
                },
              });
            }
            
            await this.prisma.productPrice.upsert({
              where: {
                productId_storeId: {
                  productId: product.id,
                  storeId: store.id,
                },
              },
              update: {
                price: storePrice.price,
                currency: storePrice.currency || 'USD',
                shippingCost: storePrice.shippingCost || 0,
                inStock: storePrice.inStock,
                productUrl: storePrice.url,
                lastUpdated: new Date(),
              },
              create: {
                productId: product.id,
                storeId: store.id,
                price: storePrice.price,
                currency: storePrice.currency || 'USD',
                shippingCost: storePrice.shippingCost || 0,
                inStock: storePrice.inStock,
                productUrl: storePrice.url,
                lastUpdated: new Date(),
              },
            });
          }
          
          // Reload product with prices
          const updatedProduct = await this.prisma.product.findUnique({
            where: { id: product.id },
            include: {
              prices: {
                include: { store: true },
                orderBy: { price: 'asc' },
              },
              category: true,
            },
          });
          
          if (updatedProduct) {
            return this.formatMultiStoreResponse(updatedProduct, 'serpapi-fallback');
          }
        }
      } catch (serpApiError: any) {
        console.error(`❌ SerpAPI fallback also failed for "${cleanQuery}":`, serpApiError.message);
      }
    }

    // Step 4: No results found from any source
    this.devLog(`❌ No results found for: "${cleanQuery}"`);
    
    // Generate helpful suggestions based on the query
    let suggestions: string[] = [];
    const lowerQuery = cleanQuery.toLowerCase();
    
    // Suggest common kitchen items if query is short or looks like a typo
    if (lowerQuery.length <= 4 || lowerQuery === 'cuo' || lowerQuery === 'cup') {
      suggestions = [
        'coffee cup',
        'measuring cup',
        'mug',
        'tea cup',
      ];
    } else if (lowerQuery.includes('cup')) {
      suggestions = [
        'coffee cup',
        'measuring cup',
        'travel mug',
      ];
    }
    
    let message = this.priceApiService.isEnabled() 
      ? `No products found for "${cleanQuery}".`
      : `PriceAPI is not configured. Add PRICEAPI_KEY to .env file to enable product searches.`;
    
    if (suggestions.length > 0) {
      message += ` Try searching for: ${suggestions.slice(0, 3).join(', ')}`;
    } else if (this.priceApiService.isEnabled()) {
      message += ` Try a different search term or check if the product exists on Amazon.`;
    }
    
    return {
      product: null,
      prices: [],
      metadata: {
        source: 'none',
        totalStores: 0,
        searchedAt: new Date().toISOString(),
        message,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        priceApiEnabled: this.priceApiService.isEnabled(),
      },
    };
  }

  /**
   * Return suggestion products for fast search when Serper/SerpAPI return no results (e.g. "Not enough credits").
   * Same shape as fast search: { id, name, image, category, categorySlug, barcode, storePrices }.
   */
  private getFallbackProductsForFastSearch(
    query: string,
    categorySlug: string | undefined,
    categoryName: string,
    limit: number,
  ): any[] {
    const q = query.toLowerCase();
    const slug = categorySlug || '';
    const img = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
    const ts = Date.now();
    // Electronics + headphones / earbuds
    if ((slug === 'electronics' || slug === 'all-retailers') && (q.includes('headphone') || q.includes('earbud') || q.includes('earphone'))) {
      const names = [
        'Sony WH-1000XM5 Wireless Headphones',
        'Bose QuietComfort 45 Headphones',
        'Apple AirPods Pro (2nd Gen)',
        'Sennheiser Momentum 4 Wireless',
        'JBL Tour One M2',
        'Apple AirPods Max',
      ];
      return names.slice(0, limit).map((name, i) => ({
        id: `fallback-${ts}-${i}`,
        name,
        image: img,
        category: categoryName || 'Electronics',
        categorySlug: slug || 'electronics',
        barcode: null,
        storePrices: [],
      }));
    }
    // Electronics + laptop
    if ((slug === 'electronics' || slug === 'all-retailers') && (q.includes('laptop') || q.includes('computer') || q.includes('notebook'))) {
      const names = ['MacBook Pro 14"', 'Dell XPS 15', 'HP Pavilion 15', 'Lenovo ThinkPad X1', 'ASUS ZenBook 14', 'Microsoft Surface Laptop 5'];
      return names.slice(0, limit).map((name, i) => ({
        id: `fallback-${ts}-${i}`,
        name,
        image: img,
        category: categoryName || 'Electronics',
        categorySlug: slug || 'electronics',
        barcode: null,
        storePrices: [],
      }));
    }
    // Generic electronics
    if (slug === 'electronics' || slug === 'all-retailers') {
      const names = ['Wireless Headphones', 'Bluetooth Earbuds', 'USB-C Hub', 'Wireless Mouse', 'Mechanical Keyboard', 'Portable SSD'];
      return names.slice(0, limit).map((name, i) => ({
        id: `fallback-${ts}-${i}`,
        name,
        image: img,
        category: categoryName || 'Electronics',
        categorySlug: slug || 'electronics',
        barcode: null,
        storePrices: [],
      }));
    }
    return [];
  }

  /**
   * Return placeholder products when Puppeteer/SerpAPI returns 0 (e.g. Google shows Deals instead of query results).
   * So the category page shows something instead of infinite spinner.
   */
  private getPlaceholderProductsForCategory(categorySlug: string, limit: number): any[] {
    const placeholders: Record<string, { names: string[]; image: string }> = {
      mattresses: {
        names: ['Memory Foam Mattress', 'Hybrid Mattress', 'Innerspring Mattress', 'Mattress Topper', 'Cooling Gel Mattress', 'Bed in a Box'],
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400',
      },
      electronics: {
        names: ['Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', 'Webcam', 'Monitor', 'Headphones'],
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
      },
      groceries: {
        names: ['Organic Milk', 'Whole Grain Bread', 'Fresh Eggs', 'Bananas', 'Chicken Breast', 'Salmon'],
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      },
      kitchen: {
        names: ['Blender', 'Air Fryer', 'Coffee Maker', 'Toaster', 'Instant Pot', 'Stand Mixer'],
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      },
    };
    const config = placeholders[categorySlug] || {
      names: [`${categorySlug.replace(/-/g, ' ')} product 1`, `${categorySlug.replace(/-/g, ' ')} product 2`, `${categorySlug.replace(/-/g, ' ')} product 3`, `${categorySlug.replace(/-/g, ' ')} product 4`, `${categorySlug.replace(/-/g, ' ')} product 5`, `${categorySlug.replace(/-/g, ' ')} product 6`],
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    };
    return config.names.slice(0, limit).map((name, i) => ({
      id: `placeholder-${categorySlug}-${i}-${Date.now()}`,
      name,
      // Each product gets unique placeholder image with product name
      images: [`https://via.placeholder.com/400?text=${encodeURIComponent(name.substring(0, 30))}`],
      prices: [{ price: 99.99, store: { name: 'View prices at store' } }],
      storePrices: [{ store: { name: 'View prices at store' }, price: 99.99 }],
      lowestPrice: 99.99,
      highestPrice: 99.99,
      savings: 0,
      category: { slug: categorySlug, name: categorySlug.replace(/-/g, ' '), id: categorySlug },
    }));
  }

  /**
   * Filter SerpAPI results by category keywords to avoid irrelevant items
   * Example: When searching "pineapple" in groceries, filter out "pine lumber" results
   * Example: When searching "mango" in groceries, filter out "MANGO" clothing brand
   */
  private filterSerpAPIResultsByCategory(
    results: Array<{ name: string; image: string; price: number; url: string; store: string }>,
    categorySlug: string,
    searchQuery: string,
  ): Array<{ name: string; image: string; price: number; url: string; store: string }> {
    const lowerQuery = searchQuery.toLowerCase();
    const categoryKeywords: Record<string, string[]> = {
      groceries: ['fruit', 'vegetable', 'food', 'grocery', 'produce', 'fresh', 'organic', 'milk', 'cheese', 'bread', 'meat', 'chicken', 'beef', 'pork', 'fish', 'seafood', 'snack', 'cereal', 'pasta', 'rice', 'sauce', 'spice', 'herb', 'beverage', 'drink', 'juice', 'soda', 'water', 'coffee', 'tea', 'wine', 'beer', 'yogurt', 'butter', 'egg', 'banana', 'apple', 'orange', 'grape', 'berry', 'pineapple', 'mango', 'mangoes', 'avocado', 'tomato', 'lettuce', 'onion', 'potato', 'carrot'],
      electronics: ['phone', 'laptop', 'tablet', 'computer', 'tv', 'television', 'headphone', 'earbud', 'earphone', 'airpods', 'speaker', 'camera', 'monitor', 'keyboard', 'mouse', 'printer', 'scanner', 'smartwatch', 'watch', 'electronic', 'device', 'gadget'],
      kitchen: ['blender', 'microwave', 'oven', 'stove', 'coffee maker', 'toaster', 'mixer', 'air fryer', 'pressure cooker', 'rice cooker', 'pot', 'pan', 'knife', 'utensil', 'appliance'],
      'sports-equipment': ['basketball', 'football', 'soccer', 'baseball', 'tennis', 'racket', 'dumbbell', 'barbell', 'yoga mat', 'gym equipment', 'athletic', 'sports', 'running shoes', 'athletic shoes', 'sneakers', 'training', 'fitness', 'exercise', 'workout', 'weights', 'resistance bands', 'treadmill', 'exercise bike', 'jump rope'],
      mattresses: ['mattress', 'memory foam', 'spring mattress', 'hybrid mattress', 'latex mattress', 'mattress topper', 'mattress pad', 'bed mattress', 'box spring', 'bedding', 'sleep'],
      'pet-supplies': ['dog food', 'cat food', 'pet food', 'dog toy', 'cat toy', 'pet toy', 'dog bed', 'cat bed', 'pet bed', 'dog leash', 'cat leash', 'pet leash', 'dog collar', 'cat collar', 'pet collar', 'dog bowl', 'cat bowl', 'pet bowl', 'dog crate', 'cat carrier', 'pet carrier', 'dog treats', 'cat treats', 'pet treats', 'pet supplies', 'pet care', 'pet accessories'],
      'video-games': [
        // CRITICAL: Only actual games (software), NOT consoles or hardware
        'video game', 'game', 'pc game', 'steam game', 'epic game',
        'playstation game', 'ps4 game', 'ps5 game', 'xbox game', 'xbox one game', 'xbox series game',
        'nintendo switch game', 'nintendo game', 'wii game',
        'action game', 'adventure game', 'rpg', 'role-playing game', 'strategy game', 'simulation game',
        'sports game', 'racing game', 'fighting game', 'shooter game', 'puzzle game', 'indie game',
        'game disc', 'game cartridge', 'game download', 'digital game', 'physical game',
        'call of duty', 'fifa', 'madden', 'nba 2k', 'grand theft auto', 'gta', 'minecraft', 'fortnite',
        'assassin\'s creed', 'the elder scrolls', 'skyrim', 'fallout', 'god of war', 'spider-man',
        'halo', 'gears of war', 'forza', 'zelda', 'mario', 'pokemon', 'animal crossing',
      ],
      footwear: [
        // Core footwear keywords - include ALL types of shoes
        'shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'sandal', 'sandals', 'heel', 'heels',
        'slipper', 'slippers', 'flip flop', 'flip flops', 'loafer', 'loafers', 'oxford', 'oxfords',
        'running shoe', 'running shoes', 'athletic shoe', 'athletic shoes', 'trainer', 'trainers',
        'basketball shoe', 'basketball shoes', 'tennis shoe', 'tennis shoes', 'soccer shoe', 'soccer shoes',
        'hiking boot', 'hiking boots', 'work boot', 'work boots', 'dress shoe', 'dress shoes',
        'casual shoe', 'casual shoes', 'formal shoe', 'formal shoes',
        // Brand names (common footwear brands)
        'adidas', 'nike', 'puma', 'reebok', 'converse', 'vans', 'new balance', 'skechers', 'asics',
        'jordan', 'air jordan', 'under armour', 'under armour', 'fila', 'saucony', 'brooks',
        // Footwear types
        'footwear', 'sneaker', 'sneakers', 'kicks', 'kicks',
        // Gender-neutral terms (we want BOTH men's and women's)
        'men\'s', 'women\'s', 'unisex', 'kids', 'children\'s', 'toddler',
      ],
      'home-accessories': [
        'decor', 'decoration', 'pillow', 'cushion', 'throw', 'blanket', 'rug', 'mat', 'curtain', 'blind',
        'lamp', 'light', 'vase', 'frame', 'art', 'mirror', 'plant', 'candle', 'basket', 'tray',
        'wall art', 'picture frame', 'home decor', 'accessory', 'accessories', 'houseware',
      ],
      household: [
        'cleaning', 'detergent', 'paper towel', 'trash bag', 'battery', 'batteries', 'sponge', 'wipe',
        'household', 'supplies', 'soap', 'bleach', 'disinfectant', 'mop', 'broom', 'vacuum',
      ],
    };
    
    // Exclude terms for each category (things that should NEVER appear)
    const excludeTerms: Record<string, string[]> = {
      groceries: [
        // Clothing/fashion
        'women\'s', 'men\'s', 'coat', 'jacket', 'dress', 'shirt', 'pants', 'jeans', 'sweater', 'hoodie', 't-shirt', 'clothing', 'apparel', 'fashion', 'outfit', 'wardrobe',
        // Hardware/construction
        'lumber', 'wood', 'board', 'plank', 'hardware', 'construction', 'tool', 'nail', 'screw', 'paint', 'furniture', 'chair', 'table', 'sofa', 'bed',
        // Electronics
        'phone', 'laptop', 'computer', 'tablet', 'tv', 'television',
        // Brand names that are also product names (when they appear as clothing)
        'mango brand', 'mango clothing', 'mango fashion',
        // Specificity: when user wants the grocery (e.g. banana), don't show drink/recipe first
        'shake', 'smoothie', 'smoothie recipe', 'drink recipe', 'protein shake', 'milkshake',
      ],
      electronics: ['food', 'fruit', 'vegetable', 'grocery', 'clothing', 'furniture'],
      kitchen: ['clothing', 'electronics', 'furniture'],
      'home-accessories': [
        'food', 'fruit', 'grocery', 'snack', 'beverage', 'clothing', 'shirt', 'pants', 'dress', 'shoe',
        'phone', 'laptop', 'tablet', 'tv', 'computer', 'electronic', 'video game', 'console',
        'mattress', 'dog food', 'cat food', 'pet food', 'cleaning', 'detergent', 'paper towel', 'trash bag',
      ],
      household: [
        'food', 'fruit', 'grocery', 'clothing', 'shirt', 'pants', 'dress', 'shoe', 'phone', 'laptop',
        'mattress', 'dog food', 'cat food', 'pet food', 'video game', 'console', 'decor', 'pillow', 'rug', 'lamp', 'vase',
      ],
      'beauty-products': [
        // Electronics/Gaming
        'ps5', 'playstation', 'xbox', 'nintendo', 'console', 'controller', 'gaming', 'video game', 'game console',
        // Clothing/Apparel
        'shirt', 't-shirt', 'sweatshirt', 'sweat shirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion', 'outfit',
        // Electronics
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'headphones', 'earbuds',
        // Furniture/Home
        'furniture', 'chair', 'table', 'sofa', 'bed', 'desk', 'wardrobe',
        // Food/Groceries
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage',
        // Tools/Hardware
        'tool', 'hardware', 'screwdriver', 'hammer', 'drill',
        // Musical Instruments
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music', 'bass guitar', 'acoustic guitar', 'electric guitar',
      ],
      mattresses: [
        // Electronics
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'monitor', 'keyboard', 'mouse',
        // Food items
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty',
        // Sports equipment
        'basketball', 'football', 'soccer', 'baseball', 'tennis', 'racket', 'dumbbell', 'barbell', 'yoga mat', 'gym equipment',
        // Clothing
        'shirt', 't-shirt', 'sweatshirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion',
        // Video games and entertainment
        'video game', 'game', 'steam', 'nintendo switch', 'playstation', 'xbox',
        // Toys and collectibles
        'toy', 'figurine', 'collectible', 'youtooz', 'pop vinyl', 'lego',
        // Musical instruments
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music',
        // Tools
        'screwdriver', 'hammer', 'drill', 'wrench', 'toolbox', 'hardware', 'power tool', 'saw', 'nail gun',
        // Home appliances
        'refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave',
        // Office supplies
        'printer', 'scanner', 'stapler', 'paper clips', 'notebook', 'pen', 'pencil',
        // Other furniture (but keep bed frames, headboards, etc. that are mattress-related)
        'sofa', 'couch', 'wardrobe', 'dresser', 'nightstand', 'dining table', 'dining chair', 'bookshelf', 'cabinet',
        // Pet supplies
        'dog food', 'cat food', 'pet toy', 'pet bed', 'leash', 'pet',
        // Cleaning products
        'cleaner', 'multi-purpose cleaner', 'multi purpose cleaner', 'pink stuff', 'cleaning', 'detergent', 'soap', 'mop', 'broom', 'vacuum cleaner', 'spray', 'wipe', 'disinfectant', 'sanitizer', 'cleaning product', 'cleaning solution', 'all-purpose cleaner',
      ],
      beauty: [
        // Electronics/Gaming
        'ps5', 'playstation', 'xbox', 'nintendo', 'console', 'controller', 'gaming', 'video game', 'game console',
        // Clothing/Apparel
        'shirt', 't-shirt', 'sweatshirt', 'sweat shirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion', 'outfit',
        // Electronics
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'headphones', 'earbuds',
        // Furniture/Home
        'furniture', 'chair', 'table', 'sofa', 'bed', 'desk', 'wardrobe',
        // Food/Groceries
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage',
        // Tools/Hardware
        'tool', 'hardware', 'screwdriver', 'hammer', 'drill',
        // Musical Instruments
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music', 'bass guitar', 'acoustic guitar', 'electric guitar',
      ],
      'sports-equipment': [
        // Fashion/Non-athletic clothing and shoes
        'fashion shoe', 'dress shoe', 'heels', 'high heels', 'pumps', 'loafers', 'oxfords', 'dress boots', 'casual shoe', 'fashion sneaker', 'fashion wear', 'dress', 'suit', 'formal wear', 'casual wear',
        // Electronics (unless sports-specific like fitness trackers)
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'monitor', 'keyboard', 'mouse',
        // Furniture (unless sports-specific like exercise benches)
        'sofa', 'couch', 'bed', 'mattress', 'wardrobe', 'dresser', 'cabinet',
        // Food items
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty',
        // Office supplies
        'printer', 'scanner', 'stapler', 'paper clips', 'notebook', 'pen', 'pencil',
        // Tools (unless sports-specific)
        'screwdriver', 'hammer', 'drill', 'wrench', 'toolbox', 'hardware',
      ],
      'pet-supplies': [
        // Electronics
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'monitor', 'keyboard', 'mouse',
        // Food items (human food, not pet food)
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal', 'coffee', 'tea', 'bread', 'milk', 'cheese',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty', 'perfume',
        // Sports equipment
        'basketball', 'football', 'soccer', 'baseball', 'tennis', 'racket', 'dumbbell', 'barbell', 'yoga mat', 'gym equipment',
        // Clothing
        'shirt', 't-shirt', 'sweatshirt', 'hoodie', 'sweater', 'jacket', 'coat', 'dress', 'pants', 'jeans', 'shorts', 'clothing', 'apparel', 'fashion',
        // Video games and entertainment
        'video game', 'game', 'steam', 'nintendo switch', 'playstation', 'xbox',
        // Toys and collectibles (human toys, not pet toys)
        'toy', 'figurine', 'collectible', 'youtooz', 'pop vinyl', 'lego', 'action figure',
        // Musical instruments
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music',
        // Tools
        'screwdriver', 'hammer', 'drill', 'wrench', 'toolbox', 'hardware', 'power tool', 'saw', 'nail gun',
        // Home appliances
        'refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave',
        // Office supplies
        'printer', 'scanner', 'stapler', 'paper clips', 'notebook', 'pen', 'pencil',
        // Furniture
        'sofa', 'couch', 'wardrobe', 'dresser', 'nightstand', 'dining table', 'dining chair', 'bookshelf', 'cabinet', 'bed', 'mattress',
        // Cleaning products
        'cleaner', 'multi-purpose cleaner', 'detergent', 'soap', 'mop', 'broom', 'vacuum cleaner', 'spray', 'wipe', 'disinfectant',
      ],
      footwear: [
        // Electronics (not footwear)
        'phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'tv', 'television', 'monitor', 'keyboard', 'mouse',
        // Food items
        'food', 'fruit', 'vegetable', 'grocery', 'snack', 'beverage', 'drink', 'meal',
        // Beauty products
        'shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation', 'makeup', 'cosmetic', 'beauty',
        // Furniture
        'sofa', 'couch', 'chair', 'table', 'bed', 'mattress', 'wardrobe', 'dresser', 'cabinet',
        // Office supplies
        'printer', 'scanner', 'stapler', 'paper clips', 'notebook', 'pen', 'pencil',
        // Tools
        'screwdriver', 'hammer', 'drill', 'wrench', 'toolbox', 'hardware',
        // Home appliances
        'refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave',
        // Video games
        'video game', 'game', 'steam', 'nintendo switch', 'playstation', 'xbox',
        // Books
        'book', 'novel', 'textbook', 'manual',
        // Musical instruments
        'guitar', 'piano', 'violin', 'drum', 'instrument', 'musical instrument', 'music',
        // Pet supplies
        'dog food', 'cat food', 'pet toy', 'pet bed', 'leash', 'pet',
        // Cleaning products
        'cleaner', 'multi-purpose cleaner', 'detergent', 'soap', 'mop', 'broom', 'vacuum cleaner',
        // IMPORTANT: Do NOT exclude based on gender - we want BOTH men's and women's shoes
        // Only exclude non-footwear items
      ],
    };
    
    const keywords = categoryKeywords[categorySlug] || [];
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    const categoryExcludeTerms = excludeTerms[categorySlug] || [];
    const lowerExcludeTerms = categoryExcludeTerms.map(t => t.toLowerCase());
    
    return results.filter(product => {
      const productNameLower = (product.name || '').toLowerCase();
      
      // ALLOW LIST approach: For mattresses, ONLY allow if it matches keywords
      const categoryAllowLists: Record<string, string[]> = {
        mattresses: [
          // Core keywords (most important - should catch most mattress products)
          'mattress', 'bed', 'sleep',
          // Specific types
          'memory foam', 'spring mattress', 'hybrid mattress', 'latex mattress', 
          'mattress topper', 'mattress pad', 'bed mattress', 'box spring', 'bedding',
          'mattress protector', 'mattress cover', 'mattress encasement',
          'adjustable base', 'bed base', 'foundation', 'bed frame', 'headboard', 'footboard',
          'mattress set', 'bed set', 'sleep system', 'mattress in a box', 'bed in a box',
          'innerspring', 'pocket coil', 'gel memory foam', 'cooling mattress', 'firm mattress',
          'soft mattress', 'medium mattress', 'plush mattress', 'euro top', 'pillow top',
          // Brand names that are mattress-specific
          'casper', 'purple', 'tempur', 'saatva', 'nectar', 'leesa', 'tuft', 'needle',
        ],
      };
      
      const allowKeywords = categoryAllowLists[categorySlug];
      if (allowKeywords && allowKeywords.length > 0) {
        // ALLOW LIST: Product MUST contain at least one keyword
        const matches = allowKeywords.some(keyword => productNameLower.includes(keyword.toLowerCase()));
        if (!matches) {
          this.devLog(`🚫 Filtered out "${product.name}" - does not match ${categorySlug} allow list`);
          return false;
        }
        // If it matches, allow it through (skip exclude check)
        return true;
      }
      
      // EXCLUDE LIST approach: For other categories, exclude if it matches exclude terms
      // CRITICAL FIX for video-games: Exclude consoles and hardware - only show actual games
      if (categorySlug === 'video-games') {
        // Check if product is a console or hardware (should be excluded - belongs in electronics)
        const isConsole = productNameLower.includes('console') ||
                         productNameLower.includes('ps5') ||
                         productNameLower.includes('playstation 5') ||
                         (productNameLower.includes('playstation') && !productNameLower.includes('game') && !productNameLower.includes('disc')) ||
                         productNameLower.includes('xbox series') ||
                         productNameLower.includes('xbox one') ||
                         productNameLower.includes('xbox 360') ||
                         (productNameLower.includes('xbox') && !productNameLower.includes('game') && !productNameLower.includes('disc')) ||
                         productNameLower.includes('nintendo switch console') ||
                         productNameLower.includes('nintendo switch oled') ||
                         productNameLower.includes('nintendo switch lite') ||
                         (productNameLower.includes('nintendo switch') && !productNameLower.includes('game') && !productNameLower.includes('cartridge')) ||
                         productNameLower.includes('nintendo wii') ||
                         productNameLower.includes('nintendo wii u') ||
                         productNameLower.includes('gaming console') ||
                         productNameLower.includes('game console');
        
        const isHardware = productNameLower.includes('controller') ||
                          productNameLower.includes('gaming headset') ||
                          productNameLower.includes('gaming keyboard') ||
                          productNameLower.includes('gaming mouse') ||
                          productNameLower.includes('gaming monitor') ||
                          productNameLower.includes('gaming chair') ||
                          productNameLower.includes('gaming pc') ||
                          productNameLower.includes('gaming laptop') ||
                          productNameLower.includes('gaming desktop');
        
        // Exclude consoles and hardware - they belong in electronics, not video games
        if (isConsole || isHardware) {
          this.devLog(`🚫 Filtered out "${product.name}" - console/hardware belongs in electronics, not video games`);
          return false;
        }
        
        // Check if it's clearly a game (software) - allow it
        // Be more lenient - if it contains "game" or game-related terms, allow it
        const isGame = productNameLower.includes('game') ||
                      productNameLower.includes('call of duty') ||
                      productNameLower.includes('fifa') ||
                      productNameLower.includes('madden') ||
                      productNameLower.includes('minecraft') ||
                      productNameLower.includes('fortnite') ||
                      productNameLower.includes('steam') ||
                      productNameLower.includes('epic game') ||
                      productNameLower.includes('disc') ||
                      productNameLower.includes('cartridge') ||
                      productNameLower.includes('download') ||
                      productNameLower.includes('edition') || // Game editions
                      productNameLower.includes('dlc') || // Downloadable content
                      productNameLower.includes('expansion'); // Game expansions
        
        // If it's clearly a game, allow it (don't apply exclude terms)
        if (isGame) {
          this.devLog(`✅ Allowing "${product.name}" - identified as game`);
          return true;
        }
        
        // If it's not clearly a game, check exclude terms
        if (lowerExcludeTerms.some(term => productNameLower.includes(term))) {
          this.devLog(`🚫 Filtered out "${product.name}" - contains exclude term`);
          return false;
        }
        
        // If it doesn't match exclude terms and doesn't clearly indicate console/hardware, allow it (might be a game)
        // This is more lenient to avoid over-filtering
        this.devLog(`✅ Allowing "${product.name}" - no exclude terms matched`);
        return true;
      }
      
      // CRITICAL FIX for pet-supplies: Don't exclude products that are clearly pet products
      // The exclude list has generic terms like "food", "toy", "bed" which would incorrectly filter out
      // "dog food", "cat toy", "dog bed", etc. We need to check if it's a PET product first.
      if (categorySlug === 'pet-supplies') {
        // Check if product is clearly a pet product (contains dog/cat/pet)
        const isPetProduct = productNameLower.includes('dog') || 
                             productNameLower.includes('cat') || 
                             productNameLower.includes('pet') ||
                             productNameLower.includes('puppy') ||
                             productNameLower.includes('kitten') ||
                             productNameLower.includes('canine') ||
                             productNameLower.includes('feline');
        
        // If it's a pet product, skip generic exclude terms that would incorrectly filter it
        if (isPetProduct) {
          // For pet products, only exclude if it's clearly NOT a pet supply
          // Check for human-specific terms that would indicate it's not a pet product
          const humanSpecificTerms = ['human', 'people', 'person', 'adult', 'children', 'kids', 'baby'];
          const hasHumanTerm = humanSpecificTerms.some(term => productNameLower.includes(term));
          
          if (hasHumanTerm) {
            // It's a pet product but has human-specific terms - might be wrong category
            // Check if it matches any exclude terms (excluding generic ones like "food", "toy", "bed")
            const specificExcludeTerms = lowerExcludeTerms.filter(term => 
              !['food', 'toy', 'bed', 'treats', 'bowl', 'leash', 'collar', 'crate', 'carrier', 'shampoo', 'brush'].includes(term)
            );
            if (specificExcludeTerms.some(term => productNameLower.includes(term))) {
              this.devLog(`🚫 Filtered out "${product.name}" - pet product but contains human-specific term and exclude term`);
              return false;
            }
          }
          // It's a pet product - allow it through (don't filter based on generic terms)
          // Continue to keyword matching below
        } else {
          // Not a pet product - apply normal exclude logic
          if (lowerExcludeTerms.some(term => productNameLower.includes(term))) {
            this.devLog(`🚫 Filtered out "${product.name}" - contains exclude term`);
            return false;
          }
        }
      } else {
        // For other categories, use normal exclude logic
        if (lowerExcludeTerms.some(term => productNameLower.includes(term))) {
          this.devLog(`🚫 Filtered out "${product.name}" - contains exclude term`);
          return false;
        }
      }
      
      // SECOND: If query is specific (5+ chars), check for exact match
      if (lowerQuery.length >= 5) {
        // Check if product name contains the exact query
        if (productNameLower.includes(lowerQuery)) {
          // For groceries, also check if it's a fruit/vegetable name
          if (categorySlug === 'groceries') {
            // Common fruit/vegetable names that might conflict with brands
            const fruitVegetableNames = ['mango', 'mangoes', 'apple', 'banana', 'orange', 'grape', 'pineapple', 'avocado', 'tomato', 'potato', 'onion'];
            const isFruitVegetable = fruitVegetableNames.some(fv => {
              // Check if query matches a fruit/veg name AND product name contains it
              return lowerQuery.includes(fv) && productNameLower.includes(fv);
            });
            
            // If query is a fruit name, be STRICT - require grocery indicators
            if (isFruitVegetable) {
              // CRITICAL: Exclude if it contains non-grocery terms
              const nonGroceryTerms = ['women\'s', 'men\'s', 'coat', 'jacket', 'dress', 'shirt', 'pants', 'jeans', 'sweater', 'clothing', 'apparel', 'fashion', 'phone', 'laptop', 'computer', 'electronic', 'device', 'furniture', 'chair', 'table', 'sofa', 'bed'];
              if (nonGroceryTerms.some(term => productNameLower.includes(term))) {
                this.devLog(`🚫 Filtered out "${product.name}" - fruit query but appears to be non-grocery item`);
                return false;
              }
              
              // REQUIRE grocery-specific terms for fruit/vegetable searches
              const produceTerms = ['fresh', 'organic', 'each', 'lb', 'pound', 'fruit', 'produce', 'whole', 'ripe', 'grocery', 'food', 'canned', 'frozen', 'juice', 'chunks', 'slices', 'diced', 'tray', 'bag', 'pack', 'ct', 'count'];
              const hasProduceTerm = produceTerms.some(term => productNameLower.includes(term));
              
              if (!hasProduceTerm) {
                // If no produce terms, check if it's clearly a grocery item by other indicators
                const groceryIndicators = ['walmart', 'target', 'kroger', 'safeway', 'whole foods', 'costco', 'trader joe', 'aldi', 'publix', 'food lion'];
                const hasGroceryIndicator = groceryIndicators.some(indicator => productNameLower.includes(indicator));
                
                if (!hasGroceryIndicator) {
                  this.devLog(`🚫 Filtered out "${product.name}" - fruit query but no grocery indicators found`);
                  return false;
                }
              }
              
              return true; // Passed all checks - it's a grocery item
            }
          }
          return true;
        }
      }
      
      // THIRD: Check if product matches category keywords
      if (lowerKeywords.length > 0) {
        const matchesKeyword = lowerKeywords.some(keyword => productNameLower.includes(keyword));
        if (matchesKeyword) {
          return true;
        }
      }
      
      // FOURTH: For short queries (like "mango"), be more strict
      if (lowerQuery.length < 5 && categorySlug === 'groceries') {
        // Require grocery-specific terms for short queries
        const groceryIndicators = ['fresh', 'organic', 'fruit', 'produce', 'each', 'lb', 'pound', 'whole', 'ripe', 'grocery'];
        const hasGroceryIndicator = groceryIndicators.some(indicator => productNameLower.includes(indicator));
        
        if (!hasGroceryIndicator) {
          // Check if it's clearly NOT a grocery item
          const nonGroceryTerms = ['women\'s', 'men\'s', 'coat', 'jacket', 'dress', 'shirt', 'clothing', 'apparel'];
          if (nonGroceryTerms.some(term => productNameLower.includes(term))) {
            this.devLog(`🚫 Filtered out "${product.name}" - short query but appears to be clothing`);
            return false;
          }
        }
      }
      
      // If category has keywords defined but product didn't match any, exclude it (stops wrong-category items)
      if (lowerKeywords.length > 0) {
        this.devLog(`🚫 Filtered out "${product.name}" - no match for ${categorySlug} keywords`);
        return false;
      }
      return true;
    });
  }

  /**
   * Enhance search query with category context for better SerpAPI results
   * Example: "mango" in groceries → "mango fruit" or "fresh mango"
   */
  private enhanceQueryForCategory(query: string, categorySlug: string): string {
    const lowerQuery = query.toLowerCase().trim();
    
    // Category-specific enhancements
    const enhancements: Record<string, string[]> = {
      groceries: [
        'fruit', 'fresh', 'organic', 'produce', 'grocery', 'food',
        // For specific fruit names, add "fruit" to avoid brand confusion
        ...(lowerQuery === 'mango' || lowerQuery === 'apple' || lowerQuery === 'banana' || 
            lowerQuery === 'orange' || lowerQuery === 'grape' ? ['fruit'] : []),
      ],
      electronics: ['electronics', 'electronic device', 'tech'],
      kitchen: ['kitchen', 'appliance', 'cookware'],
      clothing: ['clothing', 'apparel', 'fashion'],
      footwear: ['shoes', 'footwear'],
      books: ['book'],
      household: ['household', 'cleaning'],
      medicine: ['medicine', 'health', 'pharmacy'],
      'beauty-products': ['beauty', 'cosmetics', 'skincare'],
      'video-games': ['video game', 'game'],
      sports: ['sports', 'athletic'],
      'sports-equipment': ['sports', 'athletic', 'athletic equipment'],
      office: ['office', 'supplies'],
      furniture: ['furniture'],
      mattresses: ['mattress', 'bed', 'sleep'],
      'pet-supplies': ['pet', 'pet supplies', 'pet food', 'pet care'],
      'home-accessories': ['home decor', 'decoration', 'accessories'],
      tools: ['tool', 'hardware'],
    };
    
    const categoryEnhancements = enhancements[categorySlug] || [];
    
    // Electronics: for product-type queries (headphones, laptop, etc.), keep query as-is so SerpAPI returns
    // typical shopping results (usually branded: Apple, Bose, Sony). Appending "electronics" can dilute results.
    if (categorySlug === 'electronics') {
      const productTypeTerms = ['headphone', 'earbud', 'earphone', 'laptop', 'computer', 'notebook', 'macbook', 'phone', 'smartphone', 'tablet', 'ipad', 'tv', 'television', 'watch', 'smartwatch', 'monitor', 'camera', 'console', 'playstation', 'xbox', 'nintendo'];
      if (productTypeTerms.some((t) => lowerQuery.includes(t))) {
        return query;
      }
    }
    
    // For groceries, prioritize the actual grocery item (most common first): fresh produce, not shake/recipe/drink
    if (categorySlug === 'groceries') {
      const produceSingleWord: Record<string, string> = {
        banana: 'fresh banana', bananas: 'fresh bananas',
        apple: 'fresh apple fruit', apples: 'fresh apples',
        orange: 'fresh orange', oranges: 'fresh oranges',
        grape: 'fresh grapes', grapes: 'fresh grapes',
        strawberry: 'fresh strawberries', strawberries: 'fresh strawberries',
        mango: 'fresh mango', mangoes: 'fresh mangoes',
        pineapple: 'fresh pineapple', avocado: 'fresh avocado',
        tomato: 'fresh tomato', tomatoes: 'fresh tomatoes',
        lettuce: 'fresh lettuce', onion: 'fresh onion', onions: 'fresh onions',
        potato: 'fresh potato', potatoes: 'fresh potatoes',
      };
      const expanded = produceSingleWord[lowerQuery];
      if (expanded) {
        return expanded;
      }
      const isFruitVegetable = Object.keys(produceSingleWord).some(fv => lowerQuery.includes(fv));
      if (isFruitVegetable) {
        return `${query} fruit`;
      }
      return `${query} grocery`;
    }
    
    // Special handling for sports-equipment: Add "athletic" or "sports" when searching for shoes/clothing
    if (categorySlug === 'sports-equipment') {
      const lowerQuery = query.toLowerCase();
      // If searching for shoes, add "athletic" to get sports shoes, not fashion shoes
      if (lowerQuery.includes('shoe') || lowerQuery.includes('sneaker') || lowerQuery.includes('boot') || 
          lowerQuery.includes('adidas') || lowerQuery.includes('nike') || lowerQuery.includes('puma')) {
        // Check if already has "athletic" or "sports" - if not, add it
        if (!lowerQuery.includes('athletic') && !lowerQuery.includes('sports') && !lowerQuery.includes('running')) {
          return `${query} athletic`;
        }
      }
      // For other sports equipment searches, add "sports" or "athletic"
      if (categoryEnhancements.length > 0) {
        return `${query} ${categoryEnhancements[0]}`;
      }
    }
    
    // For other categories, add category-specific term
    if (categoryEnhancements.length > 0) {
      return `${query} ${categoryEnhancements[0]}`;
    }
    
    // Default: return query as-is
    return query;
  }

  /**
   * Prefetch 20+ store prices for products in the background (fire-and-forget).
   * Saves to DB so when user clicks "View prices" the compare endpoint can use cached data or fetch fresh.
   * Staggered to avoid Serper/SerpAPI rate limits.
   */
  private async prefetchMultiStorePricesInBackground(products: Array<{ id?: string; name: string }>): Promise<void> {
    if (!this.multiStoreScrapingService || products.length === 0) return;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await new Promise((r) => setTimeout(r, i * 400));
      try {
        const multiStoreResult = await this.multiStoreScrapingService.searchProductWithMultiStorePrices(product.name, { limit: 100 });
        if (!multiStoreResult?.storePrices?.length || !product.id) continue;
        const dbProduct = await this.prisma.product.findUnique({ where: { id: product.id } });
        if (!dbProduct) continue;
        for (const storePrice of multiStoreResult.storePrices) {
          let store = await this.prisma.store.findFirst({ where: { name: { equals: storePrice.storeName } } });
          if (!store) {
            store = await this.prisma.store.create({
              data: {
                name: storePrice.storeName,
                slug: storePrice.storeId || storePrice.storeName.toLowerCase().replace(/\s+/g, '-'),
                logo: this.getStoreLogoUrlForSave(storePrice.storeName, storePrice.url),
                websiteUrl: storePrice.url,
                enabled: true,
              },
            });
          }
          await this.prisma.productPrice.upsert({
            where: { productId_storeId: { productId: product.id, storeId: store.id } },
            update: { price: storePrice.price, currency: storePrice.currency || 'USD', productUrl: storePrice.url, lastUpdated: new Date() },
            create: { productId: product.id, storeId: store.id, price: storePrice.price, currency: storePrice.currency || 'USD', productUrl: storePrice.url, lastUpdated: new Date() },
          });
        }
        this.devLog(`✅ Background prefetch: saved ${multiStoreResult.storePrices.length} stores for "${product.name}"`);
      } catch (e) {
        this.devLog(`⚠️ Background prefetch failed for "${product.name}": ${(e as Error)?.message}`);
      }
    }
  }

  /**
   * Search products from SerpAPI (Google Shopping)
   * Returns products with images from MULTIPLE STORES (not just Amazon)
   * This is the PRIMARY source for multi-store price comparison
   */
  private async searchProductsFromSerpAPI(
    query: string,
    limit: number = 3,
    categorySlug?: string,
  ): Promise<Array<{ name: string; image: string; price: number; url: string; store: string; storePrices?: Array<{ store: string; price: number; url: string }> }>> {
    // Prefer SerpAPI when it's a real key (more reliable for shopping); otherwise use Serper
    const serpApiKeyRaw = this.configService.get<string>('SERPAPI_KEY') || process.env.SERPAPI_KEY;
    const serperKey = this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY;
    const isPlaceholder = (k: string) => !k || !k.trim() || /your-.*-key|placeholder|xxx/i.test(k);
    const serpApiKey = serpApiKeyRaw && !isPlaceholder(serpApiKeyRaw) ? serpApiKeyRaw : undefined;
    
    if (!serpApiKey && !serperKey) {
      console.log(`⚠️ No SerpAPI or Serper key - cannot fetch products from multiple stores`);
      return [];
    }

    // Serper shopping often returns 400 when num is too high; use 20 for Serper. SerpAPI supports 100.
    const serperNum = 20;
    const serpApiNum = Math.min(100, Math.max(limit * 2, 20));

    try {
      let shoppingResults: any[] = [];
      let usedSerpAPI = false;

      // Try SerpAPI first when available (more reliable for Google Shopping)
      if (serpApiKey) {
        const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=us&num=${serpApiNum}&api_key=${serpApiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const raw = data.shopping_results || [];
          shoppingResults = raw.map((r: any) => {
            const imageUrl = r.thumbnail || r.image || (r.thumbnail && typeof r.thumbnail === 'string' ? r.thumbnail : '') || '';
            return {
              title: r.title,
              source: r.source || 'Unknown',
              price: r.price ?? '',
              link: r.link,
              thumbnail: imageUrl,
              image: imageUrl,
            };
          });
          usedSerpAPI = true;
          console.log(`🔍 Calling SerpAPI for "${query}"...`);
          console.log(`📸 [SerpAPI] Extracted images: ${shoppingResults.filter((r: any) => r.image).length}/${shoppingResults.length} products have images`);
        } else {
          if (response.status !== 429 && response.status !== 402) {
            console.log(`⚠️ SerpAPI request failed: ${response.status}, will try Serper if available`);
          }
        }
      }

      // Use Serper when SerpAPI not used (no key or request failed)
      if (shoppingResults.length === 0 && serperKey) {
        console.log(`🔍 Calling Serper for "${query}"...`);
        const res = await fetch('https://google.serper.dev/shopping', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query, gl: 'us', num: serperNum }),
        });
        if (!res.ok) {
          const errBody = await res.text();
          if (res.status === 429 || res.status === 402) {
            console.log(`⚠️ Serper rate limited or out of credits (${res.status}). Top up at serper.dev or add SERPAPI_KEY.`);
          } else if (res.status === 400 && errBody.includes('Not enough credits')) {
            console.log(`⚠️ Serper: Not enough credits. Top up at serper.dev or add SERPAPI_KEY for live results.`);
          } else {
            console.log(`⚠️ Serper request failed: ${res.status}. Response: ${errBody.slice(0, 200)}`);
          }
          return [];
        }
        const data = await res.json();
        const shopping = data.shopping || [];
        const pickImage = (r: any): string => {
          const raw = r.image ?? r.thumbnail ?? (r as any).productImage ?? (r as any).thumbnail_url ?? (r as any).imageUrl ?? '';
          if (typeof raw === 'string' && raw.trim()) return raw.trim();
          if (raw && typeof raw === 'object' && (raw.url || raw.link)) return (raw.url || raw.link) || '';
          return '';
        };
        shoppingResults = shopping.map((r: any) => {
          const img = pickImage(r);
          return {
            title: r.title,
            source: r.source || r.merchant || 'Unknown',
            price: r.price ?? r.extractedPrice ?? '',
            link: r.link,
            thumbnail: img,
            image: img,
          };
        });
      }

      if (shoppingResults.length === 0) {
        console.log(`⚠️ No shopping results for "${query}" from SerpAPI or Serper`);
        return [];
      }

      // Count unique stores
      const uniqueStores = new Set(shoppingResults.map((r: any) => r.source || 'Unknown').filter(Boolean));
      const apiLabel = usedSerpAPI ? 'SerpAPI' : 'Serper';
      console.log(`📦 ${apiLabel} returned ${shoppingResults.length} results for "${query}" from ${uniqueStores.size} unique stores: ${Array.from(uniqueStores).slice(0, 20).join(', ')}${uniqueStores.size > 20 ? '...' : ''}`);
      
      const products: Array<{ name: string; image: string; price: number; url: string; store: string; storePrices?: Array<{ store: string; price: number; url: string }> }> = [];
      const seenStores = new Set<string>();
      
      // Group results by product name to get multiple store prices per product
      // Use a more flexible grouping - normalize product names to catch variations
      const productMap = new Map<string, Array<{ store: string; price: number; url: string; image: string; title: string }>>();
      
      // List of top USA stores to prioritize (well-known retailers)
      const topUSStores = new Set([
        'walmart', 'target', 'amazon', 'best buy', 'costco', 'cvs', 'walgreens', 
        'rite aid', 'ulta', 'sephora', 'macy', 'nordstrom', 'kohl', 'home depot',
        'lowes', 'bed bath', 'tj maxx', 'marshalls', 'ross', 'dicks', 'academy',
        'bass pro', 'cabelas', 'gamestop', 'staples', 'officemax', 'petco', 'petsmart'
      ]);
      
      for (const result of shoppingResults) {
        // Extract image - handle protocol-relative URLs and object-shaped image (e.g. { url: "..." })
        const rawImage = result.thumbnail || result.image || (result as any).productImage || (result as any).thumbnail_url || (result as any).serpapi_thumbnail || '';
        let image = '';
        const raw = typeof rawImage === 'object' && rawImage !== null
          ? (rawImage.url || rawImage.link || '')
          : (typeof rawImage === 'string' ? rawImage : '');
        if (raw && typeof raw === 'string') {
          const trimmed = raw.trim();
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            image = trimmed;
          } else if (trimmed.startsWith('//')) {
            image = `https:${trimmed}`;
          } else if (trimmed.length > 0 && !trimmed.includes('placeholder')) {
            image = trimmed.startsWith('/') ? `https:${trimmed}` : `https://${trimmed}`;
          }
        }
        // If Serper/SerpAPI returned no image URL, use a placeholder so we still show the product (better than dropping all results)
        if (!image || !image.startsWith('http')) {
          const apiLabel = usedSerpAPI ? 'SerpAPI' : 'Serper';
          this.devLog(`⚠️ No image URL for "${result.title}" from ${apiLabel}, using placeholder`);
          image = `https://via.placeholder.com/200x200?text=${encodeURIComponent((result.title || 'Product').substring(0, 20))}`;
        }
        
        // Extract price - try price, extractedPrice, and "From $X.XX" style
        const priceText = String(result.price ?? result.extractedPrice ?? '0');
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        let price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
        if (price <= 0 && (result.extractedPrice != null || (result as any).extracted_price != null)) {
          const alt = Number(result.extractedPrice ?? (result as any).extracted_price);
          if (Number.isFinite(alt) && alt > 0) price = alt;
        }
        
        if (price <= 0) {
          continue; // Skip invalid prices
        }
        
        const productTitle = result.title || query;
        const productName = productTitle.toLowerCase().trim();
        const storeName = (result.source || 'Unknown').trim();
        
        // USA-only: include only stores that are known USA retailers
        if (this.multiStoreScrapingService && !this.multiStoreScrapingService.isUSAStore(storeName)) {
          continue;
        }
        
        // Normalize product name for grouping (remove store-specific suffixes, normalize spacing)
        const normalizedName = productName
          .replace(/\s*-\s*(walmart|target|amazon|best buy|costco|cvs|walgreens|rite aid|ulta|sephora).*$/i, '')
          .replace(/\s*\(.*?\)/g, '') // Remove parenthetical info
          .replace(/\s+/g, ' ')
          .trim();
        
        // Group by normalized product name to collect prices from multiple stores
        if (!productMap.has(normalizedName)) {
          productMap.set(normalizedName, []);
        }
        
        // Use actual image from SerpAPI - we already validated it exists above
        productMap.get(normalizedName)!.push({
          store: storeName,
          price: price,
          url: result.link || '',
          image: image, // Real image only - no placeholders
          title: productTitle,
        });
      }
      
      // Convert grouped products to final format
      for (const [normalizedName, storePrices] of productMap.entries()) {
        if (products.length >= limit) break;
        
        // Sort by: 1) Top USA stores first, 2) Then by price (lowest first)
        storePrices.sort((a, b) => {
          const aIsTopStore = topUSStores.has(a.store.toLowerCase());
          const bIsTopStore = topUSStores.has(b.store.toLowerCase());
          if (aIsTopStore && !bIsTopStore) return -1;
          if (!aIsTopStore && bIsTopStore) return 1;
          return a.price - b.price;
        });
        
        const primaryStore = storePrices[0];
        const productTitle = storePrices[0].title;
        
        // Include ALL store prices (up to 100 stores) for comprehensive price comparison
        const allStorePrices = storePrices.slice(0, 100).map(sp => ({
          store: sp.store,
          price: sp.price,
          url: sp.url,
        }));
        
        products.push({
          name: productTitle,
          image: primaryStore.image,
          price: primaryStore.price,
          url: primaryStore.url,
          store: primaryStore.store,
          storePrices: allStorePrices, // Include ALL stores, not just one
        });
        
        console.log(`✅ Added product "${productTitle}" with ${allStorePrices.length} store prices: ${allStorePrices.slice(0, 10).map(sp => `${sp.store} ($${sp.price})`).join(', ')}${allStorePrices.length > 10 ? `... and ${allStorePrices.length - 10} more` : ''}`);
      }
      
      return products;
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const errCause = error?.cause ? ` (cause: ${error.cause?.message || error.cause})` : '';
      const errCode = error?.code ? ` [${error.code}]` : '';
      console.log(`⚠️ SerpAPI/Serper search failed for ${query}: ${errMsg}${errCause}${errCode}`);
      // DISABLED: Puppeteer fallback removed for performance - Serper/SerpAPI should handle all requests
      // If Serper fails, return empty rather than slow Puppeteer scraping
      console.log(`⚠️ Skipping Puppeteer fallback (disabled for performance)`);
      return [];
      // OLD: return this.fallbackToCustomScraper(query, limit, categorySlug);
    }
  }

  /**
   * Fallback to custom Google Shopping scraper when SerpAPI fails
   */
  private async fallbackToCustomScraper(
    query: string,
    limit: number = 3,
    categorySlug?: string,
  ): Promise<Array<{ name: string; image: string; price: number; url: string; store: string; storePrices?: Array<{ store: string; price: number; url: string }> }>> {
    try {
      console.log(`🔄 [Fallback] Using custom Google Shopping scraper for: "${query}"`);
      
      const scrapedProducts = await this.googleShoppingScraper.searchProducts(query, limit * 3, categorySlug);
      
      if (scrapedProducts.length === 0) {
        console.log(`⚠️ [Fallback] Custom scraper returned no results for: "${query}"`);
        return [];
      }

      // Transform scraper results to match SerpAPI format
      const products: Array<{ name: string; image: string; price: number; url: string; store: string; storePrices?: Array<{ store: string; price: number; url: string }> }> = [];
      
      // Group by product name to collect multiple store prices
      const productMap = new Map<string, Array<{ store: string; price: number; url: string; image: string }>>();
      
      for (const product of scrapedProducts) {
        const normalizedName = product.name.toLowerCase().trim();
        
        if (!productMap.has(normalizedName)) {
          productMap.set(normalizedName, []);
        }
        
        productMap.get(normalizedName)!.push({
          store: product.store,
          price: product.price,
          url: product.url,
          image: product.image,
        });
      }
      
      // Convert to final format
      for (const [normalizedName, storePrices] of productMap.entries()) {
        if (products.length >= limit) break;
        
        // Sort by price (lowest first)
        storePrices.sort((a, b) => a.price - b.price);
        
        const primaryStore = storePrices[0];
        
        products.push({
          name: scrapedProducts.find(p => p.name.toLowerCase().trim() === normalizedName)?.name || normalizedName,
          image: primaryStore.image,
          price: primaryStore.price,
          url: primaryStore.url,
          store: primaryStore.store,
          storePrices: storePrices.map(sp => ({
            store: sp.store,
            price: sp.price,
            url: sp.url,
          })),
        });
      }
      
      console.log(`✅ [Fallback] Custom scraper returned ${products.length} products for: "${query}"`);
      return products;
    } catch (error: any) {
      console.log(`❌ [Fallback] Custom scraper failed for ${query}: ${error.message}`);
      return [];
    }
  }

  /**
   * Auto-save product from PriceAPI or SerpAPI to database
   * This builds up your product catalog over time
   */
  private async autoSaveProductFromAPI(
    apiProduct: any,
    barcode: string | null,
    allResults: any[],
    categorySlug?: string,
    subcategory?: string,
  ) {
    // Get or create category based on categorySlug
    let category: { id: string } | null = null;
    if (categorySlug) {
      category = await this.prisma.category.findFirst({
        where: { slug: categorySlug },
      });
    }
    
    // Fallback to 'general' category if not found
    if (!category) {
      category = await this.prisma.category.findFirst({
      where: { slug: 'general' },
    });

    if (!category) {
      category = await this.prisma.category.create({
        data: {
          name: 'General',
          slug: 'general',
          description: 'Auto-imported products',
          displayOrder: 999,
        },
      });
      }
    }
    
    // Ensure category is not null before proceeding
    if (!category) {
      throw new Error('Failed to get or create category');
    }

    // Extract image from multiple possible fields - comprehensive check for all API sources
    // Priority order:
    // 1. SerpAPI: thumbnail (Google Shopping results from Amazon, Walmart, Target, etc.)
    // 2. PriceAPI: image_url, main_image.link, image
    // 3. Amazon API: Images.Primary.Large.URL
    // 4. Other APIs: imageUrl, images array
    let productImage: string | null = null;
    
    // Check all possible image fields
    const imageFields = [
      (apiProduct as any).thumbnail,           // SerpAPI Google Shopping
      apiProduct.image,                        // PriceAPI, Amazon API
      (apiProduct as any).image_url,           // PriceAPI alternative
      (apiProduct as any).main_image?.link,    // PriceAPI nested
      (apiProduct as any).imageUrl,            // Alternative field name
      (apiProduct as any).Images?.Primary?.Large?.URL,  // Amazon API
      (apiProduct as any).Images?.Primary?.Medium?.URL, // Amazon API fallback
      (apiProduct as any).images?.[0],        // Images array (first image)
      (apiProduct as any).images,              // Images as string
    ];
    
    // Find first valid HTTP/HTTPS image URL
    for (const img of imageFields) {
      if (img && typeof img === 'string' && img.trim().length > 0) {
        const trimmed = img.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          productImage = trimmed;
          break; // Use first valid image found
        }
      }
    }
    
    // Log only if no image found (for debugging)
    if (!productImage && apiProduct.name) {
      this.devLog(`⚠️ [autoSaveProductFromAPI] No valid image URL found for "${apiProduct.name}"`);
    }
    
    // Extract description from API product if available
    const productDescription = apiProduct.description || 
                              (apiProduct as any).descriptionText ||
                              (apiProduct as any).summary ||
                              null;
    
    // Check if this is a SerpAPI product with multiple store prices
    const hasMultipleStores = apiProduct.storePrices && Array.isArray(apiProduct.storePrices) && apiProduct.storePrices.length > 0;
    
    // Prepare prices array - handle both PriceAPI (single store) and SerpAPI (multiple stores)
    const pricesToCreate: Array<{
      storeId: string;
      price: number;
      shippingCost: number;
      currency: string;
      inStock: boolean;
      productUrl: string | null;
    }> = [];
    
    if (hasMultipleStores) {
      // SerpAPI: Save prices from MULTIPLE STORES (Walmart, Target, Best Buy, etc.)
      console.log(`🛒 Saving product with ${apiProduct.storePrices.length} store prices from SerpAPI`);
      
      for (const storePrice of apiProduct.storePrices) {
        // Find or create store
        const storeName = storePrice.store || 'Unknown';
        const storeSlug = storeName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
        
        let store = await this.prisma.store.findFirst({
          where: { 
            OR: [
              { slug: storeSlug },
              { name: { equals: storeName } },
            ],
          },
        });
        
        if (!store) {
          store = await this.prisma.store.create({
            data: {
              name: storeName,
              slug: storeSlug,
              logo: this.getStoreLogoUrlForSave(storeName, storePrice.url),
              websiteUrl: storePrice.url || null,
              enabled: true,
            },
          });
          console.log(`✅ Created new store: ${storeName}`);
        }
        
        pricesToCreate.push({
          storeId: store.id,
          price: storePrice.price,
          shippingCost: 0,
          currency: 'USD',
          inStock: true,
          productUrl: storePrice.url || null,
        });
      }
    } else {
      // PriceAPI: Only Amazon (fallback)
      let amazonStore = await this.prisma.store.findFirst({
        where: { slug: 'amazon' },
      });

      if (!amazonStore) {
        amazonStore = await this.prisma.store.create({
          data: {
            name: 'Amazon',
            slug: 'amazon',
            logo: 'https://logo.clearbit.com/amazon.com',
            websiteUrl: 'https://www.amazon.com',
            enabled: true,
          },
        });
      }
      
      // Create prices from allResults (PriceAPI format)
      pricesToCreate.push(...allResults.map((result) => ({
        storeId: amazonStore.id,
        price: result.price,
        shippingCost: result.shipping || 0,
        currency: result.currency || 'USD',
        inStock: result.inStock !== undefined ? result.inStock : true,
        productUrl: result.url || null,
      })));
    }
    
    // Check if product already exists (by name or barcode) to avoid duplicates
    let product = await this.prisma.product.findFirst({
      where: {
        OR: [
          barcode ? { barcode } : { name: { equals: apiProduct.name } },
        ],
        categoryId: category.id,
      },
      include: {
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
        category: true,
      },
    });
    
    if (product) {
      // Product exists - update it with new prices AND images if needed
      console.log(`♻️ Product "${apiProduct.name}" already exists, updating prices...`);
      
      // Update images if product doesn't have images or has placeholder images
      // CRITICAL: Only update with real images (not placeholders)
      const hasValidImages = product.images && Array.isArray(product.images) && product.images.length > 0 && 
                            product.images.some((img: string) => img && img.startsWith('http') && !img.includes('placeholder'));
      
      // Only update if we have a real image (not placeholder) and product currently has placeholder or no image
      if (productImage && 
          !productImage.includes('placeholder') && 
          !productImage.includes('via.placeholder') &&
          productImage.startsWith('http') &&
          (!hasValidImages || (product.images && product.images.some((img: string) => img.includes('placeholder'))))) {
        this.devLog(`🖼️ Updating images for existing product "${apiProduct.name}" with real image from API`);
        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            images: [productImage],
          },
        });
      }
      
      // Add new prices that don't exist yet
      for (const priceData of pricesToCreate) {
        const existingPrice = product.prices.find(p => p.storeId === priceData.storeId);
        if (!existingPrice) {
          await this.prisma.productPrice.create({
            data: {
              productId: product.id,
              ...priceData,
            },
          });
        }
      }
      
      // Reload product with updated prices and images
      product = await this.prisma.product.findFirst({
        where: { id: product.id },
        include: {
          prices: {
            include: { store: true },
            orderBy: { price: 'asc' },
          },
          category: true,
        },
      });
    } else {
      // Create new product with prices from MULTIPLE STORES
      try {
        // CRITICAL: Only save product if it has a real image (not placeholder)
        // Don't save products with placeholder images - they'll be fetched on-demand
        if (!productImage || productImage.includes('placeholder') || productImage.includes('via.placeholder')) {
          this.devLog(`⚠️ Skipping saving product "${apiProduct.name}" - has placeholder image, will fetch real image on-demand`);
          // Return null to indicate product wasn't saved (will be fetched fresh from SerpAPI when needed)
          return null;
        }
        
        product = await this.prisma.product.create({
          data: {
            name: apiProduct.name,
            description: productDescription,
            images: productImage && typeof productImage === 'string' && productImage.trim().length > 0 && productImage.startsWith('http') ? [productImage] : [],
            barcode: barcode,
            brand: null,
            categoryId: category.id,
            subcategory: subcategory || null,
            searchCount: 1,
            prices: {
              create: pricesToCreate,
            },
          },
          include: {
            prices: {
              include: { store: true },
              orderBy: { price: 'asc' },
            },
            category: true,
          },
        });
      } catch (error: any) {
        // Handle duplicate barcode error
        if (error.code === 'P2002' && error.meta?.target?.includes('barcode')) {
          console.log(`⚠️ Product with barcode ${barcode} already exists, finding existing product...`);
          product = await this.prisma.product.findFirst({
            where: { barcode },
            include: {
              prices: {
                include: { store: true },
                orderBy: { price: 'asc' },
              },
              category: true,
            },
          });
          if (!product) {
            throw error; // Re-throw if we can't find it
          }
        } else {
          throw error; // Re-throw other errors
        }
      }
    }

    // Ensure product is not null
    if (!product) {
      throw new Error(`Failed to save product: ${apiProduct.name}`);
    }

    if (product.prices && product.prices.length > 0) {
      console.log(`✅ Saved product "${apiProduct.name}" with ${product.prices.length} store prices: ${product.prices.map(p => p.store.name).join(', ')}`);
    } else {
      console.log(`⚠️ Product "${apiProduct.name}" saved but has no prices`);
    }
    return product;
  }

  /**
   * Format product data for multi-store response
   */
  /** Client-approved priority order for price comparison. These stores show FIRST. */
  private readonly PRIORITY_STORES = [
    'amazon', 'walmart', 'ebay', 'target', 'costco', 'home depot', 'best buy', 'kroger', 'cvs', 'walgreens',
    "lowes", "albertsons", "publix", "aldi", "dollar general", "dollar tree", "macy's", "nordstrom", "kohl's",
    "tj maxx", "whole foods", "trader joe's", "sam's club", "bj's wholesale club", "ace hardware",
    "staples", "office depot", "dick's sporting goods", "ulta beauty", "sephora",
  ];

  /** Get priority score (lower = show first). Matches client's priority store list. */
  private getStorePriority(storeName: string): number {
    const name = storeName.toLowerCase().trim().replace(/'/g, '');
    for (let i = 0; i < this.PRIORITY_STORES.length; i++) {
      const p = this.PRIORITY_STORES[i].toLowerCase().replace(/'/g, '');
      if (name.includes(p) || p.includes(name)) return i;
    }
    return 999;
  }

  /**
   * Try barcode price providers in order (non-Google first): Barcode Lookup, then PricesAPI.
   * Returns { prices, source, productName?, productImage? } for the first provider that returns at least one price.
   */
  private async getBarcodePricesFromProviders(barcode: string): Promise<{
    prices: Array<{ store: string; price: number; currency: string; url: string; inStock: boolean; image?: string }>;
    source: string;
    productName?: string;
    productImage?: string;
  }> {
    if (this.barcodeLookupService?.isEnabled()) {
      const prices = await this.barcodeLookupService.getPricesByBarcode(barcode, { country: 'us' });
      if (prices?.length > 0) return { prices, source: 'barcode-lookup' };
    }
    if (this.multiStorePriceService?.isEnabled()) {
      const result = await this.multiStorePriceService.getPricesByBarcode(barcode, { country: 'us' });
      if (result.prices?.length > 0) {
        return {
          prices: result.prices,
          source: 'pricesapi-barcode',
          productName: result.productName,
          productImage: result.productImage,
        };
      }
    }
    return { prices: [], source: 'none' };
  }

  /**
   * Sort stores by priority (well-known first) then by price
   */
  private sortStoresByPriorityAndPrice<T extends { storeName?: string; store?: { name: string }; price: number }>(
    stores: T[]
  ): T[] {
    return stores.sort((a, b) => {
      // Get store name from either storeName or store.name
      const storeNameA = (a.storeName || a.store?.name || '').toLowerCase().trim();
      const storeNameB = (b.storeName || b.store?.name || '').toLowerCase().trim();

      // Priority index in the client's preferred list (0..N-1), or 999 if not in list
      const priorityA = this.getStorePriority(storeNameA);
      const priorityB = this.getStorePriority(storeNameB);
      const isPriorityA = priorityA < 999;
      const isPriorityB = priorityB < 999;

      const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price)) || 0;
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price)) || 0;

      // 1) All priority stores (your top 30 list) come first, sorted by LOWEST PRICE.
      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;

      // 2) Within the same group (both priority or both non-priority), sort by price (cheapest first).
      if (priceA !== priceB) return priceA - priceB;

      // 3) Tie‑breakers: keep your priority ordering, then alphabetical.
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price)) || 0;
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price)) || 0;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return storeNameA.localeCompare(storeNameB);
    });
  }

  private formatMultiStoreResponse(dbProduct: any, source: string) {
    // Extract image - check multiple possible fields
    let productImage: string | null = null;
    
    // Priority 1: images array (first image)
    if (dbProduct.images && Array.isArray(dbProduct.images) && dbProduct.images.length > 0) {
      productImage = dbProduct.images[0];
    } 
    // Priority 2: images as string
    else if (typeof dbProduct.images === 'string' && dbProduct.images.trim().length > 0) {
      productImage = dbProduct.images;
    }
    // Priority 3: image field (single image)
    else if (dbProduct.image && typeof dbProduct.image === 'string' && dbProduct.image.trim().length > 0) {
      productImage = dbProduct.image;
    }
    // Priority 4: imageUrl field
    else if (dbProduct.imageUrl && typeof dbProduct.imageUrl === 'string' && dbProduct.imageUrl.trim().length > 0) {
      productImage = dbProduct.imageUrl;
    }
    
    // Validate image URL (must be http/https)
    if (productImage && typeof productImage === 'string') {
      const trimmed: string = productImage.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        console.warn(`⚠️ Invalid image URL (not http/https): ${trimmed}`);
        productImage = null;
      }
    }
    
    // Reduced logging - only log in dev mode
    this.devLog(`📦 formatMultiStoreResponse - Product: ${dbProduct.name}, Image: ${productImage || 'NO IMAGE'}`);
    
    // CRITICAL: Filter out unrealistic prices from database BEFORE returning them
    const productNameLower = (dbProduct.name || '').toLowerCase();
    const isGroceryOrFood =
      /\b(fruit|fruits|apple|banana|milk|vegetable|organic|produce|grocery|dairy|bakery|berry|eggs)\b/i.test(productNameLower);
    const validPrices = dbProduct.prices.filter((price: any) => {
      const priceNum = Number(price.price) || 0;

      if (priceNum <= 0 || priceNum > 50000) return false;
      if (isGroceryOrFood && priceNum > 200) return false;

      if (productNameLower.includes('iphone') && productNameLower.includes('pro max')) {
        if (priceNum < 600) return false;
      } else if (productNameLower.includes('iphone') && productNameLower.includes('pro') && !productNameLower.includes('max')) {
        if (priceNum < 500) return false;
      } else if (productNameLower.includes('iphone')) {
        if (priceNum < 300) return false;
      }
      return true;
    });
    
    this.devLog(`✅ Filtered database prices: ${validPrices.length}/${dbProduct.prices.length} valid prices for "${dbProduct.name}"`);
    
    // Sort valid prices by store priority (well-known stores first) then by price
    const sortedValidPrices = validPrices.sort((a: any, b: any) => {
      const priorityA = this.getStorePriority(a.store.name);
      const priorityB = this.getStorePriority(b.store.name);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower priority number = higher priority
      }
      
      // If same priority, sort by price (lowest first)
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      return priceA - priceB;
    });
    
    return {
      product: {
        id: dbProduct.id,
        name: dbProduct.name,
        description: dbProduct.description,
        image: productImage,
        barcode: dbProduct.barcode,
        category: dbProduct.category ? {
          id: dbProduct.category.id,
          name: dbProduct.category.name,
          slug: dbProduct.category.slug,
        } : null,
      },
      prices: sortedValidPrices.map((price, index) => {
        // Store logo: Clearbit by domain (real brand logos); fallback to Clearbit from name
        const productUrl = price.productUrl || price.store?.websiteUrl;
        const domain = this.extractDomainFromUrl(productUrl);
        const storeLogo = (domain ? `https://logo.clearbit.com/${domain}` : null)
          || price.store.logo
          || this.getClearbitLogoUrl(price.store.name);

        // Prefer product URL (Shop Now goes to product page); fallback to store homepage
        let finalProductUrl = price.productUrl || price.store.websiteUrl;
        if (!finalProductUrl) {
          const storeName = price.store.name.toLowerCase();
          if (storeName.includes('amazon')) finalProductUrl = 'https://www.amazon.com';
          else if (storeName.includes('walmart')) finalProductUrl = 'https://www.walmart.com';
          else if (storeName.includes('target')) finalProductUrl = 'https://www.target.com';
          else if (storeName.includes('best buy') || storeName.includes('bestbuy')) finalProductUrl = 'https://www.bestbuy.com';
          else if (storeName.includes('costco')) finalProductUrl = 'https://www.costco.com';
          else if (storeName.includes('ebay')) finalProductUrl = 'https://www.ebay.com';
          else if (storeName.includes('home depot') || storeName.includes('homedepot')) finalProductUrl = 'https://www.homedepot.com';
          else if (storeName.includes('office depot') || storeName.includes('officedepot')) finalProductUrl = 'https://www.officedepot.com';
          else finalProductUrl = domain ? `https://www.${domain}` : `https://www.${price.store.name.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com`;
        }
        
        // Reduced logging - only log in dev mode or for first 3 prices
        if (this.isDev && index < 3) {
          this.devLog(`🔗 Price ${index + 1} for ${price.store.name}: Using store URL: ${finalProductUrl}`);
        }
        
        return {
        rank: index + 1,
        store: {
          id: price.store.id,
          name: price.store.name,
            logo: storeLogo,
          url: price.store.websiteUrl,
        },
        price: Number(price.price),
        currency: price.currency,
        inStock: price.inStock,
        shippingCost: Number(price.shippingCost),
        totalPrice: Number(price.price) + Number(price.shippingCost),
        savings:
          index === 0
            ? 0
            : Number(price.price) - Number(dbProduct.prices[0].price),
        isBestPrice: index === 0,
        productUrl: finalProductUrl, // Include product URL (or store URL as fallback)
        };
      }),
      metadata: {
        source,
        totalStores: dbProduct.prices.length,
        lowestPrice: Number(dbProduct.prices[0].price),
        highestPrice: Number(
          dbProduct.prices[dbProduct.prices.length - 1].price,
        ),
        maxSavings:
          Number(dbProduct.prices[dbProduct.prices.length - 1].price) -
          Number(dbProduct.prices[0].price),
        searchedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Get closest stores for a product by zip code
   * Returns top 3 closest stores with distance information
   */
  async getClosestStoresForProduct(productId: string, zipCode: string) {
    // Get product with prices
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Get store names from product prices
    const storeNames = product.prices.map(p => p.store.name);

    // Find nearby store locations
    const nearbyLocations = await this.storeLocationsService.findNearby({
      zipCode,
      radius: 50, // 50 mile radius
    });

    // Filter to only stores that have prices for this product
    // Note: findNearby may add distance property, but TypeScript doesn't know about it
    const relevantLocations = nearbyLocations
      .filter(loc => storeNames.includes(loc.store.name))
      .slice(0, 3); // Top 3 closest

    // Get prices for these stores
    const storesWithPrices = relevantLocations.map(location => {
      const price = product.prices.find(p => p.store.name === location.store.name);
      // Access distance property safely (findNearby adds it but TypeScript doesn't know)
      const locationAny = location as any;
      const distanceValue = locationAny.distance !== undefined && typeof locationAny.distance === 'number'
        ? Math.round(locationAny.distance * 10) / 10
        : undefined;
      
      return {
        store: {
          id: location.store.id,
          name: location.store.name,
          logo: location.store.logo,
        },
        location: {
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          distance: distanceValue, // Round to 1 decimal
        },
        price: price ? {
          price: Number(price.price),
          currency: price.currency,
          productUrl: price.productUrl,
        } : null,
      };
    });

    return storesWithPrices;
  }
}

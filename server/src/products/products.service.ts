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
import { MultiStoreScrapingService } from '../integrations/services/multi-store-scraping.service';
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
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly walmartIntegration: WalmartMockIntegration,
    private readonly amazonIntegration: AmazonMockIntegration,
    private readonly targetIntegration: TargetMockIntegration,
    private readonly priceApiService: PriceApiService,
    private readonly multiStorePriceService: MultiStorePriceService,
    private readonly multiStoreScrapingService: MultiStoreScrapingService,
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

    return products.map((p) => this.enrichProductWithPriceCalculations(p));
  }

  async findOne(id: string) {
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

    return this.enrichProductWithPriceCalculations(product);
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

    return products.map((p) => this.enrichProductWithPriceCalculations(p));
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
      products: sortedProducts.map((p) => this.enrichProductWithPriceCalculations(p)),
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
          'home-accessories': 'Home Accessories',
          'beauty-products': 'Beauty Products',
          'video-games': 'Video Games',
          'home-decor': 'Home Decor',
          'pet-supplies': 'Pet Supplies',
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
      ],
    };

    // First, get products with images prioritized
    // CRITICAL: Ensure test products are excluded at database level
    const finalWhere: Prisma.ProductWhereInput = {
      AND: [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          images: { isEmpty: false }, // Has images array with items
        },
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
    
    const productsWithImages = await this.prisma.product.findMany({
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

    // Filter products that actually have valid images AND real prices AND exclude test products
    const productsWithValidImages = productsWithImages.filter(p => {
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
      
      const hasImages = p.images && Array.isArray(p.images) && p.images.length > 0;
      if (!hasImages) {
        console.log(`⚠️ Filtering out product without images array: "${p.name}"`);
        return false;
      }
      
      // Check if at least one image is a valid URL (exclude example.com test URLs)
      const validImage = p.images.some((img: string) => 
        img && typeof img === 'string' && 
        img.trim().length > 0 && 
        (img.startsWith('http://') || img.startsWith('https://')) &&
        !img.includes('placeholder') &&
        !img.includes('via.placeholder') &&
        !img.includes('example.com') // Exclude example.com URLs (test images)
      );
      
      if (!validImage) {
        console.log(`⚠️ Filtering out product without valid image URL: "${p.name}"`);
      }
      
      return validImage && productHasRealPrices; // Must have both valid image AND real prices
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
    let finalProducts = Array.from(uniqueProducts.values()).slice(0, limit);
    
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

      // Filter additional products for valid images
      const additionalWithImages = additionalProducts.filter(p => {
        const hasImages = p.images && Array.isArray(p.images) && p.images.length > 0;
        if (!hasImages) return false;
        
        const validImage = p.images.some((img: string) => 
          img && typeof img === 'string' && 
          img.trim().length > 0 && 
          (img.startsWith('http://') || img.startsWith('https://')) &&
          !img.includes('placeholder') &&
          !img.includes('via.placeholder')
        );
        
        return validImage;
      });
      
      // Combine products with images
      finalProducts = [...productsWithValidImages, ...additionalWithImages].slice(0, limit);
    }
    
    // Check if any products still need images and fetch replacements from PriceAPI
    const productsNeedingReplacement = finalProducts.filter(p => {
      const hasImages = p.images && Array.isArray(p.images) && p.images.length > 0;
      if (!hasImages) return true;
      
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
        'home-accessories': ['lamp', 'vase', 'candle', 'pillow', 'blanket', 'curtain', 'rug', 'mirror'],
        clothing: ['t-shirt', 'jeans', 'dress', 'jacket', 'sweater', 'shirt', 'pants', 'shorts'],
        footwear: ['sneakers', 'boots', 'sandals', 'heels', 'flip flops', 'running shoes'],
        books: ['novel', 'fiction book', 'mystery book', 'biography', 'self-help book'],
        household: ['detergent', 'paper towels', 'trash bags', 'cleaning supplies', 'batteries'],
        medicine: ['vitamins', 'pain reliever', 'bandages', 'first aid kit'],
        'beauty-products': ['shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation'],
        'video-games': ['playstation game', 'xbox game', 'nintendo switch game', 'pc game'],
        sports: ['basketball', 'football', 'tennis racket', 'yoga mat', 'dumbbells'],
        office: ['printer', 'scanner', 'stapler', 'paper clips', 'notebook'],
        furniture: ['sofa', 'chair', 'table', 'desk', 'bed', 'wardrobe'],
        'home-decor': ['wall art', 'picture frame', 'plant', 'throw pillow', 'decorative bowl'],
        tools: ['drill', 'hammer', 'screwdriver', 'wrench', 'toolbox'],
        'pet-supplies': ['dog food', 'cat food', 'pet toy', 'pet bed', 'leash'],
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
    
    // FINAL VALIDATION: Filter out any products without valid images AND real prices AND test products before returning
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
      
      const hasImages = p.images && Array.isArray(p.images) && p.images.length > 0;
      if (!hasImages) {
        console.log(`⚠️ Filtering out product without images array: "${p.name}"`);
        return false;
      }
      
      const validImage = p.images.some((img: string) => 
        img && typeof img === 'string' && 
        img.trim().length > 0 && 
        (img.startsWith('http://') || img.startsWith('https://')) &&
        !img.includes('placeholder') &&
        !img.includes('via.placeholder') &&
        !img.includes('example.com') // Also exclude example.com URLs (test images)
      );
      
      if (!validImage) {
        console.log(`⚠️ Filtering out product without valid image URL: "${p.name}"`);
      }
      
      return validImage && productHasRealPrices; // Must have both valid image AND real prices
    });
    
    // DEDUPLICATE: Remove duplicate products by name (case-insensitive) to prevent showing same product multiple times
    const uniqueFinalProducts = new Map<string, any>();
    for (const product of productsWithValidImagesFinal) {
      const productName = (product.name || '').toLowerCase().trim();
      if (!uniqueFinalProducts.has(productName)) {
        uniqueFinalProducts.set(productName, product);
      } else {
        console.log(`🔄 Removing duplicate product: "${product.name}"`);
      }
    }
    const deduplicatedProducts = Array.from(uniqueFinalProducts.values());
    
    // If we still don't have enough products with images, fetch from BOTH PriceAPI and SerpAPI
    if (deduplicatedProducts.length < limit && categorySlug) {
      const priceApiEnabled = this.priceApiService.isEnabled();
      const serpApiKey = this.configService.get<string>('SERPAPI_KEY');
      const serpApiEnabled = !!serpApiKey;
      
      this.devLog(`🔍 API Status Check for ${categorySlug}: PriceAPI=${priceApiEnabled}, SerpAPI=${serpApiEnabled}`);
      
      if (priceApiEnabled || serpApiEnabled) {
        this.devLog(`🖼️ Only ${deduplicatedProducts.length}/${limit} products have valid images, fetching ${limit - deduplicatedProducts.length} more from APIs...`);
      
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
        'home-accessories': ['lamp', 'vase', 'candle', 'pillow', 'blanket', 'curtain', 'rug', 'mirror'],
        clothing: ['t-shirt', 'jeans', 'dress', 'jacket', 'sweater', 'shirt', 'pants', 'shorts'],
        footwear: ['sneakers', 'boots', 'sandals', 'heels', 'flip flops', 'running shoes'],
        books: ['novel', 'fiction book', 'mystery book', 'biography', 'self-help book'],
        household: ['detergent', 'paper towels', 'trash bags', 'cleaning supplies', 'batteries'],
        medicine: ['vitamins', 'pain reliever', 'bandages', 'first aid kit'],
        'beauty-products': ['shampoo', 'conditioner', 'moisturizer', 'lipstick', 'foundation'],
        'video-games': ['playstation game', 'xbox game', 'nintendo switch game', 'pc game'],
        sports: ['basketball', 'football', 'tennis racket', 'yoga mat', 'dumbbells'],
        office: ['printer', 'scanner', 'stapler', 'paper clips', 'notebook'],
        furniture: ['sofa', 'chair', 'table', 'desk', 'bed', 'wardrobe'],
        'home-decor': ['wall art', 'picture frame', 'plant', 'throw pillow', 'decorative bowl'],
        tools: ['drill', 'hammer', 'screwdriver', 'wrench', 'toolbox'],
        'pet-supplies': ['dog food', 'cat food', 'pet toy', 'pet bed', 'leash'],
      };
      
      const searchTerms = categorySearchTerms[categorySlug] || ['product', 'item'];
      const additionalProducts: any[] = [];
      const seenNames = new Set(deduplicatedProducts.map(p => (p.name || '').toLowerCase().trim()));
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
        
        const productImage = apiProduct.image || (apiProduct as any).imageUrl || (apiProduct as any).images?.[0] || (apiProduct as any).thumbnail || '';
        if (!productImage || typeof productImage !== 'string' || !productImage.trim() || !productImage.startsWith('http')) {
          return; // Skip products without valid images
        }
        
        // Also exclude example.com URLs (test images)
        if (productImage.includes('example.com')) {
          console.log(`🚫 Skipping product with test image URL: "${apiProduct.name || apiProduct.title}"`);
          return;
        }
        
        const normalizedName = productName;
        if (seenNames.has(normalizedName)) return;
        
        try {
          // Ensure category exists before saving product
          let targetCategory = categoryId ? await this.prisma.category.findUnique({ where: { id: categoryId } }) : null;
          if (!targetCategory && categorySlug) {
            const categoryNameMap: Record<string, string> = {
              'kitchen': 'Kitchen & Appliances',
              'home-accessories': 'Home Accessories',
              'beauty-products': 'Beauty Products',
              'video-games': 'Video Games',
              'home-decor': 'Home Decor',
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
          const productToSave = source === 'serpapi' ? {
            name: apiProduct.name || apiProduct.title,
            image: apiProduct.image || apiProduct.thumbnail,
            price: apiProduct.price || 0,
            url: apiProduct.url || apiProduct.link || '',
            store: apiProduct.store || 'Unknown',
            barcode: null,
            // Include ALL store prices from SerpAPI (Walmart, Target, Best Buy, etc.)
            storePrices: apiProduct.storePrices || [],
          } : apiProduct;
          
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
            if (savedImage && typeof savedImage === 'string' && savedImage.startsWith('http') && !savedImage.includes('example.com')) {
              additionalProducts.push(savedProduct);
              seenNames.add(normalizedName);
              console.log(`✅ Added product with REAL prices and image from ${source.toUpperCase()}: "${productToSave.name || productToSave.title}" (${additionalProducts.length}/${fetchTarget}, need ${needed})`);
            } else {
              console.log(`⚠️ Saved product missing image, skipping: "${productToSave.name || productToSave.title}"`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not save product from ${source}: ${error.message}`);
        }
      };
      
      // PRIORITY: Use SerpAPI FIRST (gives products from MULTIPLE STORES)
      // Fallback to PriceAPI only if SerpAPI doesn't have enough results
      // Search MORE terms to ensure we get enough products after filtering
      const maxTermsToSearch = Math.min(searchTerms.length, Math.max(needed * 3, 10)); // Search at least 10 terms or 3x needed
      this.devLog(`🔍 Will search ${maxTermsToSearch} terms to find ${needed} products`);
      
      for (const term of searchTerms.slice(0, maxTermsToSearch)) {
        if (additionalProducts.length >= fetchTarget) break;
        
        // PRIMARY: Try SerpAPI first (multi-store results)
        // Fetch MORE products per term to account for filtering
        if (serpApiEnabled) {
          try {
            const productsPerTerm = Math.min(5, Math.ceil(fetchTarget / maxTermsToSearch) + 2); // Fetch more per term
            const serpApiResults = await this.searchProductsFromSerpAPI(term, productsPerTerm);
            if (serpApiResults && serpApiResults.length > 0) {
              this.devLog(`🛒 SerpAPI found ${serpApiResults.length} products from multiple stores for "${term}"`);
              for (const apiProduct of serpApiResults) {
                await saveProductFromAPI(apiProduct, 'serpapi');
                if (additionalProducts.length >= fetchTarget) break;
              }
            }
          } catch (error) {
            console.log(`⚠️ SerpAPI search failed for ${term}: ${error.message}`);
          }
        }
        
        // FALLBACK: Use PriceAPI only if we still need more products
        if (additionalProducts.length < fetchTarget && priceApiEnabled) {
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
          } catch (error) {
            console.log(`⚠️ PriceAPI search failed for ${term}: ${error.message}`);
          }
        }
      }
      
      // Combine products with valid images and deduplicate again
      const combinedProducts = [...deduplicatedProducts, ...additionalProducts];
      const uniqueCombined = new Map<string, any>();
      for (const product of combinedProducts) {
        const productName = (product.name || '').toLowerCase().trim();
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
      finalProducts = deduplicatedProducts.slice(0, limit);
    }
    } // Close the outer if block from line 589
    
    const enrichedProducts = finalProducts.map((p) => this.enrichProductWithPriceCalculations(p));

    // Log what we found (only in dev mode)
    this.devLog(`📚 getPopular results for categorySlug="${categorySlug}": ${enrichedProducts.length}/${limit} products`);
    
    if (enrichedProducts.length === 0) {
      console.warn(`⚠️ NO PRODUCTS RETURNED for ${categorySlug}! Frontend will show empty or fallback to sample data.`);
    }

    // If no products found (or not enough) and PriceAPI is enabled, try to fetch from PriceAPI
    // Also trigger if we have products but they don't match the subcategory filter
    const needsMoreProducts = enrichedProducts.length < minLimit;
    if (needsMoreProducts && this.priceApiService.isEnabled() && categorySlug) {
      console.log(`📡 Not enough products in database (${enrichedProducts.length}/${limit}) for ${categorySlug}${subcategory ? `, subcategory="${subcategory}"` : ''}, fetching from PriceAPI...`);
      
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
        // Add more categories as needed
      };
      
      // Filter search terms by subcategory if specified
      let searchTerms = categorySearchTerms[categorySlug] || [{ term: 'product' }];
      if (subcategory) {
        console.log(`🔍 Filtering search terms for subcategory: "${subcategory}"`);
        const originalCount = searchTerms.length;
        searchTerms = searchTerms.filter(st => 
          st.subcategory && st.subcategory.toLowerCase() === subcategory.toLowerCase()
        );
        console.log(`   - Filtered from ${originalCount} to ${searchTerms.length} terms`);
        // If no matching terms found, use all terms but filter results by subcategory
        if (searchTerms.length === 0) {
          console.log(`   ⚠️ No matching search terms found, using all terms for category`);
          searchTerms = categorySearchTerms[categorySlug] || [{ term: 'product' }];
        }
      }
      
      console.log(`📚 Using ${searchTerms.length} search terms for books:`, searchTerms.map(st => st.term).join(', '));
      
      const allResults: any[] = [];
      const seenProductNames = new Set<string>(); // Track product names to avoid duplicates
      const seenProductImages = new Set<string>(); // Track product images to avoid duplicates
      
      // Fetch products from PriceAPI - fetch enough to get at least 6 unique products
      // For books: fetch 1 product per search term, but ensure diversity
      const productsPerTerm = 1; // Fetch 1 product per search term for diversity
      const maxTermsToSearch = Math.max(searchTerms.length, minLimit * 2); // Search more terms to ensure we get enough unique products
      
      for (const { term, subcategory: termSubcategory } of searchTerms.slice(0, maxTermsToSearch)) {
        // Stop if we have enough unique products
        if (allResults.length >= minLimit) break;
        
        try {
          const apiResults = await this.priceApiService.searchProducts(term, { limit: 3 }); // Fetch 3 to have options
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
              if (!productImage || typeof productImage !== 'string' || !productImage.trim() || !productImage.startsWith('http')) {
                console.log(`⏭️ Skipping product without valid image: "${apiProduct.name}"`);
                continue;
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
          .map((p) => this.enrichProductWithPriceCalculations(p));
        
        // If subcategory was specified, filter the combined results
        let finalProducts = combined;
        if (subcategory) {
          finalProducts = combined.filter(p => {
            const productSubcategory = p.subcategory?.toLowerCase() || '';
            const matches = productSubcategory.includes(subcategory.toLowerCase());
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
        console.log(`⚠️ No products found from PriceAPI`);
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
    const finalEnrichedProducts = filteredEnrichedProducts.map((p) => this.enrichProductWithPriceCalculations(p));
    const finalProductsWithImages = finalEnrichedProducts.filter((p: any) => {
      // Must have valid images
      const images = p.images || [];
      if (!Array.isArray(images) || images.length === 0) {
        console.log(`🚫 Filtering out "${p.name}" - no images array`);
        return false;
      }
      
      const hasValidImage = images.some((img: string) => 
        img && typeof img === 'string' && 
        img.trim().length > 0 && 
        (img.startsWith('http://') || img.startsWith('https://')) &&
        !img.includes('placeholder') &&
        !img.includes('via.placeholder') &&
        !img.includes('example.com')
      );
      
      if (!hasValidImage) {
        console.log(`🚫 Filtering out "${p.name}" - no valid image URL`);
        return false;
      }
      
      // Must have real prices (enriched products have storePrices, not prices)
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
        console.log(`🚫 Filtering out "${p.name}" - no real prices (storePrices: ${storePrices.length})`);
        return false;
      }
      
      return true;
    });
    
    // Apply pagination
    const skip = (page - 1) * limit;
    const totalProducts = finalProductsWithImages.length;
    const paginatedProducts = finalProductsWithImages.slice(skip, skip + limit);
    const hasMore = skip + limit < totalProducts;
    
    console.log(`📄 Pagination: page ${page}, limit ${limit}, skip ${skip}, total ${totalProducts}, returning ${paginatedProducts.length}, hasMore: ${hasMore}`);
    
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
    const finalCategoryId = category?.id;
    
    const products: any[] = [];
    
    // Use SerpAPI (paid plan) for category searches - it provides better multi-store results
    // Use PriceAPI only if no category (for general searches)
    const serpApiKey = this.configService.get<string>('SERPAPI_KEY');
    const serpApiEnabled = !!serpApiKey;
    
    if (category && serpApiEnabled) {
      // Use SerpAPI (paid plan) for category-specific searches - provides better multi-store results
      const categoryName = category.name;
      const categorySlug = category.slug;
      try {
        // Enhance query with category context to get relevant results from SerpAPI
        const enhancedQuery = this.enhanceQueryForCategory(cleanQuery, categorySlug);
        this.devLog(`🔍 Using SerpAPI (paid plan) for category search: "${cleanQuery}" → "${enhancedQuery}" in "${categoryName}" (page ${page})`);
        
        // Fetch enough results from SerpAPI to support pagination
        // For page 1: Fetch more results (5 pages worth)
        // For page 2+: Still fetch to ensure we have enough results (SerpAPI might return different results)
        const serpApiLimit = limit * 5; // Fetch 5 pages worth to allow pagination
        const serpApiResults = await this.searchProductsFromSerpAPI(enhancedQuery, serpApiLimit, categorySlug);
        
        if (serpApiResults && serpApiResults.length > 0) {
          // Filter results by category-specific keywords to avoid irrelevant items (backup filter)
          const filteredResults = this.filterSerpAPIResultsByCategory(serpApiResults, categorySlug, cleanQuery);
          
          // Add ALL filtered results (pagination will be handled later)
          for (const product of filteredResults) {
            products.push({
              id: `serpapi-${Date.now()}-${Math.random()}`,
              name: product.name || 'Unknown Product',
              image: product.image || '',
              category: categoryName,
              categorySlug: categorySlug,
              barcode: null, // SerpAPI doesn't provide barcode in fast search
              storePrices: [], // No prices in fast search - fetched when user clicks "View Price"
            });
          }
          this.devLog(`✅ SerpAPI returned ${filteredResults.length} filtered products (from ${serpApiResults.length} total) for category "${categoryName}"`);
        } else {
          this.devLog(`⚠️ SerpAPI returned no results for "${enhancedQuery}"`);
        }
      } catch (error: any) {
        this.devLog(`⚠️ SerpAPI fast search failed: ${error.message}`);
        // Don't throw - continue with database results
      }
    } else if (this.priceApiService && !categoryId) {
      // Use PriceAPI only for general searches (no category filter)
      try {
        // Get first product from PriceAPI (fast - just Amazon)
        const priceApiResult = await this.priceApiService.searchProducts(cleanQuery, { limit: 1 });
        
        if (priceApiResult && priceApiResult.length > 0) {
          // Transform to simple product format
          const product = priceApiResult[0];
          products.push({
            id: `priceapi-${Date.now()}-${Math.random()}`,
            name: product.name || 'Unknown Product',
            image: product.image || '',
            category: 'Uncategorized',
            categorySlug: null, // PriceAPI products don't have category
            barcode: product.barcode || null,
            storePrices: [], // No prices in fast search
          });
        }
      } catch (error: any) {
        this.devLog(`⚠️ PriceAPI fast search failed: ${error.message}`);
      }
    } else if (categoryId && !serpApiEnabled) {
      this.devLog(`ℹ️ SerpAPI not configured - using database only for category search`);
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Search database for products (filtered by category if found)
    // Note: Hierarchical ordering will be applied after fetching
    // Fetch enough results to support pagination (fetch more than needed for proper sorting)
    const dbProducts = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery } },
          { brand: { contains: cleanQuery } },
          { description: { contains: cleanQuery } },
        ],
        ...(finalCategoryId ? { categoryId: finalCategoryId } : {}),
      },
      skip: 0, // Fetch all matching products for hierarchical sorting
      take: limit * 10, // Fetch enough to support multiple pages
      include: {
        category: true,
      },
      orderBy: [
        { searchCount: 'desc' },
        { viewCount: 'desc' },
      ],
    });
    
    // Add database products (avoid duplicates)
    const seenNames = new Set(products.map(p => p.name.toLowerCase()));
    for (const p of dbProducts) {
      if (!seenNames.has(p.name.toLowerCase())) {
        products.push({
          id: p.id,
          name: p.name,
          image: p.images && p.images.length > 0 ? p.images[0] : '',
          category: p.category?.name || 'Uncategorized',
          categorySlug: p.category?.slug || null,
          barcode: p.barcode || null,
          storePrices: [],
        });
        seenNames.add(p.name.toLowerCase());
      }
    }
    
    // Final filter: If categorySlug is known, ensure all products match it
    const filteredProducts = category 
      ? products.filter(p => !p.categorySlug || p.categorySlug === category.slug)
      : products;
    
    // Apply hierarchical ordering to final results
    const orderedProducts = this.applyHierarchicalOrdering(filteredProducts, cleanQuery, categorySlug);
    
    // Return paginated results
    const paginatedResults = orderedProducts.slice(skip, skip + limit);
    const hasMore = orderedProducts.length > skip + limit;
    
    this.devLog(`✅ Fast search returned ${paginatedResults.length} products (page ${page}, from ${orderedProducts.length} total, hasMore: ${hasMore})`);
    
    // If no results and it's page 1, log warning
    if (paginatedResults.length === 0 && page === 1) {
      this.devLog(`⚠️ No products found for query "${cleanQuery}" in category "${categorySlug || 'all'}"`);
    }
    
    return paginatedResults;
  }
  
  /**
   * Apply hierarchical ordering to search results
   * Generic search → Models (newest first)
   * Model search → Variants
   * Specific search → Specs/colors
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
    
    // For other categories, maintain current order (already sorted by relevance)
    return products;
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
        
        // For generic grocery products, add "whole" or "fresh" to get generic products
        // This helps get "whole milk" instead of "chocolate milk"
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
          
          if (genericGroceryProducts[lowerQuery]) {
            cleanQuery = genericGroceryProducts[lowerQuery];
            this.devLog(`🔍 Enhanced generic grocery query: "${searchQuery.trim()}" → "${cleanQuery}"`);
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

    // If found in database, ALWAYS try to fetch multi-store prices for comprehensive comparison
    // Database might only have 1-2 stores (from initial search), but user expects 20+ stores when clicking "View Price"
    if (dbProduct && dbProduct.prices && dbProduct.prices.length > 0) {
      const uniqueStores = new Set(dbProduct.prices.map((p: any) => p.store?.name || p.storeId));
      const storeCount = uniqueStores.size;
      
      // CRITICAL: Always fetch multi-store prices when user clicks "View Price"
      // Even if database has multiple stores, fetch fresh prices from SerpAPI to get 20+ stores
      if (this.multiStoreScrapingService) {
        console.log(`🔍 Product found in database with ${storeCount} stores. Fetching multi-store prices for comprehensive comparison...`);
        console.log(`🔍 Using query: "${cleanQuery}"`);
        
        try {
          // Simplify query for SerpAPI - use product name from database instead of search query
          // SerpAPI works better with simpler, more generic queries
          const serpApiQuery = dbProduct.name || cleanQuery;
          console.log(`🔍 SerpAPI search query: "${serpApiQuery}"`);
          
          // Request 100 stores to get ALL stores from SerpAPI
          const multiStoreResult = await this.multiStoreScrapingService.searchProductWithMultiStorePrices(
            serpApiQuery,
            { limit: 100 } // Get ALL stores from SerpAPI
          );
          
          console.log(`📦 Multi-store result: ${multiStoreResult ? multiStoreResult.storePrices.length : 0} stores found`);
          
          // CRITICAL FIX: Always use SerpAPI results if available, even if same or fewer stores
          // SerpAPI results are fresher and more accurate than database
          if (multiStoreResult && multiStoreResult.storePrices.length > 0) {
            const serpApiStoreCount = multiStoreResult.storePrices.length;
            console.log(`✅ Found ${serpApiStoreCount} store prices from SerpAPI (database had ${storeCount}). Using SerpAPI results (fresher prices)...`);
            
            // Update product with new store prices from SerpAPI
            for (const storePrice of multiStoreResult.storePrices) {
              // Find or create store
              let store = await this.prisma.store.findFirst({
                where: { name: { equals: storePrice.storeName } },
              });
              
              if (!store) {
                store = await this.prisma.store.create({
                  data: {
                    name: storePrice.storeName,
                    slug: storePrice.storeId || storePrice.storeName.toLowerCase().replace(/\s+/g, '-'),
                    logo: `https://logo.clearbit.com/${storePrice.storeName.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com`,
                    websiteUrl: storePrice.url || `https://www.${storePrice.storeName.toLowerCase().replace(/\s+/g, '')}.com`,
                    enabled: true,
                  },
                });
              }
              
              // Check if price already exists
              const existingPrice = await this.prisma.productPrice.findFirst({
                where: {
                  productId: dbProduct.id,
                  storeId: store.id,
                },
              });
              
              // Use upsert to handle race conditions
              await this.prisma.productPrice.upsert({
                where: {
                  productId_storeId: {
                    productId: dbProduct.id,
                    storeId: store.id,
                  },
                },
                    update: {
                      price: storePrice.price,
                      currency: storePrice.currency || 'USD',
                      shippingCost: storePrice.shippingCost || 0,
                      inStock: storePrice.inStock,
                      productUrl: storePrice.url,
                    },
                create: {
                  productId: dbProduct.id,
                  storeId: store.id,
                  price: storePrice.price,
                  currency: storePrice.currency || 'USD',
                  shippingCost: storePrice.shippingCost || 0,
                  inStock: storePrice.inStock,
                  productUrl: storePrice.url,
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
              console.log(`✅ Returning product with ${updatedProduct.prices.length} store prices from SerpAPI (database had ${storeCount}, now has ${updatedProduct.prices.length})`);
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
        console.warn(`⚠️ Multi-store scraping service not configured for product "${dbProduct.name}". Add SERPAPI_KEY to .env to enable multi-store price fetching.`);
        console.warn(`   Product ID: ${dbProduct.id}, Database stores: ${storeCount}`);
      }
      
      // Fallback: Return database product if multi-store fetch failed or wasn't configured
      console.log(`⚠️ Returning database product "${dbProduct.name}" with ${storeCount} stores (multi-store fetch may have failed or not configured)`);
      console.log(`   Product ID: ${dbProduct.id}`);
      console.log(`   Stores in database: ${dbProduct.prices.map((p: any) => p.store?.name || 'Unknown').join(', ')}`);
      return this.formatMultiStoreResponse(dbProduct, 'database');
    }

    // Step 2: If not in database, search via PriceAPI to get product info
    if (this.priceApiService.isEnabled()) {
      try {
      const results = await this.priceApiService.searchProducts(cleanQuery, {
        limit: 20, // Get more results to find the best match
      });

        if (results && results.length > 0) {
        // Prioritize generic products over branded/specific variants
        // For generic queries like "milk", prefer "Milk" over "Chocolate Milk" or "Organic Milk"
        const lowerQuery = cleanQuery.toLowerCase().trim();
        const isGenericQuery = lowerQuery.length < 15 && !lowerQuery.includes(' ') || 
                               ['milk', 'bread', 'eggs', 'cheese', 'butter', 'rice', 'pasta', 
                                'apples', 'bananas', 'oranges', 'tomatoes', 'lettuce', 'onions'].includes(lowerQuery);
        
        let selectedProduct = results[0];
        
        if (isGenericQuery) {
          // Find the most generic match (exact match or closest to query)
          const exactMatch = results.find(p => 
            p.name.toLowerCase().trim() === lowerQuery ||
            p.name.toLowerCase().trim() === `${lowerQuery} ` ||
            p.name.toLowerCase().trim() === ` ${lowerQuery}`
          );
          
          if (exactMatch) {
            selectedProduct = exactMatch;
          }
          
          if (!exactMatch) {
            // Find product with shortest name that contains the query (most generic)
            const genericMatches = results.filter(p => {
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
          if (this.multiStoreScrapingService) {
            try {
              // Request 100 stores to ensure we get ALL stores from SerpAPI
              // SerpAPI can return 40+ results, and we want to capture ALL unique stores
              // User expects 20+ stores, so we request more to account for deduplication
              const multiStoreResult = await this.multiStoreScrapingService.searchProductWithMultiStorePrices(
                cleanQuery,
                { limit: 100 } // Increased to 100 to get ALL stores from SerpAPI
              );
              
              if (multiStoreResult && multiStoreResult.storePrices.length > 0) {
                this.devLog(`✅ Found ${multiStoreResult.storePrices.length} store prices (Amazon from PriceAPI + others from SerpAPI)!`);
                
                // Save multi-store prices to database
                const productName = multiStoreResult.name || firstProduct.name;
                const productImage = multiStoreResult.image || firstProduct.image;
                const barcode = multiStoreResult.barcode || extractedBarcode;
                
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
                  const category = await this.prisma.category.findFirst({ where: { slug: 'groceries' } });
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
                for (const storePrice of multiStoreResult.storePrices) {
                  // Find or create store
                  let store = await this.prisma.store.findFirst({
                    where: { name: { equals: storePrice.storeName } },
                  });
                  
                  if (!store) {
                    store = await this.prisma.store.create({
                      data: {
                        name: storePrice.storeName,
                        slug: storePrice.storeId || storePrice.storeName.toLowerCase().replace(/\s+/g, '-'),
                        logo: `https://logo.clearbit.com/${storePrice.storeName.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com`,
                        websiteUrl: storePrice.url,
                        enabled: true,
                      },
                    });
                  }
                  
                  // Check if price already exists
                  const existingPrice = await this.prisma.productPrice.findFirst({
                    where: {
                      productId: product.id,
                      storeId: store.id,
                    },
                  });
                  
                  // Use upsert to handle race conditions (multiple requests creating same price simultaneously)
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
                      inStock: storePrice.inStock,
                      productUrl: storePrice.url || null,
                      shippingCost: storePrice.shippingCost || 0,
                    },
                    create: {
                      productId: product.id,
                      storeId: store.id,
                      price: storePrice.price,
                      currency: storePrice.currency || 'USD',
                      inStock: storePrice.inStock,
                      productUrl: storePrice.url || null,
                      shippingCost: storePrice.shippingCost || 0,
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
            results,
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
            category: null,
          },
          prices: results.map((item, index) => {
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
                logo: `https://logo.clearbit.com/${item.store.toLowerCase().replace(/\s+/g, '')}.com`,
                url: storeUrl, // Store website URL
              },
              price: item.price,
              currency: item.currency,
              inStock: item.inStock,
              shippingCost: item.shipping || 0,
              totalPrice: item.price + (item.shipping || 0),
              savings: index === 0 ? 0 : item.price - results[0].price,
              isBestPrice: index === 0,
              productUrl: storeUrl, // Use store homepage for now
            };
          }),
          metadata: {
            source: 'priceapi',
            totalStores: results.length,
            lowestPrice: Math.min(...results.map((r) => r.price)),
            highestPrice: Math.max(...results.map((r) => r.price)),
            maxSavings:
              Math.max(...results.map((r) => r.price)) -
              Math.min(...results.map((r) => r.price)),
            searchedAt: new Date().toISOString(),
              note: extractedBarcode 
                ? `Product saved with barcode ${extractedBarcode}. Add prices from other stores to database for multi-retailer comparison.`
                : 'No barcode found. Add barcode manually to enable multi-store price lookup.',
          },
        };
        }
      } catch (error) {
        console.error(`❌ PriceAPI search failed for "${cleanQuery}":`, error.message);
        // Continue to return "no results" instead of crashing
      }
    }

    // Step 3: No results found
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
      electronics: ['phone', 'laptop', 'tablet', 'computer', 'tv', 'television', 'headphone', 'speaker', 'camera', 'monitor', 'keyboard', 'mouse', 'printer', 'scanner', 'smartwatch', 'watch', 'electronic', 'device', 'gadget'],
      kitchen: ['blender', 'microwave', 'oven', 'stove', 'coffee maker', 'toaster', 'mixer', 'air fryer', 'pressure cooker', 'rice cooker', 'pot', 'pan', 'knife', 'utensil', 'appliance'],
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
      ],
      electronics: ['food', 'fruit', 'vegetable', 'grocery', 'clothing', 'furniture'],
      kitchen: ['clothing', 'electronics', 'furniture'],
    };
    
    const keywords = categoryKeywords[categorySlug] || [];
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    const categoryExcludeTerms = excludeTerms[categorySlug] || [];
    const lowerExcludeTerms = categoryExcludeTerms.map(t => t.toLowerCase());
    
    return results.filter(product => {
      const productNameLower = (product.name || '').toLowerCase();
      
      // FIRST: Exclude items that match exclude terms (highest priority)
      if (lowerExcludeTerms.some(term => productNameLower.includes(term))) {
        this.devLog(`🚫 Filtered out "${product.name}" - contains exclude term`);
        return false;
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
            
            // If query is a fruit name, prioritize products that look like produce
            if (isFruitVegetable) {
              // Exclude if it contains clothing terms
              const clothingTerms = ['women\'s', 'men\'s', 'coat', 'jacket', 'dress', 'shirt', 'pants', 'jeans', 'sweater', 'clothing', 'apparel', 'fashion'];
              if (clothingTerms.some(term => productNameLower.includes(term))) {
                this.devLog(`🚫 Filtered out "${product.name}" - fruit query but appears to be clothing`);
                return false;
              }
              
              // Prefer products with produce-related terms
              const produceTerms = ['fresh', 'organic', 'each', 'lb', 'pound', 'fruit', 'produce', 'whole', 'ripe'];
              if (produceTerms.some(term => productNameLower.includes(term))) {
                return true; // Definitely a grocery item
              }
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
      
      // If no keywords defined, include all results (but still apply exclude terms)
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
      'home-accessories': ['home', 'decor', 'accessory'],
      clothing: ['clothing', 'apparel', 'fashion'],
      footwear: ['shoes', 'footwear'],
      books: ['book'],
      household: ['household', 'cleaning'],
      medicine: ['medicine', 'health', 'pharmacy'],
      'beauty-products': ['beauty', 'cosmetics', 'skincare'],
      'video-games': ['video game', 'game'],
      sports: ['sports', 'athletic'],
      office: ['office', 'supplies'],
      furniture: ['furniture'],
      'home-decor': ['home decor', 'decoration'],
      tools: ['tool', 'hardware'],
      'pet-supplies': ['pet', 'animal'],
    };
    
    const categoryEnhancements = enhancements[categorySlug] || [];
    
    // For groceries, prioritize "fruit" or "fresh" to get produce items
    if (categorySlug === 'groceries') {
      // Check if query is a common fruit/vegetable name
      const fruitNames = ['mango', 'apple', 'banana', 'orange', 'grape', 'pineapple', 'avocado', 'tomato', 'potato', 'onion'];
      const isFruitVegetable = fruitNames.some(fv => lowerQuery.includes(fv));
      
      if (isFruitVegetable) {
        // Add "fruit" or "fresh" to make it clear we want produce
        return `${query} fruit`;
      }
      
      // For other grocery items, add "grocery" or "food"
      return `${query} grocery`;
    }
    
    // For other categories, add category-specific term
    if (categoryEnhancements.length > 0) {
      return `${query} ${categoryEnhancements[0]}`;
    }
    
    // Default: return query as-is
    return query;
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
    const apiKey = this.configService.get<string>('SERPAPI_KEY');
    if (!apiKey) {
      console.log(`⚠️ SerpAPI key not found - cannot fetch products from multiple stores`);
      return [];
    }
    
    console.log(`🔍 Calling SerpAPI for "${query}"...`);

    try {
      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const shoppingResults = data.shopping_results || [];
      
      console.log(`📦 SerpAPI returned ${shoppingResults.length} results for "${query}" from multiple stores`);
      
      const products: Array<{ name: string; image: string; price: number; url: string; store: string; storePrices?: Array<{ store: string; price: number; url: string }> }> = [];
      const seenStores = new Set<string>();
      
      // Group results by product name to get multiple store prices per product
      const productMap = new Map<string, Array<{ store: string; price: number; url: string; image: string }>>();
      
      for (const result of shoppingResults) {
        // Extract image
        const image = result.thumbnail || result.image || '';
        if (!image || !image.startsWith('http')) {
          continue; // Skip products without valid images
        }
        
        // Extract price
        const priceText = result.price || '0';
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
        
        if (price <= 0) {
          continue; // Skip invalid prices
        }
        
        const productName = (result.title || query).toLowerCase().trim();
        const storeName = (result.source || 'Unknown').toLowerCase().trim();
        
        // Group by product name to collect prices from multiple stores
        if (!productMap.has(productName)) {
          productMap.set(productName, []);
        }
        
        productMap.get(productName)!.push({
          store: result.source || 'Unknown',
          price: price,
          url: result.link || '',
          image: image,
        });
      }
      
      // Convert grouped products to final format
      for (const [productName, storePrices] of productMap.entries()) {
        if (products.length >= limit) break;
        
        // Sort by price (lowest first) and take the first one as primary
        storePrices.sort((a, b) => a.price - b.price);
        const primaryStore = storePrices[0];
        
        // Get product name from first result
        const firstResult = shoppingResults.find(r => 
          (r.title || '').toLowerCase().trim() === productName
        );
        
        products.push({
          name: firstResult?.title || query,
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
        
        console.log(`✅ Added product "${firstResult?.title || query}" with ${storePrices.length} store prices: ${storePrices.map(sp => `${sp.store} ($${sp.price})`).join(', ')}`);
      }
      
      return products;
    } catch (error) {
      console.log(`⚠️ SerpAPI search failed for ${query}: ${error.message}`);
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

    // Extract image from multiple possible fields
    const productImage = apiProduct.image || 
                        (apiProduct as any).imageUrl || 
                        (apiProduct as any).images?.[0] || 
                        (apiProduct as any).thumbnail ||
                        null;
    
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
              logo: `https://logo.clearbit.com/${storeName.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com`,
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
      // Product exists - update it with new prices if needed
      console.log(`♻️ Product "${apiProduct.name}" already exists, updating prices...`);
      
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
      
      // Reload product with updated prices
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
        product = await this.prisma.product.create({
          data: {
            name: apiProduct.name,
            description: productDescription,
            images: productImage && typeof productImage === 'string' && productImage.trim().length > 0 ? [productImage] : [],
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
    
    console.log(`📦 formatMultiStoreResponse - Product: ${dbProduct.name}, Image: ${productImage || 'NO IMAGE'}`);
    
    return {
      product: {
        id: dbProduct.id,
        name: dbProduct.name,
        description: dbProduct.description,
        image: productImage,
        barcode: dbProduct.barcode,
        category: dbProduct.category.name,
      },
      prices: dbProduct.prices.map((price, index) => {
        // Generate Clearbit logo if store doesn't have one
        const storeLogo = price.store.logo || 
          `https://logo.clearbit.com/${price.store.name.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')}.com`;
        
        // For now, use store website URL (homepage) instead of specific product URL
        // This ensures users can always click through to the store
        let finalProductUrl = price.store.websiteUrl;
        
        // Generate store homepage URL if websiteUrl is missing
        if (!finalProductUrl) {
          const storeName = price.store.name.toLowerCase();
          if (storeName.includes('amazon')) {
            finalProductUrl = 'https://www.amazon.com';
          } else if (storeName.includes('walmart')) {
            finalProductUrl = 'https://www.walmart.com';
          } else if (storeName.includes('target')) {
            finalProductUrl = 'https://www.target.com';
          } else if (storeName.includes('best buy') || storeName.includes('bestbuy')) {
            finalProductUrl = 'https://www.bestbuy.com';
          } else if (storeName.includes('costco')) {
            finalProductUrl = 'https://www.costco.com';
          } else if (storeName.includes('ebay')) {
            finalProductUrl = 'https://www.ebay.com';
          } else if (storeName.includes('home depot') || storeName.includes('homedepot')) {
            finalProductUrl = 'https://www.homedepot.com';
          } else if (storeName.includes('office depot') || storeName.includes('officedepot')) {
            finalProductUrl = 'https://www.officedepot.com';
          } else {
            // Generic fallback - try to construct URL from store name
            finalProductUrl = `https://www.${price.store.name.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com`;
          }
        }
        
        console.log(`🔗 Price ${index + 1} for ${price.store.name}: Using store URL: ${finalProductUrl}`);
        
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

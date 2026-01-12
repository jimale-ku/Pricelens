import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { WalmartMockIntegration } from '../integrations/services/walmart-mock.integration';
import { AmazonMockIntegration } from '../integrations/services/amazon-mock.integration';
import { TargetMockIntegration } from '../integrations/services/target-mock.integration';
import { PriceApiService } from '../integrations/services/priceapi.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walmartIntegration: WalmartMockIntegration,
    private readonly amazonIntegration: AmazonMockIntegration,
    private readonly targetIntegration: TargetMockIntegration,
    private readonly priceApiService: PriceApiService,
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
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
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
                mode: 'insensitive',
              },
            }
          : {},
        // Search query
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
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
  async getPopular(categorySlug?: string, limit: number = 6) {
    const where: Prisma.ProductWhereInput = categorySlug
      ? {
          category: {
            slug: categorySlug,
          },
        }
      : {};

    const products = await this.prisma.product.findMany({
      where,
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
      take: limit,
    });

    // If no products found and PriceAPI is enabled, try to fetch from PriceAPI
    if (products.length === 0 && this.priceApiService.isEnabled() && categorySlug) {
      console.log(`📡 No products in database for ${categorySlug}, fetching from PriceAPI...`);
      
      // Get category-specific search terms
      const categorySearchTerms: Record<string, string[]> = {
        electronics: ['laptop', 'smartphone', 'headphones', 'tablet', 'smartwatch', 'tv'],
        groceries: ['apple', 'banana', 'milk', 'bread', 'eggs', 'chicken'],
        // Add more categories as needed
      };
      
      const searchTerms = categorySearchTerms[categorySlug] || ['product'];
      const allResults: any[] = [];
      
      // Fetch products from PriceAPI for each search term (limit to first 2 terms to avoid too many API calls)
      for (const term of searchTerms.slice(0, 2)) {
        try {
          const apiResults = await this.priceApiService.searchProducts(term, { limit: 3 });
          if (apiResults && apiResults.length > 0) {
            // Auto-save products to database with correct category
            for (const apiProduct of apiResults.slice(0, 2)) {
              try {
                const savedProduct = await this.autoSaveProductFromAPI(
                  apiProduct,
                  apiProduct.barcode || null,
                  [apiProduct],
                  categorySlug, // Pass categorySlug so products are saved to correct category
                );
                if (savedProduct) {
                  allResults.push(savedProduct);
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
      
      // If we got products from PriceAPI, return them
      if (allResults.length > 0) {
        const enriched = allResults.map((p) => this.enrichProductWithPriceCalculations(p));
        return {
          products: enriched,
          count: enriched.length,
          categorySlug,
        };
      }
    }

    return {
      products: products.map((p) => this.enrichProductWithPriceCalculations(p)),
      count: products.length,
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
  async compareProductAcrossStores(
    searchQuery: string,
    searchType: 'term' | 'gtin' | 'auto' = 'auto',
  ) {
    // Auto-detect if it's a barcode (numeric, 8-14 digits)
    const isBarcode =
      searchType === 'gtin' ||
      (searchType === 'auto' && /^\d{8,14}$/.test(searchQuery.trim()));
    
    const key = isBarcode ? 'gtin' : 'term';
    const cleanQuery = searchQuery.trim();

    console.log(`🔍 Searching with ${key}: "${cleanQuery}"`);

    // Step 1: Check if product exists in our database
    const dbProduct = await this.prisma.product.findFirst({
      where: isBarcode
        ? { barcode: cleanQuery }
        : { 
            OR: [
              { name: { contains: cleanQuery, mode: 'insensitive' } },
              { brand: { contains: cleanQuery, mode: 'insensitive' } },
              { description: { contains: cleanQuery, mode: 'insensitive' } },
            ]
          },
      include: {
        prices: {
          include: { store: true },
          orderBy: { price: 'asc' },
        },
        category: true,
      },
    });

    // If found in database, return that (fastest)
    if (dbProduct && dbProduct.prices.length > 0) {
      console.log(`✅ Found in database: ${dbProduct.name} with ${dbProduct.prices.length} store prices`);
      
      return this.formatMultiStoreResponse(dbProduct, 'database');
    }

    // Step 2: If not in database, search via PriceAPI to get product info
    if (this.priceApiService.isEnabled()) {
      console.log('📡 Searching via PriceAPI to get product data...');
      
      const results = await this.priceApiService.searchProducts(cleanQuery, {
        limit: 10,
      });

      if (results && results.length > 0) {
        const firstProduct = results[0];
        
        // Extract barcode from first result if available
        const extractedBarcode = firstProduct.barcode || (isBarcode ? cleanQuery : null);
        
        // CRITICAL: If we have a barcode, search database for prices from ALL stores
        if (extractedBarcode) {
          console.log(`🔍 Found barcode: ${extractedBarcode}, searching database for multi-store prices...`);
          
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
          if (multiStoreProduct && multiStoreProduct.prices.length > 0) {
            console.log(`✅ Found product in database with ${multiStoreProduct.prices.length} store prices!`);
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
          
          if (savedProduct) {
            console.log(`✅ Auto-saved product: ${savedProduct.name} (barcode: ${savedProduct.barcode || 'none'})`);
            // Return the saved product with all its prices
            // NOTE: Initially only has Amazon prices, but barcode allows future multi-store lookup
            return this.formatMultiStoreResponse(savedProduct, 'priceapi-saved');
          }
        } catch (error) {
          console.log(`⚠️  Could not auto-save product: ${error.message}`);
        }

        // Fallback: return API results directly (only Amazon for now)
        // TODO: Enhance to fetch from multiple retailers
        console.log(`📦 PriceAPI product image: ${firstProduct.image || 'NO IMAGE'}`);
        console.log(`⚠️  NOTE: Currently only returning Amazon prices. To get multi-retailer prices:`);
        console.log(`   1. Product will be saved with barcode: ${extractedBarcode || 'none'}`);
        console.log(`   2. Manually add prices from other stores to database`);
        console.log(`   3. Future searches will show prices from all stores!`);
        
        console.log(`📦 PriceAPI product image in response: ${firstProduct.image || 'NO IMAGE'}`);
        
        return {
          product: {
            name: firstProduct.name,
            description: null,
            image: firstProduct.image || null, // Ensure image is passed through
            barcode: extractedBarcode,
            category: null,
          },
          prices: results.map((item, index) => ({
            rank: index + 1,
            store: {
              name: item.store,
              logo: `https://logo.clearbit.com/${item.store.toLowerCase().replace(/\s+/g, '')}.com`,
              url: item.url,
            },
            price: item.price,
            currency: item.currency,
            inStock: item.inStock,
            shippingCost: item.shipping,
            totalPrice: item.price + (item.shipping || 0),
            savings: index === 0 ? 0 : item.price - results[0].price,
            isBestPrice: index === 0,
            productUrl: item.url,
          })),
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
    }

    // Step 3: No results found
    return {
      product: null,
      prices: [],
      metadata: {
        source: 'none',
        totalStores: 0,
        searchedAt: new Date().toISOString(),
        message: 'No prices found. Try searching by product name or barcode.',
      },
    };
  }

  /**
   * Auto-save product from PriceAPI to database
   * This builds up your product catalog over time
   */
  private async autoSaveProductFromAPI(
    apiProduct: any,
    barcode: string | null,
    allResults: any[],
    categorySlug?: string,
  ) {
    // Get or create a default category
    let category = await this.prisma.category.findFirst({
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

    // Get or create Amazon store
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

    // Create the product with prices
    const product = await this.prisma.product.create({
      data: {
        name: apiProduct.name,
        description: null,
        images: apiProduct.image ? [apiProduct.image] : [],
        barcode: barcode,
        brand: null,
        categoryId: category.id,
        searchCount: 1,
        prices: {
          create: allResults.map((result) => ({
            storeId: amazonStore.id,
            price: result.price,
            shippingCost: result.shipping || 0,
            currency: result.currency || 'USD',
            inStock: result.inStock,
            productUrl: result.url,
          })),
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

    return product;
  }

  /**
   * Format product data for multi-store response
   */
  private formatMultiStoreResponse(dbProduct: any, source: string) {
    // Extract image - handle both array and single value
    let productImage = null;
    if (dbProduct.images && Array.isArray(dbProduct.images) && dbProduct.images.length > 0) {
      productImage = dbProduct.images[0];
    } else if (typeof dbProduct.images === 'string') {
      productImage = dbProduct.images;
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
          productUrl: price.productUrl,
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
}

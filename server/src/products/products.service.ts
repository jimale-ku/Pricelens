import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { WalmartMockIntegration } from '../integrations/services/walmart-mock.integration';
import { AmazonMockIntegration } from '../integrations/services/amazon-mock.integration';
import { TargetMockIntegration } from '../integrations/services/target-mock.integration';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walmartIntegration: WalmartMockIntegration,
    private readonly amazonIntegration: AmazonMockIntegration,
    private readonly targetIntegration: TargetMockIntegration,
  ) {}

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
    return this.prisma.product.findMany({
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

    return product;
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

    return products;
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
      products: sortedProducts,
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
   * Search external store integrations for live product results.
   * This is useful for discovering new products not yet in our database.
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
    // Search all 3 major retailers in parallel for maximum speed
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
    };
  }
}

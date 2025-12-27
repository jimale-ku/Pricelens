import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PriceInsightsResponseDto } from './dto/price-insights-response.dto';

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  async getPriceInsights(productId: string): Promise<PriceInsightsResponseDto> {
    // Get product with all prices
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.prices.length === 0) {
      throw new NotFoundException('No prices available for this product');
    }

    // Calculate insights
    const prices = product.prices.map((p) => Number(p.price));
    const sortedPrices = [...prices].sort((a, b) => a - b);

    const lowestPrice = sortedPrices[0];
    const highestPrice = sortedPrices[sortedPrices.length - 1];
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Find store with lowest price
    const lowestPriceEntry = product.prices.find(
      (p) => Number(p.price) === lowestPrice,
    );

    // Find store with highest price
    const highestPriceEntry = product.prices.find(
      (p) => Number(p.price) === highestPrice,
    );

    if (!lowestPriceEntry || !highestPriceEntry) {
      throw new NotFoundException('Price data not found');
    }

    return {
      productId: product.id,
      productName: product.name,
      lowest: {
        price: lowestPrice,
        store: {
          id: lowestPriceEntry.store.id,
          name: lowestPriceEntry.store.name,
          logo: lowestPriceEntry.store.logo || '',
        },
      },
      average: Math.round(averagePrice * 100) / 100,
      highest: {
        price: highestPrice,
        store: {
          id: highestPriceEntry.store.id,
          name: highestPriceEntry.store.name,
          logo: highestPriceEntry.store.logo || '',
        },
      },
      savings: Math.round((highestPrice - lowestPrice) * 100) / 100,
      storeCount: product.prices.length,
      priceRange: {
        min: lowestPrice,
        max: highestPrice,
      },
    };
  }

  async getTrendingProducts(limit: number = 10) {
    // Get products sorted by search count + view count
    const products = await this.prisma.product.findMany({
      take: limit,
      orderBy: [
        { searchCount: 'desc' },
        { viewCount: 'desc' },
      ],
      include: {
        category: true,
        prices: {
          include: {
            store: true,
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      images: product.images,
      category: product.category.name,
      subcategory: product.subcategory,
      searchCount: product.searchCount,
      viewCount: product.viewCount,
      lowestPrice: product.prices.length > 0 ? Number(product.prices[0].price) : null,
      storeCount: product.prices.length,
    }));
  }

  async getPopularItemsByCategory(categoryId: string, limit: number = 10) {
    const products = await this.prisma.product.findMany({
      where: { categoryId },
      take: limit,
      orderBy: [
        { searchCount: 'desc' },
        { viewCount: 'desc' },
      ],
      include: {
        category: true,
        prices: {
          include: {
            store: true,
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      images: product.images,
      subcategory: product.subcategory,
      searchCount: product.searchCount,
      viewCount: product.viewCount,
      lowestPrice: product.prices.length > 0 ? Number(product.prices[0].price) : null,
      storeCount: product.prices.length,
    }));
  }

  async incrementProductView(productId: string) {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async incrementProductSearch(productId: string) {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        searchCount: {
          increment: 1,
        },
      },
    });
  }
}


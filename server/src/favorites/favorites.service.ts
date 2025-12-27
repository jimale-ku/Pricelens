import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async addFavorite(userId: string, productId: string) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Product already in favorites');
    }

    return this.prisma.favorite.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            prices: {
              include: { store: true },
              orderBy: { price: 'asc' },
            },
            category: true,
          },
        },
      },
    });
  }

  async getUserFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            prices: {
              include: { store: true },
              orderBy: { price: 'asc' },
            },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeFavorite(userId: string, productId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return { message: 'Removed from favorites' };
  }

  async isFavorite(userId: string, productId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return { isFavorite: !!favorite };
  }
}

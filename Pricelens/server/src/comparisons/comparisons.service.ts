import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveComparisonDto } from './dto/save-comparison.dto';

@Injectable()
export class ComparisonsService {
  constructor(private prisma: PrismaService) {}

  async saveComparison(userId: string, dto: SaveComparisonDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.savedComparison.create({
      data: {
        userId,
        productId: dto.productId,
        notes: dto.notes,
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

  async getUserComparisons(userId: string) {
    return this.prisma.savedComparison.findMany({
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

  async deleteComparison(userId: string, comparisonId: string) {
    const comparison = await this.prisma.savedComparison.findUnique({
      where: { id: comparisonId },
    });

    if (!comparison) {
      throw new NotFoundException('Saved comparison not found');
    }

    if (comparison.userId !== userId) {
      throw new NotFoundException('Comparison not found');
    }

    await this.prisma.savedComparison.delete({
      where: { id: comparisonId },
    });

    return { message: 'Comparison deleted successfully' };
  }
}

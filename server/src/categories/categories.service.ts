import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // Check existence

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Get product counts by subcategory for a given category
   * @param categoryId Category ID
   * @returns Object mapping subcategory IDs (normalized) to product counts
   * 
   * Note: Normalizes subcategory names to lowercase IDs for matching with frontend
   * Example: "TVs" -> "tvs", "Gaming" -> "gaming"
   */
  async getSubcategoryCounts(categoryId: string): Promise<Record<string, number>> {
    const products = await this.prisma.product.groupBy({
      by: ['subcategory'],
      where: {
        categoryId,
        subcategory: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    const counts: Record<string, number> = {};
    products.forEach((product) => {
      if (product.subcategory) {
        // Normalize subcategory name to lowercase ID for matching with frontend
        // Frontend uses IDs like "tvs", "gaming", "headphones"
        const normalizedId = product.subcategory.toLowerCase().trim();
        counts[normalizedId] = product._count.id;
      }
    });

    return counts;
  }

  /**
   * Get product counts by subcategory for a category by slug
   * @param slug Category slug
   * @returns Object mapping subcategory names to product counts
   */
  async getSubcategoryCountsBySlug(slug: string): Promise<Record<string, number>> {
    const category = await this.findBySlug(slug);
    return this.getSubcategoryCounts(category.id);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

@Injectable()
export class AdvertisementsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateAdvertisementDto) {
    return this.prisma.advertisement.create({
      data: createDto,
      include: { category: true },
    });
  }

  async findAll(categoryId?: string) {
    const now = new Date();

    return this.prisma.advertisement.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        ...(categoryId && { categoryId }),
      },
      include: { category: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findFeatured(limit = 3) {
    const now = new Date();

    return this.prisma.advertisement.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        categoryId: null, // Featured ads have no category
      },
      include: { category: true },
      orderBy: [{ displayOrder: 'asc' }, { impressions: 'desc' }],
      take: limit,
    });
  }

  async findOne(id: string) {
    return this.prisma.advertisement.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async update(id: string, updateDto: UpdateAdvertisementDto) {
    return this.prisma.advertisement.update({
      where: { id },
      data: updateDto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    return this.prisma.advertisement.delete({
      where: { id },
    });
  }

  async trackImpression(id: string) {
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        impressions: { increment: 1 },
      },
    });
  }

  async trackClick(id: string) {
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        clicks: { increment: 1 },
      },
    });
  }
}

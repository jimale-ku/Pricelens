import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStoreDto: CreateStoreDto) {
    return this.prisma.store.create({
      data: createStoreDto,
    });
  }

  async findAll() {
    return this.prisma.store.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async findBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
    });

    if (!store) {
      throw new NotFoundException(`Store with slug ${slug} not found`);
    }

    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto) {
    await this.findOne(id);

    return this.prisma.store.update({
      where: { id },
      data: updateStoreDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.store.delete({
      where: { id },
    });
  }
}

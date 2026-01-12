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

  /**
   * Handle user request for adding a new store.
   * In production, this could send notifications to admins or save to a database.
   */
  async requestStore(storeName: string, userEmail?: string) {
    // For now, we'll just return a success message
    // In production, you could:
    // 1. Save to a StoreRequest table
    // 2. Send email notification to admin
    // 3. Track popular requests
    
    console.log(`Store request received: ${storeName} from ${userEmail || 'anonymous'}`);
    
    return {
      message: 'Store request submitted successfully',
      storeName,
      status: 'pending',
      note: 'We review all store requests and add the most popular ones to help you save even more!',
    };
  }
}

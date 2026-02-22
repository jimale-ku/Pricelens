import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  async createList(userId: string, dto: CreateListDto) {
    return this.prisma.userList.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault || false,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async getUserLists(userId: string) {
    return this.prisma.userList.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getListById(userId: string, listId: string) {
    const list = await this.prisma.userList.findUnique({
      where: { id: listId },
      include: {
        items: {
          include: {
            product: {
              include: {
                prices: {
                  include: {
                    store: true,
                  },
                  orderBy: { price: 'asc' },
                },
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('You do not have access to this list');
    }

    return list;
  }

  async updateList(userId: string, listId: string, dto: UpdateListDto) {
    // Verify ownership
    await this.getListById(userId, listId);

    return this.prisma.userList.update({
      where: { id: listId },
      data: dto,
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async deleteList(userId: string, listId: string) {
    // Verify ownership
    await this.getListById(userId, listId);

    await this.prisma.userList.delete({
      where: { id: listId },
    });

    return { message: 'List deleted successfully' };
  }

  async addItemToList(userId: string, listId: string, dto: AddItemDto) {
    // Verify ownership
    await this.getListById(userId, listId);

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if item already exists in list
    const existingItem = await this.prisma.listItem.findUnique({
      where: {
        listId_productId: {
          listId,
          productId: dto.productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity instead of creating duplicate
      return this.prisma.listItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + (dto.quantity || 1),
          notes: dto.notes || existingItem.notes,
        },
        include: {
          product: {
            include: {
              prices: {
                include: { store: true },
                orderBy: { price: 'asc' },
              },
            },
          },
        },
      });
    }

    return this.prisma.listItem.create({
      data: {
        listId,
        productId: dto.productId,
        quantity: dto.quantity || 1,
        notes: dto.notes,
      },
      include: {
        product: {
          include: {
            prices: {
              include: { store: true },
              orderBy: { price: 'asc' },
            },
          },
        },
      },
    });
  }

  async updateListItem(userId: string, listId: string, itemId: string, dto: UpdateItemDto) {
    // Verify ownership
    await this.getListById(userId, listId);

    const item = await this.prisma.listItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.listId !== listId) {
      throw new NotFoundException('Item not found in this list');
    }

    return this.prisma.listItem.update({
      where: { id: itemId },
      data: dto,
      include: {
        product: {
          include: {
            prices: {
              include: { store: true },
              orderBy: { price: 'asc' },
            },
          },
        },
      },
    });
  }

  async removeItemFromList(userId: string, listId: string, itemId: string) {
    // Verify ownership
    await this.getListById(userId, listId);

    const item = await this.prisma.listItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.listId !== listId) {
      throw new NotFoundException('Item not found in this list');
    }

    await this.prisma.listItem.delete({
      where: { id: itemId },
    });

    return { message: 'Item removed from list' };
  }

  async markItemPurchased(userId: string, listId: string, itemId: string, isPurchased: boolean) {
    return this.updateListItem(userId, listId, itemId, { isPurchased });
  }

  async getTotalEstimatedCost(userId: string, listId: string) {
    const list = await this.getListById(userId, listId);

    let totalCost = 0;
    
    for (const item of list.items) {
      if (!item.isPurchased && item.product.prices.length > 0) {
        // Use lowest price
        const lowestPrice = item.product.prices[0].price;
        totalCost += Number(lowestPrice) * item.quantity;
      }
    }

    return {
      listId,
      listName: list.name,
      totalItems: list.items.length,
      unpurchasedItems: list.items.filter((i) => !i.isPurchased).length,
      estimatedTotal: totalCost.toFixed(2),
      currency: 'USD',
    };
  }
}

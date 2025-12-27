import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async createAlert(userId: string, dto: CreateAlertDto) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check for duplicate alert
    const existing = await this.prisma.priceAlert.findFirst({
      where: {
        userId,
        productId: dto.productId,
        isActive: true,
      },
    });

    if (existing) {
      throw new BadRequestException('Alert already exists for this product');
    }

    return this.prisma.priceAlert.create({
      data: {
        userId,
        productId: dto.productId,
        targetPrice: dto.targetPrice,
      },
      include: {
        product: {
          include: {
            prices: {
              orderBy: { price: 'asc' },
              take: 1,
              include: { store: true },
            },
          },
        },
      },
    });
  }

  async getUserAlerts(userId: string, activeOnly: boolean = true) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: {
        userId,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        product: {
          include: {
            prices: {
              orderBy: { price: 'asc' },
              take: 1,
              include: { store: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((alert) => ({
      ...alert,
      currentLowestPrice: alert.product.prices[0]
        ? Number(alert.product.prices[0].price)
        : null,
      priceReached: alert.product.prices[0]
        ? Number(alert.product.prices[0].price) <= Number(alert.targetPrice)
        : false,
    }));
  }

  async updateAlert(userId: string, alertId: string, dto: UpdateAlertDto) {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.prisma.priceAlert.update({
      where: { id: alertId },
      data: {
        targetPrice: dto.targetPrice,
        notified: false, // Reset notification status
      },
      include: {
        product: true,
      },
    });
  }

  async deleteAlert(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    await this.prisma.priceAlert.delete({
      where: { id: alertId },
    });

    return { message: 'Alert deleted successfully' };
  }

  async deactivateAlert(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.prisma.priceAlert.update({
      where: { id: alertId },
      data: { isActive: false },
    });
  }

  // Background job method - check all active alerts
  async checkPriceAlerts() {
    const alerts = await this.prisma.priceAlert.findMany({
      where: {
        isActive: true,
        notified: false,
      },
      include: {
        product: {
          include: {
            prices: {
              orderBy: { price: 'asc' },
              take: 1,
            },
          },
        },
        user: true,
      },
    });

    const triggeredAlerts: Array<{
      alertId: string;
      userId: string;
      userEmail: string;
      productName: string;
      targetPrice: number;
      currentPrice: number;
    }> = [];

    for (const alert of alerts) {
      if (alert.product.prices.length > 0) {
        const lowestPrice = Number(alert.product.prices[0].price);
        const targetPrice = Number(alert.targetPrice);

        if (lowestPrice <= targetPrice) {
          // Mark as notified
          await this.prisma.priceAlert.update({
            where: { id: alert.id },
            data: { notified: true },
          });

          triggeredAlerts.push({
            alertId: alert.id,
            userId: alert.userId,
            userEmail: alert.user.email,
            productName: alert.product.name,
            targetPrice: targetPrice,
            currentPrice: lowestPrice,
          });
        }
      }
    }

    return triggeredAlerts;
  }
}

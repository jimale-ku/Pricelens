import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('alert-notifications')
export class AlertNotificationProcessor {
  private readonly logger = new Logger(AlertNotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('check-price-alerts')
  async handleAlertCheck(job: Job) {
    this.logger.log('Starting price alert check...');

    try {
      // Get all active alerts
      const alerts = await this.prisma.priceAlert.findMany({
        where: {
          isActive: true,
          notified: false,
        },
        include: {
          product: {
            include: {
              prices: {
                include: { store: true },
              },
            },
          },
          user: true,
        },
      });

      this.logger.log(`Checking ${alerts.length} price alerts`);

      let notifiedCount = 0;

      for (const alert of alerts) {
        // Find lowest price
        const lowestPrice = Math.min(
          ...alert.product.prices.map((p) => Number(p.price)),
        );

        // Check if target price is met
        if (lowestPrice <= Number(alert.targetPrice)) {
          // In production, send email here
          this.logger.log(
            `Alert triggered for user ${alert.user.email}: ${alert.product.name} now at $${lowestPrice} (target: $${alert.targetPrice})`,
          );

          // Mark as notified
          await this.prisma.priceAlert.update({
            where: { id: alert.id },
            data: { notified: true },
          });

          notifiedCount++;

          // TODO: Implement email notification
          // await this.emailService.sendPriceAlert(alert.user.email, {
          //   productName: alert.product.name,
          //   targetPrice: alert.targetPrice,
          //   currentPrice: lowestPrice,
          // });
        }
      }

      this.logger.log(`Notified ${notifiedCount} users`);
      return { checked: alerts.length, notified: notifiedCount };
    } catch (error) {
      this.logger.error('Alert notification job failed', error);
      throw error;
    }
  }
}

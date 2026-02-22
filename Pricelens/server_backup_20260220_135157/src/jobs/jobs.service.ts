import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('price-updates') private priceUpdateQueue: Queue,
    @InjectQueue('alert-notifications') private alertQueue: Queue,
  ) {}

  // Run price updates every 6 hours
  @Cron(CronExpression.EVERY_6_HOURS)
  async schedulePriceUpdate() {
    this.logger.log('Scheduling price update job');
    await this.priceUpdateQueue.add('update-all-prices', { batchSize: 100 });
  }

  // Check price alerts every hour
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleAlertCheck() {
    this.logger.log('Scheduling alert check job');
    await this.alertQueue.add('check-price-alerts', {});
  }

  // Manual triggers (for testing or admin panel)
  async triggerPriceUpdate(batchSize = 50) {
    try {
      return await this.priceUpdateQueue.add('update-all-prices', { batchSize });
    } catch (error) {
      this.logger.warn('Redis not available, price update job not queued');
      return null;
    }
  }

  async triggerAlertCheck() {
    try {
      return await this.alertQueue.add('check-price-alerts', {});
    } catch (error) {
      this.logger.warn('Redis not available, alert check job not queued');
      return null;
    }
  }

  async getJobStats() {
    try {
      const [priceUpdateCounts, alertCounts] = await Promise.all([
        this.priceUpdateQueue.getJobCounts(),
        this.alertQueue.getJobCounts(),
      ]);

      return {
        priceUpdates: priceUpdateCounts,
        alertNotifications: alertCounts,
      };
    } catch (error) {
      // Return placeholder if Redis unavailable
      return {
        priceUpdates: { waiting: 0, active: 0, completed: 0, failed: 0 },
        alertNotifications: { waiting: 0, active: 0, completed: 0, failed: 0 },
      };
    }
  }
}

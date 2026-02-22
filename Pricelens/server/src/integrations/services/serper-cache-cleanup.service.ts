/**
 * Deletes expired Serper cache rows so DB storage doesn't grow unbounded.
 * Runs on startup and once daily.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SerperCacheService } from './serper-cache.service';

@Injectable()
export class SerperCacheCleanupService {
  private readonly logger = new Logger(SerperCacheCleanupService.name);

  constructor(private readonly serperCache: SerperCacheService) {}

  async onModuleInit() {
    try {
      const deleted = await this.serperCache.deleteExpired();
      if (deleted > 0) {
        this.logger.log(`Serper cache startup cleanup: removed ${deleted} expired entries`);
      }
    } catch (e) {
      this.logger.warn(`Serper cache startup cleanup failed: ${(e as Error).message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runDailyCleanup() {
    try {
      const deleted = await this.serperCache.deleteExpired();
      if (deleted > 0) {
        this.logger.log(`Serper cache daily cleanup: removed ${deleted} expired entries`);
      }
    } catch (e) {
      this.logger.warn(`Serper cache daily cleanup failed: ${(e as Error).message}`);
    }
  }
}

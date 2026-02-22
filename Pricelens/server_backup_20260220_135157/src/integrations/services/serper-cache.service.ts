/**
 * Serper API response cache – store Serper responses in DB to avoid repeated API calls.
 * TTL default 24 hours; configurable via SERPER_CACHE_TTL_HOURS.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

export type SerperCacheType = 'maps' | 'shopping' | 'search';

@Injectable()
export class SerperCacheService {
  private readonly logger = new Logger(SerperCacheService.name);
  private readonly ttlHours: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.ttlHours = this.config.get<number>('SERPER_CACHE_TTL_HOURS') ?? 24;
  }

  private hashKey(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 32);
  }

  /**
   * Build a cache key from type and request params.
   */
  buildKey(type: SerperCacheType, params: Record<string, unknown>): string {
    const normalized = JSON.stringify(params, Object.keys(params).sort());
    return `${type}:${this.hashKey(normalized)}`;
  }

  /**
   * Get cached response if present and not expired. Returns null on miss or expired.
   */
  async get(cacheKey: string): Promise<unknown | null> {
    try {
      const row = await this.prisma.serperCache.findUnique({
        where: { cacheKey },
      });
      if (!row || row.expiresAt < new Date()) {
        if (row && row.expiresAt < new Date()) {
          await this.prisma.serperCache.delete({ where: { cacheKey } }).catch(() => {});
        }
        return null;
      }
      return row.response as unknown;
    } catch (e) {
      this.logger.warn(`Serper cache get failed: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Store response in cache. TTL from constructor (default 24h).
   */
  async set(
    cacheKey: string,
    type: SerperCacheType,
    response: unknown,
    ttlHours?: number,
  ): Promise<void> {
    const hours = ttlHours ?? this.ttlHours;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    try {
      await this.prisma.serperCache.upsert({
        where: { cacheKey },
        create: { cacheKey, type, response: response as object, expiresAt },
        update: { response: response as object, expiresAt },
      });
      this.logger.debug(`Serper cache set: ${cacheKey} (expires ${expiresAt.toISOString()})`);
    } catch (e) {
      this.logger.warn(`Serper cache set failed: ${(e as Error).message}`);
    }
  }

  /**
   * Delete expired rows (call periodically or on startup to free space).
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.serperCache.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (result.count > 0) {
        this.logger.log(`Serper cache: deleted ${result.count} expired entries`);
      }
      return result.count;
    } catch (e) {
      this.logger.warn(`Serper cache deleteExpired failed: ${(e as Error).message}`);
      return 0;
    }
  }
}

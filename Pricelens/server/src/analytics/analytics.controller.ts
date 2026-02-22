import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Track an analytics event
   * POST /analytics/event
   */
  @Post('event')
  async trackEvent(@Body() body: {
    eventType: 'category_view' | 'category_search' | 'product_search' | 'service_search' | 'product_view';
    categorySlug?: string;
    categoryName?: string;
    productId?: string;
    productName?: string;
    serviceCategory?: string;
    userId?: string;
    searchQuery?: string;
    metadata?: Record<string, any>;
  }) {
    await this.analyticsService.trackEvent(body);
    return { success: true };
  }

  /**
   * Get analytics summary
   * GET /analytics
   */
  @Get()
  async getAnalytics() {
    return this.analyticsService.getAnalyticsSummary();
  }

  /**
   * Get category performance
   * GET /analytics/categories
   */
  @Get('categories')
  async getCategoryPerformance() {
    return this.analyticsService.getCategoryPerformance();
  }

  /**
   * Get service category performance
   * GET /analytics/service-categories
   */
  @Get('service-categories')
  async getServiceCategoryPerformance() {
    return this.analyticsService.getServiceCategoryPerformance();
  }

  /**
   * Get specific category analytics
   * GET /analytics/category/:slug
   */
  @Get('category/:slug')
  async getCategoryAnalytics(@Param('slug') slug: string) {
    return this.analyticsService.getCategoryAnalytics(slug);
  }
}

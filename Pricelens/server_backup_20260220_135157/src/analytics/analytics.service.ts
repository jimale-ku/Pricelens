import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track an analytics event
   */
  async trackEvent(data: {
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
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventType: data.eventType,
          categorySlug: data.categorySlug,
          categoryName: data.categoryName,
          productId: data.productId,
          productName: data.productName,
          serviceCategory: data.serviceCategory,
          userId: data.userId,
          searchQuery: data.searchQuery,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track event: ${error.message}`, error.stack);
      // Don't throw - analytics shouldn't break the app
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Total users
    const totalUsers = await this.prisma.user.count();
    
    // Plus/Pro users
    const plusUsers = await this.prisma.subscription.count({
      where: {
        tier: { in: ['PLUS', 'PRO', 'PREMIUM'] },
        status: 'ACTIVE',
      },
    });

    // New users today
    const newUsersToday = await this.prisma.user.count({
      where: {
        createdAt: { gte: today },
      },
    });

    // New users this week
    const newUsersThisWeek = await this.prisma.user.count({
      where: {
        createdAt: { gte: weekAgo },
      },
    });

    // New users this month
    const newUsersThisMonth = await this.prisma.user.count({
      where: {
        createdAt: { gte: monthAgo },
      },
    });

    // Total sessions (approximate from events)
    const totalSessions = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'category_view',
      },
    });

    // Category performance
    const categoryStats = await this.prisma.analyticsEvent.groupBy({
      by: ['categorySlug', 'categoryName'],
      where: {
        categorySlug: { not: null },
        createdAt: { gte: monthAgo },
      },
      _count: {
        id: true,
      },
    });

    const savingsByCategory: Record<string, number> = {};
    // Calculate estimated savings per category (mock calculation based on activity)
    for (const stat of categoryStats) {
      if (stat.categorySlug) {
        // Rough estimate: $10-50 per search/view depending on category
        const multiplier = this.getCategorySavingsMultiplier(stat.categorySlug);
        savingsByCategory[stat.categorySlug] = stat._count.id * multiplier;
      }
    }

    // Total savings (sum of all categories)
    const totalSavings = Object.values(savingsByCategory).reduce((a, b) => a + b, 0);

    // Recent signups
    const recentSignups = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    return {
      totalUsers,
      plusUsers,
      totalSavings: Math.round(totalSavings),
      avgSessionTime: 420, // TODO: Calculate from actual session data
      totalSessions,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      savingsByCategory,
      recentSignups: recentSignups.map((user) => ({
        email: user.email,
        signupDate: user.createdAt.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        plan: user.subscription?.tier === 'PLUS' || user.subscription?.tier === 'PRO' || user.subscription?.tier === 'PREMIUM' 
          ? 'Plus' 
          : 'Free',
      })),
    };
  }

  /**
   * Get category performance metrics
   */
  async getCategoryPerformance() {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get all category events from last month
    const categoryEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        categorySlug: { not: null },
        createdAt: { gte: monthAgo },
      },
      select: {
        categorySlug: true,
        categoryName: true,
        createdAt: true,
        eventType: true,
      },
    });

    // Group by category
    const categoryMap = new Map<string, {
      name: string;
      totalViews: number;
      totalSearches: number;
      viewsThisWeek: number;
      searchesThisWeek: number;
    }>();

    for (const event of categoryEvents) {
      if (!event.categorySlug) continue;

      const key = event.categorySlug;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          name: event.categoryName || event.categorySlug,
          totalViews: 0,
          totalSearches: 0,
          viewsThisWeek: 0,
          searchesThisWeek: 0,
        });
      }

      const stats = categoryMap.get(key)!;
      const isThisWeek = event.createdAt >= weekAgo;

      if (event.eventType === 'category_view') {
        stats.totalViews++;
        if (isThisWeek) stats.viewsThisWeek++;
      } else if (event.eventType === 'category_search' || event.eventType === 'product_search') {
        stats.totalSearches++;
        if (isThisWeek) stats.searchesThisWeek++;
      }
    }

    return Array.from(categoryMap.values()).map((stats) => ({
      ...stats,
      totalActivity: stats.totalViews + stats.totalSearches,
      activityThisWeek: stats.viewsThisWeek + stats.searchesThisWeek,
    })).sort((a, b) => b.totalActivity - a.totalActivity);
  }

  /**
   * Get service category performance
   */
  async getServiceCategoryPerformance() {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const serviceEvents = await this.prisma.analyticsEvent.groupBy({
      by: ['serviceCategory'],
      where: {
        eventType: 'service_search',
        serviceCategory: { not: null },
        createdAt: { gte: monthAgo },
      },
      _count: {
        id: true,
      },
    });

    return serviceEvents.map((event) => ({
      category: event.serviceCategory || 'unknown',
      searches: event._count.id,
    })).sort((a, b) => b.searches - a.searches);
  }

  /**
   * Get category-specific analytics
   */
  async getCategoryAnalytics(categorySlug: string) {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        categorySlug,
        createdAt: { gte: monthAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalViews = events.filter(e => e.eventType === 'category_view').length;
    const totalSearches = events.filter(e => 
      e.eventType === 'category_search' || e.eventType === 'product_search'
    ).length;
    const viewsThisWeek = events.filter(e => 
      e.eventType === 'category_view' && e.createdAt >= weekAgo
    ).length;
    const searchesThisWeek = events.filter(e => 
      (e.eventType === 'category_search' || e.eventType === 'product_search') && e.createdAt >= weekAgo
    ).length;

    // Get top search queries
    const searchQueries = events
      .filter(e => e.searchQuery)
      .map(e => e.searchQuery!)
      .reduce((acc, query) => {
        acc[query] = (acc[query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topQueries = Object.entries(searchQueries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      categorySlug,
      categoryName: events[0]?.categoryName || categorySlug,
      totalViews,
      totalSearches,
      viewsThisWeek,
      searchesThisWeek,
      totalActivity: totalViews + totalSearches,
      topQueries,
    };
  }

  /**
   * Estimate savings multiplier per category
   */
  private getCategorySavingsMultiplier(categorySlug: string): number {
    const multipliers: Record<string, number> = {
      'groceries': 15,
      'electronics': 45,
      'clothing': 25,
      'books': 8,
      'household': 12,
      'medicine': 20,
      'rental-cars': 50,
      'hotels': 60,
      'airfare': 80,
      'tires': 35,
      'haircuts': 10,
      'oil-changes': 15,
      'car-washes': 8,
      'video-games': 20,
      'gas-stations': 5,
      'car-insurance': 100,
      'renters-insurance': 80,
      'apartments': 200,
      'moving': 150,
      'food-delivery': 12,
      'gym': 30,
      'nail-salons': 15,
    };
    return multipliers[categorySlug] || 10;
  }
}

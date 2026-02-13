import { API_ENDPOINTS } from '@/constants/api';

/**
 * Track analytics events
 */
export async function trackEvent(data: {
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
    const response = await fetch(`${API_ENDPOINTS.base}/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      console.warn('Analytics tracking failed:', response.status);
    }
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.debug('Analytics tracking error:', error);
  }
}

/**
 * Fetch analytics summary
 */
export async function fetchAnalytics() {
  try {
    const response = await fetch(`${API_ENDPOINTS.base}/analytics`);
    if (!response.ok) {
      throw new Error(`Analytics fetch failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    throw error;
  }
}

/**
 * Fetch category performance
 */
export async function fetchCategoryPerformance() {
  try {
    const response = await fetch(`${API_ENDPOINTS.base}/analytics/categories`);
    if (!response.ok) {
      throw new Error(`Category performance fetch failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch category performance:', error);
    throw error;
  }
}

/**
 * Fetch service category performance
 */
export async function fetchServiceCategoryPerformance() {
  try {
    const response = await fetch(`${API_ENDPOINTS.base}/analytics/service-categories`);
    if (!response.ok) {
      throw new Error(`Service category performance fetch failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch service category performance:', error);
    throw error;
  }
}

/**
 * Fetch category-specific analytics
 */
export async function fetchCategoryAnalytics(categorySlug: string) {
  try {
    const response = await fetch(`${API_ENDPOINTS.base}/analytics/category/${categorySlug}`);
    if (!response.ok) {
      throw new Error(`Category analytics fetch failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch category analytics:', error);
    throw error;
  }
}

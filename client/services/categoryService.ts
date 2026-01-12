/**
 * Category Service - Fetches real data from backend
 * 
 * This service connects to the backend API to:
 * 1. Fetch stores for a category (from database)
 * 2. Fetch popular products for a category (from database/PriceAPI)
 * 3. Handle caching and error states
 */

import { API_ENDPOINTS } from '@/constants/api';
import { transformProducts, transformCompareResponse } from '@/utils/apiTransform';

export interface CategoryStores {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface CategoryProductsResponse {
  products: any[];
  stores: CategoryStores[];
  error?: string;
}

/**
 * Fetch stores for a category from backend
 * Returns stores that have products in this category
 */
export async function fetchCategoryStores(categorySlug: string): Promise<CategoryStores[]> {
  try {
    // Option 1: Get stores from category endpoint (if backend supports it)
    const categoryResponse = await fetch(API_ENDPOINTS.categories.bySlug(categorySlug));
    if (categoryResponse.ok) {
      const categoryData = await categoryResponse.json();
      if (categoryData.stores && Array.isArray(categoryData.stores)) {
        return categoryData.stores;
      }
    }

    // Option 2: Get all stores and filter by category
    // For now, get all enabled stores from backend
    const storesResponse = await fetch(API_ENDPOINTS.stores.all);
    if (storesResponse.ok) {
      const stores = await storesResponse.json();
      return stores.map((store: any) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        logo: store.logo,
      }));
    }

    return [];
  } catch (error: any) {
    // Silently handle network errors - app will use fallback data
    // Only log if it's not a network error (which is expected when backend is offline)
    if (error?.message && !error.message.includes('Network request failed')) {
      console.error('Error fetching category stores:', error);
    }
    return [];
  }
}

/**
 * Fetch popular products for a category from backend
 * Uses /products/popular endpoint which returns cached/database products
 * 
 * Backend returns: { products: [...], count: number, categorySlug: string }
 * Products include: id, name, images[], prices[], category, etc.
 */
export async function fetchCategoryProducts(
  categorySlug: string,
  limit: number = 6
): Promise<any[]> {
  try {
    const response = await fetch(API_ENDPOINTS.products.popular(categorySlug, limit));
    
    if (!response.ok) {
      console.warn(`Failed to fetch popular products for ${categorySlug}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // Backend returns: { products: [...], count: number, categorySlug: string }
    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else {
      console.warn('Unexpected response format from /products/popular:', data);
      return [];
    }

    // Transform backend products to frontend format
    // Backend products have: images[] (array), prices[] (with store info)
    const transformed = transformProducts(products);
    
    console.log(`✅ Fetched ${transformed.length} popular products for ${categorySlug}`);
    return transformed;
  } catch (error: any) {
    // Silently handle network errors - app will use fallback data
    // Only log if it's not a network error (which is expected when backend is offline)
    if (error?.message && !error.message.includes('Network request failed')) {
      console.error('Error fetching category products:', error);
    }
    return [];
  }
}

/**
 * Fetch complete category data (stores + products)
 * This is the main function to use in components
 */
export async function fetchCategoryData(
  categorySlug: string,
  limit: number = 6
): Promise<CategoryProductsResponse> {
  try {
    // Fetch stores and products in parallel
    const [stores, products] = await Promise.all([
      fetchCategoryStores(categorySlug),
      fetchCategoryProducts(categorySlug, limit),
    ]);

    return {
      products,
      stores,
    };
  } catch (error) {
    console.error('Error fetching category data:', error);
    return {
      products: [],
      stores: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


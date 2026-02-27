/**
 * Category Service - Fetches real data from backend
 * 
 * This service connects to the backend API to:
 * 1. Fetch stores for a category (from database)
 * 2. Fetch popular products for a category (from database/PriceAPI)
 * 3. Handle caching and error states
 */

import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import { transformProducts, transformCompareResponse } from '@/utils/apiTransform';

const isRender = API_BASE_URL.includes('onrender.com');
const REQUEST_TIMEOUT = isRender ? 55000 : 5000;  // Render cold start ~30–60s
const SHORT_TIMEOUT = isRender ? 55000 : 3000;

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
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      // Option 1: Get stores from category endpoint (if backend supports it)
      const categoryResponse = await fetch(API_ENDPOINTS.categories.bySlug(categorySlug), {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        if (categoryData.stores && Array.isArray(categoryData.stores)) {
          return categoryData.stores;
        }
      }

      // Option 2: Get all stores and filter by category
      // For now, get all enabled stores from backend
      const storesController = new AbortController();
      const storesTimeoutId = setTimeout(() => storesController.abort(), SHORT_TIMEOUT);
      
      const storesResponse = await fetch(API_ENDPOINTS.stores.all, {
        signal: storesController.signal,
      });
      clearTimeout(storesTimeoutId);
      
      if (storesResponse.ok) {
        const stores = await storesResponse.json();
        
        // CRITICAL: Validate stores is an array before calling .map()
        if (!Array.isArray(stores)) {
          console.warn('⚠️ Stores response is not an array:', typeof stores, stores);
          return [];
        }
        
        return stores.map((store: any) => ({
          id: store.id,
          name: store.name,
          slug: store.slug,
          logo: store.logo,
        }));
      }

      return [];
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error: any) {
    // Silently handle network errors - app will use fallback data
    // Only log if it's not a network/abort error (which is expected when backend is offline)
    if (error?.name !== 'AbortError' && error?.message && !error.message.includes('Network request failed') && !error.message.includes('aborted')) {
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
    // 45s timeout: backend may need Render wake (30–60s) + Serper calls for categories like groceries (avoids empty screen)
    const timeoutDuration = 45000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    console.log(`⏱️ Fetching products for ${categorySlug} (timeout: ${timeoutDuration}ms)...`);
    const response = await fetch(API_ENDPOINTS.products.popular(categorySlug, limit), {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch popular products for ${categorySlug}: ${response.status}`);
      // If backend returns error, try to get more details
      if (response.status === 500 || response.status === 503) {
        const errorText = await response.text().catch(() => '');
        console.error(`Backend error details: ${errorText}`);
      }
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
    console.log(`🔄 Transforming ${products.length} backend products for ${categorySlug}...`);
    const transformed = transformProducts(products);
    console.log(`🔄 After transformProducts: ${transformed.length} products`);
    
    const filtered = transformed.filter((p: any) => {
      // Safety: ensure we never show products from the wrong category
      // If categorySlug is not set, trust the backend query (it already filtered by category)
      // If categorySlug is set, it must match the requested category
      if (p?.categorySlug) {
        const matches = p.categorySlug === categorySlug;
        if (!matches) {
          console.warn(`🚫 Filtering out "${p.name}" - wrong category: ${p.categorySlug} !== ${categorySlug}`);
        }
        return matches;
      }
      // If no categorySlug, trust backend (it already filtered by categorySlug in the query)
      // BUT: For certain categories, we should still show products even if categorySlug is missing
      // because the backend already filtered by categoryId
      if (categorySlug === 'beauty' || categorySlug === 'beauty-products' || categorySlug === 'sports-equipment' || categorySlug === 'mattresses' || categorySlug === 'pet-supplies' || categorySlug === 'books') {
        console.log(`✅ Keeping product "${p.name}" for ${categorySlug} category (no categorySlug, but backend filtered by categoryId)`);
        return true;
      }
      return true;
    });
    
    console.log(`✅ Fetched ${filtered.length} popular products for ${categorySlug} (from ${products.length} backend products, ${transformed.length} after transformation)`);
    
    // Log timing for books category to help debug slow loading
    if (categorySlug === 'books') {
      console.log(`📚 Books category: ${filtered.length} products ready to display`);
      if (filtered.length === 0) {
        console.warn(`⚠️ Books category: No products returned. Backend may still be fetching from SerpAPI...`);
      }
    }
    
    return filtered;
  } catch (error: any) {
    // Better error handling for connection issues
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.log(`⏭️ Request aborted for ${categorySlug}`);
      return [];
    }
    
    // Log network errors with more detail
    if (error?.message?.includes('Network request failed') || error?.message?.includes('Failed to fetch')) {
      console.error(`❌ Network error fetching products for ${categorySlug}:`, error.message);
      console.error(`   Check: 1) Backend running? 2) IP correct? 3) Same network?`);
    } else if (error?.message && !error.message.includes('Network request failed')) {
      console.error('Error fetching category products:', error);
    }
    return [];
  }
}

/**
 * Fetch products progressively - returns items one by one as they're fetched
 * This allows UI to show skeletons and reveal items as they load
 */
export async function* fetchCategoryProductsProgressive(
  categorySlug: string,
  limit: number = 6,
  onProgress?: (products: any[], index: number) => void
): AsyncGenerator<any[], void, unknown> {
  try {
    // Fetch all products first (backend handles the fetching)
    const allProducts = await fetchCategoryProducts(categorySlug, limit);
    
    // Yield products one by one with small delay for progressive reveal
    for (let i = 0; i < allProducts.length; i++) {
      const productsSoFar = allProducts.slice(0, i + 1);
      yield productsSoFar;
      if (onProgress) {
        onProgress(productsSoFar, i);
      }
      // Small delay to show progressive loading effect
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('Error in progressive fetch:', error);
    yield [];
  }
}

/**
 * Fetch subcategory product counts for a category
 * Returns an object mapping subcategory IDs to product counts
 * Example: { 'tvs': 31, 'headphones': 12, 'gaming': 30 }
 */
export async function fetchSubcategoryCounts(
  categorySlug: string
): Promise<Record<string, number>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SHORT_TIMEOUT);

    const response = await fetch(
      `${API_ENDPOINTS.categories.base}/slug/${categorySlug}/subcategory-counts`,
      {
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch subcategory counts for ${categorySlug}: ${response.status}`);
      return {};
    }

    const counts = await response.json();
    console.log(`✅ Fetched subcategory counts for ${categorySlug}:`, counts);
    return counts || {};
  } catch (error: any) {
    // Silently handle network errors - app will use fallback/hardcoded counts
    if (error?.name !== 'AbortError' && error?.message && !error.message.includes('Network request failed') && !error.message.includes('aborted')) {
      console.error('Error fetching subcategory counts:', error);
    }
    return {};
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


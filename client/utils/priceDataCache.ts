/**
 * Shared cache for "View Price" data (multi-store comparison)
 * This allows prefetched price data to be shared between components
 */

type PriceData = {
  product: any;
  prices: any[];
  metadata?: any;
};

class PriceDataCache {
  private cache: Map<string, PriceData> = new Map();
  
  /**
   * Store price data for a product
   */
  set(productName: string, data: PriceData): void {
    this.cache.set(productName.toLowerCase().trim(), data);
  }
  
  /**
   * Get price data for a product
   */
  get(productName: string): PriceData | undefined {
    return this.cache.get(productName.toLowerCase().trim());
  }
  
  /**
   * Check if price data exists for a product
   */
  has(productName: string): boolean {
    return this.cache.has(productName.toLowerCase().trim());
  }
  
  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Remove specific product from cache
   */
  delete(productName: string): void {
    this.cache.delete(productName.toLowerCase().trim());
  }
  
  /**
   * Get cache size (for debugging)
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const priceDataCache = new PriceDataCache();

/**
 * Cache product image URL by productId when navigating to compare page.
 * Compare page can use this when API response has no image (fix: image disappearing).
 */
const productImageById: Map<string, string> = new Map();
const productImageByName: Map<string, string> = new Map();

function normalizeNameForCache(name: string): string {
  return (name || '').toLowerCase().trim();
}

export function setProductImageForCompare(productId: string, imageUrl: string): void {
  if (productId && imageUrl && imageUrl.startsWith('http')) {
    productImageById.set(String(productId), imageUrl);
  }
}

export function getProductImageForCompare(productId: string): string | undefined {
  return productId ? productImageById.get(String(productId)) : undefined;
}

/** Cache by product name so compare page can find image when API returns different product id (e.g. SerpAPI id vs DB id). */
export function setProductImageForCompareByName(productName: string, imageUrl: string): void {
  const key = normalizeNameForCache(productName);
  if (key && imageUrl && imageUrl.startsWith('http')) {
    productImageByName.set(key, imageUrl);
  }
}

export function getProductImageForCompareByName(productName: string): string | undefined {
  const key = normalizeNameForCache(productName);
  return key ? productImageByName.get(key) : undefined;
}

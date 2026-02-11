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

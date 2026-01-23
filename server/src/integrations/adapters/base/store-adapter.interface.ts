/**
 * Store Adapter Interface
 * 
 * This is the foundation for all store adapters.
 * Every store adapter (Amazon, Walmart, Target, etc.) must implement this interface.
 * 
 * Analogy: This is like a contract that all store "assistants" must follow.
 * No matter which store they work for, they all report back in the same format.
 */

import { StoreInfo, NormalizedProduct, NormalizedPrice, SearchOptions, AdapterHealth } from '../types';

/**
 * Base interface that all store adapters must implement
 * 
 * Each adapter is responsible for:
 * 1. Searching products in its specific store
 * 2. Extracting product information (name, price, availability, etc.)
 * 3. Normalizing data to a standard format
 * 4. Handling store-specific errors and retries
 */
export interface IStoreAdapter {
  /**
   * Get information about this store adapter
   * 
   * @returns Store information (name, logo, base URL, etc.)
   */
  getStoreInfo(): StoreInfo;

  /**
   * Check if this adapter is enabled and configured
   * 
   * @returns true if adapter is ready to use, false otherwise
   */
  isEnabled(): boolean;

  /**
   * Search for products in this store
   * 
   * @param query - Search query (e.g., "iPhone 15", "Samsung Galaxy S23")
   * @param options - Optional search parameters (limit, filters, etc.)
   * @returns Array of normalized products with prices
   * 
   * Example:
   * ```typescript
   * const products = await amazonAdapter.searchProducts("iPhone 15", { limit: 10 });
   * // Returns: [{ name: "iPhone 15", prices: [{ store: "Amazon", price: 799 }] }]
   * ```
   */
  searchProducts(
    query: string,
    options?: SearchOptions,
  ): Promise<NormalizedProduct[]>;

  /**
   * Get price for a specific product by barcode/UPC
   * 
   * This is more accurate than search because barcode is unique.
   * Use this when you already know the product's barcode.
   * 
   * @param barcode - Product barcode/UPC (e.g., "194253123456")
   * @returns Array of normalized prices (usually 1, but could be multiple variants)
   * 
   * Example:
   * ```typescript
   * const prices = await amazonAdapter.getProductPrice("194253123456");
   * // Returns: [{ store: "Amazon", price: 799, currency: "USD", ... }]
   * ```
   */
  getProductPrice(barcode: string): Promise<NormalizedPrice[]>;

  /**
   * Get current health status of this adapter
   * 
   * Used for monitoring and failure handling.
   * 
   * @returns Health status (healthy, degraded, down, etc.)
   */
  getHealthStatus(): AdapterHealth;

  /**
   * Test the adapter connection/configuration
   * 
   * Useful for checking if API keys are valid, scrapers are working, etc.
   * 
   * @returns true if test passes, false otherwise
   */
  testConnection(): Promise<boolean>;
}








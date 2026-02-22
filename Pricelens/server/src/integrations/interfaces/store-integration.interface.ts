/**
 * Standard interface that all store integrations must implement.
 * This ensures consistent behavior whether using mock or real APIs.
 */
export interface StoreProductResult {
  externalId: string; // Store's product ID
  name: string;
  description?: string;
  price: number;
  shippingCost?: number;
  currency: string;
  inStock: boolean;
  productUrl?: string;
  imageUrl?: string;
  brand?: string;
  barcode?: string;
}

export interface StoreIntegration {
  /**
   * Search for products in the store
   * @param query - Search term (e.g., "ceramic vase")
   * @param options - Additional filters (category, price range, etc.)
   */
  searchProducts(
    query: string,
    options?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      limit?: number;
    },
  ): Promise<StoreProductResult[]>;

  /**
   * Get specific product details by store's product ID
   * @param externalId - The store's unique product identifier
   */
  getProductById(externalId: string): Promise<StoreProductResult | null>;

  /**
   * Get the store's name (e.g., "walmart", "amazon", "target")
   */
  getStoreName(): string;
}

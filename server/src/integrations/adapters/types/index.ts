/**
 * Shared Types for Store Adapters
 * 
 * These types define the standard format that all adapters must use.
 * This ensures consistency across all stores.
 */

/**
 * Store Information
 * 
 * Basic information about a store (name, logo, website, etc.)
 */
export interface StoreInfo {
  /** Store ID (e.g., "amazon", "walmart") */
  id: string;
  
  /** Store display name (e.g., "Amazon", "Walmart") */
  name: string;
  
  /** Store slug (e.g., "amazon", "walmart") */
  slug: string;
  
  /** Store logo URL */
  logo?: string;
  
  /** Store website base URL */
  baseUrl?: string;
  
  /** Is this store currently enabled? */
  enabled: boolean;
  
  /** Store type (e.g., "api", "scraping", "affiliate") */
  type: 'api' | 'scraping' | 'affiliate' | 'hybrid';
}

/**
 * Normalized Product
 * 
 * This is the standard format for products across all stores.
 * All adapters must convert their store-specific format to this format.
 */
export interface NormalizedProduct {
  /** Product name (e.g., "Apple iPhone 15 128GB") */
  name: string;
  
  /** Product barcode/UPC (if available) - CRITICAL for matching */
  barcode?: string;
  
  /** Manufacturer Part Number (if available) */
  mpn?: string;
  
  /** Product model number (e.g., "SM-S911B") */
  model?: string;
  
  /** Product brand (e.g., "Apple", "Samsung") */
  brand?: string;
  
  /** Product description */
  description?: string;
  
  /** Product image URL */
  image?: string;
  
  /** Array of product images (multiple angles/views) */
  images?: string[];
  
  /** Prices from this store (usually 1, but could be multiple variants) */
  prices: NormalizedPrice[];
  
  /** Product URL on this store */
  url?: string;
  
  /** Category (e.g., "Electronics", "Groceries") */
  category?: string;
  
  /** Subcategory (e.g., "Smartphones", "Produce") */
  subcategory?: string;
  
  /** When was this data fetched? */
  fetchedAt: Date;
  
  /** Source of this data (e.g., "amazon-api", "walmart-scraper") */
  source: string;
}

/**
 * Normalized Price
 * 
 * This is the standard format for prices across all stores.
 * All adapters must convert their store-specific price format to this format.
 */
export interface NormalizedPrice {
  /** Store name (e.g., "Amazon", "Walmart") */
  store: string;
  
  /** Store ID (e.g., "amazon", "walmart") */
  storeId: string;
  
  /** Price amount (e.g., 799.99) */
  price: number;
  
  /** Currency code (e.g., "USD", "EUR") */
  currency: string;
  
  /** Formatted price string (e.g., "$799.99") */
  formattedPrice?: string;
  
  /** Is product in stock? */
  inStock: boolean;
  
  /** Stock quantity (if available) */
  stockQuantity?: number;
  
  /** Shipping cost */
  shippingCost?: number;
  
  /** Total price (price + shipping) */
  totalPrice?: number;
  
  /** Product URL on this store */
  url: string;
  
  /** Product image URL (store-specific) */
  image?: string;
  
  /** Is this a sale/discount price? */
  onSale?: boolean;
  
  /** Original price (if on sale) */
  originalPrice?: number;
  
  /** Sale percentage (if on sale) */
  salePercentage?: number;
  
  /** When was this price fetched? */
  fetchedAt: Date;
  
  /** Additional metadata (store-specific) */
  metadata?: Record<string, any>;
}

/**
 * Search Options
 * 
 * Options for product search
 */
export interface SearchOptions {
  /** Maximum number of results to return */
  limit?: number;
  
  /** Minimum price filter */
  minPrice?: number;
  
  /** Maximum price filter */
  maxPrice?: number;
  
  /** Category filter */
  category?: string;
  
  /** Brand filter */
  brand?: string;
  
  /** Additional store-specific options */
  storeSpecific?: Record<string, any>;
}

/**
 * Adapter Health Status
 * 
 * Used for monitoring and failure handling
 */
export interface AdapterHealth {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  
  /** Is adapter currently working? */
  isHealthy: boolean;
  
  /** Last successful request timestamp */
  lastSuccess?: Date;
  
  /** Last failure timestamp */
  lastFailure?: Date;
  
  /** Number of consecutive failures */
  consecutiveFailures: number;
  
  /** Error message (if unhealthy) */
  errorMessage?: string;
  
  /** Response time in milliseconds (if available) */
  averageResponseTime?: number;
  
  /** When was this health check performed? */
  checkedAt: Date;
}

/**
 * Adapter Error
 * 
 * Standardized error format for adapter failures
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly storeId: string,
    public readonly storeName: string,
    public readonly errorType: 'network' | 'auth' | 'rate_limit' | 'parse' | 'unknown',
    public readonly retryable: boolean = false,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

/**
 * Search Result
 * 
 * Result of a product search operation
 */
export interface SearchResult {
  /** Products found */
  products: NormalizedProduct[];
  
  /** Total number of results (if available) */
  totalResults?: number;
  
  /** Search query used */
  query: string;
  
  /** Store that was searched */
  store: StoreInfo;
  
  /** Time taken to search (milliseconds) */
  searchTime?: number;
  
  /** Any warnings or errors */
  warnings?: string[];
  errors?: string[];
}








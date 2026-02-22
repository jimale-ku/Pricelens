/**
 * Abstract Base Store Adapter
 * 
 * Provides common functionality that all store adapters can use.
 * Reduces code duplication across adapters.
 * 
 * Analogy: This is like a base class that provides common tools
 * that all store "assistants" can use (error handling, logging, etc.)
 */

import { Injectable, Logger } from '@nestjs/common';
import { IStoreAdapter } from './store-adapter.interface';
import type {
  StoreInfo,
  NormalizedProduct,
  NormalizedPrice,
  SearchOptions,
  AdapterHealth,
} from '../types';
import { AdapterError } from '../types';

/**
 * Abstract base class for all store adapters
 * 
 * Provides:
 * - Common error handling
 * - Health status tracking
 * - Logging
 * - Retry logic helpers
 */
@Injectable()
export abstract class AbstractStoreAdapter implements IStoreAdapter {
  protected readonly logger: Logger;
  protected healthStatus: AdapterHealth;
  protected consecutiveFailures = 0;
  protected lastSuccess?: Date;
  protected lastFailure?: Date;

  constructor(protected readonly storeInfo: StoreInfo) {
    this.logger = new Logger(`${this.constructor.name}`);
    this.healthStatus = {
      status: 'unknown',
      isHealthy: false,
      consecutiveFailures: 0,
      checkedAt: new Date(),
    };
  }

  /**
   * Get store information
   */
  getStoreInfo(): StoreInfo {
    return this.storeInfo;
  }

  /**
   * Check if adapter is enabled
   * Override this in subclasses to check API keys, configuration, etc.
   */
  abstract isEnabled(): boolean;

  /**
   * Search for products
   * Must be implemented by each adapter
   */
  abstract searchProducts(
    query: string,
    options?: SearchOptions,
  ): Promise<NormalizedProduct[]>;

  /**
   * Get product price by barcode
   * Must be implemented by each adapter
   */
  abstract getProductPrice(barcode: string): Promise<NormalizedPrice[]>;

  /**
   * Test connection
   * Override in subclasses to test API keys, scrapers, etc.
   */
  async testConnection(): Promise<boolean> {
    try {
      // Default: try a simple search
      await this.searchProducts('test', { limit: 1 });
      return true;
    } catch (error) {
      this.logger.error(`Connection test failed for ${this.storeInfo.name}:`, error);
      return false;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): AdapterHealth {
    return {
      ...this.healthStatus,
      lastSuccess: this.lastSuccess,
      lastFailure: this.lastFailure,
      consecutiveFailures: this.consecutiveFailures,
      checkedAt: new Date(),
    };
  }

  /**
   * Record successful operation
   * Call this after successful API calls
   */
  protected recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.lastSuccess = new Date();
    this.healthStatus = {
      status: 'healthy',
      isHealthy: true,
      consecutiveFailures: 0,
      checkedAt: new Date(),
    };
  }

  /**
   * Record failed operation
   * Call this after failed API calls
   */
  protected recordFailure(error: Error, retryable: boolean = false): void {
    this.consecutiveFailures++;
    this.lastFailure = new Date();

    // Determine health status based on failures
    let status: AdapterHealth['status'] = 'degraded';
    if (this.consecutiveFailures >= 5) {
      status = 'down';
    }

    this.healthStatus = {
      status,
      isHealthy: false, // If we're recording a failure, it's not healthy
      consecutiveFailures: this.consecutiveFailures,
      errorMessage: error.message,
      checkedAt: new Date(),
    };

    this.logger.warn(
      `${this.storeInfo.name} adapter failure #${this.consecutiveFailures}: ${error.message}`,
    );
  }

  /**
   * Retry helper with exponential backoff
   * 
   * @param operation - Function to retry
   * @param maxRetries - Maximum number of retries (default: 3)
   * @param initialDelay - Initial delay in ms (default: 1000)
   * @returns Result of operation
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.recordSuccess();
        return result;
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors (auth, invalid request, etc.)
        if (error instanceof AdapterError && !error.retryable) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          this.recordFailure(error, true);
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        this.logger.warn(
          `${this.storeInfo.name} adapter retry ${attempt + 1}/${maxRetries} after ${delay}ms`,
        );

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Sleep helper
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Normalize price to standard format
   * Helper method for adapters to use
   */
  protected normalizePrice(
    price: number,
    currency: string = 'USD',
  ): {
    price: number;
    currency: string;
    formattedPrice: string;
  } {
    return {
      price,
      currency,
      formattedPrice: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(price),
    };
  }

  /**
   * Extract barcode from product data
   * Helper method - different stores return barcodes in different formats
   */
  protected extractBarcode(productData: any): string | undefined {
    // Try common barcode field names
    return (
      productData.barcode ||
      productData.upc ||
      productData.ean ||
      productData.gtin ||
      productData.sku?.match(/^\d{8,14}$/)?.[0] // SKU might be barcode
    );
  }

  /**
   * Validate normalized product
   * Ensures product data is valid before returning
   */
  protected validateProduct(product: NormalizedProduct): boolean {
    if (!product.name || product.name.trim().length === 0) {
      this.logger.warn(`Invalid product: missing name`);
      return false;
    }

    if (!product.prices || product.prices.length === 0) {
      this.logger.warn(`Invalid product: ${product.name} has no prices`);
      return false;
    }

    // Validate prices
    for (const price of product.prices) {
      if (!price.price || price.price <= 0) {
        this.logger.warn(`Invalid price for ${product.name}: ${price.price}`);
        return false;
      }

      if (!price.store || !price.storeId) {
        this.logger.warn(`Invalid price for ${product.name}: missing store info`);
        return false;
      }
    }

    return true;
  }
}





import { Injectable, Logger } from '@nestjs/common';
import {
  StoreIntegration,
  StoreProductResult,
} from '../interfaces/store-integration.interface';

/**
 * Mock Walmart integration service.
 * Simulates Walmart API responses with realistic product data.
 * 
 * WHY MOCK?
 * - No API keys required for development
 * - Instant responses (no network delay)
 * - Predictable data for testing
 * - Easy to swap with real WalmartIntegration later
 */
@Injectable()
export class WalmartMockIntegration implements StoreIntegration {
  private readonly logger = new Logger(WalmartMockIntegration.name);

  /**
   * Mock product database - simulates Walmart's catalog.
   * In production, this would be replaced with real API calls.
   */
  private readonly mockProducts: StoreProductResult[] = [
    // Home Decor
    {
      externalId: 'WM-VASE-001',
      name: 'Modern White Ceramic Vase',
      description: 'Elegant minimalist ceramic vase, perfect for fresh or dried flowers. 8 inch height.',
      price: 24.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/modern-ceramic-vase/123456',
      imageUrl: 'https://picsum.photos/seed/walmart-vase1/400/400',
      brand: 'Better Homes & Gardens',
      barcode: '123456789001',
    },
    {
      externalId: 'WM-MIRROR-001',
      name: 'Round Gold-Framed Wall Mirror 24"',
      description: 'Decorative round mirror with brushed gold metal frame. Adds elegance to any room.',
      price: 89.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/gold-wall-mirror/234567',
      imageUrl: 'https://picsum.photos/seed/walmart-mirror1/400/400',
      brand: 'Mainstays',
      barcode: '123456789002',
    },
    {
      externalId: 'WM-CANDLE-001',
      name: 'Scented Candle Set - Vanilla & Lavender',
      description: '3-pack of aromatic candles with 40-hour burn time each. Relaxing home fragrance.',
      price: 15.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/scented-candle-set/345678',
      imageUrl: 'https://picsum.photos/seed/walmart-candle1/400/400',
      brand: 'Mainstays',
    },

    // Electronics
    {
      externalId: 'WM-HEAD-001',
      name: 'Wireless Bluetooth Headphones with ANC',
      description: 'Over-ear noise-cancelling headphones. 30-hour battery life, premium sound quality.',
      price: 149.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/wireless-headphones/456789',
      imageUrl: 'https://picsum.photos/seed/walmart-headphones1/400/400',
      brand: 'onn.',
      barcode: '123456789003',
    },
    {
      externalId: 'WM-CHRG-001',
      name: 'USB-C Fast Charger 65W Dual Port',
      description: 'Universal fast charger with 2 USB-C ports. Compatible with laptops, phones, tablets.',
      price: 34.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/usb-c-charger/567890',
      imageUrl: 'https://picsum.photos/seed/walmart-charger1/400/400',
      brand: 'onn.',
      barcode: '123456789004',
    },
    {
      externalId: 'WM-CABLE-001',
      name: 'Braided USB-C Cable 6ft',
      description: 'Durable braided charging cable, supports fast charging up to 100W.',
      price: 12.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/usb-c-cable/678901',
      imageUrl: 'https://picsum.photos/seed/walmart-cable1/400/400',
      brand: 'onn.',
    },

    // Groceries
    {
      externalId: 'WM-HONEY-001',
      name: 'Pure Organic Wildflower Honey 32oz',
      description: 'Raw organic honey from wildflowers. No additives, 100% pure and natural.',
      price: 18.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/organic-honey/789012',
      imageUrl: 'https://picsum.photos/seed/walmart-honey1/400/400',
      brand: 'Great Value Organic',
      barcode: '123456789005',
    },
    {
      externalId: 'WM-OIL-001',
      name: 'Extra Virgin Olive Oil 1L - Italian',
      description: 'Cold-pressed extra virgin olive oil from Italy. Perfect for cooking and salads.',
      price: 12.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/olive-oil/890123',
      imageUrl: 'https://picsum.photos/seed/walmart-oil1/400/400',
      brand: 'Great Value',
      barcode: '123456789006',
    },
    {
      externalId: 'WM-PASTA-001',
      name: 'Organic Whole Wheat Pasta 1lb',
      description: 'Healthy whole wheat penne pasta. High in fiber and protein.',
      price: 3.49,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.walmart.com/ip/organic-pasta/901234',
      imageUrl: 'https://picsum.photos/seed/walmart-pasta1/400/400',
      brand: 'Great Value Organic',
    },
  ];

  getStoreName(): string {
    return 'walmart';
  }

  /**
   * Search products by query string.
   * Simulates Walmart API search with fuzzy matching on name, description, brand.
   */
  async searchProducts(
    query: string,
    options?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      limit?: number;
    },
  ): Promise<StoreProductResult[]> {
    this.logger.log(`Searching Walmart for: "${query}"`);

    // Simulate API delay (50-150ms like real API)
    await this.simulateApiDelay();

    // Fuzzy search: case-insensitive match on name, description, brand
    const searchTerm = query.toLowerCase();
    let results = this.mockProducts.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.barcode === query;

      // Apply price filters if provided
      const matchesMinPrice = options?.minPrice
        ? product.price >= options.minPrice
        : true;
      const matchesMaxPrice = options?.maxPrice
        ? product.price <= options.maxPrice
        : true;

      return matchesQuery && matchesMinPrice && matchesMaxPrice;
    });

    // Apply limit
    const limit = options?.limit || 20;
    results = results.slice(0, limit);

    this.logger.log(`Found ${results.length} Walmart products for "${query}"`);
    return results;
  }

  /**
   * Get product by Walmart's external ID.
   */
  async getProductById(externalId: string): Promise<StoreProductResult | null> {
    this.logger.log(`Fetching Walmart product: ${externalId}`);
    
    await this.simulateApiDelay();

    const product = this.mockProducts.find((p) => p.externalId === externalId);
    
    if (product) {
      this.logger.log(`Found Walmart product: ${product.name}`);
    } else {
      this.logger.warn(`Walmart product not found: ${externalId}`);
    }

    return product || null;
  }

  /**
   * Simulates network delay of real API (50-150ms).
   * Remove this in production WalmartIntegration.
   */
  private simulateApiDelay(): Promise<void> {
    const delay = Math.random() * 100 + 50; // 50-150ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

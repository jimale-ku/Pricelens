import { Injectable, Logger } from '@nestjs/common';
import {
  StoreIntegration,
  StoreProductResult,
} from '../interfaces/store-integration.interface';

/**
 * Mock Target integration service.
 * Simulates Target's RedCircle API responses.
 * 
 * WHY TARGET?
 * - Often has mid-range pricing (between Walmart and specialty stores)
 * - Strong in home decor and groceries
 * - Completes the "big 3" retailers for price comparison
 */
@Injectable()
export class TargetMockIntegration implements StoreIntegration {
  private readonly logger = new Logger(TargetMockIntegration.name);

  /**
   * Mock Target catalog - focusing on home and grocery strength.
   */
  private readonly mockProducts: StoreProductResult[] = [
    // Home Decor - Target's strength
    {
      externalId: 'TGT-VASE-001',
      name: 'Modern Ceramic Vase - White',
      description: 'Contemporary design ceramic vase. Matte finish, perfect for modern homes. 8"H.',
      price: 26.99, // Slightly higher than Walmart/Amazon - premium positioning
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/modern-vase/-/A-12345',
      imageUrl: 'https://picsum.photos/seed/target-vase1/400/400',
      brand: 'Project 62',
      barcode: '123456789001',
    },
    {
      externalId: 'TGT-MIRROR-001',
      name: 'Round Gold Wall Mirror 24"',
      description: 'Elegant round mirror with brushed gold frame. Premium quality, ready to hang.',
      price: 92.50, // Highest price - Target positions as premium
      shippingCost: 0,
      currency: 'USD',
      inStock: false, // Out of stock - shows realistic scenario
      productUrl: 'https://www.target.com/p/gold-mirror/-/A-23456',
      imageUrl: 'https://picsum.photos/seed/target-mirror1/400/400',
      brand: 'Threshold',
      barcode: '123456789002',
    },
    {
      externalId: 'TGT-CANDLE-001',
      name: 'Scented Candle Collection - Lavender Vanilla',
      description: 'Premium candle set with essential oils. 3-pack, 50+ hours burn time.',
      price: 24.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/candle-set/-/A-34567',
      imageUrl: 'https://picsum.photos/seed/target-candle1/400/400',
      brand: 'Threshold',
    },
    {
      externalId: 'TGT-PILLOW-001',
      name: 'Decorative Throw Pillow - Geometric Pattern',
      description: 'Modern geometric throw pillow. Soft velvet fabric, removable cover. 18x18".',
      price: 19.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/throw-pillow/-/A-45678',
      imageUrl: 'https://picsum.photos/seed/target-pillow1/400/400',
      brand: 'Project 62',
    },

    // Electronics
    {
      externalId: 'TGT-HEAD-001',
      name: 'Wireless Noise-Cancelling Headphones',
      description: 'Over-ear Bluetooth headphones with ANC. 30-hour battery, premium audio.',
      price: 154.99, // Highest price on electronics
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/headphones/-/A-56789',
      imageUrl: 'https://picsum.photos/seed/target-headphones1/400/400',
      brand: 'heyday',
      barcode: '123456789003',
    },
    {
      externalId: 'TGT-CHRG-001',
      name: 'USB-C Fast Charger 65W - 2 Port',
      description: 'Dual-port fast charger. Charges laptops and phones simultaneously.',
      price: 32.50, // Mid-range pricing
      shippingCost: 5.99, // Shipping cost - not always free like competitors
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/usb-charger/-/A-67890',
      imageUrl: 'https://picsum.photos/seed/target-charger1/400/400',
      brand: 'heyday',
      barcode: '123456789004',
    },
    {
      externalId: 'TGT-EARBUDS-001',
      name: 'True Wireless Earbuds - Bluetooth 5.0',
      description: 'Compact wireless earbuds with charging case. 24hr total playtime.',
      price: 29.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/wireless-earbuds/-/A-78901',
      imageUrl: 'https://picsum.photos/seed/target-earbuds1/400/400',
      brand: 'heyday',
    },

    // Groceries - Target's Good & Gather brand
    {
      externalId: 'TGT-HONEY-001',
      name: 'Organic Wildflower Honey 32oz',
      description: 'Pure organic honey from wildflowers. USDA organic certified.',
      price: 19.50, // Highest price on honey - premium organic
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/organic-honey/-/A-89012',
      imageUrl: 'https://picsum.photos/seed/target-honey1/400/400',
      brand: 'Good & Gather',
      barcode: '123456789005',
    },
    {
      externalId: 'TGT-OIL-001',
      name: 'Extra Virgin Olive Oil 1L - Italian Import',
      description: 'Premium Italian extra virgin olive oil. First cold press, robust flavor.',
      price: 13.99, // Mid-range
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/olive-oil/-/A-90123',
      imageUrl: 'https://picsum.photos/seed/target-oil1/400/400',
      brand: 'Good & Gather',
      barcode: '123456789006',
    },
    {
      externalId: 'TGT-PASTA-001',
      name: 'Organic Whole Wheat Pasta 1lb',
      description: 'Wholesome organic penne pasta. High fiber and protein.',
      price: 2.99, // Competitive grocery pricing
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/whole-wheat-pasta/-/A-01234',
      imageUrl: 'https://picsum.photos/seed/target-pasta1/400/400',
      brand: 'Good & Gather',
    },
    {
      externalId: 'TGT-GRANOLA-001',
      name: 'Organic Granola - Honey Almond 12oz',
      description: 'Crunchy organic granola with honey and almonds. Perfect for breakfast.',
      price: 5.49,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.target.com/p/organic-granola/-/A-11234',
      imageUrl: 'https://picsum.photos/seed/target-granola1/400/400',
      brand: 'Good & Gather',
    },
  ];

  getStoreName(): string {
    return 'target';
  }

  async searchProducts(
    query: string,
    options?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      limit?: number;
    },
  ): Promise<StoreProductResult[]> {
    this.logger.log(`Searching Target for: "${query}"`);

    // Simulate API delay (Target API typically 80-120ms)
    await this.simulateApiDelay();

    const searchTerm = query.toLowerCase();
    let results = this.mockProducts.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.barcode === query;

      const matchesMinPrice = options?.minPrice
        ? product.price >= options.minPrice
        : true;
      const matchesMaxPrice = options?.maxPrice
        ? product.price <= options.maxPrice
        : true;

      return matchesQuery && matchesMinPrice && matchesMaxPrice;
    });

    const limit = options?.limit || 20;
    results = results.slice(0, limit);

    this.logger.log(`Found ${results.length} Target products for "${query}"`);
    return results;
  }

  async getProductById(externalId: string): Promise<StoreProductResult | null> {
    this.logger.log(`Fetching Target product: ${externalId}`);
    
    await this.simulateApiDelay();

    const product = this.mockProducts.find((p) => p.externalId === externalId);
    
    if (product) {
      this.logger.log(`Found Target product: ${product.name}`);
    } else {
      this.logger.warn(`Target product not found: ${externalId}`);
    }

    return product || null;
  }

  /**
   * Target API typically responds in 80-120ms.
   */
  private simulateApiDelay(): Promise<void> {
    const delay = Math.random() * 40 + 80; // 80-120ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

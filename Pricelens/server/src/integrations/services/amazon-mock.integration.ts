import { Injectable, Logger } from '@nestjs/common';
import {
  StoreIntegration,
  StoreProductResult,
} from '../interfaces/store-integration.interface';

/**
 * Mock Amazon integration service.
 * Simulates Amazon Product Advertising API responses.
 * 
 * WHY DIFFERENT PRICES?
 * - Amazon typically has competitive pricing (often lowest)
 * - Different inventory from Walmart
 * - Shows realistic price comparison in frontend
 */
@Injectable()
export class AmazonMockIntegration implements StoreIntegration {
  private readonly logger = new Logger(AmazonMockIntegration.name);

  /**
   * Mock Amazon catalog - similar products, different prices.
   */
  private readonly mockProducts: StoreProductResult[] = [
    // Home Decor
    {
      externalId: 'AMZ-VASE-001',
      name: 'Modern White Ceramic Vase',
      description: 'Contemporary ceramic vase with matte white finish. Perfect for flowers or as standalone decor. 8 inch.',
      price: 22.50, // $2.49 cheaper than Walmart
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08VASE001',
      imageUrl: 'https://picsum.photos/seed/amazon-vase1/400/400',
      brand: 'Amazon Basics',
      barcode: '123456789001',
    },
    {
      externalId: 'AMZ-MIRROR-001',
      name: 'Round Gold Wall Mirror 24 inch',
      description: 'Decorative wall mirror with gold metal frame. Modern design, easy to hang.',
      price: 84.95, // $5.04 cheaper than Walmart
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08MIRROR1',
      imageUrl: 'https://picsum.photos/seed/amazon-mirror1/400/400',
      brand: 'Rivet Modern',
      barcode: '123456789002',
    },
    {
      externalId: 'AMZ-CANDLE-001',
      name: 'Aromatherapy Candle Gift Set - Lavender & Vanilla',
      description: 'Premium scented candles made with natural soy wax. 3-pack with 45+ hours total burn time.',
      price: 18.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08CANDLE1',
      imageUrl: 'https://picsum.photos/seed/amazon-candle1/400/400',
      brand: 'Yankee Candle',
    },

    // Electronics
    {
      externalId: 'AMZ-HEAD-001',
      name: 'Wireless Bluetooth Headphones - Noise Cancelling',
      description: 'Premium over-ear headphones with active noise cancellation. 30hr playtime, deep bass.',
      price: 139.99, // $10 cheaper than Walmart - Amazon wins on tech
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08HEADPH1',
      imageUrl: 'https://picsum.photos/seed/amazon-headphones1/400/400',
      brand: 'Sony',
      barcode: '123456789003',
    },
    {
      externalId: 'AMZ-CHRG-001',
      name: 'USB-C Fast Charger 65W - Dual Port',
      description: 'GaN technology fast charger. Charge 2 devices simultaneously. Compact design.',
      price: 29.99, // $5 cheaper than Walmart
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08CHARGE1',
      imageUrl: 'https://picsum.photos/seed/amazon-charger1/400/400',
      brand: 'Anker',
      barcode: '123456789004',
    },
    {
      externalId: 'AMZ-CABLE-001',
      name: 'USB-C Braided Cable 6ft - Fast Charging',
      description: 'Durable braided USB-C cable. 100W power delivery, 10000+ bend lifespan.',
      price: 11.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08CABLE01',
      imageUrl: 'https://picsum.photos/seed/amazon-cable1/400/400',
      brand: 'Anker',
    },
    {
      externalId: 'AMZ-SPEAKER-001',
      name: 'Bluetooth Speaker - Waterproof Portable',
      description: 'Compact wireless speaker with 360° sound. IPX7 waterproof, 12hr battery.',
      price: 39.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08SPEAKER',
      imageUrl: 'https://picsum.photos/seed/amazon-speaker1/400/400',
      brand: 'JBL',
    },

    // Groceries
    {
      externalId: 'AMZ-HONEY-001',
      name: 'Organic Raw Wildflower Honey 32oz',
      description: 'USDA certified organic honey. Unfiltered, unpasteurized, no additives.',
      price: 16.75, // $2.24 cheaper than Walmart
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08HONEY01',
      imageUrl: 'https://picsum.photos/seed/amazon-honey1/400/400',
      brand: "Nature Nate's",
      barcode: '123456789005',
    },
    {
      externalId: 'AMZ-OIL-001',
      name: 'Extra Virgin Olive Oil 1L - Cold Pressed Italian',
      description: 'Premium Italian EVOO. First cold press, rich flavor, perfect for cooking.',
      price: 11.50, // $1.49 cheaper than Walmart
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08OLIVEOIL',
      imageUrl: 'https://picsum.photos/seed/amazon-oil1/400/400',
      brand: 'Colavita',
      barcode: '123456789006',
    },
    {
      externalId: 'AMZ-PASTA-001',
      name: 'Organic Whole Wheat Pasta - Penne 1lb',
      description: 'Wholesome organic pasta. High protein, high fiber, authentic Italian taste.',
      price: 3.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08PASTA01',
      imageUrl: 'https://picsum.photos/seed/amazon-pasta1/400/400',
      brand: 'Bionaturae',
    },
    {
      externalId: 'AMZ-COFFEE-001',
      name: 'Organic Ground Coffee - Medium Roast 12oz',
      description: 'Fair trade organic coffee. Smooth medium roast, rich aroma.',
      price: 9.99,
      shippingCost: 0,
      currency: 'USD',
      inStock: true,
      productUrl: 'https://www.amazon.com/dp/B08COFFEE1',
      imageUrl: 'https://picsum.photos/seed/amazon-coffee1/400/400',
      brand: 'Amazon Fresh',
    },
  ];

  getStoreName(): string {
    return 'amazon';
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
    this.logger.log(`Searching Amazon for: "${query}"`);

    // Simulate API delay (Amazon API is typically 100-200ms)
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

    this.logger.log(`Found ${results.length} Amazon products for "${query}"`);
    return results;
  }

  async getProductById(externalId: string): Promise<StoreProductResult | null> {
    this.logger.log(`Fetching Amazon product: ${externalId}`);
    
    await this.simulateApiDelay();

    const product = this.mockProducts.find((p) => p.externalId === externalId);
    
    if (product) {
      this.logger.log(`Found Amazon product: ${product.name}`);
    } else {
      this.logger.warn(`Amazon product not found: ${externalId}`);
    }

    return product || null;
  }

  /**
   * Amazon API typically responds in 100-200ms.
   */
  private simulateApiDelay(): Promise<void> {
    const delay = Math.random() * 100 + 100; // 100-200ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

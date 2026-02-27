import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Barcode Lookup API (barcodelookup.com) – no Google.
 * Returns product info + retail pricing by UPC/EAN/ISBN.
 * Set BARCODE_LOOKUP_API_KEY in .env to enable.
 */

export interface StorePrice {
  store: string;
  price: number;
  currency: string;
  url: string;
  inStock: boolean;
  image?: string;
}

@Injectable()
export class BarcodeLookupService {
  private readonly logger = new Logger(BarcodeLookupService.name);
  private readonly apiKey: string;
  private readonly enabled: boolean;
  private readonly baseUrl = 'https://api.barcodelookup.com/v3/products';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('BARCODE_LOOKUP_API_KEY', '');
    this.enabled = !!this.apiKey?.trim();
    if (!this.enabled) {
      this.logger.debug('Barcode Lookup API not configured (BARCODE_LOOKUP_API_KEY).');
    } else {
      this.logger.log('✅ Barcode Lookup API enabled (barcodelookup.com – no Google).');
    }
  }

  /**
   * Get prices for a product by barcode. Returns [] if disabled, no key, or no prices.
   */
  async getPricesByBarcode(
    barcode: string,
    _options?: { country?: string },
  ): Promise<StorePrice[]> {
    if (!this.enabled || !barcode?.trim()) return [];

    const clean = String(barcode).replace(/\D/g, '');
    if (clean.length < 8 || clean.length > 14) return [];

    try {
      const url = `${this.baseUrl}?barcode=${encodeURIComponent(clean)}&key=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        this.logger.warn(`Barcode Lookup failed ${res.status} for barcode ${clean}`);
        return [];
      }
      const data = await res.json();
      return this.mapResponseToStorePrices(data, clean);
    } catch (e: any) {
      this.logger.warn(`Barcode Lookup error for ${clean}: ${e?.message}`);
      return [];
    }
  }

  private mapResponseToStorePrices(data: any, barcode: string): StorePrice[] {
    const products = data?.products;
    if (!Array.isArray(products) || products.length === 0) return [];

    const out: StorePrice[] = [];
    const product = products[0];

    // Multiple stores: products[0].stores[] or .retailers[] or .offers[]
    const stores = product.stores ?? product.retailers ?? product.offers ?? [];
    if (Array.isArray(stores)) {
      for (const s of stores) {
        const storeName = s.store_name ?? s.store ?? s.retailer ?? s.name ?? 'Store';
        const price = parseFloat(s.price ?? s.retail_price ?? s.current_price ?? 0);
        if (price > 0) {
          out.push({
            store: storeName,
            price,
            currency: s.currency ?? 'USD',
            url: s.url ?? s.link ?? '',
            inStock: s.in_stock !== false,
            image: product.images?.[0] ?? product.image,
          });
        }
      }
    }

    // Single retail price: product.retail_price or .price
    if (out.length === 0) {
      const price = parseFloat(product.retail_price ?? product.price ?? 0);
      if (price > 0) {
        out.push({
          store: product.store_name ?? product.store ?? 'Retail',
          price,
          currency: product.currency ?? 'USD',
          url: product.url ?? product.link ?? '',
          inStock: true,
          image: product.images?.[0] ?? product.image,
        });
      }
    }

    return out;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

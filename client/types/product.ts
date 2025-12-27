/**
 * Product Type Definitions
 */

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  image: string;
  tag?: string; // e.g., 'produce', 'dairy', 'meat'
  prices: ProductPrice[];
}

export interface ProductPrice {
  storeId: string;
  storeName: string;
  price: number;
  currency: string;
  originalPrice?: number;
  discount?: number;
  shippingInfo?: string;
  availability: 'in-stock' | 'out-of-stock' | 'limited' | 'online-only' | 'in-store-only';
  url?: string;
  lastUpdated: Date;
}

export interface PriceComparison {
  product: Product;
  bestPrice: ProductPrice;
  averagePrice: number;
  maxSavings: number;
}

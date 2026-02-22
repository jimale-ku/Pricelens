/**
 * Walmart Open API Types
 * 
 * Types specific to Walmart's API responses
 * 
 * Documentation: https://developer.walmart.com/api/us/mp
 */

/**
 * Walmart API Configuration
 */
export interface WalmartConfig {
  /** API Key (Primary Key) */
  apiKey: string;
  
  /** Partner ID (optional, for affiliate links) */
  partnerId?: string;
}

/**
 * Walmart API Search Response
 */
export interface WalmartSearchResponse {
  query: string;
  sort: string;
  responseGroup: string;
  totalResults: number;
  start: number;
  numItems: number;
  items: WalmartItem[];
}

/**
 * Walmart Product Item
 */
export interface WalmartItem {
  itemId: number;
  parentItemId?: number;
  name: string;
  msrp?: number;
  salePrice: number;
  upc?: string;
  categoryPath: string;
  categoryNode: string;
  shortDescription?: string;
  longDescription?: string;
  brandName?: string;
  thumbnailImage: string;
  mediumImage: string;
  largeImage: string;
  productTrackingUrl: string;
  productUrl: string;
  customerRating?: string;
  numReviews?: number;
  customerRatingImage?: string;
  freeShippingOver35Dollars?: boolean;
  marketplace?: boolean;
  shipToStore?: boolean;
  standardShipRate?: number;
  twoThreeDayShippingRate?: number;
  availableOnline: boolean;
  stock?: string;
  addToCartUrl?: string;
  affiliateAddToCartUrl?: string;
  freeShippingOver50Dollars?: boolean;
  maxItemsInOrder?: number;
  giftOptions?: {
    allowGiftWrap: boolean;
    allowGiftMessage: boolean;
    allowGiftReceipt: boolean;
  };
  imageEntities?: Array<{
    thumbnailImage: string;
    mediumImage: string;
    largeImage: string;
    entityType: string;
  }>;
  offerType?: string;
  isTwoDayShippingEligible?: boolean;
}




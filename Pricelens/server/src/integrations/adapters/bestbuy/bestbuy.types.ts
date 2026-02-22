/**
 * Best Buy Store API Types
 * 
 * Types specific to Best Buy's API responses
 * 
 * Documentation: https://developer.bestbuy.com/
 */

/**
 * Best Buy API Configuration
 */
export interface BestBuyConfig {
  /** API Key */
  apiKey: string;
}

/**
 * Best Buy API Search Response
 */
export interface BestBuySearchResponse {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  queryTime: string;
  totalTime: string;
  partial: boolean;
  canonicalUrl: string;
  products: BestBuyProduct[];
}

/**
 * Best Buy Product
 */
export interface BestBuyProduct {
  sku: number;
  name: string;
  type: string;
  startDate: string;
  new: boolean;
  active: boolean;
  lowPriceGuarantee: boolean;
  activeUpdateDate: string;
  regularPrice: number;
  salePrice?: number;
  onSale: boolean;
  planPrice?: number;
  priceWithPlan?: Array<{
    plan: {
      planId: string;
      planName: string;
      planType: string;
    };
    price: {
      currentPrice: number;
      regularPrice: number;
    };
  }>;
  percentSavings: string;
  dollarSavings: number;
  shortDescription: string;
  longDescription?: string;
  techSpecs?: Array<{
    name: string;
    value: string;
  }>;
  modelNumber: string;
  manufacturer: string;
  image: string;
  largeImage?: string;
  mediumImage?: string;
  thumbnail?: string;
  largeFrontImage?: string;
  mediumFrontImage?: string;
  thumbnailFrontImage?: string;
  largeBackImage?: string;
  mediumBackImage?: string;
  thumbnailBackImage?: string;
  alternateViewsImage?: string[];
  angleImage?: string;
  backViewImage?: string;
  energyGuideImage?: string;
  leftViewImage?: string;
  rightViewImage?: string;
  topViewImage?: string;
  url: string;
  onlineAvailability: boolean;
  onlineAvailabilityText: string;
  inStoreAvailability: boolean;
  inStoreAvailabilityText: string;
  releaseDate?: string;
  preowned: boolean;
  carrierPlans?: any;
  marketplace: boolean;
  shippingCost?: number;
  shipping?: {
    ground?: number;
    secondDay?: number;
    nextDay?: number;
    vendorDelivery?: string;
  };
  details?: Array<{
    name: string;
    value: string;
  }>;
  includedItemList?: Array<{
    includedItem: string;
  }>;
  features?: Array<{
    feature: string;
  }>;
  condition?: string;
  customerReviewAverage?: number;
  customerReviewCount?: number;
  customerTopRated?: boolean;
  format?: string;
  freeShipping?: boolean;
  freeShippingForRewardsMembers?: boolean;
  inStorePickup?: boolean;
  isTwoDayShippingEligible?: boolean;
  isOneDayShippingEligible?: boolean;
  marketplaceSeller?: {
    name: string;
    averageRating: number;
    totalRatings: number;
  };
  mobileUrl?: string;
  orderable?: string;
  plot?: string;
  preOrderable?: boolean;
  reviews?: Array<{
    id: string;
    rating: number;
    reviewText: string;
    submissionTime: string;
    title: string;
    user: string;
  }>;
  saleable?: string;
  shippingLevelsOfService?: Array<{
    serviceLevelId: number;
    serviceLevelName: string;
    unitShippingPrice: number;
  }>;
  specialOrder?: boolean;
  upc?: string;
  tradeIn?: {
    eligible: boolean;
    credit: number;
  };
}







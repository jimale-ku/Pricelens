/**
 * eBay Browse API Types
 * 
 * Types specific to eBay's API responses
 * 
 * Documentation: https://developer.ebay.com/api-docs/buy/browse/overview.html
 */

/**
 * eBay API Configuration
 */
export interface EbayConfig {
  /** Client ID (App ID) */
  clientId: string;
  
  /** Client Secret (optional, for OAuth) */
  clientSecret?: string;
  
  /** Marketplace ID (default: EBAY_US) */
  marketplaceId?: string;
}

/**
 * eBay Browse API Search Response
 */
export interface EbaySearchResponse {
  total: number;
  itemSummaries: EbayItem[];
  warnings?: Array<{
    category: string;
    domain: string;
    errorId: number;
    inputRefIds: string[];
    longMessage: string;
    message: string;
    outputRefIds: string[];
    parameters: Array<{ name: string; value: string }>;
    subdomain: string;
  }>;
}

/**
 * eBay Product Item
 */
export interface EbayItem {
  itemId: string;
  title: string;
  shortDescription?: string;
  image?: {
    imageUrl: string;
  };
  price?: {
    value: string;
    currency: string;
  };
  itemWebUrl: string;
  condition?: string;
  conditionId?: string;
  itemLocation?: {
    country: string;
    postalCode?: string;
  };
  shippingOptions?: Array<{
    shippingCostType: string;
    shippingCost?: {
      value: string;
      currency: string;
    };
  }>;
  buyingOptions?: string[];
  itemGroupType?: string;
  itemGroupHref?: string;
  legacyItemId?: string;
  itemAffiliateWebUrl?: string;
  itemEndDate?: string;
  categories?: Array<{
    categoryId: string;
    categoryName: string;
  }>;
  itemHref?: string;
  seller?: {
    username: string;
    feedbackPercentage: string;
    feedbackScore: number;
  };
  estimatedAvailabilities?: Array<{
    availabilityThresholdType: string;
    availabilityThreshold: number;
    estimatedAvailabilityStatus: string;
    estimatedSoldQuantity: number;
  }>;
  additionalImages?: Array<{
    imageUrl: string;
  }>;
  adultOnly?: boolean;
  brand?: string;
  bidders?: number;
  energyEfficiencyClass?: string;
  epid?: string;
  gtin?: string;
  marketingPrice?: {
    originalPrice?: {
      value: string;
      currency: string;
    };
    discountAmount?: {
      value: string;
      currency: string;
    };
    discountPercentage?: string;
    priceDisplayCondition?: string;
  };
  pickupOptions?: Array<{
    pickupMethodType: string;
    merchantKey?: string;
  }>;
  qualifiedPrograms?: string[];
  returnTerms?: {
    returnsAccepted: boolean;
    refundMethod?: string;
    returnPeriod?: {
      value: number;
      unit: string;
    };
    returnShippingCostPayer?: string;
  };
  thumbnailImages?: Array<{
    imageUrl: string;
  }>;
  unitPrice?: {
    value: string;
    currency: string;
    unit: string;
  };
}




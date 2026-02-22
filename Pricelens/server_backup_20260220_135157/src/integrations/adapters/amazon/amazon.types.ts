/**
 * Amazon Product Advertising API Types
 * 
 * Types specific to Amazon's API responses
 */

/**
 * Amazon Product Advertising API Configuration
 */
export interface AmazonConfig {
  /** Access Key ID */
  accessKeyId: string;
  
  /** Secret Access Key */
  secretAccessKey: string;
  
  /** Associate Tag (required for affiliate links) */
  associateTag: string;
  
  /** Marketplace (default: US) */
  marketplace?: string;
  
  /** Region (default: us-east-1) */
  region?: string;
}

/**
 * Amazon API Search Response
 */
export interface AmazonSearchResponse {
  SearchResult: {
    SearchIndex?: string;
    TotalResultCount?: number;
    SearchRefinements?: any;
    Items?: AmazonItem[];
  };
}

/**
 * Amazon Product Item
 */
export interface AmazonItem {
  ASIN: string;
  DetailPageURL: string;
  Images?: {
    Primary?: {
      Large?: { URL: string };
      Medium?: { URL: string };
    };
  };
  ItemInfo?: {
    ByLineInfo?: {
      Brand?: { DisplayValue: string };
      Manufacturer?: { DisplayValue: string };
    };
    ContentInfo?: {
      Edition?: { DisplayValue: string };
    };
    ExternalIds?: {
      EANs?: { DisplayValues: string[] };
      UPCs?: { DisplayValues: string[] };
    };
    ProductInfo?: {
      IsAdultProduct?: { DisplayValue: boolean };
      UnitCount?: { DisplayValue: number };
    };
    Title?: {
      DisplayValue: string;
    };
  };
  Offers?: {
    Listings?: AmazonListing[];
    Summaries?: AmazonSummary[];
  };
}

/**
 * Amazon Price Listing
 */
export interface AmazonListing {
  Price?: {
    DisplayAmount: string;
    Amount: number;
    Currency: string;
  };
  Availability?: {
    Message: string;
    Type: string;
    MinOrderQuantity?: number;
    MaxOrderQuantity?: number;
  };
  Condition?: {
    Value: string;
    DisplayValue: string;
  };
  MerchantInfo?: {
    Name: string;
  };
  DeliveryInfo?: {
    IsAmazonFulfilled: boolean;
    IsFreeShippingEligible: boolean;
    IsPrimeEligible: boolean;
  };
  ShippingCharges?: {
    Amount: number;
    Currency: string;
  };
}

/**
 * Amazon Offer Summary
 */
export interface AmazonSummary {
  HighestPrice?: {
    Amount: number;
    Currency: string;
  };
  LowestPrice?: {
    Amount: number;
    Currency: string;
  };
  OfferCount?: number;
}








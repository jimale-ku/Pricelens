/**
 * Bright Data Scraping API Types
 * 
 * Bright Data provides managed scraping infrastructure
 * No approval needed - works immediately
 * 
 * Documentation: https://docs.brightdata.com/
 */

/**
 * Bright Data Configuration
 */
export interface BrightDataConfig {
  /** API Username */
  username: string;
  
  /** API Password */
  password: string;
  
  /** Customer ID */
  customerId?: string;
  
  /** Zone (e.g., "general", "amazon", "walmart") */
  zone?: string;
}

/**
 * Bright Data Scraping Request
 */
export interface BrightDataRequest {
  /** Target URL to scrape */
  url: string;
  
  /** HTTP Method (GET, POST) */
  method?: 'GET' | 'POST';
  
  /** Request headers */
  headers?: Record<string, string>;
  
  /** Request body (for POST) */
  body?: string;
  
  /** JavaScript rendering (for SPAs) */
  render?: boolean;
  
  /** Wait time before scraping (ms) */
  wait?: number;
}

/**
 * Bright Data Scraping Response
 */
export interface BrightDataResponse {
  /** HTTP Status Code */
  status: number;
  
  /** Response headers */
  headers: Record<string, string>;
  
  /** HTML content */
  body: string;
  
  /** Metadata */
  metadata?: {
    /** IP used */
    ip?: string;
    
    /** Country */
    country?: string;
    
    /** User agent */
    userAgent?: string;
  };
}

/**
 * Store-specific scraping configuration
 */
export interface StoreScrapingConfig {
  /** Store name */
  storeName: string;
  
  /** Search URL pattern */
  searchUrlPattern: string;
  
  /** Product page URL pattern */
  productUrlPattern?: string;
  
  /** Selectors for data extraction */
  selectors: {
    /** Product name selector */
    name: string;
    
    /** Price selector */
    price: string;
    
    /** Image selector */
    image: string;
    
    /** Availability selector */
    availability?: string;
    
    /** Product URL selector */
    url?: string;
  };
  
  /** Whether to use JavaScript rendering */
  requiresJavaScript?: boolean;
}







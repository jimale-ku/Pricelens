import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * PriceAPI Integration Service
 * 
 * This service is ready to integrate with PriceAPI.com when the client subscribes.
 * 
 * Setup Instructions:
 * 1. Client subscribes to PriceAPI.com ($200-500/month)
 * 2. Get API key from PriceAPI dashboard
 * 3. Add to .env: PRICEAPI_KEY=your_key_here
 * 4. Uncomment the implementation below
 * 5. Remove mock integrations from products.service.ts
 * 
 * Documentation: https://www.priceapi.com/documentation
 */

interface PriceAPIProduct {
  name: string;
  price: number;
  currency: string;
  store: string;
  url: string;
  image?: string;
  inStock: boolean;
  shipping?: number;
  barcode?: string; // Add barcode field
}

@Injectable()
export class PriceApiService {
  private readonly logger = new Logger(PriceApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.priceapi.com';
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('PRICEAPI_KEY', '');
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      this.logger.warn('⚠️  PriceAPI key not configured. Using mock data.');
      this.logger.warn('💡 To enable: Add PRICEAPI_KEY to .env after client subscription');
    } else {
      this.logger.log('✅ PriceAPI integration enabled (job-based)');
      this.logger.log('⏱️  Note: Searches may take 2-5 seconds due to async job processing');
    }
  }

  /**
   * Search products across all stores
   * 
   * When enabled, this will call:
   * GET /search?q={query}&stores=walmart,amazon,target&key={apiKey}
   */
  async searchProducts(
    query: string,
    options?: {
      stores?: string[];
      limit?: number;
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<PriceAPIProduct[]> {
    if (!this.enabled) {
      return this.getMockResults(query);
    }

    try {
      // Step 1: Create a job with PriceAPI
      // Note: API key goes as query parameter, not in body
      // Using Amazon source because it supports 'term' (keyword) search with current plan
      // Google Shopping requires search_results topic which isn't in the plan
      
      const jobPayload = {
        source: 'amazon', // Amazon supports term search with current plan
        country: 'us',
        topic: 'product_and_offers',
        key: 'term', // Keyword search - works with Amazon!
        values: [query.replace(/['"]/g, '')], // Array of search terms
      };

      this.logger.debug(`🔍 Creating PriceAPI job for: "${query}"`);
      
      // Token must be passed as query parameter
      const createJobResponse = await fetch(`${this.baseUrl}/v2/jobs?token=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobPayload),
      });

      if (!createJobResponse.ok) {
        const errorText = await createJobResponse.text();
        this.logger.error(`❌ PriceAPI job creation failed (${createJobResponse.status}): ${errorText}`);
        // Don't return mock data - return empty array so user knows PriceAPI isn't working
        return [];
      }

      const jobData = await createJobResponse.json();
      this.logger.debug(`📋 Job response: ${JSON.stringify(jobData)}`);
      const jobId = jobData.job_id;

      if (!jobId) {
        this.logger.error('❌ No job_id returned from PriceAPI');
        this.logger.error(`Full response: ${JSON.stringify(jobData)}`);
        // Don't return mock data - return empty array so user knows PriceAPI isn't working
        return [];
      }

      this.logger.debug(`✅ Job created: ${jobId}, waiting for results...`);

      // Step 2: Poll for results (max 30 seconds for real API calls)
      const maxAttempts = 15;
      let attempt = 0;

      while (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempt++;

        const resultResponse = await fetch(`${this.baseUrl}/v2/jobs/${jobId}?token=${this.apiKey}`);
        
        if (!resultResponse.ok) {
          continue;
        }

        const resultData = await resultResponse.json();
        this.logger.debug(`📊 Job status (attempt ${attempt}/${maxAttempts}): ${resultData.status}`);

        // Check if job is complete
        if (resultData.status === 'finished') {
          // Download the actual results
          const downloadResponse = await fetch(`${this.baseUrl}/v2/jobs/${jobId}/download?token=${this.apiKey}`);
          
          if (!downloadResponse.ok) {
            this.logger.error('❌ Failed to download results');
            break;
          }

          const downloadData = await downloadResponse.json();
          this.logger.debug(`📦 Downloaded ${downloadData.results?.length || 0} results`);
          
          // Log the actual response structure for debugging
          if (downloadData.results && downloadData.results.length > 0) {
            this.logger.debug(`🔍 Sample result structure: ${JSON.stringify(downloadData.results[0], null, 2).substring(0, 500)}`);
          }

          // Parse Amazon product_and_offers response
          const products: PriceAPIProduct[] = [];
          
          if (downloadData.results && Array.isArray(downloadData.results)) {
            for (const result of downloadData.results) {
              if (result.success && result.content) {
                const content = result.content;
                const buybox = content.buybox;
                const productName = content.name || content.title || 'Unknown Product';
                const productUrl = content.url || '';
                const productImage = content.image_url || content.main_image?.link || content.image || '';
                
                // Extract barcode/GTIN (gtins array or eans array)
                let barcode: string | undefined = undefined;
                if (content.gtins && content.gtins.length > 0) {
                  barcode = content.gtins[0];
                } else if (content.eans && content.eans.length > 0) {
                  barcode = content.eans[0];
                }
                this.logger.debug(`📦 Product: ${productName}, Barcode: ${barcode || 'none'}, Image: ${productImage ? 'Yes' : 'No'}`);

                // Add the buybox offer (main offer)
                if (buybox && buybox.min_price) {
                  // Use actual shop_name from PriceAPI, default to 'Amazon' if not provided
                  const storeName = buybox.shop_name || 'Amazon';
                  products.push({
                    name: productName,
                    price: parseFloat(buybox.min_price || 0),
                    currency: buybox.currency || 'USD',
                    store: storeName, // Use actual store name from PriceAPI
                    url: productUrl,
                    image: productImage,
                    inStock: buybox.availability_text?.toLowerCase().includes('in stock') || true,
                    shipping: parseFloat(buybox.shipping_cost || 0),
                    barcode: barcode,
                  });
                  this.logger.debug(`✅ Added buybox product: ${productName} at $${buybox.min_price} from ${storeName}`);
                  this.logger.debug(`🖼️ Product image URL: ${productImage || 'NO IMAGE'}`);
                } else {
                  this.logger.debug(`⚠️  No buybox found for ${productName}. Buybox: ${JSON.stringify(buybox)}`);
                }

                // Add additional offers if available (limit to avoid duplicates)
                if (content.offers && Array.isArray(content.offers)) {
                  this.logger.debug(`📦 Found ${content.offers.length} offers for ${productName}`);
                  // Only add unique offers (different prices or stores)
                  const seenPrices = new Set<number>();
                  for (const offer of content.offers.slice(0, 10)) {
                    if (offer.price) {
                      const price = parseFloat(offer.price || 0);
                      const storeName = offer.shop_name || 'Amazon Seller';
                      
                      // Skip if we already have this exact price (likely duplicate)
                      if (seenPrices.has(price)) {
                        continue;
                      }
                      seenPrices.add(price);
                      
                      products.push({
                        name: productName,
                        price: price,
                        currency: offer.currency || 'USD',
                        store: storeName, // Use actual store name from PriceAPI
                        url: productUrl,
                        image: productImage,
                        inStock: offer.availability_text?.toLowerCase().includes('in stock') || true,
                        shipping: parseFloat(offer.shipping_cost || 0),
                        barcode: barcode,
                      });
                      this.logger.debug(`✅ Added offer: ${storeName} at $${price}`);
                    }
                  }
                } else {
                  this.logger.debug(`⚠️  No offers array found for ${productName}`);
                }
              } else {
                this.logger.debug(`⚠️  Result not successful or no content. Success: ${result.success}, Content: ${result.content ? 'Yes' : 'No'}`);
              }
            }
          } else {
            this.logger.warn(`⚠️  No results array found. Response keys: ${Object.keys(downloadData).join(', ')}`);
          }

          if (products.length > 0) {
            this.logger.log(`✅ Got ${products.length} products from PriceAPI (Amazon)`);
            return products.slice(0, options?.limit || 20);
          } else {
            this.logger.warn('⚠️  No products found in results - PriceAPI returned data but parsing failed');
            this.logger.warn(`⚠️  Response structure: ${JSON.stringify(downloadData).substring(0, 1000)}`);
            // Don't return mock data - return empty array so user knows PriceAPI isn't working
            return [];
          }
        }

        if (resultData.status === 'failed') {
          this.logger.error('❌ PriceAPI job failed');
          this.logger.error(`Reason: ${JSON.stringify(resultData)}`);
          break;
        }
      }

      this.logger.warn('⚠️ PriceAPI job timeout - no results returned');
      // Don't return mock data - return empty array so user knows PriceAPI isn't working
      return [];

    } catch (error) {
      this.logger.error('PriceAPI request failed', error);
      // Don't return mock data - return empty array so user knows PriceAPI isn't working
      return [];
    }
  }

  /**
   * Get product details by URL
   * Useful for price tracking specific items
   */
  async getProductByUrl(url: string): Promise<PriceAPIProduct | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        url,
        key: this.apiKey,
      });

      const response = await fetch(`${this.baseUrl}/product?${params}`);
      
      if (!response.ok) {
        return null;
      }

      const product = await response.json();
      
      return {
        name: product.name,
        price: product.price,
        currency: product.currency || 'USD',
        store: product.store,
        url: product.url,
        image: product.image,
        inStock: product.in_stock !== false,
        shipping: product.shipping_price,
      };
    } catch (error) {
      this.logger.error('PriceAPI product lookup failed', error);
      return null;
    }
  }

  /**
   * Mock results for development
   * Remove this method when PriceAPI is enabled
   */
  private getMockResults(query: string): PriceAPIProduct[] {
    const basePrice = Math.random() * 100 + 20;
    
    return [
      {
        name: `${query} - Walmart`,
        price: basePrice,
        currency: 'USD',
        store: 'walmart',
        url: 'https://walmart.com',
        inStock: true,
      },
      {
        name: `${query} - Amazon`,
        price: basePrice * 0.95,
        currency: 'USD',
        store: 'amazon',
        url: 'https://amazon.com',
        inStock: true,
      },
      {
        name: `${query} - Target`,
        price: basePrice * 1.05,
        currency: 'USD',
        store: 'target',
        url: 'https://target.com',
        inStock: Math.random() > 0.3,
      },
    ];
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

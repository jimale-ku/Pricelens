/**
 * Apify Gas Price Service
 * 
 * Alternative to ScrapingBee for getting real gas station prices
 * Uses Apify's Gas Station Prices scraper
 * 
 * Documentation: https://apify.com/scraped/gas-station-prices
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ApifyGasStation {
  name: string;
  address: string;
  regular?: number;
  midgrade?: number;
  premium?: number;
  diesel?: number;
  distance?: string;
  lastUpdated?: Date;
}

export interface ApifyGasPriceResponse {
  stations: ApifyGasStation[];
  zipCode: string;
  lastUpdated: Date;
}

@Injectable()
export class ApifyGasPriceService {
  private readonly logger = new Logger(ApifyGasPriceService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.apify.com/v2';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('APIFY_API_KEY') || '';
    
    if (!this.apiKey) {
      this.logger.warn('⚠️ APIFY_API_KEY not configured. Apify gas prices will not work.');
    }
  }

  /**
   * Get gas prices from Apify Gas Station Prices scraper
   * 
   * Actor: scraped~gas-station-prices
   * Documentation: https://apify.com/scraped/gas-station-prices
   */
  async getGasPrices(zipCode: string, fuelType?: string): Promise<ApifyGasPriceResponse | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      // Apify Actor ID for Gas Station Prices
      // Try different actor IDs if one doesn't work
      // Format: username~actor-name or username/actor-name
      let actorId = 'scraped~gas-station-prices'; // Default
      
      // Check if a different actor ID is configured
      const customActorId = this.configService.get<string>('APIFY_GAS_ACTOR_ID');
      if (customActorId) {
        actorId = customActorId;
      }
      
      this.logger.debug(`🔍 Apify gas price search: ZIP ${zipCode}`);

      // Step 1: Start the actor run
      const runUrl = `${this.baseUrl}/acts/${actorId}/runs?token=${this.apiKey}`;
      
      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipcodes: [zipCode], // Note: plural "zipcodes" not "zipCode"
        }),
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        throw new Error(`Apify run error: ${runResponse.status} - ${errorText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;
      const datasetId = runData.data.defaultDatasetId;

      this.logger.debug(`✅ Apify actor started: ${runId}`);

      // Step 2: Wait for the run to complete (poll status)
      let status = 'RUNNING';
      let attempts = 0;
      const maxAttempts = 30; // Wait up to 30 seconds

      while (status === 'RUNNING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusUrl = `${this.baseUrl}/actor-runs/${runId}?token=${this.apiKey}`;
        const statusResponse = await fetch(statusUrl);
        const statusData = await statusResponse.json();
        
        status = statusData.data.status;
        attempts++;
      }

      if (status !== 'SUCCEEDED') {
        throw new Error(`Apify actor failed with status: ${status}`);
      }

      // Step 3: Fetch the dataset items (results)
      const datasetUrl = `${this.baseUrl}/datasets/${datasetId}/items?token=${this.apiKey}`;
      const datasetResponse = await fetch(datasetUrl);

      if (!datasetResponse.ok) {
        throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
      }

      const results = await datasetResponse.json();
      
      this.logger.debug(`✅ Got ${results.length} gas stations from Apify`);

      // Transform Apify response to our format
      return this.transformApifyResponse(results, zipCode);
    } catch (error: any) {
      this.logger.error(`Apify gas price error: ${error.message}`);
      return null;
    }
  }

  /**
   * Transform Apify response to our format
   * 
   * Apify Gas Station Prices actor returns data like:
   * {
   *   name: "Shell",
   *   address: "123 Main St",
   *   regular: "$3.45",
   *   premium: "$3.89",
   *   diesel: "$4.12",
   *   ...
   * }
   */
  private transformApifyResponse(data: any[], zipCode: string): ApifyGasPriceResponse {
    const stations: ApifyGasStation[] = [];

    // Data is already an array of results from the dataset
    for (const item of data) {
      stations.push({
        name: item.name || item.stationName || item.station || 'Unknown Station',
        address: item.address || item.location || item.fullAddress || '',
        regular: this.parsePrice(item.regular || item.regularPrice || item.price),
        midgrade: this.parsePrice(item.midgrade || item.midGrade || item.midgradePrice),
        premium: this.parsePrice(item.premium || item.premiumPrice),
        diesel: this.parsePrice(item.diesel || item.dieselPrice),
        distance: item.distance ? `${item.distance} mi` : undefined,
        lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
      });
    }

    return {
      stations,
      zipCode,
      lastUpdated: new Date(),
    };
  }

  /**
   * Parse price string to number
   */
  private parsePrice(price: string | number | undefined): number | undefined {
    if (!price) return undefined;
    
    if (typeof price === 'number') return price;
    
    // Remove $ and parse
    const cleaned = price.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? undefined : parsed;
  }
}


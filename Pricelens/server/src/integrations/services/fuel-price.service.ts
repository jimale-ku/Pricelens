/**
 * Fuel Price Service
 * 
 * Integrates with fuel price APIs to get real gas prices
 * 
 * Options:
 * 1. OilPriceAPI (https://oilpriceapi.com/) - Recommended
 * 2. ScrapingBee GasBuddy scraper (use with caution)
 * 3. Custom scraping solution
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FuelPrice {
  stationName: string;
  address: string;
  regular?: number;
  midgrade?: number;
  premium?: number;
  diesel?: number;
  lastUpdated?: Date;
}

export interface FuelPriceResponse {
  prices: FuelPrice[];
  zipCode: string;
  lastUpdated: Date;
}

@Injectable()
export class FuelPriceService {
  private readonly logger = new Logger(FuelPriceService.name);
  private readonly oilPriceApiKey: string;
  private readonly scrapingBeeApiKey: string;
  private readonly apifyApiKey: string;

  constructor(private configService: ConfigService) {
    this.oilPriceApiKey = this.configService.get<string>('OILPRICEAPI_KEY') || '';
    this.scrapingBeeApiKey = this.configService.get<string>('SCRAPINGBEE_API_KEY') || '';
    this.apifyApiKey = this.configService.get<string>('APIFY_API_KEY') || '';
  }

  /**
   * Get gas prices for a ZIP code
   * Tries multiple sources in order of preference
   */
  async getGasPrices(zipCode: string, fuelType?: string): Promise<FuelPriceResponse | null> {
    // Try OilPriceAPI first (if configured)
    if (this.oilPriceApiKey) {
      try {
        const prices = await this.getPricesFromOilPriceAPI(zipCode, fuelType);
        if (prices) {
          return prices;
        }
      } catch (error) {
        this.logger.warn(`OilPriceAPI failed: ${error.message}`);
      }
    }

    // Note: Apify is handled in ServicesService directly
    // This method is for OilPriceAPI and ScrapingBee fallbacks

    // Fallback to ScrapingBee (if configured)
    if (this.scrapingBeeApiKey) {
      try {
        const prices = await this.getPricesFromScrapingBee(zipCode, fuelType);
        if (prices) {
          return prices;
        }
      } catch (error) {
        this.logger.warn(`ScrapingBee failed: ${error.message}`);
      }
    }

    // No fuel price data available
    this.logger.warn(`No fuel price data available for ZIP ${zipCode}`);
    return null;
  }

  /**
   * Get prices from OilPriceAPI
   * Documentation: https://docs.oilpriceapi.com/
   * 
   * Note: OilPriceAPI provides:
   * - Wholesale/commodity prices (Brent, WTI, Gasoline, Diesel)
   * - State-level averages
   * - Station-level prices (via SDK, may require paid plan)
   */
  private async getPricesFromOilPriceAPI(
    zipCode: string,
    fuelType?: string
  ): Promise<FuelPriceResponse | null> {
    if (!this.oilPriceApiKey) {
      return null;
    }

    try {
      // First, get wholesale prices for the fuel type
      const fuelCode = this.mapFuelTypeToCode(fuelType);
      
      // Get latest wholesale price
      const wholesaleUrl = `https://api.oilpriceapi.com/v1/prices/latest?by_code=${fuelCode}`;
      
      const wholesaleResponse = await fetch(wholesaleUrl, {
        headers: {
          'Authorization': `Token ${this.oilPriceApiKey}`, // Note: Uses "Token" not "Bearer"
          'Content-Type': 'application/json',
        },
      });

      if (!wholesaleResponse.ok) {
        const errorText = await wholesaleResponse.text();
        throw new Error(`OilPriceAPI error: ${wholesaleResponse.status} - ${errorText}`);
      }

      const wholesaleData = await wholesaleResponse.json();
      
      // Extract wholesale price
      const wholesalePrice = wholesaleData.data?.[fuelCode]?.price;
      
      if (!wholesalePrice) {
        this.logger.warn(`No wholesale price found for ${fuelCode}`);
        return null;
      }

      // Estimate retail prices: wholesale + markup + taxes
      // Typical markup: $0.50-$1.00 per gallon
      // State taxes vary: ~$0.20-$0.60 per gallon
      const estimatedRegular = this.estimateRetailPrice(wholesalePrice, zipCode);
      
      // Estimate other fuel types (premium is typically $0.20-0.40 more, diesel varies)
      const estimatedPremium = estimatedRegular + 0.30; // Premium is usually $0.30 more
      const estimatedMidgrade = estimatedRegular + 0.15; // Mid-grade is between regular and premium
      
      // Get diesel price if requested
      let estimatedDiesel = estimatedRegular;
      if (fuelType === 'diesel') {
        try {
          const dieselUrl = `https://api.oilpriceapi.com/v1/prices/latest?by_code=DIESEL_USD`;
          const dieselResponse = await fetch(dieselUrl, {
            headers: {
              'Authorization': `Token ${this.oilPriceApiKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (dieselResponse.ok) {
            const dieselData = await dieselResponse.json();
            const dieselWholesale = dieselData.data?.DIESEL_USD?.price;
            if (dieselWholesale) {
              estimatedDiesel = this.estimateRetailPrice(dieselWholesale, zipCode);
            }
          }
        } catch (error) {
          // Use regular estimate if diesel fails
        }
      }
      
      // Return estimated prices for all fuel types
      return {
        prices: [{
          stationName: 'Estimated Average',
          address: `ZIP ${zipCode}`,
          regular: estimatedRegular,
          midgrade: estimatedMidgrade,
          premium: estimatedPremium,
          diesel: estimatedDiesel,
          lastUpdated: new Date(),
        }],
        zipCode,
        lastUpdated: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`OilPriceAPI error: ${error.message}`);
      return null;
    }
  }

  /**
   * Map fuel type to OilPriceAPI commodity code
   */
  private mapFuelTypeToCode(fuelType?: string): string {
    const codeMap: Record<string, string> = {
      'regular': 'GASOLINE_USD',
      'midgrade': 'GASOLINE_USD',
      'premium': 'GASOLINE_USD',
      'diesel': 'DIESEL_USD',
    };
    
    return codeMap[fuelType || 'regular'] || 'GASOLINE_USD';
  }

  /**
   * Estimate retail price from wholesale price
   * Formula: wholesale (per barrel) / 42 gallons + markup + taxes
   */
  private estimateRetailPrice(wholesalePricePerBarrel: number, zipCode: string): number {
    // Convert barrel price to per-gallon wholesale
    const wholesalePerGallon = wholesalePricePerBarrel / 42;
    
    // Add markup (retailer profit): $0.50-$1.00
    const markup = 0.75; // Average markup
    
    // Add state/local taxes (varies by state, estimate $0.30 average)
    const taxes = 0.30;
    
    // Total estimated retail price
    const estimatedPrice = wholesalePerGallon + markup + taxes;
    
    return Math.round(estimatedPrice * 100) / 100; // Round to 2 decimals
  }

  // Note: Apify integration is handled directly in ServicesService
  // This keeps dependency injection clean

  /**
   * Get prices from ScrapingBee GasBuddy scraper
   * Documentation: https://www.scrapingbee.com/scrapers/gasbuddy-scraper-api/
   * ⚠️ Warning: May violate GasBuddy's ToS
   */
  private async getPricesFromScrapingBee(
    zipCode: string,
    fuelType?: string
  ): Promise<FuelPriceResponse | null> {
    if (!this.scrapingBeeApiKey) {
      return null;
    }

    try {
      // ScrapingBee GasBuddy scraper endpoint
      const url = `https://app.scrapingbee.com/api/v1/store/gasbuddy?api_key=${this.scrapingBeeApiKey}&zip=${zipCode}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`ScrapingBee error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform to our format
      return {
        prices: this.transformScrapingBeeResponse(data),
        zipCode,
        lastUpdated: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`ScrapingBee error: ${error.message}`);
      return null;
    }
  }

  /**
   * Transform OilPriceAPI response to our format
   * Note: This is for station-level data if available
   * Currently using wholesale price estimation instead
   */
  private transformOilPriceAPIResponse(data: any): FuelPrice[] {
    // If OilPriceAPI provides station-level data, transform it here
    // For now, we're using wholesale price estimation in getPricesFromOilPriceAPI
    const prices: FuelPrice[] = [];

    if (data.stations && Array.isArray(data.stations)) {
      data.stations.forEach((station: any) => {
        prices.push({
          stationName: station.name || 'Unknown',
          address: station.address || '',
          regular: station.prices?.regular ? parseFloat(station.prices.regular) : undefined,
          midgrade: station.prices?.midgrade ? parseFloat(station.prices.midgrade) : undefined,
          premium: station.prices?.premium ? parseFloat(station.prices.premium) : undefined,
          diesel: station.prices?.diesel ? parseFloat(station.prices.diesel) : undefined,
          lastUpdated: station.lastUpdated ? new Date(station.lastUpdated) : new Date(),
        });
      });
    }

    return prices;
  }

  /**
   * Transform ScrapingBee response to our format
   * Adjust based on actual API response structure
   */
  private transformScrapingBeeResponse(data: any): FuelPrice[] {
    // This is a placeholder - adjust based on actual API response
    const prices: FuelPrice[] = [];

    if (data.stations && Array.isArray(data.stations)) {
      data.stations.forEach((station: any) => {
        prices.push({
          stationName: station.name || 'Unknown',
          address: station.address || '',
          regular: station.regular ? parseFloat(station.regular) : undefined,
          midgrade: station.midgrade ? parseFloat(station.midgrade) : undefined,
          premium: station.premium ? parseFloat(station.premium) : undefined,
          diesel: station.diesel ? parseFloat(station.diesel) : undefined,
          lastUpdated: new Date(),
        });
      });
    }

    return prices;
  }

  /**
   * Match a station from SerpAPI with price data
   */
  matchStationWithPrice(
    stationName: string,
    stationAddress: string,
    priceData: FuelPriceResponse | null
  ): FuelPrice | null {
    if (!priceData || !priceData.prices.length) {
      return null;
    }

    // Try to match by name first
    let match = priceData.prices.find(
      (p) => p.stationName.toLowerCase().includes(stationName.toLowerCase()) ||
             stationName.toLowerCase().includes(p.stationName.toLowerCase())
    );

    // If no name match, try address
    if (!match) {
      match = priceData.prices.find(
        (p) => p.address.toLowerCase().includes(stationAddress.toLowerCase()) ||
               stationAddress.toLowerCase().includes(p.address.toLowerCase())
      );
    }

    return match || null;
  }
}


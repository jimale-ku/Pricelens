/**
 * Services Service
 * 
 * Handles business logic for Pattern B and Pattern C searches
 */

import { Injectable, Logger } from '@nestjs/common';
import { SerpAPIMapsService } from '../integrations/services/serpapi-maps.service';
import { FuelPriceService, FuelPriceResponse } from '../integrations/services/fuel-price.service';
import { ApifyGasPriceService } from '../integrations/services/apify-gas-price.service';

export interface SearchGasStationsDto {
  zipCode: string;
  gasType?: string;
}

export interface SearchGymsDto {
  zipCode: string;
  membershipType?: string;
}

export interface SearchHotelsDto {
  location: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export interface SearchServiceProvidersDto {
  category: string;
  serviceType: string;
  zipCode: string;
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private serpAPIMapsService: SerpAPIMapsService,
    private fuelPriceService: FuelPriceService,
    private apifyGasPriceService: ApifyGasPriceService,
  ) {}

  /**
   * Pattern B: Search gas stations
   */
  async searchGasStations(dto: SearchGasStationsDto) {
    try {
      // Get stations from SerpAPI
      const serpResults = await this.serpAPIMapsService.searchGasStations(
        dto.zipCode,
        dto.gasType
      );

      // Get estimated gas prices from OilPriceAPI
      // Using OilPriceAPI wholesale prices + markup estimation
      const fuelPriceData = await this.fuelPriceService.getGasPrices(
        dto.zipCode,
        dto.gasType
      );

      // Transform to table format and merge with price data
      return serpResults.results.map((result, index) => {
        // Try to match station with price data
        const priceMatch = fuelPriceData
          ? this.fuelPriceService.matchStationWithPrice(
              result.title,
              result.address,
              fuelPriceData
            )
          : null;

        // Get price for requested fuel type
        // Use OilPriceAPI estimated prices
        let price = 'N/A';
        
        if (fuelPriceData && fuelPriceData.prices && fuelPriceData.prices.length > 0) {
          // Use estimated price from OilPriceAPI
          const estimatedPrice = fuelPriceData.prices[0];
          if (dto.gasType === 'regular' && estimatedPrice.regular) {
            price = `~$${estimatedPrice.regular.toFixed(2)}`;
          } else if (dto.gasType === 'midgrade' && estimatedPrice.midgrade) {
            price = `~$${estimatedPrice.midgrade.toFixed(2)}`;
          } else if (dto.gasType === 'premium' && estimatedPrice.premium) {
            price = `~$${estimatedPrice.premium.toFixed(2)}`;
          } else if (dto.gasType === 'diesel' && estimatedPrice.diesel) {
            price = `~$${estimatedPrice.diesel.toFixed(2)}`;
          } else if (estimatedPrice.regular) {
            // Fallback to regular if specific type not available
            price = `~$${estimatedPrice.regular.toFixed(2)}`;
          }
        }
        
        // Try to match with exact station if available (for future when we have real station prices)
        if (priceMatch) {
          if (dto.gasType === 'regular' && priceMatch.regular) {
            price = `$${priceMatch.regular.toFixed(2)}`;
          } else if (dto.gasType === 'midgrade' && priceMatch.midgrade) {
            price = `$${priceMatch.midgrade.toFixed(2)}`;
          } else if (dto.gasType === 'premium' && priceMatch.premium) {
            price = `$${priceMatch.premium.toFixed(2)}`;
          } else if (dto.gasType === 'diesel' && priceMatch.diesel) {
            price = `$${priceMatch.diesel.toFixed(2)}`;
          }
        }

        return {
          rank: index + 1,
          station: result.title,
          address: result.address,
          price: price,
          distance: result.distance || 'N/A',
          rating: result.rating,
          phone: result.phone,
          website: result.website,
        };
      });
    } catch (error: any) {
      this.logger.error(`Error searching gas stations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pattern B: Search gyms
   */
  async searchGyms(dto: SearchGymsDto) {
    try {
      const results = await this.serpAPIMapsService.searchGyms(
        dto.zipCode,
        dto.membershipType
      );

      // Transform to table format
      return results.results.map((result, index) => ({
        rank: index + 1,
        gym: result.title,
        address: result.address,
        price: this.estimateGymPrice(result) || 'Contact for pricing',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching gyms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pattern B: Search hotels
   */
  async searchHotels(dto: SearchHotelsDto) {
    try {
      const results = await this.serpAPIMapsService.searchHotels(
        dto.location,
        dto.checkIn,
        dto.checkOut
      );

      // Transform to table format
      return results.results.map((result, index) => ({
        rank: index + 1,
        hotel: result.title,
        address: result.address,
        price: this.estimateHotelPrice(result) || 'Contact for pricing',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching hotels: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pattern C: Search service providers
   */
  async searchServiceProviders(dto: SearchServiceProvidersDto) {
    try {
      const results = await this.serpAPIMapsService.searchServiceProviders(
        dto.serviceType,
        dto.zipCode,
        dto.category
      );

      // Transform to service card format
      return results.results.map((result, index) => ({
        id: result.placeId || `service-${index}`,
        name: result.title,
        businessName: result.title,
        address: result.address,
        distance: result.distance,
        rating: result.rating,
        reviewCount: result.reviews,
        hours: result.hours,
        priceRange: result.price || 'Contact for pricing',
        price: this.estimateServicePrice(dto.category, dto.serviceType, result),
        phone: result.phone,
        website: result.website,
        thumbnail: result.thumbnail,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching service providers: ${error.message}`);
      throw error;
    }
  }

  // Helper methods for price estimation/extraction
  private extractGasPrice(title: string, address: string): string | null {
    // Gas prices are typically not in Google Maps results
    // You'd need a separate gas price API (GasBuddy, etc.)
    // For now, return null
    return null;
  }

  private estimateGymPrice(result: any): string | null {
    // Estimate based on price indicator ($, $$, $$$)
    if (result.price === '$') return '$20-40/month';
    if (result.price === '$$') return '$40-80/month';
    if (result.price === '$$$') return '$80-150/month';
    if (result.price === '$$$$') return '$150+/month';
    return null;
  }

  private estimateHotelPrice(result: any): string | null {
    // Estimate based on price indicator
    if (result.price === '$') return '$50-100/night';
    if (result.price === '$$') return '$100-200/night';
    if (result.price === '$$$') return '$200-400/night';
    if (result.price === '$$$$') return '$400+/night';
    return null;
  }

  private estimateServicePrice(category: string, serviceType: string, result: any): string | null {
    // Estimate based on price indicator and service type
    const priceMap: Record<string, Record<string, string>> = {
      'haircuts': {
        'mens': '$15-30',
        'womens': '$30-80',
        'kids': '$15-25',
      },
      'massage': {
        'swedish': '$60-100',
        'deep': '$80-120',
        'hot': '$100-150',
      },
      'nail-salons': {
        'manicure': '$20-40',
        'pedicure': '$30-50',
        'both': '$45-80',
      },
    };

    if (priceMap[category] && priceMap[category][serviceType]) {
      return priceMap[category][serviceType];
    }

    // Fallback to price indicator
    if (result.price === '$') return '$20-50';
    if (result.price === '$$') return '$50-100';
    if (result.price === '$$$') return '$100-200';
    if (result.price === '$$$$') return '$200+';
    
    return null;
  }
}


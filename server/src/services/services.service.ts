/**
 * Services Service
 * 
 * Handles business logic for Pattern B and Pattern C searches
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SerpAPIMapsService } from '../integrations/services/serpapi-maps.service';
import { FuelPriceService, FuelPriceResponse } from '../integrations/services/fuel-price.service';
import { ApifyGasPriceService } from '../integrations/services/apify-gas-price.service';
import { MockServiceDataService } from './mock-service-data.service';

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

export interface SearchTiresDto {
  year: string;
  make: string;
  model: string;
  tireSize?: string;
  zipCode: string;
}

export interface SearchAirfareDto {
  origin: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  passengers?: number;
}

export interface SearchOilChangesDto {
  zipCode: string;
  vehicleType?: string;
}

export interface SearchCarWashesDto {
  zipCode: string;
  washType?: string;
}

export interface SearchRentalCarsDto {
  location: string;
  pickupDate?: string;
  returnDate?: string;
  /** Single string e.g. "Dec 1-5, 2025" when frontend sends "dates" */
  dates?: string;
  carType?: string;
}

export interface SearchStorageUnitsDto {
  zipCode: string;
  size?: string;
}

export interface SearchMealKitsDto {
  zipCode: string;
}

export interface SearchCarInsuranceDto {
  zipCode: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export interface SearchRentersInsuranceDto {
  zipCode: string;
}

export interface SearchApartmentsDto {
  zipCode: string;
  serviceType?: string; // studio, 1br, 2br, 3br
}

export interface SearchMovingCompaniesDto {
  zipCode: string;
  moveType?: string; // local, long-distance
}

export interface SearchFoodDeliveryDto {
  zipCode: string;
  cuisine?: string;
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);
  private readonly useMockData: boolean;

  constructor(
    private serpAPIMapsService: SerpAPIMapsService,
    private fuelPriceService: FuelPriceService,
    private apifyGasPriceService: ApifyGasPriceService,
    private mockServiceData: MockServiceDataService,
    private configService: ConfigService,
  ) {
    // Use mock data if explicitly enabled OR if in development and no API key
    const useMockEnv = this.configService.get<string>('USE_MOCK_SERVICE_DATA') === 'true';
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';
    const hasApiKey = !!(
      this.configService.get<string>('SERPER_API_KEY') ||
      this.configService.get<string>('SERPAPI_KEY')
    );
    
    this.useMockData = useMockEnv || (isDev && !hasApiKey);
    
    if (this.useMockData) {
      this.logger.warn('⚠️ Using MOCK service data to save API costs. Set USE_MOCK_SERVICE_DATA=false to use real APIs.');
    }
  }

  /**
   * Pattern B: Search gas stations
   */
  async searchGasStations(dto: SearchGasStationsDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for gas stations (ZIP: ${dto.zipCode}, Type: ${dto.gasType || 'regular'})`);
      return this.mockServiceData.generateGasStations(dto.zipCode, dto.gasType || 'regular');
    }

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
      // Fallback to mock data on error (to avoid breaking the app)
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateGasStations(dto.zipCode, dto.gasType || 'regular');
    }
  }

  /**
   * Pattern B: Search gyms
   */
  async searchGyms(dto: SearchGymsDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for gyms (ZIP: ${dto.zipCode})`);
      return this.mockServiceData.generateGyms(dto.zipCode, dto.membershipType);
    }

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
        price: result.price || this.estimateGymPrice(result) || 'Contact for pricing',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching gyms: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateGyms(dto.zipCode, dto.membershipType);
    }
  }

  /**
   * Pattern B: Search hotels
   */
  async searchHotels(dto: SearchHotelsDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for hotels (Location: ${dto.location})`);
      return this.mockServiceData.generateHotels(dto.location, dto.checkIn, dto.checkOut);
    }

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
        price: result.price || this.estimateHotelPrice(result) || 'Contact for pricing',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching hotels: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateHotels(dto.location, dto.checkIn, dto.checkOut);
    }
  }

  /**
   * Pattern B: Search airfare/flights
   */
  async searchAirfare(dto: SearchAirfareDto) {
    try {
      // Use SerpAPI to search for flights
      // Note: SerpAPI Google Flights requires airport codes, but we'll handle city names too
      const results = await this.serpAPIMapsService.searchFlights(
        dto.origin,
        dto.destination,
        dto.departDate,
        dto.returnDate
      );

      // Transform to table format
      // Note: SerpAPIMapsResult only has title, address, rating, reviews, phone, website, distance
      // Flight-specific data would need to be extracted from title or stored differently
      return results.results.map((result, index) => ({
        rank: index + 1,
        airline: result.title || 'N/A',
        price: this.estimateFlightPrice(result) || 'Contact for pricing',
        times: this.formatFlightTimes(result) || 'N/A',
        duration: 'N/A', // Not available in SerpAPIMapsResult
        stops: 'N/A', // Not available in SerpAPIMapsResult
        departure: 'N/A', // Not available in SerpAPIMapsResult
        arrival: 'N/A', // Not available in SerpAPIMapsResult
      }));
    } catch (error: any) {
      this.logger.error(`Error searching airfare: ${error.message}`);
      throw error;
    }
  }

  /**
   * Estimate flight price based on route and result data
   */
  private estimateFlightPrice(result: any): string {
    // If price is already in result, use it
    if (result.price) {
      return typeof result.price === 'string' ? result.price : `$${result.price}`;
    }

    // Estimate based on route distance and typical prices
    // This is a placeholder - in production, you'd use actual flight pricing APIs
    const basePrice = 200; // Base price for domestic flights
    const priceVariation = Math.floor(Math.random() * 300) + 50; // $50-$350 variation
    
    return `$${basePrice + priceVariation}`;
  }

  /**
   * Format flight times from result
   */
  private formatFlightTimes(result: any): string {
    if (result.departure && result.arrival) {
      return `${result.departure} - ${result.arrival}`;
    }
    if (result.departure_time && result.arrival_time) {
      return `${result.departure_time} - ${result.arrival_time}`;
    }
    return 'N/A';
  }

  /**
   * Pattern B: Search oil change shops
   */
  async searchOilChanges(dto: SearchOilChangesDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for oil changes (ZIP: ${dto.zipCode}, Type: ${dto.vehicleType || 'car'})`);
      return this.mockServiceData.generateOilChanges(dto.zipCode, dto.vehicleType || 'car');
    }

    try {
      // Build search query
      let query = `oil change`;
      if (dto.vehicleType) {
        query = `${dto.vehicleType} ${query}`;
      }

      // Search for oil change shops near the zip code
      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      // Transform to table format
      return results.results.map((result, index) => ({
        rank: index + 1,
        shop: result.title,
        address: result.address,
        price: this.estimateOilChangePrice(result, dto) || 'Contact for pricing',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching oil changes: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateOilChanges(dto.zipCode, dto.vehicleType || 'car');
    }
  }

  /**
   * Estimate oil change price based on vehicle type and shop rating
   */
  private estimateOilChangePrice(result: any, dto: SearchOilChangesDto): string {
    // Base prices by vehicle type
    const basePrices: Record<string, number> = {
      sedan: 30,
      suv: 45,
      truck: 55,
      luxury: 75,
    };

    const basePrice = basePrices[dto.vehicleType || 'sedan'] || 35;
    
    // Adjust based on shop rating (higher rating = slightly higher price)
    const ratingMultiplier = result.rating ? 1 + (result.rating - 4) * 0.1 : 1;
    const estimatedPrice = Math.round(basePrice * ratingMultiplier);
    
    return `$${estimatedPrice}`;
  }

  /**
   * Pattern B: Search tire shops
   */
  async searchTires(dto: SearchTiresDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for tires (${dto.year} ${dto.make} ${dto.model}, ZIP: ${dto.zipCode})`);
      return this.mockServiceData.generateTires(dto.year, dto.make, dto.model, dto.zipCode);
    }

    try {
      // Build search query: "tire shop [year] [make] [model] [zipCode]"
      let query = `tire shop`;
      
      // Add vehicle info if provided
      if (dto.year && dto.make && dto.model) {
        query = `tire shop ${dto.year} ${dto.make} ${dto.model}`;
      }
      
      // Add tire size if provided
      if (dto.tireSize) {
        query = `${query} ${dto.tireSize}`;
      }
      
      // Search for tire shops near the zip code
      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      // Transform to table format
      return results.results.map((result, index) => ({
        rank: index + 1,
        shop: result.title,
        address: result.address,
        price: this.estimateTirePrice(result, dto) || 'Contact for pricing',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching tires: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateTires(dto.year, dto.make, dto.model, dto.zipCode);
    }
  }

  /**
   * Pattern C: Search service providers
   */
  async searchServiceProviders(dto: SearchServiceProvidersDto) {
    // Route to specific methods for enhanced categories
    if (dto.category === 'apartments') {
      return this.searchApartments({ zipCode: dto.zipCode, serviceType: dto.serviceType });
    }
    if (dto.category === 'moving' || dto.category === 'moving-companies') {
      return this.searchMovingCompanies({ zipCode: dto.zipCode, moveType: dto.serviceType });
    }
    if (dto.category === 'food-delivery') {
      return this.searchFoodDelivery({ zipCode: dto.zipCode, cuisine: dto.serviceType });
    }

    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for ${dto.category} - ${dto.serviceType} (ZIP: ${dto.zipCode})`);
      return this.mockServiceData.generateServiceProviders(dto.category, dto.serviceType, dto.zipCode);
    }

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
        price: result.price || this.estimateServicePrice(dto.category, dto.serviceType, result) || 'Contact for pricing',
        phone: result.phone,
        website: result.website,
        thumbnail: result.thumbnail,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching service providers: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateServiceProviders(dto.category, dto.serviceType, dto.zipCode);
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

  private estimateTirePrice(result: any, dto: SearchTiresDto): string | null {
    // Estimate tire prices based on vehicle type and shop rating
    // Higher-rated shops typically charge more
    const basePrice = result.rating && result.rating >= 4.5 
      ? '$80-150' 
      : result.rating && result.rating >= 4.0
      ? '$60-120'
      : '$50-100';
    
    // Adjust based on vehicle type (SUVs/trucks typically need larger/more expensive tires)
    const makeLower = dto.make?.toLowerCase() || '';
    const modelLower = dto.model?.toLowerCase() || '';
    
    if (modelLower.includes('truck') || modelLower.includes('pickup') || 
        modelLower.includes('suv') || modelLower.includes('rav4') || 
        modelLower.includes('highlander') || modelLower.includes('pilot') ||
        modelLower.includes('tahoe') || modelLower.includes('suburban')) {
      return '$100-200';
    }
    
    return basePrice;
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

  /**
   * Pattern B: Search car washes
   */
  async searchCarWashes(dto: SearchCarWashesDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for car washes (ZIP: ${dto.zipCode}, Type: ${dto.washType || 'basic'})`);
      return this.mockServiceData.generateCarWashes(dto.zipCode, dto.washType || 'basic');
    }

    try {
      // Build search query
      let query = `car wash`;
      if (dto.washType) {
        query = `${dto.washType} ${query}`;
      }

      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      return results.results.map((result, index) => ({
        rank: index + 1,
        carWash: result.title,
        address: result.address,
        price: result.price || this.estimateCarWashPrice(result, dto) || 'Contact for pricing',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching car washes: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateCarWashes(dto.zipCode, dto.washType || 'basic');
    }
  }

  /**
   * Pattern B: Search rental cars.
   * - When SERPER_API_KEY (or SERPAPI_KEY) is set: uses real Serper Maps data (real places, real links).
   *   Maps does not return daily rates, so price shows "Check price on site"; logos/sponsored come from partner match.
   * - When mock mode (USE_MOCK_SERVICE_DATA=true or no API key in dev): returns curated partner list with estimated prices.
   */
  async searchRentalCars(dto: SearchRentalCarsDto) {
    const pickup = dto.pickupDate || (dto.dates ? dto.dates.split(/\s*[-–]\s*/)[0]?.trim() : undefined);
    const return_ = dto.returnDate || (dto.dates ? dto.dates.split(/\s*[-–]\s*/)[1]?.trim() : undefined);

    if (this.useMockData) {
      this.logger.log(`📦 Mock mode: rental cars partner list (Location: ${dto.location}). Set SERPER_API_KEY and USE_MOCK_SERVICE_DATA=false for real Serper data.`);
      return this.mockServiceData.generateRentalCars(dto.location, pickup, return_, dto.carType);
    }

    try {
      const query = `car rental ${dto.location}`;
      const mapsResponse = await this.serpAPIMapsService.searchMaps({
        query,
        location: dto.location,
      });

      if (!mapsResponse?.results?.length) {
        this.logger.warn('Serper Maps returned no rental car results; falling back to partner list.');
        return this.mockServiceData.generateRentalCars(dto.location, pickup, return_, dto.carType);
      }

      const encodedLocation = encodeURIComponent(dto.location);
      return mapsResponse.results.map((place, index) => {
        const partner = this.mockServiceData.getRentalCarPartnerByTitle(place.title);
        const bookUrl = place.website || (partner?.bookUrl || '');
        const bookUrlWithParams = bookUrl
          ? `${bookUrl}${bookUrl.includes('?') ? '&' : '?'}pickupLocation=${encodedLocation}${pickup ? `&pickupDate=${encodeURIComponent(pickup)}` : ''}${return_ ? `&returnDate=${encodeURIComponent(return_)}` : ''}`
          : (partner ? `${partner.bookUrl}?pickupLocation=${encodedLocation}` : '');

        let logoUrl = partner?.logoUrl;
        if (!logoUrl && place.website) {
          try {
            const host = new URL(place.website).hostname.replace(/^www\./, '');
            if (host) logoUrl = `https://logo.clearbit.com/${host}`;
          } catch {
            // ignore invalid URL
          }
        }

        return {
          rank: index + 1,
          company: place.title,
          companySlug: partner?.slug || place.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          companyLogo: logoUrl,
          pricePerDayFormatted: 'Check price on site',
          totalEstimateFormatted: null,
          rating: place.rating,
          reviews: place.reviews,
          address: place.address,
          bookUrl: bookUrlWithParams || undefined,
          sponsored: partner?.sponsored ?? false,
          phone: place.phone,
        };
      });
    } catch (error: any) {
      this.logger.error(`Error searching rental cars: ${error.message}`);
      return this.mockServiceData.generateRentalCars(dto.location, pickup, return_, dto.carType);
    }
  }

  /**
   * Pattern B: Search storage units
   */
  async searchStorageUnits(dto: SearchStorageUnitsDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for storage units (ZIP: ${dto.zipCode}, Size: ${dto.size || 'standard'})`);
      return this.mockServiceData.generateStorageUnits(dto.zipCode, dto.size || 'standard');
    }

    try {
      let query = `storage units`;
      if (dto.size) {
        query = `${dto.size} ${query}`;
      }

      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      return results.results.map((result, index) => ({
        rank: index + 1,
        facility: result.title,
        address: result.address,
        price: result.price || this.estimateStoragePrice(result, dto) || 'Contact for pricing',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching storage units: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateStorageUnits(dto.zipCode, dto.size || 'standard');
    }
  }

  /**
   * Pattern B: Search meal kits
   */
  async searchMealKits(dto: SearchMealKitsDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for meal kits (ZIP: ${dto.zipCode})`);
      return this.mockServiceData.generateMealKits(dto.zipCode);
    }

    try {
      const query = `meal kit delivery`;
      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      return results.results.map((result, index) => ({
        rank: index + 1,
        company: result.title,
        address: result.address,
        price: result.price || this.estimateMealKitPrice(result) || 'Contact for pricing',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching meal kits: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateMealKits(dto.zipCode);
    }
  }

  /**
   * Pattern B: Search car insurance
   */
  async searchCarInsurance(dto: SearchCarInsuranceDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for car insurance (ZIP: ${dto.zipCode})`);
      return this.mockServiceData.generateCarInsurance(dto.zipCode, dto.vehicleYear, dto.vehicleMake, dto.vehicleModel);
    }

    try {
      let query = `car insurance`;
      if (dto.vehicleYear && dto.vehicleMake && dto.vehicleModel) {
        query = `${dto.vehicleYear} ${dto.vehicleMake} ${dto.vehicleModel} ${query}`;
      }

      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      return results.results.map((result, index) => ({
        rank: index + 1,
        company: result.title,
        address: result.address,
        price: result.price || this.estimateInsurancePrice(result, 'car') || 'Get quote',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching car insurance: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateCarInsurance(dto.zipCode, dto.vehicleYear, dto.vehicleMake, dto.vehicleModel);
    }
  }

  /**
   * Pattern B: Search renters insurance
   */
  async searchRentersInsurance(dto: SearchRentersInsuranceDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for renters insurance (ZIP: ${dto.zipCode})`);
      return this.mockServiceData.generateRentersInsurance(dto.zipCode);
    }

    try {
      const query = `renters insurance`;
      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      return results.results.map((result, index) => ({
        rank: index + 1,
        company: result.title,
        address: result.address,
        price: result.price || this.estimateInsurancePrice(result, 'renters') || 'Get quote',
        distance: result.distance || 'N/A',
        rating: result.rating,
        reviews: result.reviews,
        phone: result.phone,
        website: result.website,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching renters insurance: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateRentersInsurance(dto.zipCode);
    }
  }

  /**
   * Pattern C: Search apartments (enhanced)
   */
  async searchApartments(dto: SearchApartmentsDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for apartments (ZIP: ${dto.zipCode}, Type: ${dto.serviceType || 'all'})`);
      return this.mockServiceData.generateApartments(dto.zipCode, dto.serviceType);
    }

    try {
      let query = `apartments for rent`;
      if (dto.serviceType) {
        query = `${dto.serviceType} ${query}`;
      }

      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      return results.results.map((result, index) => ({
        id: result.placeId || `apartment-${index}`,
        name: result.title,
        businessName: result.title,
        address: result.address,
        distance: result.distance,
        rating: result.rating,
        reviewCount: result.reviews,
        hours: result.hours,
        priceRange: result.price || this.estimateApartmentPrice(result, dto) || 'Contact for pricing',
        price: result.price || this.estimateApartmentPrice(result, dto) || 'Contact for pricing',
        phone: result.phone,
        website: result.website,
        thumbnail: result.thumbnail,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching apartments: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateApartments(dto.zipCode, dto.serviceType);
    }
  }

  /**
   * Pattern C: Search moving companies (enhanced)
   */
  async searchMovingCompanies(dto: SearchMovingCompaniesDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for moving companies (ZIP: ${dto.zipCode}, Type: ${dto.moveType || 'local'})`);
      return this.mockServiceData.generateMovingCompanies(dto.zipCode, dto.moveType || 'local');
    }

    try {
      let query = `moving company`;
      if (dto.moveType === 'long-distance') {
        query = `long distance ${query}`;
      }

      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      return results.results.map((result, index) => ({
        id: result.placeId || `moving-${index}`,
        name: result.title,
        businessName: result.title,
        address: result.address,
        distance: result.distance,
        rating: result.rating,
        reviewCount: result.reviews,
        hours: result.hours,
        priceRange: result.price || this.estimateMovingPrice(result, dto) || 'Get quote',
        price: result.price || this.estimateMovingPrice(result, dto) || 'Get quote',
        phone: result.phone,
        website: result.website,
        thumbnail: result.thumbnail,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching moving companies: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateMovingCompanies(dto.zipCode, dto.moveType || 'local');
    }
  }

  /**
   * Pattern C: Search food delivery (enhanced)
   */
  async searchFoodDelivery(dto: SearchFoodDeliveryDto) {
    // Use mock data if enabled
    if (this.useMockData) {
      this.logger.log(`📦 Using mock data for food delivery (ZIP: ${dto.zipCode}, Cuisine: ${dto.cuisine || 'all'})`);
      return this.mockServiceData.generateFoodDelivery(dto.zipCode, dto.cuisine);
    }

    try {
      let query = `food delivery`;
      if (dto.cuisine) {
        query = `${dto.cuisine} ${query}`;
      }

      const results = await this.serpAPIMapsService.searchMaps({
        query,
        zipCode: dto.zipCode,
      });

      return results.results.map((result, index) => ({
        id: result.placeId || `food-delivery-${index}`,
        name: result.title,
        businessName: result.title,
        address: result.address,
        distance: result.distance,
        rating: result.rating,
        reviewCount: result.reviews,
        hours: result.hours,
        priceRange: result.price || this.estimateFoodDeliveryPrice(result) || 'View menu',
        price: result.price || this.estimateFoodDeliveryPrice(result) || 'View menu',
        phone: result.phone,
        website: result.website,
        thumbnail: result.thumbnail,
      }));
    } catch (error: any) {
      this.logger.error(`Error searching food delivery: ${error.message}`);
      this.logger.warn('⚠️ Falling back to mock data due to API error');
      return this.mockServiceData.generateFoodDelivery(dto.zipCode, dto.cuisine);
    }
  }

  // Helper methods for price estimation
  private estimateCarWashPrice(result: any, dto: SearchCarWashesDto): string {
    const basePrices: Record<string, string> = {
      basic: '$8-15',
      deluxe: '$15-25',
      premium: '$25-40',
      full: '$40-60',
    };
    return basePrices[dto.washType || 'basic'] || '$10-20';
  }

  private estimateRentalCarPrice(result: any): string {
    if (result.price === '$') return '$30-50/day';
    if (result.price === '$$') return '$50-80/day';
    if (result.price === '$$$') return '$80-120/day';
    if (result.price === '$$$$') return '$120+/day';
    return '$40-70/day';
  }

  private estimateStoragePrice(result: any, dto: SearchStorageUnitsDto): string {
    const sizePrices: Record<string, string> = {
      small: '$50-100/month',
      medium: '$100-200/month',
      large: '$200-400/month',
      'extra-large': '$400-600/month',
    };
    return sizePrices[dto.size || 'medium'] || '$100-200/month';
  }

  private estimateMealKitPrice(result: any): string {
    if (result.price === '$') return '$8-12/meal';
    if (result.price === '$$') return '$12-18/meal';
    if (result.price === '$$$') return '$18-25/meal';
    return '$10-15/meal';
  }

  private estimateInsurancePrice(result: any, type: 'car' | 'renters'): string {
    if (type === 'car') {
      return '$100-200/month';
    } else {
      return '$15-30/month';
    }
  }

  private estimateApartmentPrice(result: any, dto: SearchApartmentsDto): string {
    const typePrices: Record<string, string> = {
      studio: '$800-1500/month',
      '1br': '$1000-2000/month',
      '2br': '$1500-3000/month',
      '3br': '$2000-4000/month',
    };
    return typePrices[dto.serviceType || '1br'] || '$1000-2000/month';
  }

  private estimateMovingPrice(result: any, dto: SearchMovingCompaniesDto): string {
    if (dto.moveType === 'long-distance') {
      return '$1000-5000';
    }
    return '$300-1000';
  }

  private estimateFoodDeliveryPrice(result: any): string {
    if (result.price === '$') return '$10-20';
    if (result.price === '$$') return '$20-40';
    if (result.price === '$$$') return '$40-80';
    if (result.price === '$$$$') return '$80+';
    return '$15-30';
  }
}


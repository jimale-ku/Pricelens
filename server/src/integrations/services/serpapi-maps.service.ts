/**
 * SerpAPI Maps Service
 * 
 * Uses SerpAPI's Google Maps engine to search for:
 * - Pattern B: Location-based services (gas stations, gyms, hotels, etc.)
 * - Pattern C: Service providers (salons, massage, nail salons, etc.)
 * 
 * SerpAPI Google Maps API Documentation:
 * https://serpapi.com/google-maps-api
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SerpAPIMapsSearchParams {
  query: string;
  location?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in meters
  type?: string; // e.g., 'gas_station', 'gym', 'hair_salon'
  sort?: 'rating' | 'distance' | 'relevance';
}

export interface SerpAPIMapsResult {
  title: string;
  address: string;
  rating?: number;
  reviews?: number;
  price?: string; // $, $$, $$$, $$$$
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  distance?: string; // e.g., "0.5 mi"
  hours?: string;
  placeId?: string;
  thumbnail?: string;
  category?: string;
}

export interface SerpAPIMapsResponse {
  results: SerpAPIMapsResult[];
  total: number;
  searchMetadata: {
    query: string;
    location: string;
    engine: string;
  };
}

@Injectable()
export class SerpAPIMapsService {
  private readonly logger = new Logger(SerpAPIMapsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://serpapi.com/search.json';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SERPAPI_KEY') || '';
    
    if (!this.apiKey) {
      this.logger.warn('⚠️ SERPAPI_KEY not configured. Pattern B & C searches will not work.');
    }
  }

  /**
   * Search for locations/services using Google Maps via SerpAPI
   */
  async searchMaps(params: SerpAPIMapsSearchParams): Promise<SerpAPIMapsResponse> {
    if (!this.apiKey) {
      throw new Error('SERPAPI_KEY not configured');
    }

    try {
      // Build query string
      const queryParams = new URLSearchParams({
        engine: 'google_maps',
        api_key: this.apiKey,
        q: params.query,
      });

      // Add location (ZIP code or city)
      if (params.location) {
        queryParams.append('location', params.location);
      } else if (params.zipCode) {
        queryParams.append('location', params.zipCode);
      } else if (params.latitude && params.longitude) {
        queryParams.append('ll', `@${params.latitude},${params.longitude}`);
      }

      // Add type filter (for specific business types)
      if (params.type) {
        queryParams.append('type', params.type);
      }

      // Add radius (in meters, max 50000)
      if (params.radius) {
        queryParams.append('radius', Math.min(params.radius, 50000).toString());
      } else {
        // Default radius: 10km
        queryParams.append('radius', '10000');
      }

      // Add sorting
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }

      const url = `${this.baseUrl}?${queryParams.toString()}`;
      this.logger.debug(`🔍 SerpAPI Maps search: ${url.replace(this.apiKey, '***')}`);

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ SerpAPI Maps request failed: ${response.status} - ${errorText}`);
        throw new Error(`SerpAPI Maps request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform SerpAPI response to our format
      const results = this.transformResults(data);
      
      return {
        results,
        total: results.length,
        searchMetadata: {
          query: params.query,
          location: params.location || params.zipCode || 'Unknown',
          engine: 'google_maps',
        },
      };
    } catch (error: any) {
      this.logger.error(`❌ SerpAPI Maps search error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Transform SerpAPI Google Maps response to our format
   */
  private transformResults(data: any): SerpAPIMapsResult[] {
    const results: SerpAPIMapsResult[] = [];

    // SerpAPI Google Maps returns results in 'local_results' array
    const localResults = data.local_results || [];

    for (const result of localResults) {
      results.push({
        title: result.title || 'Unknown',
        address: result.address || '',
        rating: result.rating ? parseFloat(result.rating.toString()) : undefined,
        reviews: result.reviews ? parseInt(result.reviews.toString().replace(/[^0-9]/g, '')) : undefined,
        price: result.price || undefined,
        phone: result.phone || undefined,
        website: result.website || undefined,
        latitude: result.gps_coordinates?.latitude,
        longitude: result.gps_coordinates?.longitude,
        distance: result.distance || undefined,
        hours: result.hours || undefined,
        placeId: result.data_id || undefined,
        thumbnail: result.thumbnail || undefined,
        category: result.type || undefined,
      });
    }

    return results;
  }

  /**
   * Search for gas stations
   */
  async searchGasStations(zipCode: string, gasType?: string): Promise<SerpAPIMapsResponse> {
    const query = gasType 
      ? `${gasType} gas station near ${zipCode}`
      : `gas station near ${zipCode}`;
    
    return this.searchMaps({
      query,
      zipCode,
      type: 'gas_station',
      sort: 'distance',
    });
  }

  /**
   * Search for gyms
   */
  async searchGyms(zipCode: string, membershipType?: string): Promise<SerpAPIMapsResponse> {
    const query = membershipType
      ? `${membershipType} gym near ${zipCode}`
      : `gym near ${zipCode}`;
    
    return this.searchMaps({
      query,
      zipCode,
      type: 'gym',
      sort: 'rating',
    });
  }

  /**
   * Search for hotels
   */
  async searchHotels(location: string, checkIn?: string, checkOut?: string): Promise<SerpAPIMapsResponse> {
    const query = `hotels in ${location}`;
    
    return this.searchMaps({
      query,
      location,
      type: 'lodging',
      sort: 'rating',
    });
  }

  /**
   * Search for service providers (Pattern C)
   */
  async searchServiceProviders(
    serviceType: string,
    zipCode: string,
    category?: string
  ): Promise<SerpAPIMapsResponse> {
    const query = `${serviceType} near ${zipCode}`;
    
    // Map service types to Google Maps types
    const typeMap: Record<string, string> = {
      'haircuts': 'hair_salon',
      'massage': 'spa',
      'nail-salons': 'beauty_salon',
      'spa': 'spa',
      'apartments': 'real_estate_agency',
      'moving': 'moving_company',
      'food-delivery': 'restaurant',
      'services': 'establishment',
    };

    return this.searchMaps({
      query,
      zipCode,
      type: category ? typeMap[category] : undefined,
      sort: 'rating',
    });
  }
}




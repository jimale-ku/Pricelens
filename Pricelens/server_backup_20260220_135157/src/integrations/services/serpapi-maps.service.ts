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
import { SerperCacheService } from './serper-cache.service';

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
  private readonly serperApiKey: string;
  private readonly serperBaseUrl = 'https://google.serper.dev/maps';
  private readonly serperShoppingUrl = 'https://google.serper.dev/shopping';
  private readonly serperSearchUrl = 'https://google.serper.dev/search';

  constructor(
    private configService: ConfigService,
    private readonly serperCache: SerperCacheService,
  ) {
    this.apiKey = this.configService.get<string>('SERPAPI_KEY') || process.env.SERPAPI_KEY || '';
    // Only use SERPER_API_KEY if explicitly set (don't fallback to SERPAPI_KEY - they're different services)
    this.serperApiKey = this.configService.get<string>('SERPER_API_KEY') || process.env.SERPER_API_KEY || '';
    
    if (!this.apiKey && !this.serperApiKey) {
      this.logger.warn('⚠️ No maps provider configured. Add SERPAPI_KEY (for SerpAPI) or SERPER_API_KEY (for Serper). Pattern B & C searches will not work.');
    } else if (this.serperApiKey) {
      this.logger.log('✅ Serper Maps enabled for Pattern B & C searches');
    } else if (this.apiKey) {
      this.logger.log('✅ SerpAPI Maps enabled for Pattern B & C searches');
    }
  }

  /**
   * Search for locations/services using Google Maps via SerpAPI
   */
  async searchMaps(params: SerpAPIMapsSearchParams): Promise<SerpAPIMapsResponse> {
    if (!this.apiKey && !this.serperApiKey) {
      throw new Error('SERPER_API_KEY or SERPAPI_KEY not configured');
    }

    try {
      // Prefer Serper when configured (matches current project direction)
      if (this.serperApiKey) {
        const body = { q: params.query, gl: 'us', num: 20 };
        const cacheKey = this.serperCache.buildKey('maps', body);
        const cached = await this.serperCache.get(cacheKey);
        if (cached != null) {
          const results = this.transformSerperResults(cached as any);
          return {
            results,
            total: results.length,
            searchMetadata: {
              query: params.query,
              location: params.location || params.zipCode || 'US',
              engine: 'serper_maps',
            },
          };
        }

        const res = await fetch(this.serperBaseUrl, {
          method: 'POST',
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          this.logger.error(`❌ Serper Maps request failed: ${res.status} - ${errorText}`);
          throw new Error(`Serper Maps request failed: ${res.status}`);
        }

        const data = await res.json();
        await this.serperCache.set(cacheKey, 'maps', data);
        const results = this.transformSerperResults(data);

        return {
          results,
          total: results.length,
          searchMetadata: {
            query: params.query,
            location: params.location || params.zipCode || 'US',
            engine: 'serper_maps',
          },
        };
      }

      // Build query string - include location in query to avoid zoom parameter requirement
      let query = params.query;
      
      // If we have a ZIP code or location, include it in the query string
      // This avoids the need for the `z` or `m` parameter that SerpAPI requires with `location`
      if (params.zipCode) {
        // Clean ZIP code (remove trailing spaces/plus signs)
        const cleanZip = params.zipCode.trim().replace(/\+$/, '');
        // If location isn't already in query, append it
        if (!query.includes(cleanZip)) {
          query = `${query} ${cleanZip}`;
        }
      } else if (params.location) {
        const cleanLocation = params.location.trim().replace(/\+$/, '');
        if (!query.includes(cleanLocation)) {
          query = `${query} ${cleanLocation}`;
        }
      }
      
      const queryParams = new URLSearchParams({
        engine: 'google_maps',
        api_key: this.apiKey,
        q: query,
      });

      // Only use location parameter with coordinates (which don't require zoom)
      // For ZIP codes, we include them in the query string above
      if (params.latitude && params.longitude) {
        queryParams.append('ll', `@${params.latitude},${params.longitude}`);
      }

      // Note: type parameter is commented out because it's not supported in all SerpAPI plans
      // and causes "is not included in the list" error. The query string with location should be sufficient.
      // if (params.type) {
      //   queryParams.append('type', params.type);
      // }

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
   * Transform Serper Maps response to our format
   * Serper returns results in a `places` array.
   */
  private transformSerperResults(data: any): SerpAPIMapsResult[] {
    const places = data?.places || [];
    const results: SerpAPIMapsResult[] = [];

    for (const p of places) {
      results.push({
        title: p.title || p.name || 'Unknown',
        address: p.address || '',
        rating: typeof p.rating === 'number' ? p.rating : undefined,
        reviews: typeof p.ratingCount === 'number' ? p.ratingCount : undefined,
        price: undefined, // Not consistently provided by Serper maps
        phone: p.phoneNumber || undefined,
        website: p.website || undefined,
        latitude: typeof p.latitude === 'number' ? p.latitude : undefined,
        longitude: typeof p.longitude === 'number' ? p.longitude : undefined,
        distance: undefined,
        hours: p.openingHours ? JSON.stringify(p.openingHours) : undefined,
        placeId: p.placeId || p.cid || undefined,
        thumbnail: p.thumbnailUrl || undefined,
        category: p.type || (Array.isArray(p.types) ? p.types[0] : undefined),
      });
    }

    return results;
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
    // Clean ZIP code
    const cleanZip = zipCode.trim().replace(/\+$/, '').trim();
    
    // Include ZIP in query string instead of using location parameter
    const query = gasType 
      ? `${gasType} gas station ${cleanZip}`
      : `gas station ${cleanZip}`;
    
    return this.searchMaps({
      query,
      zipCode: cleanZip,
      // Don't use type parameter - not supported in all plans
      sort: 'distance',
    });
  }

  /**
   * Search for gyms
   */
  async searchGyms(zipCode: string, membershipType?: string): Promise<SerpAPIMapsResponse> {
    // Clean ZIP code
    const cleanZip = zipCode.trim().replace(/\+$/, '').trim();
    
    // Include ZIP in query string instead of using location parameter
    const query = membershipType
      ? `${membershipType} gym ${cleanZip}`
      : `gym ${cleanZip}`;
    
    const mapsResponse = await this.searchMaps({
      query,
      zipCode: cleanZip,
      sort: 'rating',
    });

    // Enrich with prices from Serper Shopping if available
    if (this.serperApiKey && mapsResponse.results.length > 0) {
      try {
        const pricesMap = await this.fetchServicePrices(`gym membership ${cleanZip}`, mapsResponse.results);
        mapsResponse.results = mapsResponse.results.map(result => {
          const servicePrices = pricesMap.get(result.title);
          if (servicePrices && servicePrices.length > 0) {
            const lowestPrice = servicePrices.reduce((min, p) => 
              p.price < min.price ? p : min
            );
            result.price = `$${lowestPrice.price.toFixed(2)}/month (from ${lowestPrice.store})`;
          }
          return result;
        });
      } catch (error: any) {
        this.logger.warn(`Failed to fetch gym prices: ${error.message}`);
      }
    }

    return mapsResponse;
  }

  /**
   * Search for hotels
   */
  async searchHotels(location: string, checkIn?: string, checkOut?: string): Promise<SerpAPIMapsResponse> {
    const query = `hotels in ${location}`;
    
    const mapsResponse = await this.searchMaps({
      query,
      location,
      sort: 'rating',
    });

    // Enrich with prices from Serper Shopping if available
    if (this.serperApiKey && mapsResponse.results.length > 0) {
      try {
        const pricesMap = await this.fetchHotelPrices(location, mapsResponse.results);
        // Merge prices into results
        mapsResponse.results = mapsResponse.results.map(result => {
          const hotelPrices = pricesMap.get(result.title);
          if (hotelPrices && hotelPrices.length > 0) {
            // Use lowest price found
            const lowestPrice = hotelPrices.reduce((min, p) => 
              p.price < min.price ? p : min
            );
            result.price = `$${lowestPrice.price.toFixed(2)}/night (from ${lowestPrice.store})`;
          }
          return result;
        });
      } catch (error: any) {
        this.logger.warn(`Failed to fetch hotel prices: ${error.message}`);
      }
    }

    return mapsResponse;
  }

  /**
   * Fetch hotel prices from Serper Shopping
   * Returns a map of hotel name -> array of {price, store}
   */
  private async fetchHotelPrices(
    location: string,
    hotels: SerpAPIMapsResult[]
  ): Promise<Map<string, Array<{ price: number; store: string }>>> {
    const pricesMap = new Map<string, Array<{ price: number; store: string }>>();

    if (!this.serperApiKey) return pricesMap;

    try {
      const body = { q: `hotels in ${location}`, gl: 'us', num: 20 };
      const cacheKey = this.serperCache.buildKey('shopping', body);
      let data: any = await this.serperCache.get(cacheKey);
      if (data == null) {
        const res = await fetch(this.serperShoppingUrl, {
          method: 'POST',
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) return pricesMap;
        data = await res.json();
        await this.serperCache.set(cacheKey, 'shopping', data);
      }
      const shoppingResults = data.shopping || [];

      // Match shopping results to hotel names from Maps
      for (const item of shoppingResults) {
        const title = (item.title || '').toLowerCase();
        const priceText = item.price || item.extractedPrice || '';
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
        const store = item.source || item.merchant || 'Unknown';

        if (!price) continue;

        // Try to match to hotel from Maps results
        for (const hotel of hotels) {
          const hotelName = hotel.title.toLowerCase();
          // Match if shopping title contains hotel name or vice versa
          if (title.includes(hotelName) || hotelName.includes(title.split(' ')[0])) {
            if (!pricesMap.has(hotel.title)) {
              pricesMap.set(hotel.title, []);
            }
            pricesMap.get(hotel.title)!.push({ price, store });
            break;
          }
        }
      }
    } catch (error: any) {
      this.logger.warn(`Error fetching hotel prices: ${error.message}`);
    }

    return pricesMap;
  }

  /**
   * Fetch service prices from Serper Shopping (generic - works for gyms, spas, etc.)
   * Returns a map of service name -> array of {price, store}
   */
  private async fetchServicePrices(
    shoppingQuery: string,
    services: SerpAPIMapsResult[]
  ): Promise<Map<string, Array<{ price: number; store: string }>>> {
    const pricesMap = new Map<string, Array<{ price: number; store: string }>>();

    if (!this.serperApiKey) return pricesMap;

    try {
      const body = { q: shoppingQuery, gl: 'us', num: 20 };
      const cacheKey = this.serperCache.buildKey('shopping', body);
      let data: any = await this.serperCache.get(cacheKey);
      if (data == null) {
        const res = await fetch(this.serperShoppingUrl, {
          method: 'POST',
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) return pricesMap;
        data = await res.json();
        await this.serperCache.set(cacheKey, 'shopping', data);
      }
      const shoppingResults = data.shopping || [];

      // Match shopping results to service names from Maps
      for (const item of shoppingResults) {
        const title = (item.title || '').toLowerCase();
        const priceText = item.price || item.extractedPrice || '';
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
        const store = item.source || item.merchant || 'Unknown';

        if (!price) continue;

        // Try to match to service from Maps results
        for (const service of services) {
          const serviceName = service.title.toLowerCase();
          // Match if shopping title contains service name keywords
          const serviceKeywords = serviceName.split(' ').filter(w => w.length > 3);
          if (serviceKeywords.some(kw => title.includes(kw)) || 
              title.includes(serviceName.split(' ')[0])) {
            if (!pricesMap.has(service.title)) {
              pricesMap.set(service.title, []);
            }
            pricesMap.get(service.title)!.push({ price, store });
            break;
          }
        }
      }
    } catch (error: any) {
      this.logger.warn(`Error fetching service prices: ${error.message}`);
    }

    return pricesMap;
  }

  /**
   * Search for flights/airfare
   */
  async searchFlights(
    origin: string,
    destination: string,
    departDate?: string,
    returnDate?: string
  ): Promise<SerpAPIMapsResponse> {
    // Try to convert city names to airport codes if needed
    // For now, use Google Search engine which handles city names better
    const query = `flights from ${origin} to ${destination}`;
    if (departDate) {
      // Ensure date is in the future
      const date = new Date(departDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        // Set to tomorrow if date is in the past
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        departDate = tomorrow.toISOString().split('T')[0];
      }
    }

    const fullQuery = query + (departDate ? ` ${departDate}` : '') + (returnDate ? ` return ${returnDate}` : '');

    // Prefer Serper when configured (same key as Maps)
    if (this.serperApiKey) {
      try {
        const body = { q: fullQuery, gl: 'us', num: 20 };
        const cacheKey = this.serperCache.buildKey('search', body);
        let data: any = await this.serperCache.get(cacheKey);
        if (data == null) {
          const res = await fetch(this.serperSearchUrl, {
            method: 'POST',
            headers: {
              'X-API-KEY': this.serperApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            throw new Error(`Serper search failed: ${res.status}`);
          }
          data = await res.json();
          await this.serperCache.set(cacheKey, 'search', data);
        }
        const organic = data.organic || [];
        const results = organic
          .filter((r: any) => (r.title || '').toLowerCase().includes('flight') || (r.title || '').toLowerCase().includes('airline') || (r.link || '').includes('flight'))
          .slice(0, 20)
          .map((r: any, index: number) => ({
            title: r.title || `Flight option ${index + 1}`,
            address: `${origin} to ${destination}`,
            rating: undefined,
            reviews: undefined,
            phone: undefined,
            website: r.link,
            distance: undefined,
          }));
        return {
          results,
          total: results.length,
          searchMetadata: { query: fullQuery, location: `${origin} to ${destination}`, engine: 'serper_search' },
        };
      } catch (err: any) {
        this.logger.warn(`Serper flight search failed: ${err.message}`);
      }
    }

    // Fallback: SerpAPI Google Search (requires valid SERPAPI key)
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?${new URLSearchParams({
          engine: 'google',
          q: fullQuery,
          api_key: this.apiKey,
        }).toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const organicResults = data.organic_results || [];
      const results = organicResults
        .filter((r: any) => r.title?.toLowerCase().includes('flight') || r.title?.toLowerCase().includes('airline'))
        .slice(0, 20)
        .map((r: any, index: number) => ({
          title: r.title || `Flight Option ${index + 1}`,
          address: `${origin} to ${destination}`,
          rating: null,
          reviews: null,
          phone: null,
          website: r.link,
          distance: null,
        }));

      return {
        results,
        total: results.length,
        searchMetadata: { query: fullQuery, location: `${origin} to ${destination}`, engine: 'google' },
      };
    } catch (error: any) {
      this.logger.error(`Error searching flights: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for service providers (Pattern C)
   */
  async searchServiceProviders(
    serviceType: string,
    zipCode: string,
    category?: string
  ): Promise<SerpAPIMapsResponse> {
    // Clean ZIP code (remove trailing spaces, plus signs, etc.)
    const cleanZip = zipCode.trim().replace(/\+$/, '').trim();
    
    // Build query with service type and ZIP code included
    // For haircuts, use "hair salon" instead of just the service type for better results
    let query: string;
    let shoppingQuery: string;
    if (category === 'haircuts') {
      query = `hair salon ${cleanZip}`;
      shoppingQuery = `haircut ${serviceType} ${cleanZip}`;
    } else if (category === 'spa') {
      query = `spa ${cleanZip}`;
      shoppingQuery = `spa services ${cleanZip}`;
    } else if (category === 'nail-salons') {
      query = `nail salon ${cleanZip}`;
      shoppingQuery = `${serviceType} nail salon ${cleanZip}`;
    } else {
      query = `${serviceType} ${cleanZip}`;
      shoppingQuery = `${serviceType} ${cleanZip}`;
    }
    
    const mapsResponse = await this.searchMaps({
      query,
      zipCode: cleanZip,
      sort: 'rating',
    });

    // Enrich with prices from Serper Shopping if available
    if (this.serperApiKey && mapsResponse.results.length > 0) {
      try {
        const pricesMap = await this.fetchServicePrices(shoppingQuery, mapsResponse.results);
        mapsResponse.results = mapsResponse.results.map(result => {
          const servicePrices = pricesMap.get(result.title);
          if (servicePrices && servicePrices.length > 0) {
            const lowestPrice = servicePrices.reduce((min, p) => 
              p.price < min.price ? p : min
            );
            // Format price based on service type
            const priceUnit = category === 'spa' ? '/session' : 
                            category === 'haircuts' ? '' : 
                            category === 'nail-salons' ? '' : '/service';
            result.price = `$${lowestPrice.price.toFixed(2)}${priceUnit} (from ${lowestPrice.store})`;
          }
          return result;
        });
      } catch (error: any) {
        this.logger.warn(`Failed to fetch service prices: ${error.message}`);
      }
    }

    return mapsResponse;
  }
}




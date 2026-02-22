/**
 * Cardog Gas Price Service
 * 
 * Alternative to ScrapingBee - uses Cardog API for real gas station prices
 * Structured API (not scraping) - more reliable
 * 
 * Documentation: https://docs.cardog.ai/reference/fuel
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CardogGasStation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  regular?: number;
  premium?: number;
  diesel?: number;
  cashPrice?: number;
  creditPrice?: number;
  amenities?: string[];
  distance?: number;
}

export interface CardogGasPriceResponse {
  stations: CardogGasStation[];
  location: string;
  lastUpdated: Date;
}

@Injectable()
export class CardogGasPriceService {
  private readonly logger = new Logger(CardogGasPriceService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.cardog.ai/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CARDOG_API_KEY') || '';
    
    if (!this.apiKey) {
      this.logger.warn('⚠️ CARDOG_API_KEY not configured. Cardog gas prices will not work.');
    }
  }

  /**
   * Get gas prices from Cardog API
   * Requires latitude/longitude (not ZIP code)
   */
  async getGasPrices(
    latitude: number,
    longitude: number,
    radius: number = 5000, // meters
    fuelType?: string
  ): Promise<CardogGasPriceResponse | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/fuel?lat=${latitude}&lng=${longitude}&radius=${radius}`;
      
      this.logger.debug(`🔍 Cardog gas price search: lat=${latitude}, lng=${longitude}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cardog API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Transform Cardog response to our format
      return this.transformCardogResponse(data, latitude, longitude);
    } catch (error: any) {
      this.logger.error(`Cardog gas price error: ${error.message}`);
      return null;
    }
  }

  /**
   * Get gas prices by ZIP code (requires geocoding first)
   */
  async getGasPricesByZipCode(zipCode: string, fuelType?: string): Promise<CardogGasPriceResponse | null> {
    // First, geocode ZIP to lat/lng
    // You can use a geocoding service or Google Maps Geocoding API
    // For now, return null - implement geocoding separately
    this.logger.warn('Cardog requires lat/lng, not ZIP. Implement geocoding first.');
    return null;
  }

  /**
   * Transform Cardog response to our format
   */
  private transformCardogResponse(
    data: any,
    latitude: number,
    longitude: number
  ): CardogGasPriceResponse {
    const stations: CardogGasStation[] = [];

    // Adjust based on actual Cardog API response structure
    const results = data.stations || data.data || data.results || [];

    for (const item of results) {
      stations.push({
        name: item.name || item.stationName || 'Unknown Station',
        address: item.address || item.location || '',
        latitude: item.latitude || item.lat || latitude,
        longitude: item.longitude || item.lng || longitude,
        regular: this.parsePrice(item.regular || item.regularPrice),
        premium: this.parsePrice(item.premium || item.premiumPrice),
        diesel: this.parsePrice(item.diesel || item.dieselPrice),
        cashPrice: this.parsePrice(item.cashPrice),
        creditPrice: this.parsePrice(item.creditPrice),
        amenities: item.amenities || [],
        distance: item.distance || this.calculateDistance(
          latitude,
          longitude,
          item.latitude || item.lat,
          item.longitude || item.lng
        ),
      });
    }

    return {
      stations,
      location: `${latitude},${longitude}`,
      lastUpdated: new Date(),
    };
  }

  /**
   * Parse price string to number
   */
  private parsePrice(price: string | number | undefined): number | undefined {
    if (!price) return undefined;
    
    if (typeof price === 'number') return price;
    
    const cleaned = price.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}




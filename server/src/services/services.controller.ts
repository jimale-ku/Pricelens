/**
 * Services Controller
 * 
 * API endpoints for Pattern B (location-based) and Pattern C (service listings)
 */

import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly servicesService: ServicesService) {}

  /**
   * Pattern B: Search gas stations
   * GET /services/gas-stations?zipCode=90210&gasType=regular
   */
  @Get('gas-stations')
  async searchGasStations(
    @Query('zipCode') zipCode: string,
    @Query('gasType') gasType?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    return this.servicesService.searchGasStations({ zipCode, gasType });
  }

  /**
   * Pattern B: Search gyms
   * GET /services/gyms?zipCode=90210&membershipType=basic
   */
  @Get('gyms')
  async searchGyms(
    @Query('zipCode') zipCode: string,
    @Query('membershipType') membershipType?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    return this.servicesService.searchGyms({ zipCode, membershipType });
  }

  /**
   * Pattern B: Search hotels
   * GET /services/hotels?location=Los+Angeles&checkIn=2024-01-15&checkOut=2024-01-20
   */
  @Get('hotels')
  async searchHotels(
    @Query('location') location: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('guests') guests?: number,
  ) {
    if (!location) {
      throw new Error('Location is required');
    }

    return this.servicesService.searchHotels({ location, checkIn, checkOut, guests });
  }

  /**
   * Pattern C: Search service providers
   * GET /services/providers?category=haircuts&serviceType=mens&zipCode=90210
   */
  @Get('providers')
  async searchServiceProviders(
    @Query('category') category: string,
    @Query('serviceType') serviceType: string,
    @Query('zipCode') zipCode: string,
  ) {
    if (!category || !serviceType || !zipCode) {
      throw new Error('Category, serviceType, and zipCode are required');
    }

    return this.servicesService.searchServiceProviders({
      category,
      serviceType,
      zipCode,
    });
  }

  /**
   * Generic Pattern B search endpoint
   * GET /services/search?category=gas-stations&zipCode=90210&...
   */
  @Get('search')
  async search(
    @Query('category') category: string,
    @Query('zipCode') zipCode?: string,
    @Query('location') location?: string,
    @Query() params?: Record<string, any>,
  ) {
    // Provide default empty object to safely access properties
    const queryParams = params || {};
    
    // Route to appropriate method based on category
    switch (category) {
      case 'gas-stations':
        return this.searchGasStations(zipCode || '', queryParams.gasType);
      
      case 'gym':
        return this.searchGyms(zipCode || '', queryParams.membershipType);
      
      case 'hotels':
        return this.searchHotels(location || zipCode || '', queryParams.checkIn, queryParams.checkOut, queryParams.guests);
      
      default:
        throw new Error(`Category ${category} not supported`);
    }
  }
}


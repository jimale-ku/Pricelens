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

    // Clean ZIP code (remove trailing spaces, plus signs, etc.)
    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();

    return this.servicesService.searchGasStations({ zipCode: cleanZipCode, gasType });
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

    // Clean ZIP code (remove trailing spaces, plus signs, etc.)
    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();

    return this.servicesService.searchGyms({ zipCode: cleanZipCode, membershipType });
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

    // Clean ZIP code (remove trailing spaces, plus signs, etc.)
    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();

    return this.servicesService.searchServiceProviders({
      category,
      serviceType,
      zipCode: cleanZipCode,
    });
  }

  /**
   * Pattern B: Search airfare/flights
   * GET /services/airfare?origin=JFK&destination=LAX&departDate=2024-03-15&returnDate=2024-03-20&passengers=2
   */
  @Get('airfare')
  async searchAirfare(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('departDate') departDate?: string,
    @Query('returnDate') returnDate?: string,
    @Query('passengers') passengers?: number,
  ) {
    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    return this.servicesService.searchAirfare({ origin, destination, departDate, returnDate, passengers });
  }

  /**
   * Pattern B: Search oil change shops
   * GET /services/oil-changes?zipCode=90210&vehicleType=sedan
   */
  @Get('oil-changes')
  async searchOilChanges(
    @Query('zipCode') zipCode: string,
    @Query('vehicleType') vehicleType?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    // Clean ZIP code (remove trailing spaces, plus signs, etc.)
    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();

    return this.servicesService.searchOilChanges({ zipCode: cleanZipCode, vehicleType });
  }

  /**
   * Pattern B: Search tires
   * GET /services/tires?year=2020&make=Toyota&model=RAV4&tireSize=P225/65R17&zipCode=90210
   */
  @Get('tires')
  async searchTires(
    @Query('year') year: string,
    @Query('make') make: string,
    @Query('model') model: string,
    @Query('tireSize') tireSize?: string,
    @Query('zipCode') zipCode?: string,
  ) {
    if (!year || !make || !model || !zipCode) {
      throw new Error('Year, make, model, and zipCode are required');
    }

    // Clean ZIP code
    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();

    return this.servicesService.searchTires({
      year: year.trim(),
      make: make.trim(),
      model: model.trim(),
      tireSize: tireSize?.trim(),
      zipCode: cleanZipCode,
    });
  }

  /**
   * Pattern B: Search car washes
   * GET /services/car-washes?zipCode=90210&washType=basic
   */
  @Get('car-washes')
  async searchCarWashes(
    @Query('zipCode') zipCode: string,
    @Query('washType') washType?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();
    return this.servicesService.searchCarWashes({ zipCode: cleanZipCode, washType });
  }

  /**
   * Pattern B: Search rental cars
   * GET /services/rental-cars?location=Los+Angeles&pickupDate=2024-03-15&returnDate=2024-03-20
   */
  @Get('rental-cars')
  async searchRentalCars(
    @Query('location') location: string,
    @Query('pickupDate') pickupDate?: string,
    @Query('returnDate') returnDate?: string,
  ) {
    if (!location) {
      throw new Error('Location is required');
    }

    return this.servicesService.searchRentalCars({ location, pickupDate, returnDate });
  }

  /**
   * Pattern B: Search storage units
   * GET /services/storage?zipCode=90210&size=medium
   */
  @Get('storage')
  async searchStorageUnits(
    @Query('zipCode') zipCode: string,
    @Query('size') size?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();
    return this.servicesService.searchStorageUnits({ zipCode: cleanZipCode, size });
  }

  /**
   * Pattern B: Search meal kits
   * GET /services/meal-kits?zipCode=90210
   */
  @Get('meal-kits')
  async searchMealKits(
    @Query('zipCode') zipCode: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();
    return this.servicesService.searchMealKits({ zipCode: cleanZipCode });
  }

  /**
   * Pattern B: Search car insurance
   * GET /services/car-insurance?zipCode=90210&vehicleYear=2020&vehicleMake=Toyota&vehicleModel=RAV4
   */
  @Get('car-insurance')
  async searchCarInsurance(
    @Query('zipCode') zipCode: string,
    @Query('vehicleYear') vehicleYear?: string,
    @Query('vehicleMake') vehicleMake?: string,
    @Query('vehicleModel') vehicleModel?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();
    return this.servicesService.searchCarInsurance({
      zipCode: cleanZipCode,
      vehicleYear,
      vehicleMake,
      vehicleModel,
    });
  }

  /**
   * Pattern B: Search renters insurance
   * GET /services/renters-insurance?zipCode=90210
   */
  @Get('renters-insurance')
  async searchRentersInsurance(
    @Query('zipCode') zipCode: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();
    return this.servicesService.searchRentersInsurance({ zipCode: cleanZipCode });
  }

  /**
   * Pattern C: Search apartments (enhanced)
   * GET /services/apartments?zipCode=90210&serviceType=1br
   */
  @Get('apartments')
  async searchApartments(
    @Query('zipCode') zipCode: string,
    @Query('serviceType') serviceType?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();
    return this.servicesService.searchApartments({ zipCode: cleanZipCode, serviceType });
  }

  /**
   * Pattern C: Search moving companies (enhanced)
   * GET /services/moving?zipCode=90210&moveType=local
   */
  @Get('moving')
  async searchMovingCompanies(
    @Query('zipCode') zipCode: string,
    @Query('moveType') moveType?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();
    return this.servicesService.searchMovingCompanies({ zipCode: cleanZipCode, moveType });
  }

  /**
   * Pattern C: Search food delivery (enhanced)
   * GET /services/food-delivery?zipCode=90210&cuisine=italian
   */
  @Get('food-delivery')
  async searchFoodDelivery(
    @Query('zipCode') zipCode: string,
    @Query('cuisine') cuisine?: string,
  ) {
    if (!zipCode) {
      throw new Error('ZIP code is required');
    }

    const cleanZipCode = zipCode.trim().replace(/\+$/, '').trim();
    return this.servicesService.searchFoodDelivery({ zipCode: cleanZipCode, cuisine });
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
      
      case 'tires':
        if (!queryParams.year || !queryParams.make || !queryParams.model || !zipCode) {
          throw new Error('Year, make, model, and zipCode are required for tire search');
        }
        // Clean ZIP code
        const cleanZipCode = (zipCode || '').trim().replace(/\+$/, '').trim();
        return this.servicesService.searchTires({
          year: queryParams.year.trim(),
          make: queryParams.make.trim(),
          model: queryParams.model.trim(),
          tireSize: queryParams.tireSize?.trim(),
          zipCode: cleanZipCode,
        });
      
      case 'car-washes':
        return this.searchCarWashes(zipCode || '', queryParams.washType);
      
      case 'rental-cars':
        return this.searchRentalCars(location || zipCode || '', queryParams.pickupDate, queryParams.returnDate);
      
      case 'storage':
        return this.searchStorageUnits(zipCode || '', queryParams.size);
      
      case 'meal-kits':
        return this.searchMealKits(zipCode || '');
      
      case 'car-insurance':
        return this.searchCarInsurance(
          zipCode || '',
          queryParams.vehicleYear,
          queryParams.vehicleMake,
          queryParams.vehicleModel
        );
      
      case 'renters-insurance':
        return this.searchRentersInsurance(zipCode || '');
      
      default:
        throw new Error(`Category ${category} not supported`);
    }
  }
}


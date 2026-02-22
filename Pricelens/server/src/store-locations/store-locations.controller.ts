import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoreLocationsService } from './store-locations.service';
import { CreateStoreLocationDto } from './dto/create-store-location.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Store Locations')
@Controller('store-locations')
export class StoreLocationsController {
  constructor(private readonly storeLocationsService: StoreLocationsService) {}

  @Post(':storeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a location for a store (admin)' })
  create(
    @Param('storeId') storeId: string,
    @Body() createDto: CreateStoreLocationDto,
  ) {
    return this.storeLocationsService.create(storeId, createDto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find stores near a ZIP code' })
  findNearby(@Query() findNearbyDto: FindNearbyDto) {
    return this.storeLocationsService.findNearby(findNearbyDto);
  }

  @Get('nearby-by-names')
  @ApiOperation({ summary: 'Find nearby stores by ZIP or by lat/lng (Use my location)' })
  findNearbyByStoreNames(
    @Query('zipCode') zipCode: string,
    @Query('lat') latParam: string,
    @Query('lng') lngParam: string,
    @Query('storeNames') storeNamesParam: string,
    @Query('radius') radius?: string,
  ) {
    const storeNames = storeNamesParam ? storeNamesParam.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const radiusMiles = radius ? Math.min(100, Math.max(5, parseInt(radius, 10) || 50)) : 50;

    const lat = latParam != null ? parseFloat(latParam) : NaN;
    const lng = lngParam != null ? parseFloat(lngParam) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return this.storeLocationsService.findNearbyByStoreNamesWithCoords(lat, lng, storeNames, radiusMiles);
    }
    if (zipCode?.trim()) {
      return this.storeLocationsService.findNearbyByStoreNames(zipCode.trim(), storeNames, radiusMiles);
    }
    return [];
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all locations for a store' })
  findByStore(@Param('storeId') storeId: string) {
    return this.storeLocationsService.findByStore(storeId);
  }

  @Get('zip/:zipCode')
  @ApiOperation({ summary: 'Get all stores in a ZIP code' })
  findByZipCode(@Param('zipCode') zipCode: string) {
    return this.storeLocationsService.findByZipCode(zipCode);
  }
}

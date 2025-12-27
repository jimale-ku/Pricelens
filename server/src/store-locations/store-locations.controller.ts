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

/**
 * Services Module
 * 
 * Handles Pattern B (location-based) and Pattern C (service listings) searches
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ApifyGasPriceService } from '../integrations/services/apify-gas-price.service';

@Module({
  imports: [ConfigModule, IntegrationsModule],
  providers: [ServicesService, ApifyGasPriceService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}


import { Module } from '@nestjs/common';
import { StoreLocationsService } from './store-locations.service';
import { StoreLocationsController } from './store-locations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StoreLocationsService],
  controllers: [StoreLocationsController],
  exports: [StoreLocationsService],
})
export class StoreLocationsModule {}

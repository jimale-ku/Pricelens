import { Module } from '@nestjs/common';
import { AdvertisementsService } from './advertisements.service';
import { AdvertisementsController } from './advertisements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AdvertisementsService],
  controllers: [AdvertisementsController],
  exports: [AdvertisementsService],
})
export class AdvertisementsModule {}

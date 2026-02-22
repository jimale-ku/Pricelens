import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PriceUpdateProcessor } from './processors/price-update.processor';
import { AlertNotificationProcessor } from './processors/alert-notification.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'price-updates' },
      { name: 'alert-notifications' },
    ),
    PrismaModule,
    IntegrationsModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, PriceUpdateProcessor, AlertNotificationProcessor],
  exports: [JobsService, BullModule],
})
export class JobsModule {}

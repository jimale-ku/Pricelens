import { Module } from '@nestjs/common';
import { ComparisonsService } from './comparisons.service';
import { ComparisonsController } from './comparisons.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ComparisonsController],
  providers: [ComparisonsService],
  exports: [ComparisonsService],
})
export class ComparisonsModule {}

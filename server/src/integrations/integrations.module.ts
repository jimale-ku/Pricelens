import { Module } from '@nestjs/common';
import { WalmartMockIntegration } from './services/walmart-mock.integration';
import { AmazonMockIntegration } from './services/amazon-mock.integration';
import { TargetMockIntegration } from './services/target-mock.integration';
import { PriceApiService } from './services/priceapi.service';

/**
 * IntegrationsModule manages all external store API integrations.
 * Currently using mock services - will swap to real APIs when keys are available.
 * 
 * ALL 3 MAJOR RETAILERS NOW INTEGRATED:
 * - Walmart: Budget-friendly, wide selection
 * - Amazon: Competitive tech pricing, fast shipping
 * - Target: Premium home decor, quality groceries
 */
@Module({
  providers: [
    WalmartMockIntegration,
    AmazonMockIntegration,
    TargetMockIntegration,
    PriceApiService,
  ],
  exports: [
    WalmartMockIntegration,
    AmazonMockIntegration,
    TargetMockIntegration,
    PriceApiService,
  ],
})
export class IntegrationsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { WalmartMockIntegration } from './services/walmart-mock.integration';
import { AmazonMockIntegration } from './services/amazon-mock.integration';
import { TargetMockIntegration } from './services/target-mock.integration';
import { PriceApiService } from './services/priceapi.service';
import { MultiStorePriceService } from './services/multi-store-price.service';
import { BarcodeLookupService } from './services/barcode-lookup.service';
import { MultiStoreScrapingService } from './services/multi-store-scraping.service';
import { SerpAPIMapsService } from './services/serpapi-maps.service';
import { SerperCacheService } from './services/serper-cache.service';
import { SerperCacheCleanupService } from './services/serper-cache-cleanup.service';
import { GoogleShoppingScraperService } from './services/google-shopping-scraper.service';
import { FuelPriceService } from './services/fuel-price.service';
import { ApifyGasPriceService } from './services/apify-gas-price.service';
// Store Adapters
import { AmazonAdapter } from './adapters/amazon/amazon.adapter';
import { WalmartAdapter } from './adapters/walmart/walmart.adapter';
import { EbayAdapter } from './adapters/ebay/ebay.adapter';
import { BestBuyAdapter } from './adapters/bestbuy/bestbuy.adapter';

/**
 * IntegrationsModule manages all external store API integrations.
 * Currently using mock services - will swap to real APIs when keys are available.
 * 
 * ALL 3 MAJOR RETAILERS NOW INTEGRATED:
 * - Walmart: Budget-friendly, wide selection
 * - Amazon: Competitive tech pricing, fast shipping
 * - Target: Premium home decor, quality groceries
 * 
 * MULTI-STORE PRICE COMPARISON:
 * - PricesAPI: Fetches prices from 100+ retailers (Walmart, Target, Costco, Best Buy, etc.)
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    WalmartMockIntegration,
    AmazonMockIntegration,
    TargetMockIntegration,
    PriceApiService,
    MultiStorePriceService,
    BarcodeLookupService,
    MultiStoreScrapingService,
    SerpAPIMapsService,
    SerperCacheService,
    SerperCacheCleanupService,
    GoogleShoppingScraperService,
    FuelPriceService,
    ApifyGasPriceService,
    // Store Adapters
    AmazonAdapter,
    WalmartAdapter,
    EbayAdapter,
    BestBuyAdapter,
  ],
  exports: [
    WalmartMockIntegration,
    AmazonMockIntegration,
    TargetMockIntegration,
    PriceApiService,
    MultiStorePriceService,
    BarcodeLookupService,
    MultiStoreScrapingService,
    SerpAPIMapsService,
    SerperCacheService,
    SerperCacheCleanupService,
    GoogleShoppingScraperService,
    FuelPriceService,
    ApifyGasPriceService,
    // Store Adapters
    AmazonAdapter,
    WalmartAdapter,
    EbayAdapter,
    BestBuyAdapter,
  ],
})
export class IntegrationsModule {}

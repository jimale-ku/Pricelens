import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
// import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { envSchema } from './config/config.schema';
import { CategoriesModule } from './categories/categories.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ListsModule } from './lists/lists.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ComparisonsModule } from './comparisons/comparisons.module';
import { InsightsModule } from './insights/insights.module';
import { AlertsModule } from './alerts/alerts.module';
import { StoreLocationsModule } from './store-locations/store-locations.module';
import { AdvertisementsModule } from './advertisements/advertisements.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { ServicesModule } from './services/services.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ReceiptsModule } from './receipts/receipts.module';
// import { JobsModule } from './jobs/jobs.module';
// import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env.development', '.env'],
      validate: (config) => envSchema.parse(config),
    }),
    ScheduleModule.forRoot(),
    // BullModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     redis: {
    //       host: config.get('REDIS_HOST', 'localhost'),
    //       port: config.get('REDIS_PORT', 6379),
    //       maxRetriesPerRequest: 3,
    //       retryStrategy: () => null, // Don't retry in tests if Redis unavailable
    //     },
    //   }),
    // }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: config.get('RATE_LIMIT_TTL', 60) * 1000,
        limit: config.get('RATE_LIMIT_MAX', 100),
      }],
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    StoresModule,
    ProductsModule,
    IntegrationsModule,
    ListsModule,
    FavoritesModule,
    ComparisonsModule,
    InsightsModule,
    AlertsModule,
    StoreLocationsModule,
    AdvertisementsModule,
    UserPreferencesModule,
    ServicesModule,
    SubscriptionsModule,
    ReceiptsModule,
    // JobsModule, // Disabled - requires Redis
    // HealthModule, // Disabled - requires JobsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

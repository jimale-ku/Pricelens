import { SetMetadata } from '@nestjs/common';

export const SUBSCRIPTION_TIER_KEY = 'subscription_tier';
export const RequireSubscription = (tier: 'FREE' | 'PLUS') =>
  SetMetadata(SUBSCRIPTION_TIER_KEY, tier);







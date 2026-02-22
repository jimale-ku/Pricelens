import { SetMetadata } from '@nestjs/common';
import type { SubscriptionTierName } from '../subscription-tiers';

export const SUBSCRIPTION_TIER_KEY = 'subscription_tier';

/** Require at least this tier (e.g. RequireSubscription('PRO') allows PRO or PREMIUM) */
export const RequireSubscription = (tier: SubscriptionTierName) =>
  SetMetadata(SUBSCRIPTION_TIER_KEY, tier);







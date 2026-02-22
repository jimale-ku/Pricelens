/**
 * Subscription tier hierarchy for modern 3 paid tiers (Basic, Pro, Premium).
 * PLUS is legacy and treated as same level as PRO.
 */

export type SubscriptionTierName = 'FREE' | 'BASIC' | 'PRO' | 'PLUS' | 'PREMIUM';

/** Numeric level for comparison (higher = more features). FREE=0, BASIC=1, PRO/PLUS=2, PREMIUM=3 */
export const TIER_LEVEL: Record<SubscriptionTierName, number> = {
  FREE: 0,
  BASIC: 1,
  PLUS: 2,   // legacy; same as PRO
  PRO: 2,
  PREMIUM: 3,
};

export function getTierLevel(tier: string): number {
  return TIER_LEVEL[tier as SubscriptionTierName] ?? 0;
}

/** True if userTier meets or exceeds the minimum required tier */
export function meetsMinimumTier(userTier: string, minimumTier: SubscriptionTierName): boolean {
  return getTierLevel(userTier) >= getTierLevel(minimumTier);
}

export class SubscriptionResponseDto {
  id: string;
  userId: string;
  planId: string;
  status: string;
  tier: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    name: string;
    tier: string;
    price: number;
    features: any;
    maxSearches?: number;
    maxStores?: number;
    maxFavorites?: number;
    maxLists?: number;
    maxAlerts?: number;
    hasPriceHistory: boolean;
    hasAdvancedFilters: boolean;
    hasAdFree: boolean;
  };
}







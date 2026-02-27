/**
 * useSubscription – central source of truth for premium status.
 * Use to confirm premium features work for paying users and to gate UI for non-paying users.
 *
 * - Paying user: status ACTIVE or TRIALING and tier BASIC or higher → isPremium true.
 * - Non-paying: no subscription, FREE tier, or inactive → isPremium false.
 */

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/constants/api';
import { getAccessToken } from '@/utils/auth';

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE' | 'FREE' | '';

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'PLUS' | 'PREMIUM';

export interface SubscriptionState {
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  planId?: string;
  planName?: string;
}

export interface UseSubscriptionResult {
  /** True if user has an active/trialing paid subscription (BASIC or higher) */
  isPremium: boolean;
  /** Raw subscription status from API */
  status: SubscriptionStatus;
  /** User's tier (FREE, BASIC, PRO, etc.) */
  tier: SubscriptionTier;
  /** Loading state while fetching */
  loading: boolean;
  /** Error message if fetch failed (e.g. not logged in) */
  error: string | null;
  /** Re-fetch subscription (e.g. after checkout or login) */
  refetch: () => Promise<void>;
  /** Full subscription payload if needed */
  subscription: SubscriptionState | null;
}

const PAID_TIERS: SubscriptionTier[] = ['BASIC', 'PRO', 'PLUS', 'PREMIUM'];

function isPaidTier(tier: string): tier is SubscriptionTier {
  return PAID_TIERS.includes(tier as SubscriptionTier);
}

export function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setError(null);
    const token = await getAccessToken();
    if (!token) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(API_ENDPOINTS.subscriptions.me, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setSubscription(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const status = (data?.status ?? data?.subscription?.status ?? '') as SubscriptionStatus;
      const tier = (data?.tier ?? data?.plan?.tier ?? 'FREE') as SubscriptionTier;
      setSubscription({
        status,
        tier,
        planId: data?.planId ?? data?.plan?.id,
        planName: data?.plan?.name,
      });
    } catch (e) {
      setSubscription(null);
      setError(e instanceof Error ? e.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPremium =
    !!subscription &&
    (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING') &&
    isPaidTier(subscription.tier);

  return {
    isPremium,
    status: subscription?.status ?? '',
    tier: subscription?.tier ?? 'FREE',
    loading,
    error: error ?? null,
    refetch: fetchSubscription,
    subscription,
  };
}

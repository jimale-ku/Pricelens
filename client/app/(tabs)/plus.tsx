/**
 * PriceLens Plus - Upgrade page & Plus Member dashboard
 * VIEW 1: Non-subscriber (hero, pricing, 8 features, testimonial, guarantee)
 * VIEW 2: Plus subscriber (badge, cashback, coupon finder, scanners)
 */

import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AppState } from 'react-native';
import AppHeader from '@/components/AppHeader';
import { API_ENDPOINTS } from '@/constants/api';

type ReceiptLineItem = { name: string; quantity: number; unitPrice: number; totalPrice: number; category?: string };
type ReceiptAnalysisResult = {
  storeName?: string;
  items: ReceiptLineItem[];
  totalAmount?: number;
  currency?: string;
  message?: string;
};

type SubscriptionPlan = {
  id: string;
  name: string;
  tier: string;
  price: number;
  priceYearly?: number | null;
  trialPeriodDays?: number | null;
  stripePriceId?: string | null;
};

// Mock coupon data for Plus dashboard
const MOCK_COUPONS = [
  { id: '1', store: 'Walmart', category: 'Grocery', discount: '15%', code: 'SAVE15', desc: '15% off your first online order', exp: 'Dec 31, 2025', min: '$50' },
  { id: '2', store: 'Target', category: 'Household', discount: '$5', code: 'TARGET5', desc: '$5 off $25 household essentials', exp: 'Jan 15, 2026', min: '$25' },
  { id: '3', store: 'Amazon', category: 'Electronics', discount: '10%', code: 'TECH10', desc: '10% off select electronics', exp: 'Feb 28, 2026', min: '$100' },
];

const RETAILERS = [
  { name: 'Amazon', emoji: '📦', rate: '5%' },
  { name: 'Walmart', emoji: '🛒', rate: '3%' },
  { name: 'Target', emoji: '🎯', rate: '4%' },
  { name: 'Best Buy', emoji: '🔌', rate: '2%' },
  { name: 'Home Depot', emoji: '🔨', rate: '3%' },
  { name: "Macy's", emoji: '👗', rate: '4%' },
  { name: 'Petco', emoji: '🐕', rate: '3%' },
  { name: 'Whole Foods', emoji: '🥗', rate: '5%' },
];

const PREMIUM_FEATURES = [
  { icon: 'pricetag', title: 'Coupon Finder', desc: 'Access thousands of grocery coupons', colors: ['#A855F7', '#7C3AED'] },
  { icon: 'cash', title: 'Cashback Rewards', desc: 'Earn up to 5% cashback', colors: ['#10B981', '#059669'] },
  { icon: 'barcode', title: 'In-Store Price Scanner', desc: 'Scan barcodes while shopping', colors: ['#06B6D4', '#0891B2'] },
  { icon: 'camera', title: 'Camera Product Scanner', desc: 'Take photos to find prices', colors: ['#14B8A6', '#0D9488'] },
  { icon: 'receipt', title: 'AI Receipt Scanner', desc: 'Upload receipts for AI analysis', colors: ['#22C55E', '#16A34A'] },
  { icon: 'trending-down', title: 'Price Drop Alerts', desc: 'Get notified when prices drop', colors: ['#3B82F6', '#2563EB'] },
  { icon: 'bar-chart', title: 'Advanced Analytics', desc: 'Detailed spending insights', colors: ['#EC4899', '#DB2777'] },
  { icon: 'sparkles', title: 'Smart Recommendations', desc: 'AI-powered suggestions', colors: ['#A855F7', '#7C3AED'] },
];

export default function PlusScreen() {
  const router = useRouter();
  const [isPlusMember, setIsPlusMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [couponSearch, setCouponSearch] = useState('');
  const [onlineSearch, setOnlineSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('All Stores');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [onlineSearching, setOnlineSearching] = useState(false);
  const [onlineResults, setOnlineResults] = useState<typeof MOCK_COUPONS>([]);
  const [plusPlan, setPlusPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptResult, setReceiptResult] = useState<ReceiptAnalysisResult | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.subscriptions.me, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const status = data?.status ?? data?.subscription?.status ?? '';
        setIsPlusMember(!!(status === 'ACTIVE' || status === 'active' || status === 'TRIALING' || status === 'trialing'));
      }
    } catch {
      // Default to non-subscriber when API unavailable
      setIsPlusMember(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.subscriptions.plans, { credentials: 'include' });
      if (res.ok) {
        const plans: SubscriptionPlan[] = await res.json();
        const paid = plans.find((p) => p.tier === 'BASIC' || (p.price > 0 && p.stripePriceId));
        setPlusPlan(paid || plans.find((p) => p.price > 0) || null);
      }
    } catch {
      setPlusPlan(null);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, [fetchSubscription, fetchPlans]);

  const checkoutSessionIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for subscription update after checkout
  const startPollingSubscription = useCallback(() => {
    if (pollingIntervalRef.current) return; // Already polling

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(API_ENDPOINTS.subscriptions.me, {
          credentials: 'include',
        });
        if (res.ok) {
          const subscription = await res.json();
          if (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING') {
            // Payment succeeded!
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            Alert.alert(
              '🎉 Success!',
              'Your subscription is now active. Premium features are unlocked!',
              [{ text: 'OK', onPress: () => fetchSubscription() }]
            );
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 300000);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Listen for app state changes (when user returns from browser)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && checkoutSessionIdRef.current) {
        // User returned to app - check subscription status
        fetchSubscription();
        startPollingSubscription();
      }
    });

    return () => subscription.remove();
  }, [fetchSubscription, startPollingSubscription]);

  const handleUpgrade = async () => {
    if (!plusPlan?.id) {
      Alert.alert('Not available', 'Subscription plans could not be loaded. Please try again later.');
      return;
    }
    if (!plusPlan.stripePriceId) {
      Alert.alert('Setup required', 'Stripe is not configured for this plan yet. Add STRIPE_PRICE_ID_BASIC_MONTHLY to the server.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.subscriptions.checkout, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId: plusPlan.id, interval: 'month' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Checkout error', data?.message || 'Could not start checkout. Are you logged in?');
        return;
      }
      if (data?.url) {
        checkoutSessionIdRef.current = data.sessionId || null;
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
          // Start polling for subscription update
          startPollingSubscription();
          Alert.alert(
            'Redirecting to Payment',
            'Complete your payment in the browser. We\'ll automatically detect when it\'s done.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Open link', 'Open this link in your browser: ' + data.url);
        }
      } else {
        Alert.alert('Checkout', 'Redirect URL not returned. Session ID: ' + (data?.sessionId || 'none'));
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    setCopiedId(id);
    // In a real app: Clipboard.setString(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOnlineSearch = () => {
    setOnlineSearching(true);
    setTimeout(() => {
      setOnlineResults(MOCK_COUPONS.filter(c => c.store.toLowerCase().includes(onlineSearch.toLowerCase()) || c.code.toLowerCase().includes(onlineSearch.toLowerCase())));
      setOnlineSearching(false);
    }, 800);
  };

  const sendReceiptToAnalyze = async (formData: FormData) => {
    setReceiptLoading(true);
    setReceiptError(null);
    setReceiptResult(null);
    try {
      // IMPORTANT: Do NOT set Content-Type header - React Native sets it automatically with boundary
      const res = await fetch(API_ENDPOINTS.receipts.analyze, {
        method: 'POST',
        headers: { 
          Accept: 'application/json',
          // Do NOT set Content-Type - React Native FormData handles it
        },
        body: formData,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReceiptError(data?.message || `Upload failed (${res.status}). Are you logged in?`);
        return;
      }
      setReceiptResult({
        storeName: data.storeName,
        items: data.items || [],
        totalAmount: data.totalAmount,
        currency: data.currency || 'USD',
        message: data.message,
      });
    } catch (e: any) {
      console.error('Receipt upload error:', e);
      setReceiptError(e?.message || 'Network error. Please check your connection and try again.');
    } finally {
      setReceiptLoading(false);
    }
  };

  const pickAndAnalyzeReceipt = async () => {
    setReceiptError(null);
    setReceiptResult(null);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photos to upload a receipt.');
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable cropping to avoid UI issues
        quality: 0.8,
      });
      
      if (pickerResult.canceled) {
        return; // User canceled
      }
      
      if (!pickerResult.assets?.[0]?.uri) {
        setReceiptError('No image selected. Please try again.');
        return;
      }

      const asset = pickerResult.assets[0];
      const uri = asset.uri;
      
      // Normalize URI for React Native FormData
      // On iOS, might be ph:// or file://, on Android file://
      const normalizedUri = uri.startsWith('file://') ? uri : uri.startsWith('ph://') ? uri : `file://${uri}`;
      
      const formData = new FormData();
      // React Native FormData format - do NOT set Content-Type header manually
      formData.append('receipt', {
        uri: normalizedUri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'receipt.jpg',
      } as any);
      
      await sendReceiptToAnalyze(formData);
    } catch (error: any) {
      console.error('Image picker error:', error);
      setReceiptError(error?.message || 'Failed to pick image. Please try again.');
    }
  };

  const trySampleReceipt = async () => {
    setReceiptError(null);
    setReceiptResult(null);
    setReceiptLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.receipts.analyzeSample, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReceiptError(data?.message || 'Failed. Are you logged in?');
        return;
      }
      setReceiptResult({
        storeName: data.storeName,
        items: data.items || [],
        totalAmount: data.totalAmount,
        currency: data.currency || 'USD',
        message: data.message,
      });
    } catch (e) {
      setReceiptError('Network error. Is the server running?');
    } finally {
      setReceiptLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <AppHeader />

        {!isPlusMember ? (
          /* ========== VIEW 1: Non-Subscriber (Upgrade Page) ========== */
          <View style={{ paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 48 }}>
            {/* Section 1: Hero Header */}
            <View style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.5)',
              padding: 32,
              marginBottom: 24,
              overflow: 'hidden',
              alignItems: 'center',
            }}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.25)', 'rgba(59, 130, 246, 0.25)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <View style={{ position: 'relative', zIndex: 10, alignItems: 'center' }}>
                <LinearGradient
                  colors={['#A855F7', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                >
                  <Ionicons name="trophy" size={36} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 }}>
                  PriceLens Plus
                </Text>
                <Text style={{ fontSize: 15, color: '#94A3B8', textAlign: 'center', maxWidth: 280 }}>
                  Unlock premium features and save even more on your groceries
                </Text>
              </View>
            </View>

            {/* Section 2: Pricing Box */}
            <View style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.4)',
              padding: 28,
              marginBottom: 24,
              alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="cash" size={28} color="#A855F7" />
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>$4.99/month</Text>
              </View>
              <Text style={{ fontSize: 15, color: '#10B981', fontWeight: '600', marginBottom: 6 }}>
                30 days free, then $4.99/month
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>
                Save an average of $50+ per month • Cancel anytime
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleUpgrade}
                disabled={checkoutLoading}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={['#A855F7', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    opacity: checkoutLoading ? 0.8 : 1,
                  }}
                >
                  {checkoutLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="trophy" size={22} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                        Start 30-day free trial
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Section 3: Key Features (Top 4) */}
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>
              What You Get
            </Text>
            <View style={{ gap: 12, marginBottom: 24 }}>
              {PREMIUM_FEATURES.slice(0, 4).map((f, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.1)',
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <LinearGradient
                    colors={f.colors as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name={f.icon as any} size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>{f.title}</Text>
                    <Text style={{ fontSize: 13, color: '#94A3B8' }}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Section 4: Try Premium Feature (Gated - Shows Upgrade Prompt) */}
            <View
              style={{
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(168, 85, 247, 0.4)',
              }}
            >
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.15)', 'rgba(59, 130, 246, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <View style={{ position: 'relative', zIndex: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <LinearGradient
                    colors={['#A855F7', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="receipt" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 }}>
                      AI Receipt Scanner
                    </Text>
                    <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                      Premium Feature
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, color: '#E2E8F0', marginBottom: 16, lineHeight: 20 }}>
                  Upload receipts and let AI extract line items, totals, and store information automatically. Save time and track your spending effortlessly.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Premium Feature',
                      'AI Receipt Scanner is available with PriceLens Plus. Upgrade now to unlock this and other premium features.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Upgrade', onPress: handleUpgrade },
                      ]
                    );
                  }}
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.25)',
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(168, 85, 247, 0.5)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="lock-closed" size={18} color="#A855F7" />
                    <Text style={{ color: '#A855F7', fontSize: 15, fontWeight: '600' }}>Upgrade to Try</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 5: All Premium Features (Collapsible) */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>
                All Premium Features
              </Text>
              <View style={{ gap: 10 }}>
                {PREMIUM_FEATURES.map((f, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.4)',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(148, 163, 184, 0.1)',
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <LinearGradient
                      colors={f.colors as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name={f.icon as any} size={18} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>{f.title}</Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8' }}>{f.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 6: Testimonial (smaller, less prominent) */}
            <View style={{
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
            }}>
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((_) => (
                  <Ionicons key={_} name="star" size={14} color="#EAB308" />
                ))}
              </View>
              <Text style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 20, marginBottom: 8, fontStyle: 'italic' }}>
                "PriceLens Plus has completely transformed how I shop. The coupon finder alone has saved me over $200!"
              </Text>
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>— Sarah M., Plus Member</Text>
            </View>

            {/* Section 7: Guarantee Footer */}
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 24 }}>
              ✓ Cancel anytime • ✓ 30-day money-back guarantee • ✓ No hidden fees
            </Text>
          </View>
        ) : (
          /* ========== VIEW 2: Plus Subscriber (Dashboard) ========== */
          <View style={{ paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 48 }}>
            {/* Section 1: Plus Member Badge */}
            <View style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.5)',
              padding: 24,
              marginBottom: 24,
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.2)', 'rgba(59, 130, 246, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <View style={{ position: 'relative', zIndex: 10, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <LinearGradient
                    colors={['#A855F7', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="trophy" size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 }}>Plus Member</Text>
                    <Text style={{ fontSize: 13, color: '#94A3B8' }}>Enjoy all premium features</Text>
                  </View>
                </View>
                <LinearGradient
                  colors={['#A855F7', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Active</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Section 2: Cashback Rewards Dashboard */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Cashback Rewards</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 20, borderRadius: 12 }}
                >
                  <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>$23.47</Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>Ready to redeem</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={{ backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#059669', fontSize: 14, fontWeight: '600' }}>Redeem Cashback</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#10B981',
                padding: 20,
              }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#059669' }}>$15.89</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>Processing (30-60 days)</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>This month: $7.04</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Lifetime: $128.81</Text>
              </View>
            </View>

            <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 10 }}>Participating retailers</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {RETAILERS.map((r, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    minWidth: '30%',
                  }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 2 }}>{r.emoji}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#E2E8F0' }}>{r.name}</Text>
                  <Text style={{ fontSize: 11, color: '#10B981' }}>{r.rate} cashback</Text>
                </View>
              ))}
            </View>

            <View style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.3)',
              padding: 16,
              marginBottom: 24,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name="bulb-outline" size={20} color="#10B981" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#E2E8F0' }}>How it works</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#94A3B8', lineHeight: 20 }}>
                • Shop at participating retailers through PriceLens.{'\n'}
                • Cashback is credited within 30-60 days.{'\n'}
                • Redeem when you reach $10 minimum.{'\n'}
                • No expiration on earned cashback.
              </Text>
            </View>

            {/* Section 3: Coupon Finder */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Coupon Finder</Text>
            <TextInput
              value={couponSearch}
              onChangeText={setCouponSearch}
              placeholder="Search coupons..."
              placeholderTextColor="#64748B"
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                borderRadius: 10,
                padding: 14,
                color: '#FFFFFF',
                fontSize: 15,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: 'rgba(168, 85, 247, 0.3)',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {['Available Coupons', 'Partner Stores', 'Avg. Savings', 'Daily Updates'].map((label, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    borderRadius: 8,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>{label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                    {label.includes('Coupons') ? '24' : label.includes('Stores') ? '11' : label.includes('Savings') ? '$50+' : 'New'}
                  </Text>
                </View>
              ))}
            </View>
            {MOCK_COUPONS.map((c) => (
              <View
                key={c.id}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: '#A78BFA', fontWeight: '600' }}>{c.store}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: '#34D399', fontWeight: '600' }}>{c.category}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '600' }}>{c.discount}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, color: '#E2E8F0', marginBottom: 6 }}>{c.desc}</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>Exp {c.exp} • Min {c.min}</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(168, 85, 247, 0.2)',
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                }}>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: '#E2E8F0', letterSpacing: 2 }}>{c.code}</Text>
                  <TouchableOpacity
                    onPress={() => handleCopyCode(c.id, c.code)}
                    style={{
                      backgroundColor: copiedId === c.id ? '#10B981' : 'rgba(168, 85, 247, 0.5)',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                      {copiedId === c.id ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.3)',
              marginBottom: 24,
            }}>
              <Ionicons name="sparkles" size={20} color="#A855F7" />
              <Text style={{ fontSize: 13, color: '#94A3B8', flex: 1 }}>Pro tip: Stack coupons with store promotions for maximum savings.</Text>
            </View>

            {/* Section 4: Online Coupon Search */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Online Coupon Search</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput
                value={onlineSearch}
                onChangeText={setOnlineSearch}
                placeholder="Search for store or brand (e.g., Walmart, Nike...)"
                placeholderTextColor="#64748B"
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: 10,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                }}
              />
              <TouchableOpacity
                onPress={handleOnlineSearch}
                disabled={onlineSearching}
                style={{ justifyContent: 'center' }}
              >
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10 }}
                >
                  {onlineSearching ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Search</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>
              We scan multiple coupon sites for the best codes.
            </Text>
            {onlineResults.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                {onlineResults.map((c) => (
                  <View key={c.id} style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.1)',
                  }}>
                    <Text style={{ fontSize: 14, color: '#E2E8F0', fontWeight: '600' }}>{c.store} — {c.code}</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>{c.desc}</Text>
                  </View>
                ))}
                <TouchableOpacity onPress={() => setOnlineResults([])}>
                  <Text style={{ color: '#6366F1', fontSize: 14, fontWeight: '500' }}>Clear Results</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Price Drop Alerts */}
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Ionicons name="trending-down" size={24} color="#3B82F6" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>Price Drop Alerts</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                Get notified when prices drop to your target
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/alerts')}
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                }}
              >
                <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>Manage Alerts</Text>
              </TouchableOpacity>
            </View>

            {/* In-Store Barcode Scanner */}
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(6, 182, 212, 0.3)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Ionicons name="barcode" size={24} color="#06B6D4" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>Barcode Scanner</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                Scan or enter a barcode to compare prices across stores
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/barcode-scanner')}
                style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.2)',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(6, 182, 212, 0.3)',
                }}
              >
                <Text style={{ color: '#06B6D4', fontSize: 14, fontWeight: '600' }}>Scan Barcode</Text>
              </TouchableOpacity>
            </View>

            {/* Camera Product Scanner - placeholder */}
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(148, 163, 184, 0.1)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Ionicons name="camera" size={24} color="#14B8A6" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>Camera Product Scanner</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                Take a photo to find prices (Coming soon)
              </Text>
              <TouchableOpacity
                disabled
                style={{
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                  opacity: 0.5,
                }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>Coming Soon</Text>
              </TouchableOpacity>
            </View>

            {/* AI Receipt Scanner - working feature */}
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(34, 197, 94, 0.3)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Ionicons name="receipt" size={24} color="#22C55E" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>AI Receipt Scanner</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                Upload a receipt photo and we'll extract line items and totals.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: receiptResult || receiptError ? 12 : 0 }}>
                <TouchableOpacity
                  onPress={pickAndAnalyzeReceipt}
                  disabled={receiptLoading}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(34, 197, 94, 0.4)',
                  }}
                >
                  {receiptLoading ? (
                    <ActivityIndicator size="small" color="#22C55E" />
                  ) : (
                    <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>Upload Receipt</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={trySampleReceipt}
                  disabled={receiptLoading}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.3)',
                  }}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Try sample</Text>
                </TouchableOpacity>
              </View>
              {receiptError && (
                <View style={{ marginBottom: 12, padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
                  <Text style={{ color: '#FCA5A5', fontSize: 13 }}>{receiptError}</Text>
                </View>
              )}
              {receiptResult?.message && receiptResult.items.length === 0 && (
                <View style={{ marginBottom: 12, padding: 10, backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 8 }}>
                  <Text style={{ color: '#FCD34D', fontSize: 13 }}>{receiptResult.message}</Text>
                </View>
              )}
              {receiptResult && receiptResult.items.length > 0 && (
                <View>
                  {receiptResult.storeName && (
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 8 }}>
                      {receiptResult.storeName}
                    </Text>
                  )}
                  <View style={{ gap: 6, marginBottom: 10 }}>
                    {receiptResult.items.map((item, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          backgroundColor: 'rgba(21, 27, 40, 0.6)',
                          borderRadius: 8,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, color: '#E2E8F0', fontWeight: '500' }} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.quantity > 1 && (
                            <Text style={{ fontSize: 12, color: '#94A3B8' }}>Qty: {item.quantity}</Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: '#22C55E', fontWeight: '600' }}>
                          ${item.totalPrice.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {receiptResult.totalAmount != null && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.2)' }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Total</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#22C55E' }}>
                        {receiptResult.currency || 'USD'} ${receiptResult.totalAmount.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => { setReceiptResult(null); setReceiptError(null); }} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 13 }}>Clear & scan another</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

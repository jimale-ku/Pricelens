/**
 * Price Drop Alerts Screen
 * List, create, edit, and delete price alerts
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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import { API_ENDPOINTS } from '@/constants/api';
import { useRouter } from 'expo-router';
import { authenticatedFetch, getAccessToken } from '@/utils/auth';
import { useSubscription } from '@/hooks/useSubscription';

type PriceAlert = {
  id: string;
  productId: string;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    images?: string[];
    prices: Array<{
      price: string;
      store: {
        id: string;
        name: string;
      };
    }>;
  };
  currentLowestPrice?: number;
  priceReached?: boolean;
};

function showPremiumRequiredAlert(router: ReturnType<typeof useRouter>) {
  Alert.alert(
    'PriceLens Plus Required',
    'Price Drop Alerts are a premium feature. Upgrade to Plus to create and manage alerts.',
    [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Upgrade', onPress: () => router.replace('/(tabs)/plus') },
    ]
  );
}

export default function AlertsScreen() {
  const router = useRouter();
  const { isPremium, loading: subLoading } = useSubscription();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createProductId, setCreateProductId] = useState('');
  const [createTargetPrice, setCreateTargetPrice] = useState('');
  const [creating, setCreating] = useState(false);

  // Check authentication and premium on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert('Login Required', 'Please log in to view your price alerts.');
        router.replace('/(auth)/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await authenticatedFetch(API_ENDPOINTS.alerts.list(false));
      if (res.ok) {
        const data = await res.json();
        setAlerts(Array.isArray(data) ? data : []);
      } else {
        if (res.status === 401) {
          Alert.alert('Login Required', 'Please log in to view your price alerts.');
          router.replace('/(auth)/login');
        } else if (res.status === 403) {
          const err = await res.json().catch(() => ({}));
          const msg = err?.message || '';
          if (msg.toLowerCase().includes('subscription') || msg.toLowerCase().includes('upgrade')) {
            showPremiumRequiredAlert(router);
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error('Failed to fetch alerts:', errorData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreateAlert = async () => {
    if (!createProductId.trim() || !createTargetPrice.trim()) {
      Alert.alert('Error', 'Please enter both product ID and target price.');
      return;
    }

    const targetPrice = parseFloat(createTargetPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid target price.');
      return;
    }

    setCreating(true);
    try {
      const res = await authenticatedFetch(API_ENDPOINTS.alerts.create, {
        method: 'POST',
        body: JSON.stringify({
          productId: createProductId.trim(),
          targetPrice,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Price alert created successfully!');
        setShowCreateModal(false);
        setCreateProductId('');
        setCreateTargetPrice('');
        fetchAlerts();
      } else if (res.status === 403) {
        showPremiumRequiredAlert(router);
      } else {
        Alert.alert('Error', data?.message || 'Failed to create alert. Make sure the product exists.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await authenticatedFetch(API_ENDPOINTS.alerts.delete(id), {
                method: 'DELETE',
              });
              if (res.ok) {
                Alert.alert('Success', 'Alert deleted successfully.');
                fetchAlerts();
              } else if (res.status === 403) {
                showPremiumRequiredAlert(router);
              } else {
                Alert.alert('Error', 'Failed to delete alert.');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateAlert = async (id: string, newTargetPrice: number) => {
    Alert.prompt(
      'Update Target Price',
      'Enter new target price:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (priceStr) => {
            const price = parseFloat(priceStr || '0');
            if (isNaN(price) || price <= 0) {
              Alert.alert('Error', 'Invalid price.');
              return;
            }
            try {
              const res = await authenticatedFetch(API_ENDPOINTS.alerts.update(id), {
                method: 'PATCH',
                body: JSON.stringify({ targetPrice: price }),
              });
              if (res.ok) {
                Alert.alert('Success', 'Alert updated successfully.');
                fetchAlerts();
              } else if (res.status === 403) {
                showPremiumRequiredAlert(router);
              } else {
                Alert.alert('Error', 'Failed to update alert.');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Please try again.');
            }
          },
        },
      ],
      'plain-text',
      newTargetPrice.toString()
    );
  };

  if (loading || subLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </SafeAreaView>
    );
  }

  // Block non-premium users: show upgrade gate
  if (!isPremium) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <AppHeader />
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(168, 85, 247, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Ionicons name="lock-closed" size={36} color="#A855F7" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>PriceLens Plus Required</Text>
            <Text style={{ fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 28 }}>Price Drop Alerts are a premium feature. Upgrade to create and manage alerts.</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/plus')}
              activeOpacity={0.85}
              style={{ backgroundColor: '#A855F7', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Upgrade to Plus</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAlerts} tintColor="#A855F7" />}
      >
        <AppHeader />
        <View style={{ paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 48 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
                Price Drop Alerts
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                Get notified when prices drop to your target
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(168, 85, 247, 0.4)',
              }}
            >
              <Ionicons name="add" size={24} color="#A855F7" />
            </TouchableOpacity>
          </View>

          {/* Create Alert Modal */}
          {showCreateModal && (
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: 'rgba(168, 85, 247, 0.4)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>Create Alert</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                Find a product first, then use its ID to create an alert.
              </Text>
              <TextInput
                value={createProductId}
                onChangeText={setCreateProductId}
                placeholder="Product ID (e.g., from product page)"
                placeholderTextColor="#64748B"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: 10,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 15,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(168, 85, 247, 0.3)',
                }}
              />
              <TextInput
                value={createTargetPrice}
                onChangeText={setCreateTargetPrice}
                placeholder="Target price (e.g., 19.99)"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: 10,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 15,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(168, 85, 247, 0.3)',
                }}
              />
              <TouchableOpacity
                onPress={handleCreateAlert}
                disabled={creating}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={['#A855F7', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Create Alert</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Alerts List */}
          {alerts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="notifications-outline" size={64} color="#64748B" />
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginTop: 16, marginBottom: 8 }}>
                No Active Alerts
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', maxWidth: 280 }}>
                Create an alert to get notified when a product's price drops to your target.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {alerts.map((alert) => (
                <View
                  key={alert.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: alert.priceReached
                      ? 'rgba(34, 197, 94, 0.4)'
                      : 'rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }} numberOfLines={2}>
                        {alert.product.name}
                      </Text>
                      {alert.product.prices?.[0] && (
                        <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                          Current: ${Number(alert.product.prices[0].price).toFixed(2)} at {alert.product.prices[0].store.name}
                        </Text>
                      )}
                    </View>
                    {alert.priceReached && (
                      <View
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.2)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>TRIGGERED</Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(148, 163, 184, 0.1)',
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>Target Price</Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: alert.priceReached ? '#22C55E' : '#A855F7' }}>
                        ${alert.targetPrice.toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleUpdateAlert(alert.id, alert.targetPrice)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        <Ionicons name="pencil" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteAlert(alert.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        <Ionicons name="trash" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

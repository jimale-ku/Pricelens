/**
 * Purchase History Tab Screen
 * Shows items users have purchased
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { getPurchaseHistory, removePurchaseRecord, getTotalSpent, PurchaseRecord } from '@/utils/purchaseHistoryService';

export default function PurchaseHistoryScreen() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadPurchaseHistory = useCallback(async () => {
    const history = await getPurchaseHistory();
    const total = await getTotalSpent();
    setPurchases(history);
    setTotalSpent(total);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPurchaseHistory();
    }, [loadPurchaseHistory])
  );

  const handleRemovePurchase = async (purchaseId: string) => {
    Alert.alert(
      'Remove Purchase',
      'Remove this purchase from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removePurchaseRecord(purchaseId);
            await loadPurchaseHistory();
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPurchaseHistory();
    setRefreshing(false);
  }, [loadPurchaseHistory]);

  // Group purchases by date
  const groupedPurchases = purchases.reduce((acc, purchase) => {
    const date = new Date(purchase.purchasedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(purchase);
    return acc;
  }, {} as Record<string, PurchaseRecord[]>);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
              Purchase History
            </Text>
            <View style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.3)',
            }}>
              <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 4 }}>
                Total Spent
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#10b981' }}>
                ${totalSpent.toFixed(2)}
              </Text>
            </View>
          </View>

          {purchases.length === 0 ? (
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
            }}>
              <Ionicons name="receipt-outline" size={64} color="#64748B" />
              <Text style={{
                color: '#E2E8F0',
                fontSize: 18,
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 8,
              }}>
                No Purchase History
              </Text>
              <Text style={{
                color: '#94A3B8',
                fontSize: 14,
                textAlign: 'center',
              }}>
                Your purchases will appear here when you click "Shop Now" on products
              </Text>
            </View>
          ) : (
            <View style={{ gap: 24 }}>
              {Object.entries(groupedPurchases).map(([date, datePurchases]) => (
                <View key={date}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#94A3B8',
                    marginBottom: 12,
                  }}>
                    {date}
                  </Text>
                  <View style={{ gap: 12 }}>
                    {datePurchases.map((purchase) => (
                      <View
                        key={purchase.id}
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: 'rgba(148, 163, 184, 0.1)',
                        }}
                      >
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <Image
                            source={{ uri: purchase.productImage || 'https://via.placeholder.com/60x60/1e2736/8b95a8?text=No+Image' }}
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 8,
                              backgroundColor: '#1e2736',
                            }}
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: '#FFFFFF',
                              marginBottom: 4,
                            }}>
                              {purchase.productName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              {purchase.storeImage && (
                                <Image
                                  source={{ uri: purchase.storeImage }}
                                  style={{ width: 20, height: 20, borderRadius: 2 }}
                                  resizeMode="contain"
                                />
                              )}
                              <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                                {purchase.storeName}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: '#64748B' }}>
                              Qty: {purchase.quantity} • {new Date(purchase.purchasedAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{
                              fontSize: 18,
                              fontWeight: '700',
                              color: '#10b981',
                              marginBottom: 4,
                            }}>
                              ${(purchase.price * purchase.quantity).toFixed(2)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleRemovePurchase(purchase.id)}
                              style={{
                                padding: 6,
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: 6,
                              }}
                            >
                              <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
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

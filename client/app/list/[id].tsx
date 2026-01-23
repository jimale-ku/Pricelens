/**
 * List Detail Page
 * Route: /list/[id]
 * Shows all items in a shopping list with prices and total cost
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { getListById, removeItemFromList, updateItemQuantity, calculateListTotal, ShoppingList, ListItem } from '@/utils/listService';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadList();
  }, [id]);

  // Reload when screen comes into focus
  useEffect(() => {
    const unsubscribe = router.addListener?.('focus', () => {
      loadList();
    });
    return unsubscribe;
  }, [router]);

  const loadList = () => {
    if (!id) return;
    const loadedList = getListById(id);
    setList(loadedList);
    setIsLoading(false);
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove "${itemName}" from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (!id) return;
            removeItemFromList(id, itemId);
            loadList();
          },
        },
      ]
    );
  };

  const handleUpdateQuantity = (itemId: string, currentQuantity: number, itemName: string) => {
    Alert.prompt(
      'Update Quantity',
      `Enter new quantity for "${itemName}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (value) => {
            if (!id || !value) return;
            const newQuantity = parseInt(value, 10);
            if (isNaN(newQuantity) || newQuantity < 1) {
              Alert.alert('Error', 'Please enter a valid quantity (1 or more)');
              return;
            }
            updateItemQuantity(id, itemId, newQuantity);
            loadList();
          },
        },
      ],
      'plain-text',
      currentQuantity.toString()
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <AppHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <AppHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="list-outline" size={64} color="#64748B" />
          <Text style={{ color: '#E2E8F0', fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>
            List Not Found
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center' }}>
            This list doesn't exist or has been deleted.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: '#3b82f6',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totals = calculateListTotal(list);
  const bestStore = totals.byStore
    ? Object.entries(totals.byStore).sort((a, b) => a[1] - b[1])[0]
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Header */}
          <View style={{
            backgroundColor: 'rgba(21, 27, 40, 0.6)',
            borderRadius: 16,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(139, 149, 168, 0.15)',
            marginBottom: 24,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Ionicons name="list" size={32} color="#06B6D4" />
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>
                {list.name}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#94A3B8', lineHeight: 20 }}>
              {list.items.length} item{list.items.length !== 1 ? 's' : ''} in this list
            </Text>
          </View>

          {/* Total Cost Summary */}
          {totals.total > 0 && (
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
              marginBottom: 24,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#E2E8F0', marginBottom: 12 }}>
                Estimated Total
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 32, fontWeight: '700', color: '#10b981' }}>
                  ${totals.total.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                  (best prices)
                </Text>
              </View>
              {bestStore && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(148, 163, 184, 0.1)',
                }}>
                  <Ionicons name="storefront" size={16} color="#10b981" />
                  <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                    Best at <Text style={{ color: '#10b981', fontWeight: '600' }}>{bestStore[0]}</Text>: ${bestStore[1].toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Items List */}
          {list.items.length === 0 ? (
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
            }}>
              <Ionicons name="cart-outline" size={64} color="#64748B" />
              <Text style={{
                color: '#E2E8F0',
                fontSize: 20,
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 8,
              }}>
                List is Empty
              </Text>
              <Text style={{
                color: '#94A3B8',
                fontSize: 14,
                textAlign: 'center',
                maxWidth: 300,
              }}>
                Add items to this list to see them here
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {list.items.map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.1)',
                    padding: 16,
                    flexDirection: 'row',
                    gap: 12,
                  }}
                >
                  {/* Product Image */}
                  <Image
                    source={{ uri: item.productImage || 'https://via.placeholder.com/80x80/1e2736/8b95a8?text=No+Image' }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      backgroundColor: '#1e2736',
                    }}
                    resizeMode="cover"
                  />

                  {/* Product Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      marginBottom: 4,
                    }}>
                      {item.productName}
                    </Text>
                    
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: '#1e2736',
                      borderRadius: 6,
                      alignSelf: 'flex-start',
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        color: '#e8edf4',
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                        {item.category}
                      </Text>
                    </View>

                    {/* Price and Quantity */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {item.bestPrice && (
                        <Text style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: '#10b981',
                        }}>
                          ${(item.bestPrice * item.quantity).toFixed(2)}
                        </Text>
                      )}
                      {item.bestPriceStore && (
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                          at {item.bestPriceStore}
                        </Text>
                      )}
                    </View>

                    {/* Quantity Controls */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 8,
                    }}>
                      <TouchableOpacity
                        onPress={() => handleUpdateQuantity(item.id, item.quantity, item.productName)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        <Ionicons name="pencil" size={14} color="#3b82f6" />
                        <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '600' }}>
                          Qty: {item.quantity}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRemoveItem(item.id, item.productName)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
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




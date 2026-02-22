/**
 * List Comparison Page
 * Route: /list/[id]/compare
 * Shows all items in a list with prices across stores
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { getListById, calculateListTotal, ShoppingList } from '@/utils/listService';
import { API_ENDPOINTS } from '@/constants/api';
import { transformCompareResponse } from '@/utils/apiTransform';
import StoreCard from '@/components/StoreCard';

export default function ListCompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemPrices, setItemPrices] = useState<Record<string, any[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadList();
  }, [id]);

  const loadList = async () => {
    if (!id) return;
    const loadedList = await getListById(id);
    setList(loadedList);
    setIsLoading(false);
    
    // Fetch prices for all items
    if (loadedList) {
      fetchAllItemPrices(loadedList);
    }
  };

  const fetchAllItemPrices = async (list: ShoppingList) => {
    for (const item of list.items) {
      if (!itemPrices[item.id]) {
        await fetchItemPrices(item);
      }
    }
  };

  const fetchItemPrices = async (item: ListItem) => {
    setLoadingItems(prev => new Set(prev).add(item.id));
    
    try {
      const searchUrl = `${API_ENDPOINTS.products.compareMultiStore(item.productName, 'auto')}`;
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        const transformed = transformCompareResponse(data);
        setItemPrices(prev => ({
          ...prev,
          [item.id]: transformed.storePrices || [],
        }));
      }
    } catch (error) {
      console.error(`Error fetching prices for ${item.productName}:`, error);
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  if (isLoading || !list) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  const totals = calculateListTotal(list);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
              Compare Prices
            </Text>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>
              {list.items.length} item{list.items.length !== 1 ? 's' : ''} • Total: ${totals.total.toFixed(2)}
            </Text>
          </View>

          {/* Items with prices */}
          {list.items.map((item) => {
            const prices = itemPrices[item.id] || [];
            const isLoading = loadingItems.has(item.id);

            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                {/* Item Header */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
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
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                      {item.productName}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 8 }}>
                      Qty: {item.quantity}
                    </Text>
                    {(item.bestPrice != null && item.bestPrice > 0) ? (
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#10b981' }}>
                        Best: ${(item.bestPrice * item.quantity).toFixed(2)}
                        {item.bestPriceStore ? ` at ${item.bestPriceStore}` : ''}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Prices */}
                {isLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={{ color: '#94A3B8', marginTop: 8 }}>Loading prices...</Text>
                  </View>
                ) : prices.length > 0 ? (
                  <View style={{ gap: 12 }}>
                    {prices.slice(0, 3).map((storePrice, index) => (
                      <StoreCard
                        key={`${item.id}-${index}`}
                        rank={index + 1}
                        storeName={storePrice.storeName}
                        price={storePrice.price}
                        storeImage={storePrice.storeImage}
                        isBestDeal={storePrice.isBestDeal}
                        priceDifference={storePrice.priceDifference}
                        productUrl={storePrice.productUrl}
                        productId={item.productId}
                        productName={item.productName}
                        productImage={item.productImage}
                        category={item.category}
                      />
                    ))}
                    {prices.length > 3 && (
                      <TouchableOpacity
                        onPress={() => router.push(`/category/${item.category}/${item.productName}/compare?productId=${item.productId}&productName=${item.productName}`)}
                        style={{
                          padding: 12,
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: 8,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>
                          View All {prices.length} Stores
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8' }}>No prices available</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Total Summary */}
          {list.items.length > 0 && (
            <View
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 16,
                padding: 20,
                marginTop: 8,
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
                Total Estimated Cost
              </Text>
              <Text style={{ fontSize: 32, fontWeight: '700', color: '#10b981' }}>
                ${totals.total.toFixed(2)}
              </Text>
              {Object.keys(totals.byStore).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 8 }}>By Store:</Text>
                  {Object.entries(totals.byStore).map(([store, total]) => (
                    <View key={store} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: '#E2E8F0' }}>{store}</Text>
                      <Text style={{ color: '#E2E8F0', fontWeight: '600' }}>${total.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

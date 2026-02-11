/**
 * My Lists - Simplified design
 * Quick access: Favorites card
 * Tabs: Current | Saved | History
 * Current tab shows the shopping list with items
 * Compare button only when list has items
 * Users add items via the + button on product cards
 */

import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import {
  getAllLists,
  calculateListTotal,
  ShoppingList,
} from '@/utils/listService';
import { getAllFavorites } from '@/utils/favoritesService';

type TabType = 'current' | 'saved' | 'history';

const cardStyle = {
  flex: 1,
  minWidth: 100,
  backgroundColor: 'rgba(15, 23, 42, 0.6)' as const,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(148, 163, 184, 0.1)' as const,
  padding: 16,
};

export default function ListsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [groceryList, setGroceryList] = useState<ShoppingList | null>(null);
  const [savedLists, setSavedLists] = useState<ShoppingList[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastItemCountRef = useRef<number>(0);

  const loadGroceryList = useCallback(async () => {
    try {
      const lists = await getAllLists();
      let grocery = lists.find(
        (l) =>
          l.name.toLowerCase().includes('grocery') ||
          l.name.toLowerCase() === 'groceries list'
      );
      if (!grocery) {
        if (lists.length > 0) {
          grocery = lists[0];
        } else {
          grocery = {
            id: 'default-list',
            name: 'My Shopping List',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }
      setGroceryList(grocery);
      setSavedLists(lists);
    } catch (error) {
      console.error('❌ Error loading lists:', error);
      setGroceryList(null);
      setSavedLists([]);
    }
  }, []);

  const loadFavoritesCount = useCallback(async () => {
    const favs = await getAllFavorites();
    setFavoritesCount(favs.length);
  }, []);

  useEffect(() => {
    loadGroceryList();
    loadFavoritesCount();
  }, [loadGroceryList, loadFavoritesCount]);

  useFocusEffect(
    useCallback(() => {
      loadGroceryList();
      loadFavoritesCount();
      refreshIntervalRef.current = setInterval(async () => {
        const lists = await getAllLists();
        const grocery =
          lists.find(
            (l) =>
              l.name.toLowerCase().includes('grocery') ||
              l.id === 'default-list' ||
              lists.length === 1
          ) || lists[0];
        const currentItemCount = grocery?.items.length || 0;
        if (currentItemCount !== lastItemCountRef.current) {
          lastItemCountRef.current = currentItemCount;
          loadGroceryList();
        }
      }, 2000);
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }, [loadGroceryList, loadFavoritesCount])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadGroceryList();
        loadFavoritesCount();
      }
    });
    return () => subscription.remove();
  }, [loadGroceryList, loadFavoritesCount]);

  useEffect(() => {
    if (groceryList) lastItemCountRef.current = groceryList.items.length;
  }, [groceryList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroceryList();
    loadFavoritesCount();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadGroceryList, loadFavoritesCount]);

  const handleAddItem = () => {
    router.push('/(tabs)/search');
  };

  const handleComparePrices = () => {
    if (!groceryList || groceryList.items.length === 0) {
      Alert.alert('Empty List', 'Add items to your list first to compare prices.');
      return;
    }
    router.push(`/list/${groceryList.id}/compare`);
  };

  const itemCount = groceryList?.items.length || 0;

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
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
          {/* Title */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: 16,
            }}
          >
            My Lists
          </Text>

          {/* Quick Access Card: Favorites */}
          <View
            style={{
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/favorites')}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(148, 163, 184, 0.1)',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Ionicons name="heart-outline" size={24} color="#EC4899" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: 4,
                  }}
                >
                  Favorites
                </Text>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                  {favoritesCount} favorited item{favoritesCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Tabs: Current | Saved | History */}
          <View
            style={{
              flexDirection: 'row',
              gap: 24,
              marginBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255, 255, 255, 0.1)',
              paddingBottom: 8,
            }}
          >
            {(
              [
                { id: 'current' as TabType, label: 'Current' },
                { id: 'saved' as TabType, label: 'Saved' },
                { id: 'history' as TabType, label: 'History' },
              ] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: activeTab === tab.id ? 2 : 0,
                  borderBottomColor: '#3B82F6',
                }}
              >
                <Text
                  style={{
                    color: activeTab === tab.id ? '#3B82F6' : '#94A3B8',
                    fontSize: 14,
                    fontWeight: activeTab === tab.id ? '600' : '400',
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab: Current */}
          {activeTab === 'current' && (
            <View>
              {/* + Add Items button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAddItem}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                  marginBottom: 16,
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  borderStyle: 'dashed',
                }}
              >
                <Ionicons name="add-circle-outline" size={22} color="#3B82F6" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#3B82F6' }}>
                  Search & Add Items
                </Text>
              </TouchableOpacity>

              {/* Compare button - only when list has items */}
              {itemCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleComparePrices}
                  style={{ width: '100%', marginBottom: 16 }}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      Compare Prices Across Stores
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Current list content */}
              <View
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="cart" size={22} color="#3B82F6" />
                    <Text
                      style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}
                    >
                      {groceryList?.name || 'My Shopping List'}
                    </Text>
                    {itemCount > 0 && (
                      <View
                        style={{
                          backgroundColor: '#10b981',
                          borderRadius: 10,
                          minWidth: 22,
                          height: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          {itemCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={onRefresh}
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 8,
                        padding: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      <Ionicons name="refresh" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleAddItem}
                      style={{
                        backgroundColor: '#3B82F6',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 14,
                          fontWeight: '600',
                        }}
                      >
                        Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {!groceryList || groceryList.items.length === 0 ? (
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 40,
                    }}
                  >
                    <Ionicons
                      name="cart-outline"
                      size={64}
                      color="rgba(100, 116, 139, 0.4)"
                    />
                    <Text
                      style={{
                        color: '#E2E8F0',
                        fontSize: 16,
                        fontWeight: '600',
                        marginTop: 16,
                        marginBottom: 8,
                      }}
                    >
                      Your list is empty
                    </Text>
                    <Text
                      style={{
                        color: '#94A3B8',
                        fontSize: 14,
                        textAlign: 'center',
                        maxWidth: 280,
                      }}
                    >
                      Search for products and tap the + button to add them to your list
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    {groceryList.items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
                        onPress={() => router.push(`/list/${groceryList.id}`)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          backgroundColor: 'rgba(21, 27, 40, 0.6)',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(148, 163, 184, 0.1)',
                        }}
                      >
                        <Image
                          source={{
                            uri:
                              item.productImage ||
                              'https://via.placeholder.com/60x60/1e2736/8b95a8?text=No+Image',
                          }}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            backgroundColor: '#1e2736',
                          }}
                          resizeMode="cover"
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: '600',
                              color: '#FFFFFF',
                              marginBottom: 4,
                            }}
                          >
                            {item.productName}
                          </Text>
                          {item.bestPrice && (
                            <Text
                              style={{
                                fontSize: 13,
                                color: '#10b981',
                                fontWeight: '600',
                              }}
                            >
                              ${(item.bestPrice * item.quantity).toFixed(2)}
                              {item.bestPriceStore &&
                                ` at ${item.bestPriceStore}`}
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                          Qty: {item.quantity}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Tab: Saved */}
          {activeTab === 'saved' && (
            <View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  marginBottom: 16,
                }}
              >
                Saved Lists
              </Text>
              {savedLists.length === 0 ? (
                <View
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 16,
                    padding: 40,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="list-outline" size={64} color="#64748B" />
                  <Text
                    style={{
                      color: '#E2E8F0',
                      fontSize: 18,
                      fontWeight: '600',
                      marginTop: 16,
                      marginBottom: 8,
                    }}
                  >
                    No Saved Lists
                  </Text>
                  <Text
                    style={{
                      color: '#94A3B8',
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    Save lists to access them later
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {savedLists.map((list) => {
                    const totals = calculateListTotal(list);
                    const isCurrent =
                      list.id === groceryList?.id ||
                      list.name
                        .toLowerCase()
                        .includes('shopping') ||
                      list.id === 'default-list';
                    return (
                      <TouchableOpacity
                        key={list.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (isCurrent) {
                            setActiveTab('current');
                          } else {
                            router.push(`/list/${list.id}`);
                          }
                        }}
                        style={{
                          backgroundColor: isCurrent
                            ? 'rgba(59, 130, 246, 0.1)'
                            : 'rgba(15, 23, 42, 0.6)',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: isCurrent
                            ? 'rgba(59, 130, 246, 0.3)'
                            : 'rgba(148, 163, 184, 0.1)',
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#FFFFFF',
                                marginBottom: 4,
                              }}
                            >
                              {list.name}
                            </Text>
                            <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                              {list.items.length} item
                              {list.items.length !== 1 ? 's' : ''}
                              {totals.total > 0
                                ? ` • $${totals.total.toFixed(2)}`
                                : ''}
                            </Text>
                          </View>
                          {isCurrent && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#3B82F6"
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Tab: History (Last Bought / Recently Bought) */}
          {activeTab === 'history' && (
            <View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  marginBottom: 16,
                }}
              >
                History
              </Text>
              <View
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 16,
                  padding: 32,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                <Ionicons name="receipt-outline" size={56} color="#64748B" />
                <Text
                  style={{
                    color: '#E2E8F0',
                    fontSize: 16,
                    fontWeight: '600',
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  Last Bought & Recently Bought
                </Text>
                <Text
                  style={{
                    color: '#94A3B8',
                    fontSize: 14,
                    textAlign: 'center',
                    marginBottom: 20,
                  }}
                >
                  View your purchase history
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/purchase-history')}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Text
                    style={{
                      color: '#3B82F6',
                      fontSize: 15,
                      fontWeight: '600',
                    }}
                  >
                    View Purchase History
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

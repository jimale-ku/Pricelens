/**
 * My Lists - Favorites, Last Bought, search to add items, one Compare button
 * Search input at top; when list empty Compare is centered; when has items Compare below list
 */

import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import {
  getAllLists,
  ShoppingList,
} from '@/utils/listService';
import { getAllFavorites } from '@/utils/favoritesService';

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
  const [groceryList, setGroceryList] = useState<ShoppingList | null>(null);
  const [savedLists, setSavedLists] = useState<ShoppingList[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (q) {
      router.push(`/(tabs)/search?q=${encodeURIComponent(q)}`);
      setSearchQuery('');
    } else {
      router.push('/(tabs)/search');
    }
  };

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
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>
            My Lists
          </Text>

          {/* Favorites card */}
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
              marginBottom: 12,
            }}
          >
            <Ionicons name="heart-outline" size={24} color="#EC4899" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                Favorites
              </Text>
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                {favoritesCount} item{favoritesCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Last Bought card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/purchase-history')}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <Ionicons name="receipt-outline" size={24} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                Last Bought
              </Text>
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                Purchase history
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Search input - at top below My List / cards */}
          <View style={{ marginBottom: 16 }}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              placeholder="Search to add items to your list..."
              placeholderTextColor="#64748B"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(148, 163, 184, 0.2)',
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#FFFFFF',
              }}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSearchSubmit}
              style={{
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="search" size={18} color="#3B82F6" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B82F6' }}>
                Search & add to list
              </Text>
            </TouchableOpacity>
          </View>

          {/* List content */}
          <View
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Ionicons name="cart" size={22} color="#3B82F6" />
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                    {groceryList?.name || 'My Shopping List'}
                  </Text>
                  {itemCount > 0 ? (
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
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                        {itemCount}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {!groceryList || groceryList.items.length === 0 ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
                    <Ionicons name="cart-outline" size={56} color="rgba(100, 116, 139, 0.4)" />
                    <Text style={{ color: '#E2E8F0', fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>
                      Your list is empty
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', maxWidth: 280, marginBottom: 24 }}>
                      Use the search above to find items and add them to your list
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleComparePrices}
                      style={{ alignSelf: 'center' }}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          borderRadius: 10,
                          paddingVertical: 12,
                          paddingHorizontal: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                          Compare Prices
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
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
                          {(item.bestPrice != null && item.bestPrice > 0) ? (
                            <Text
                              style={{
                                fontSize: 13,
                                color: '#10b981',
                                fontWeight: '600',
                              }}
                            >
                              ${(item.bestPrice * item.quantity).toFixed(2)}
                              {item.bestPriceStore ? ` at ${item.bestPriceStore}` : ''}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                          Qty: {item.quantity}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Compare button - below items when list has items */}
                {itemCount > 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleComparePrices}
                    style={{ width: '100%', marginTop: 16 }}
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
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                        Compare Prices Across Stores
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : null}
              </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

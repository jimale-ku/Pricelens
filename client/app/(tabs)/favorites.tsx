/**
 * Favorites Tab Screen
 * Shows favorited items and their variations
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { getAllFavorites, removeFavorite, FavoriteProduct } from '@/utils/favoritesService';
import { API_ENDPOINTS } from '@/constants/api';
import { transformCompareResponse } from '@/utils/apiTransform';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [variations, setVariations] = useState<Record<string, any[]>>({});
  const [loadingVariations, setLoadingVariations] = useState<Set<string>>(new Set());

  const loadFavorites = useCallback(async () => {
    const favs = await getAllFavorites();
    setFavorites(favs);
    
    // Fetch variations for each favorite
    for (const fav of favs) {
      if (!variations[fav.productId]) {
        fetchVariations(fav);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const fetchVariations = async (favorite: FavoriteProduct) => {
    setLoadingVariations(prev => new Set(prev).add(favorite.productId));
    
    try {
      // Search for similar products (variations)
      const searchUrl = `${API_ENDPOINTS.products.compareMultiStore(favorite.productName, 'auto')}`;
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        const transformed = transformCompareResponse(data);
        // Get top 3 variations (different stores/versions)
        setVariations(prev => ({
          ...prev,
          [favorite.productId]: transformed.storePrices?.slice(0, 3) || [],
        }));
      }
    } catch (error) {
      console.error(`Error fetching variations for ${favorite.productName}:`, error);
    } finally {
      setLoadingVariations(prev => {
        const next = new Set(prev);
        next.delete(favorite.productId);
        return next;
      });
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    await removeFavorite(productId);
    await loadFavorites();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, [loadFavorites]);

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
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 24 }}>
            Favorites
          </Text>

          {favorites.length === 0 ? (
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
            }}>
              <Ionicons name="heart-outline" size={64} color="#64748B" />
              <Text style={{
                color: '#E2E8F0',
                fontSize: 18,
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 8,
              }}>
                No Favorites Yet
              </Text>
              <Text style={{
                color: '#94A3B8',
                fontSize: 14,
                textAlign: 'center',
              }}>
                Tap the heart icon on any product to add it to favorites
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {favorites.map((favorite) => {
                const itemVariations = variations[favorite.productId] || [];
                const isLoading = loadingVariations.has(favorite.productId);

                return (
                  <View
                    key={favorite.productId}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(148, 163, 184, 0.1)',
                    }}
                  >
                    {/* Favorite Item */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                      <Image
                        source={{ uri: favorite.productImage || 'https://via.placeholder.com/80x80/1e2736/8b95a8?text=No+Image' }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          backgroundColor: '#1e2736',
                        }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                              {favorite.productName}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
                              {favorite.category}
                            </Text>
                            {favorite.minPrice && (
                              <Text style={{ fontSize: 16, fontWeight: '700', color: '#10b981' }}>
                                From ${favorite.minPrice.toFixed(2)}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveFavorite(favorite.productId)}
                            style={{
                              padding: 8,
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              borderRadius: 8,
                            }}
                          >
                            <Ionicons name="heart" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Variations */}
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#E2E8F0', marginBottom: 12 }}>
                        Available Versions
                      </Text>
                      {isLoading ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                          <ActivityIndicator size="small" color="#3B82F6" />
                        </View>
                      ) : itemVariations.length > 0 ? (
                        <View style={{ gap: 8 }}>
                          {itemVariations.map((variation, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => router.push(`/category/${favorite.categorySlug}/${favorite.productName}/compare?productId=${favorite.productId}&productName=${favorite.productName}`)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 12,
                                backgroundColor: 'rgba(21, 27, 40, 0.6)',
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: 'rgba(148, 163, 184, 0.1)',
                              }}
                            >
                              <Image
                                source={{ uri: variation.storeImage || 'https://via.placeholder.com/40x40' }}
                                style={{ width: 40, height: 40, borderRadius: 4, marginRight: 12 }}
                                resizeMode="contain"
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '500' }}>
                                  {variation.storeName}
                                </Text>
                                <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                                  {variation.shippingInfo || 'Available'}
                                </Text>
                              </View>
                              <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '700' }}>
                                {variation.price}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity
                            onPress={() => router.push(`/category/${favorite.categorySlug}/${favorite.productName}/compare?productId=${favorite.productId}&productName=${favorite.productName}`)}
                            style={{
                              padding: 12,
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              borderRadius: 8,
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: 'rgba(59, 130, 246, 0.3)',
                              marginTop: 8,
                            }}
                          >
                            <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>
                              View All Prices
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={{ color: '#94A3B8', fontSize: 14 }}>
                          No variations available
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

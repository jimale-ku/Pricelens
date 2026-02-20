/**
 * Product Comparison Page
 * 
 * This page shows store prices for a single product.
 * Users can compare prices across multiple stores.
 * 
 * Features:
 * - Sticky product summary header
 * - Sort/filter controls
 * - Store cards grid
 * - Helpful insights
 */

import { ScrollView, View, Text, Image, TouchableOpacity, SafeAreaView, useWindowDimensions, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useMemo, useRef } from 'react';
import StoreCard from './StoreCard';
import AppHeader from './AppHeader';
import { API_ENDPOINTS } from '../constants/api';

interface StorePrice {
  rank: number;
  storeName: string;
  price: string;
  storeImage: string;
  isBestDeal?: boolean;
  shippingInfo?: string;
  totalPrice?: number;
  savings?: number;
  priceDifference?: string;
  productUrl?: string;
}

interface ProductComparisonPageProps {
  productId: string | number;
  productName: string;
  productImage: string;
  category: string;
  categorySlug: string;
  storePrices: StorePrice[];
  // Optional metadata
  minPrice?: number;
  maxPrice?: number;
  priceRange?: number;
  totalStores?: number;
}

export default function ProductComparisonPage({
  productId,
  productName,
  productImage,
  category,
  categorySlug,
  storePrices = [],
  minPrice,
  maxPrice,
  priceRange,
  totalStores,
}: ProductComparisonPageProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  // CRITICAL: Log what ProductComparisonPage received
  console.log('📥 ProductComparisonPage RECEIVED:', {
    productName,
    storePricesCount: storePrices.length,
    storePrices: storePrices.slice(0, 5).map((sp: any) => ({
      storeName: sp.storeName,
      price: sp.price,
      isBestDeal: sp.isBestDeal,
    })),
    totalStores,
  });

  // Sort/filter state
  // Sort options for price comparison (where to buy it cheapest)
  const [sortBy, setSortBy] = useState<'price' | 'delivery' | 'nearest'>('price');
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [selectedStores, setSelectedStores] = useState<string[]>([]); // Empty = all stores
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Store search state
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false); // For "See More" / "See Less" toggle
  
  // Infinite scroll state - show stores in batches
  const [visibleStoresCount, setVisibleStoresCount] = useState(12); // Show first 12 stores initially
  const STORES_PER_PAGE = 12; // Load 12 more stores each time user scrolls

  // Well-known retailers: when user has NOT entered a ZIP, show these first (then rest by price)
  const POPULAR_STORE_ORDER = [
    'Amazon', 'Walmart', 'Target', 'Best Buy', 'Costco', 'Home Depot', 'Lowe\'s',
    'Kroger', 'CVS', 'Walgreens', 'eBay', 'Newegg', 'B&H Photo', 'Sam\'s Club',
    'Apple', 'Samsung', 'Google Store', 'Macy\'s', 'Kohl\'s', 'Nordstrom',
  ];
  const getPopularStoreIndex = (storeName: string): number => {
    const lower = (storeName || '').toLowerCase().replace(/\s*\.(com|net|org)$/i, '');
    for (let i = 0; i < POPULAR_STORE_ORDER.length; i++) {
      const p = POPULAR_STORE_ORDER[i].toLowerCase();
      if (lower === p || lower.startsWith(p) || lower.includes(` ${p} `)) return i;
    }
    return POPULAR_STORE_ORDER.length;
  };

  // Get unique store names from storePrices
  const availableStores = useMemo(() => {
    const storeSet = new Set(storePrices.map(sp => sp.storeName));
    return Array.from(storeSet).sort();
  }, [storePrices]);

  // Filter and sort store prices
  const filteredAndSortedPrices = useMemo(() => {
    console.log('🔍 FILTERING storePrices:', {
      inputCount: storePrices.length,
      selectedStores: selectedStores.length,
      filterInStock,
      filterDelivery,
    });
    
    let filtered = [...storePrices];

    // Filter by selected stores
    if (selectedStores.length > 0) {
      const before = filtered.length;
      filtered = filtered.filter(p => selectedStores.includes(p.storeName));
      console.log(`   Filtered by selected stores: ${before} → ${filtered.length}`);
    }

    // Filter by store search query
    if (storeSearchQuery.trim().length > 0) {
      const before = filtered.length;
      const searchLower = storeSearchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.storeName.toLowerCase().includes(searchLower)
      );
      console.log(`   Filtered by store search: ${before} → ${filtered.length}`);
    }

    // Filter by in-stock
    if (filterInStock) {
      const before = filtered.length;
      filtered = filtered.filter(p => 
        !p.shippingInfo?.toLowerCase().includes('out of stock')
      );
      console.log(`   Filtered by in-stock: ${before} → ${filtered.length}`);
    }

    // Filter by delivery type
    if (filterDelivery === 'pickup') {
      const before = filtered.length;
      filtered = filtered.filter(p => 
        p.shippingInfo?.toLowerCase().includes('pickup') ||
        p.shippingInfo?.toLowerCase().includes('in-store')
      );
      console.log(`   Filtered by pickup: ${before} → ${filtered.length}`);
    } else if (filterDelivery === 'delivery') {
      const before = filtered.length;
      filtered = filtered.filter(p => 
        !p.shippingInfo?.toLowerCase().includes('pickup') &&
        !p.shippingInfo?.toLowerCase().includes('in-store only')
      );
      console.log(`   Filtered by delivery: ${before} → ${filtered.length}`);
    }

    // Sort: known brands first, then by price or delivery (ZIP/distance UI removed for now)
    if (sortBy === 'price') {
      // No ZIP or sort by price: known brands first, then by price
      filtered.sort((a, b) => {
        const popA = getPopularStoreIndex(a.storeName);
        const popB = getPopularStoreIndex(b.storeName);
        if (popA !== popB) return popA - popB;
        const priceA = parseFloat(a.price.replace('$', '')) || 0;
        const priceB = parseFloat(b.price.replace('$', '')) || 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'delivery') {
      // Known brands first, then free shipping, then price
      filtered.sort((a, b) => {
        const popA = getPopularStoreIndex(a.storeName);
        const popB = getPopularStoreIndex(b.storeName);
        if (popA !== popB) return popA - popB;
        const aFree = a.shippingInfo?.toLowerCase().includes('free') ? 0 : 1;
        const bFree = b.shippingInfo?.toLowerCase().includes('free') ? 0 : 1;
        if (aFree !== bFree) return aFree - bFree;
        const priceA = parseFloat(a.price.replace('$', '')) || 0;
        const priceB = parseFloat(b.price.replace('$', '')) || 0;
        return priceA - priceB;
      });
    } else {
      // nearest (or default): known brands first, then by price
      filtered.sort((a, b) => {
        const popA = getPopularStoreIndex(a.storeName);
        const popB = getPopularStoreIndex(b.storeName);
        if (popA !== popB) return popA - popB;
        const priceA = parseFloat(a.price.replace('$', '')) || 0;
        const priceB = parseFloat(b.price.replace('$', '')) || 0;
        return priceA - priceB;
      });
    }

    // Update ranks after sorting
    const result = filtered.map((price, index) => ({
      ...price,
      rank: index + 1,
      isBestDeal: index === 0,
    }));
    
    console.log(`✅ FILTERED RESULT: ${result.length} stores (from ${storePrices.length} input)`);
    if (result.length === 0 && storePrices.length > 0) {
      console.warn('⚠️ WARNING: All stores filtered out! Check filters:', {
        selectedStores: selectedStores.length,
        filterInStock,
        filterDelivery,
      });
    }
    
    return result;
  }, [storePrices, selectedStores, sortBy, filterInStock, filterDelivery, storeSearchQuery]);

  // Get visible stores for infinite scroll
  const visibleStores = useMemo(() => {
    return filteredAndSortedPrices.slice(0, visibleStoresCount);
  }, [filteredAndSortedPrices, visibleStoresCount]);

  // Check if there are more stores to load
  const hasMoreStores = filteredAndSortedPrices.length > visibleStoresCount;

  // Load more stores when user scrolls near bottom
  const handleLoadMore = () => {
    if (hasMoreStores && visibleStoresCount < filteredAndSortedPrices.length) {
      setVisibleStoresCount(prev => Math.min(prev + STORES_PER_PAGE, filteredAndSortedPrices.length));
    }
  };

  // Toggle expanded state for "See More" / "See Less"
  const toggleExpanded = () => {
    if (isExpanded) {
      // Collapse: reset to initial count
      setVisibleStoresCount(12);
      setIsExpanded(false);
    } else {
      // Expand: show all stores
      setVisibleStoresCount(filteredAndSortedPrices.length);
      setIsExpanded(true);
    }
  };

  // Calculate insights
  const insights = useMemo(() => {
    if (filteredAndSortedPrices.length === 0) return null;

    const prices = filteredAndSortedPrices.map(p => 
      parseFloat(p.price.replace('$', '')) || 0
    );
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    const cheapest = filteredAndSortedPrices[0];

    return {
      priceRange: `$${min.toFixed(2)} – $${max.toFixed(2)}`,
      savings: range > 0 ? `Save up to $${range.toFixed(2)}` : null,
      cheapestStore: cheapest?.storeName || '',
    };
  }, [filteredAndSortedPrices]);

  // Determine final image URL - persist first valid image so it doesn't disappear on re-render
  const lastValidImageRef = useRef<string | null>(null);
  let finalImageUri = 'https://via.placeholder.com/96x96/1e2736/8b95a8?text=No+Image';
  
  if (productImage && typeof productImage === 'string') {
    const trimmed = productImage.trim();
    const isPlaceholder = trimmed.includes('placeholder') || 
                         trimmed.includes('via.placeholder') ||
                         trimmed.includes('example.com') ||
                         trimmed === '' ||
                         trimmed.length < 10;
    
    const isValidUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    
    if (isValidUrl && !isPlaceholder) {
      finalImageUri = trimmed;
      lastValidImageRef.current = trimmed;
    }
  }
  // Keep showing last valid image if current prop is empty (fix: image disappearing when opening product)
  if (finalImageUri.includes('placeholder') && lastValidImageRef.current) {
    finalImageUri = lastValidImageRef.current;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />
      
      {/* Sticky Product Summary Header */}
      <View style={{
        backgroundColor: 'rgba(21, 27, 40, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 149, 168, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#e8edf4" />
        </TouchableOpacity>

        {/* Product Image */}
        <Image
          source={{ uri: finalImageUri }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: '#1e2736',
          }}
          resizeMode="cover"
        />

        {/* Product Info */}
        <View style={{ flex: 1 }}>
          <Text style={{
            color: '#e8edf4',
            fontSize: 14,
            fontWeight: '600',
            numberOfLines: 1,
          }}>
            {productName}
          </Text>
          <Text style={{
            color: '#94a3b8',
            fontSize: 12,
            marginTop: 2,
          }}>
            {category}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          // Load more when user scrolls to 80% of content
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 200; // Trigger 200px before bottom
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Store Controls */}
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          gap: 12,
        }}>
          {/* Sort and Filter Row */}
          <View style={{
            flexDirection: 'row',
            gap: 12,
          }}>
            {/* Sort Dropdown */}
            <View style={{ flex: 1, position: 'relative' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowFilterDropdown(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(139, 149, 168, 0.2)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="swap-vertical-outline" size={16} color="#8b95a8" />
                  <Text style={{ color: '#e8edf4', fontSize: 14 }}>
                    {sortBy === 'price' ? 'Price: Low → High' : 
                     sortBy === 'nearest' ? 'Nearest Store' : 
                     'Delivery Speed'}
                  </Text>
                </View>
                <Ionicons 
                  name={showSortDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#8b95a8" 
                />
              </TouchableOpacity>

              {/* Sort Dropdown Menu */}
              {showSortDropdown && (
                <View style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  backgroundColor: 'rgba(21, 27, 40, 0.95)',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(139, 149, 168, 0.2)',
                  zIndex: 1000,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}>
                  {[
                    { value: 'price', label: 'Price: Low → High' },
                    { value: 'nearest', label: 'Nearest Store' },
                    { value: 'delivery', label: 'Delivery Speed' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSortBy(option.value as 'price' | 'delivery' | 'nearest');
                        setShowSortDropdown(false);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderBottomWidth: option.value !== 'rating' ? 1 : 0,
                        borderBottomColor: 'rgba(139, 149, 168, 0.1)',
                        backgroundColor: sortBy === option.value 
                          ? 'rgba(96, 165, 250, 0.1)' 
                          : 'transparent',
                      }}
                    >
                      <Text style={{
                        color: sortBy === option.value ? '#60a5fa' : '#e2e8f0',
                        fontSize: 14,
                        fontWeight: sortBy === option.value ? '500' : '400',
                      }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Filter Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowSortDropdown(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(139, 149, 168, 0.2)',
              }}
            >
              <Ionicons name="filter-outline" size={16} color="#8b95a8" />
              <Text style={{ color: '#e8edf4', fontSize: 14 }}>
                Filter
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter Options (when dropdown is open) */}
          {showFilterDropdown && (
            <View style={{
              backgroundColor: 'rgba(21, 27, 40, 0.95)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(139, 149, 168, 0.2)',
              padding: 12,
              gap: 12,
            }}>
              {/* In Stock Only Toggle */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFilterInStock(!filterInStock)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#e8edf4', fontSize: 14 }}>
                  In Stock Only
                </Text>
                <View style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: filterInStock ? '#3b82f6' : 'rgba(139, 149, 168, 0.3)',
                  alignItems: filterInStock ? 'flex-end' : 'flex-start',
                  justifyContent: 'center',
                  padding: 2,
                }}>
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#ffffff',
                  }} />
                </View>
              </TouchableOpacity>

              {/* Delivery Type */}
              <View>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
                  Delivery Type
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'pickup', label: 'Pickup' },
                    { value: 'delivery', label: 'Delivery' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.8}
                      onPress={() => setFilterDelivery(option.value as any)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        backgroundColor: filterDelivery === option.value
                          ? 'rgba(96, 165, 250, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        borderColor: filterDelivery === option.value
                          ? 'rgba(96, 165, 250, 0.4)'
                          : 'rgba(139, 149, 168, 0.2)',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{
                        color: filterDelivery === option.value ? '#60a5fa' : '#e8edf4',
                        fontSize: 13,
                        fontWeight: filterDelivery === option.value ? '500' : '400',
                      }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Store Cards Grid */}
        <View style={{
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}>
          {filteredAndSortedPrices.length === 0 ? (
            <View style={{
              paddingVertical: 40,
              alignItems: 'center',
            }}>
              <Ionicons name="storefront-outline" size={48} color="#8b95a8" />
              <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                No stores found matching your filters
              </Text>
            </View>
          ) : (
            <>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                {visibleStores.map((storePrice, index) => {
                  // Calculate column width: 2 columns on mobile, 3 on desktop
                  const columnWidth = isMobile ? '47%' : '31%';
                  
                  return (
                    <View key={`store-${storePrice.rank}-${index}`} style={{ 
                      width: columnWidth,
                      height: 220, // Fixed height for all price comparison boxes (was minHeight)
                    }}>
                      <StoreCard
                        rank={storePrice.rank}
                        storeName={storePrice.storeName}
                        price={storePrice.price}
                        storeImage={storePrice.storeImage}
                        isBestDeal={storePrice.isBestDeal}
                        priceDifference={storePrice.priceDifference}
                        productUrl={storePrice.productUrl}
                        productId={productId}
                        productName={productName}
                        productImage={productImage}
                        category={category}
                      />
                    </View>
                  );
                })}
              </View>
              
              {/* See More / See Less Toggle */}
              {filteredAndSortedPrices.length > 12 && (
                <View style={{
                  paddingVertical: 24,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#8b95a8', fontSize: 14, marginBottom: 12 }}>
                    Showing {visibleStores.length} of {filteredAndSortedPrices.length} stores
                  </Text>
                  <TouchableOpacity
                    onPress={toggleExpanded}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      backgroundColor: '#6366f1',
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                      {isExpanded ? 'See Less Stores' : 'See More Stores'}
                    </Text>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={18} 
                      color="#ffffff" 
                    />
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Show total count if all stores are visible */}
              {!hasMoreStores && filteredAndSortedPrices.length > 0 && filteredAndSortedPrices.length <= 12 && (
                <View style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#8b95a8', fontSize: 14 }}>
                    Showing all {filteredAndSortedPrices.length} stores
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Helpful Insights */}
        {insights && filteredAndSortedPrices.length > 0 && (
          <View style={{
            marginHorizontal: 16,
            marginBottom: 24,
            padding: 16,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}>
            <Text style={{
              color: '#10b981',
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 8,
            }}>
              💡 Price Insights
            </Text>
            <Text style={{
              color: '#94a3b8',
              fontSize: 13,
              marginBottom: 4,
            }}>
              Price range: {insights.priceRange}
            </Text>
            {insights.savings && (
              <Text style={{
                color: '#10b981',
                fontSize: 13,
                fontWeight: '600',
              }}>
                {insights.savings} by choosing {insights.cheapestStore}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


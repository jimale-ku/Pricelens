/**
 * Pattern A Layout - Reusable Template for Two-Level Category System
 * 
 * Used by 25+ categories: Groceries, Electronics, Kitchen, Home Accessories, 
 * Clothing, Footwear, Books, Beauty Products, Video Games, Sports Equipment, 
 * Office Supplies, Furniture, Home Decor, Tools & Hardware, Pet Supplies
 * 
 * HOW TO USE:
 * 1. Import this component
 * 2. Pass category-specific props (icon, title, description, stores, subcategories, products)
 * 3. That's it! All the layout, search, filters, and product cards are handled here
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, Modal, Pressable, Image, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect, useRef, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import StoreChip from '../StoreChip';
import ProductCard from '../ProductCard';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import { transformProducts, transformCompareResponse } from '../../utils/apiTransform';
import { testBackendConnection } from '../../utils/testConnection';

// Validate critical imports with DETAILED error messages
const validateImport = (component: any, name: string, importPath: string) => {
  if (component === undefined) {
    const error = new Error(
      `[CRITICAL] ${name} is UNDEFINED!\n` +
      `Import path: ${importPath}\n` +
      `Type: ${typeof component}\n` +
      `Check: 1) File exists 2) Has default export 3) Export is correct`
    );
    console.error(`❌ ${name} validation failed:`, {
      component,
      type: typeof component,
      isUndefined: component === undefined,
      isNull: component === null,
      importPath,
    });
    throw error;
  }
  if (typeof component !== 'function' && typeof component !== 'object') {
    const error = new Error(
      `[CRITICAL] ${name} is not a valid component!\n` +
      `Type: ${typeof component}\n` +
      `Value: ${String(component)}\n` +
      `Expected: function or object (React component)`
    );
    console.error(`❌ ${name} is not a function/object:`, {
      component,
      type: typeof component,
      constructor: component?.constructor?.name,
    });
    throw error;
  }
  console.log(`✅ ${name} is valid:`, typeof component);
  return true;
};

try {
  validateImport(ProductCard, 'ProductCard', '../ProductCard');
  validateImport(StoreChip, 'StoreChip', '../StoreChip');
  validateImport(AppHeader, 'AppHeader', '@/components/AppHeader');
  validateImport(BottomNav, 'BottomNav', '@/components/BottomNav');
} catch (error) {
  console.error('🚨 FATAL: PatternALayout component validation failed:', error);
  throw error;
}

interface Subcategory {
  id: string;
  name: string;
  count?: number;
}

interface StorePrice {
  rank: number;
  storeName: string;
  price: string;
  storeImage: string;
  isBestDeal?: boolean;
}

interface Product {
  id: string | number;
  name: string;
  image: string;
  category: string;
  storePrices: StorePrice[];
  maxSavings?: number;
  bestPrice?: number;
  bestPriceStore?: string;
}

interface PatternALayoutProps {
  // Category identity
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: React.ComponentType<{ size?: number; color?: string }>;
  iconGradient: string[]; // e.g., ['#60a5fa', '#9333ea']
  
  // Stores for this category
  stores: string[];
  
  // Subcategories (Level 1)
  subcategories?: Subcategory[];
  
  // Default products to show (when no search)
  defaultProducts: Product[];
  
  // Optional: Custom category ID for API filtering
  categoryId?: string;
}

export default function PatternALayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon: CategoryIcon,
  iconGradient,
  stores,
  subcategories = [],
  defaultProducts,
  categoryId,
}: PatternALayoutProps) {
  // Safety check: Ensure CategoryIcon is always defined
  const SafeCategoryIcon = CategoryIcon || (({ size = 24, color = "#ffffff" }: { size?: number; color?: string }) => (
    <Ionicons name="cube-outline" size={size} color={color} />
  ));
  
  const [selectedStores, setSelectedStores] = useState<string[]>(['All Stores']);
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Lowest Price');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset state when category changes (without remounting component)
  useEffect(() => {
    setSelectedStores(['All Stores']);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, [categorySlug]);
  
  const SORT_OPTIONS = ['Lowest Price', 'Nearest Store'];
  
  // Search function - Uses PriceAPI-enabled endpoint with fallback
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    console.log('🔍 performSearch STARTED with query:', query);
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const searchUrl = API_ENDPOINTS.products.compareMultiStore(query.trim(), 'auto');
      console.log('🔍 Fetching from URL:', searchUrl);
      console.log('🔍 API_BASE_URL:', API_BASE_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Raw API response:', {
        hasProduct: !!data.product,
        productName: data.product?.name,
        productImage: data.product?.image,
        imageType: typeof data.product?.image,
        pricesCount: data.prices?.length || 0,
      });
      
      const transformedProduct = transformCompareResponse(data);
      console.log('📦 Transformed product:', {
        name: transformedProduct?.name,
        image: transformedProduct?.image,
        imageType: typeof transformedProduct?.image,
        hasImage: !!transformedProduct?.image,
        storePricesCount: transformedProduct?.storePrices?.length || 0,
      });
      
      if (transformedProduct) {
        setSearchResults([transformedProduct]);
        setHasSearched(true); // CRITICAL: Mark that search completed successfully
      } else {
        setSearchResults([]);
        setHasSearched(true); // Still mark as searched even if no results
      }
    } catch (error: any) {
      console.error('Search error:', error);
      
      const isNetworkError = 
        error.message?.includes('Network request failed') || 
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('aborted') ||
        error.name === 'AbortError';
      
      if (isNetworkError) {
        try {
          console.log('⚠️ PriceAPI endpoint failed, trying database search...');
          const fallbackUrl = `${API_ENDPOINTS.products.search}?q=${encodeURIComponent(query.trim())}`;
          const fallbackController = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackController.abort(), 10000);
          
          const fallbackResponse = await fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: fallbackController.signal,
          });
          
          clearTimeout(fallbackTimeout);
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const transformedProducts = transformProducts(Array.isArray(fallbackData) ? fallbackData : []);
            setSearchResults(transformedProducts);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError);
        }
        
        const serverUrl = API_ENDPOINTS.products.compareMultiStore(query.trim(), 'auto').split('?')[0];
        Alert.alert(
          'Connection Error',
          `Cannot connect to server:\n${serverUrl}\n\nTroubleshooting:\n1. Is backend server running?\n2. Check IP address\n3. Same WiFi network?\n4. Firewall blocking?`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Search Error',
          error.message || 'Failed to search products. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Debounced search effect
  useEffect(() => {
    console.log('🔍 Search useEffect triggered, searchQuery:', searchQuery);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!searchQuery.trim()) {
      console.log('🔍 Search query is empty, clearing results');
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    console.log('🔍 Setting up search timeout for:', searchQuery);
    searchTimeoutRef.current = setTimeout(() => {
      console.log('🔍 Timeout fired, calling performSearch with:', searchQuery);
      performSearch(searchQuery);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        console.log('🔍 Cleaning up search timeout');
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);
  
  // Memoize products to avoid recalculation on every render
  // CRITICAL: Filter out any undefined/null products to prevent render errors
  const displayProducts = useMemo(() => {
    const useSearchResults = hasSearched && searchQuery.trim();
    const products = useSearchResults ? searchResults : defaultProducts;
    
    console.log('📦 displayProducts calculation:', {
      hasSearched,
      searchQuery: searchQuery.trim(),
      useSearchResults,
      searchResultsCount: searchResults.length,
      defaultProductsCount: defaultProducts.length,
      finalProductsCount: products.length,
      firstProductImage: products[0]?.image,
      firstProductName: products[0]?.name,
    });
    
    // Filter out any undefined/null products
    return Array.isArray(products) ? products.filter(p => p != null && p.id != null) : [];
  }, [hasSearched, searchQuery, searchResults, defaultProducts]);
  
  // Memoize filtered products
  const filteredProducts = useMemo(() => {
    if (selectedSubcategory) {
      return displayProducts.filter(p => 
        p && p.category && p.category.toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }
    return displayProducts;
  }, [displayProducts, selectedSubcategory]);
  
  // Limit initial render to first 6 products for faster display
  // CRITICAL: Ensure no undefined products are included
  const productsToRender = useMemo(() => {
    return filteredProducts.filter(p => p != null && p.id != null).slice(0, 6);
  }, [filteredProducts]);
  
  // OPTIMIZED: Defer product rendering when category changes to show page structure immediately
  // This allows the header, search bar, and filters to render first
  const [showProducts, setShowProducts] = useState(true); // Show on initial mount
  
  // Defer product rendering when category changes (non-blocking)
  useEffect(() => {
    // Hide products briefly when category changes to allow page structure to render
    setShowProducts(false);
    
    // Use setTimeout as fallback (works everywhere) instead of requestAnimationFrame
    // Small delay ensures page structure renders first
    const timer = setTimeout(() => {
      setShowProducts(true);
    }, 0); // 0ms - runs after current render cycle
    
    return () => {
      clearTimeout(timer);
    };
  }, [categorySlug]); // Only depend on categorySlug to avoid unnecessary resets
  
  // Memoize subcategory emoji map to avoid recreating on every render
  const subcategoryEmojiMap = useMemo(() => ({
    'tvs': '📺',
    'headphones': '🎧',
    'tablets': '📱',
    'gaming': '🎮',
    'laptops': '💻',
    'cameras': '📷',
    'smartwatches': '⌚',
    'speakers': '🔊',
    'accessories': '🔌',
    'produce': '🥬',
    'dairy': '🥛',
    'meat': '🥩',
    'bakery': '🍞',
    'pantry': '🥫',
  }), []);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Reset scroll position when category changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [categorySlug]);
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Enable clipping for performance
        bounces={false}
        scrollEventThrottle={16}
      >
        
        <View style={{
          flexDirection: 'column',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 32,
        }}>
          {/* Category Header - Figma Specs */}
          <View style={{
            backgroundColor: 'rgba(21, 27, 40, 0.6)',
            borderRadius: 16,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(139, 149, 168, 0.15)',
            marginBottom: 24,
            // Note: backdrop-filter not directly supported in React Native
            // Using overlay gradient to simulate the effect
            overflow: 'hidden',
          }}>
            {/* Gradient overlay for glass effect */}
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
            
            {/* Content Container */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}>
              {/* Icon */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <LinearGradient
                  colors={iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SafeCategoryIcon size={24} color="#ffffff" />
                </LinearGradient>
              </View>
              
              {/* Title */}
              <View style={{ flex: 1 }}>
                <MaskedView
                  maskElement={
                    <Text style={{
                      fontSize: 30,
                      lineHeight: 36,
                      fontWeight: '700',
                      backgroundColor: 'transparent',
                    }}>
                      {categoryName} Price Comparison
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    locations={iconGradient.length === 2 ? [0, 1] : undefined}
                    style={{ marginBottom: 4 }}
                  >
                    <Text style={{
                      fontSize: 30,
                      lineHeight: 36,
                      fontWeight: '700',
                      opacity: 0,
                    }}>
                      {categoryName} Price Comparison
                    </Text>
                  </LinearGradient>
                </MaskedView>
              </View>
            </View>
            
            {/* Description */}
            <Text style={{
              fontSize: 14,
              color: '#cbd5e1', // text-slate-300 equivalent
              lineHeight: 20,
              marginTop: 0,
            }}>
              {categoryDescription}
            </Text>
          </View>
          
          {/* Search & Filters Section */}
          <Text style={{
            fontSize: 18,
            lineHeight: 28,
            color: '#e2e8f0',
            fontWeight: '600',
            marginBottom: 16,
          }}>
            Search & Filters
          </Text>
          
          <View style={{ gap: 24 }}>
            {/* Search Bar */}
            <View style={{ gap: 8 }}>
              <Text style={{
                fontSize: 14,
                lineHeight: 20,
                fontWeight: '500',
                color: '#e8edf4',
              }}>
                Search
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(139, 149, 168, 0.2)',
                paddingHorizontal: 12,
                height: 36,
              }}>
                <Ionicons name="search" size={16} color="#8b95a8" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search for products..."
                  placeholderTextColor="rgba(139, 149, 168, 0.6)"
                  value={searchQuery}
                  onChangeText={(text) => {
                    console.log('🔍 TextInput onChangeText:', text);
                    setSearchQuery(text);
                  }}
                  onSubmitEditing={() => {
                    console.log('🔍 TextInput onSubmitEditing, triggering search now');
                    if (searchQuery.trim()) {
                      performSearch(searchQuery);
                    }
                  }}
                  style={{
                    flex: 1,
                    color: '#e8edf4',
                    fontSize: 14,
                    lineHeight: 20,
                    paddingVertical: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  }}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color="#60a5fa" style={{ marginLeft: 8 }} />
                )}
              </View>
            </View>
            
            {/* Subcategory Filter Pills (if subcategories exist) */}
            {subcategories.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={{
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: '500',
                  color: '#e8edf4',
                }}>
                  Category
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  {subcategories
                    .filter(subcat => subcat != null && subcat.id != null) // Filter out undefined
                    .map((subcat) => {
                    const emoji = subcategoryEmojiMap[subcat.id] || '📦';
                    const isSelected = selectedSubcategory === subcat.id;
                    
                    return (
                      <TouchableOpacity
                        key={subcat.id}
                        onPress={() => setSelectedSubcategory(isSelected ? null : subcat.id)}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isSelected 
                            ? 'rgba(59, 130, 246, 0.2)' // Lighter background when selected
                            : 'rgba(255, 255, 255, 0.05)', // Dark background when unselected
                          borderWidth: 1,
                          borderColor: isSelected 
                            ? 'rgba(52, 211, 235, 0.5)' // Cyan border when selected
                            : 'rgba(139, 149, 168, 0.2)', // Subtle border when unselected
                          gap: 6,
                        }}
                      >
                        {/* Emoji Icon */}
                        <Text style={{
                          fontSize: 16,
                          lineHeight: 16,
                        }}>
                          {emoji}
                        </Text>
                        
                        {/* Category Name and Count */}
                        <Text style={{
                          color: isSelected ? '#60a5fa' : '#e8edf4',
                          fontSize: 14,
                          fontWeight: '500',
                        }}>
                          {subcat.name} {subcat.count !== undefined ? `(${subcat.count})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
          
          {/* Browse by Category Section - Electronics specific */}
          {categorySlug === 'electronics' && subcategories.length > 0 && (
            <View style={{
              backgroundColor: 'rgba(21, 27, 40, 0.6)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(52, 211, 235, 0.3)', // cyan-400/30
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 24,
              marginTop: 24,
              overflow: 'hidden',
            }}>
              {/* Gradient overlay for glass effect */}
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
              
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
                paddingBottom: 24,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(139, 149, 168, 0.15)',
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  {/* Sparkles Icon */}
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    <Path d="M20 3v4" />
                    <Path d="M22 5h-4" />
                    <Path d="M4 17v2" />
                    <Path d="M5 18H3" />
                  </Svg>
                  
                  {/* Title */}
                  <Text style={{
                    fontSize: 16,
                    lineHeight: 16,
                    fontWeight: '400',
                    color: '#e8edf4',
                  }}>
                    Browse by Category
                  </Text>
                </View>
              </View>
              
              {/* Category Grid */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                {subcategories.map((subcat) => {
                  const emoji = subcategoryEmojiMap[subcat.id] || '📦';
                  const isSelected = selectedSubcategory === subcat.id;
                  
                  return (
                    <TouchableOpacity
                      key={subcat.id}
                      onPress={() => setSelectedSubcategory(isSelected ? null : subcat.id)}
                      activeOpacity={0.9}
                      style={{
                        width: '47%', // 2 columns with gap-3 (12px)
                        backgroundColor: 'rgba(21, 27, 40, 0.6)',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: isSelected 
                          ? 'rgba(52, 211, 235, 0.5)' // cyan-400 when selected
                          : 'rgba(255, 255, 255, 0.1)', // border-white/10
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Hover Overlay - Gradient (shows on press in React Native) */}
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          opacity: 0.1, // opacity-10 equivalent
                        }}
                      >
                        <LinearGradient
                          colors={['#60a5fa', '#818cf8']} // blue-400 to indigo-500
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            flex: 1,
                          }}
                        />
                      </View>
                      
                      {/* Icon - Emoji (text-3xl) */}
                      <Text style={{
                        fontSize: 30,
                        lineHeight: 30,
                        zIndex: 10,
                      }}>
                        {emoji}
                      </Text>
                      
                      {/* Label (text-sm) */}
                      <Text style={{
                        fontSize: 14,
                        lineHeight: 20,
                        fontWeight: '500',
                        color: '#f1f5f9', // text-slate-100
                        textAlign: 'center',
                        zIndex: 10,
                      }}>
                        {subcat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          
          {/* Filter by Retailer Section */}
          <View style={{
            backgroundColor: 'rgba(21, 27, 40, 0.6)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(52, 211, 235, 0.3)', // cyan-400/30
            overflow: 'hidden',
            marginTop: 24,
          }}>
            {/* Gradient overlay for glass effect */}
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
            
            {/* Content Container */}
            <View style={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 24,
            }}>
              {/* Space-y-4 Container */}
              <View style={{ gap: 16 }}>
                {/* Header Row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 32,
                }}>
                  {/* Label */}
                  <Text style={{
                    fontSize: 14,
                    lineHeight: 14,
                    fontWeight: '500',
                    color: '#e2e8f0', // text-slate-200
                  }}>
                    Filter by Retailer
                  </Text>
                  
                  {/* Add Retailer Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 32,
                      paddingHorizontal: 12,
                      gap: 8,
                      backgroundColor: 'rgb(11, 15, 25)',
                      borderWidth: 1,
                      borderColor: 'rgba(59, 130, 246, 0.3)', // border-blue-500/30
                      borderRadius: 6,
                    }}
                  >
                    <Ionicons name="add" size={16} color="#e8edf4" />
                    <Text style={{
                      fontSize: 14,
                      lineHeight: 20,
                      fontWeight: '500',
                      color: '#e8edf4',
                    }}>
                      Add Retailer
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Retailer Checkboxes Grid */}
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 16,
                }}>
                  {stores
                    .filter(store => store != null && typeof store === 'string') // Filter out undefined/null stores
                    .map((store) => {
                    const isChecked = selectedStores.includes(store) || 
                      (store === 'All Stores' && selectedStores.includes('All Stores'));
                    
                    return (
                      <TouchableOpacity
                        key={store}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (store === 'All Stores') {
                            setSelectedStores(['All Stores']);
                          } else {
                            setSelectedStores(prev => 
                              prev.includes('All Stores') 
                                ? [store]
                                : prev.includes(store)
                                ? prev.filter(s => s !== store)
                                : [...prev, store]
                            );
                          }
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {/* Checkbox Button */}
                        <View style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: isChecked ? '#4f8ff7' : '#6B7280',
                          backgroundColor: isChecked ? '#4f8ff7' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isChecked && (
                            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M20 6 9 17l-5-5"
                                stroke="#FFFFFF"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          )}
                        </View>
                        
                        {/* Label */}
                        <Text style={{
                          fontSize: 14,
                          lineHeight: 20,
                          color: '#e2e8f0', // text-slate-200
                        }}>
                          {store === 'All Stores' ? 'All Retailers' : store}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
          
          {/* Products Section */}
          <View style={{
            flexDirection: 'column',
            gap: 24,
            marginTop: 24,
          }}>
            <Text style={{
              fontSize: 18,
              lineHeight: 28,
              color: '#e2e8f0',
              fontWeight: '600',
            }}>
              {selectedSubcategory 
                ? subcategories.find(s => s.id === selectedSubcategory)?.name || 'Products'
                : 'Popular Items'}
            </Text>
            
            {/* Product Cards */}
            {isSearching && searchQuery.trim() ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#60a5fa" />
                <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                  Searching products...
                </Text>
              </View>
            ) : showProducts && productsToRender.length > 0 ? (
              (() => {
                // CRITICAL: Validate ProductCard before rendering
                if (!ProductCard) {
                  console.error('❌ ProductCard is undefined when trying to render products!', {
                    ProductCard,
                    type: typeof ProductCard,
                    productsCount: productsToRender.length,
                  });
                  return (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                      <Ionicons name="alert-circle" size={48} color="#EF4444" />
                      <Text style={{ color: '#EF4444', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                        Error: ProductCard component is undefined
                      </Text>
                      <Text style={{ color: '#94A3B8', marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                        Check ProductCard import and export
                      </Text>
                    </View>
                  );
                }
                
                if (typeof ProductCard !== 'function' && typeof ProductCard !== 'object') {
                  console.error('❌ ProductCard is not a valid component!', {
                    ProductCard,
                    type: typeof ProductCard,
                    constructor: ProductCard?.constructor?.name,
                  });
                  return (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                      <Ionicons name="alert-circle" size={48} color="#EF4444" />
                      <Text style={{ color: '#EF4444', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                        Error: ProductCard is not a valid component
                      </Text>
                      <Text style={{ color: '#94A3B8', marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                        Type: {typeof ProductCard}
                      </Text>
                    </View>
                  );
                }
                
                // Render products with ProductCard
                const renderedProducts = productsToRender
                  .filter(product => product != null && product.id != null) // Extra safety check
                  .map((product, index) => {
                    try {
                      // Log product data before rendering
                      console.log('📦 Rendering product:', {
                        id: product.id,
                        name: product.name,
                        image: product.image,
                        hasImage: !!product.image,
                        imageType: typeof product.image,
                      });
                      
                      return (
                        <ProductCard
                          key={product.id || `product-${index}`}
                          productName={product.name || 'Unnamed Product'}
                          productImage={product.image || ''}
                          category={product.category || 'Uncategorized'}
                          storePrices={product.storePrices || []}
                          maxSavings={product.maxSavings}
                          bestPrice={product.bestPrice}
                          bestPriceStore={product.bestPriceStore}
                        />
                      );
                    } catch (error) {
                      console.error(`❌ Error rendering ProductCard for product ${product.id}:`, error);
                      return null;
                    }
                  })
                  .filter(Boolean); // Remove any null entries
                
                // If no products rendered, show error
                if (renderedProducts.length === 0 && productsToRender.length > 0) {
                  console.error('❌ All ProductCard renders failed!', {
                    originalCount: productsToRender.length,
                    renderedCount: renderedProducts.length,
                  });
                  return (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                      <Ionicons name="alert-circle" size={48} color="#EF4444" />
                      <Text style={{ color: '#EF4444', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                        Error: Failed to render products
                      </Text>
                    </View>
                  );
                }
                
                return renderedProducts;
              })()
            ) : hasSearched && searchQuery.trim() ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="search-outline" size={48} color="#8b95a8" />
                <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                  No products found for "{searchQuery}"
                </Text>
                <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 12 }}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#8b95a8', fontSize: 14 }}>
                  No products available
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}


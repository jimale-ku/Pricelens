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

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, Modal, Pressable, Image, ActivityIndicator, Alert, useWindowDimensions, FlatList } from "react-native";
import { useState, useEffect, useRef, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import StoreChip from '../StoreChip';
import ProductCardSimple from '../ProductCardSimple';
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
  validateImport(ProductCardSimple, 'ProductCardSimple', '../ProductCardSimple');
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
  
  // Responsive design - mobile vs desktop
  const { width } = useWindowDimensions();
  const isMobile = width < 640; // md breakpoint
  
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  // Default sort: "Popularity" for clothing, "Relevance" for others
  const [selectedSort, setSelectedSort] = useState<string>(
    categorySlug === 'clothing' || categorySlug === 'clothes' ? 'Popularity' : 'Relevance'
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  // Clothing-specific filters
  const [genderDropdownVisible, setGenderDropdownVisible] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [sizeDropdownVisible, setSizeDropdownVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('All Sizes');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Search pagination state (for infinite scroll)
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);
  const [isLoadingMoreSearch, setIsLoadingMoreSearch] = useState(false);
  const SEARCH_PAGE_SIZE = 6; // Load 6 items per page
  
  // Subcategory products state with pagination
  const [subcategoryProducts, setSubcategoryProducts] = useState<Product[]>([]);
  const [isLoadingSubcategory, setIsLoadingSubcategory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Load 6 items at a time
  
  // Reset state when category changes (without remounting component)
  useEffect(() => {
    setSelectedSubcategory(null);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
    setSortDropdownVisible(false);
    setSubcategoryProducts([]);
    // Reset clothing filters
    setSelectedGender('All');
    setSelectedSize('All Sizes');
    setGenderDropdownVisible(false);
    setSizeDropdownVisible(false);
    // Reset sort to default based on category
    if (categorySlug === 'clothing' || categorySlug === 'clothes') {
      setSelectedSort('Popularity');
    } else {
      setSelectedSort('Relevance');
    }
    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, [categorySlug]);
  
  // Fetch products by subcategory when subcategory is selected (initial load)
  useEffect(() => {
    if (selectedSubcategory) {
      // Reset pagination when subcategory changes
      setCurrentPage(1);
      setHasMoreProducts(true);
      setIsLoadingSubcategory(true);
      
      const fetchSubcategoryProducts = async (page: number = 1, append: boolean = false) => {
        try {
          // Use pagination endpoint
          const url = API_ENDPOINTS.products.popular(categorySlug, pageSize, undefined, selectedSubcategory, page);
          console.log('📚 Fetching products for subcategory:', {
            categorySlug,
            selectedSubcategory,
            page,
            url,
          });
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            console.log('📦 Raw response from backend:', {
              isArray: Array.isArray(data),
              hasProducts: !!data.products,
              dataKeys: Object.keys(data),
              productsCount: Array.isArray(data) ? data.length : (data.products?.length || 0),
              hasMore: data.hasMore !== undefined ? data.hasMore : true,
            });
            
            const products = Array.isArray(data) ? data : (data.products || []);
            const transformed = transformProducts(products).filter(p => 
              p && 
              p.id && 
              p.name && 
              typeof p.name === 'string' &&
              (p.subcategory === null || typeof p.subcategory === 'string') &&
              (p.category === null || typeof p.category === 'string')
            );
            console.log(`✅ Fetched ${transformed.length} products for subcategory "${selectedSubcategory}" (page ${page})`);
            
            if (append) {
              setSubcategoryProducts(prev => [...prev, ...transformed]);
            } else {
              setSubcategoryProducts(transformed);
            }
            
            // Check if there are more products
            const hasMore = data.hasMore !== undefined ? data.hasMore : (transformed.length === pageSize);
            setHasMoreProducts(hasMore);
          } else {
            const errorText = await response.text();
            console.warn(`❌ Failed to fetch subcategory products: ${response.status}`, errorText);
            if (!append) {
              setSubcategoryProducts([]);
            }
            setHasMoreProducts(false);
          }
        } catch (error) {
          console.error('❌ Error fetching subcategory products:', error);
          if (!append) {
            setSubcategoryProducts([]);
          }
          setHasMoreProducts(false);
        } finally {
          setIsLoadingSubcategory(false);
          setIsLoadingMore(false);
        }
      };
      
      fetchSubcategoryProducts(1, false);
    } else {
      setSubcategoryProducts([]);
      setCurrentPage(1);
      setHasMoreProducts(true);
    }
  }, [selectedSubcategory, categorySlug]);

  // Load more products (infinite scroll - TikTok-style)
  const loadMoreProducts = async () => {
    if (!selectedSubcategory || isLoadingMore || !hasMoreProducts) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const url = API_ENDPOINTS.products.popular(categorySlug, pageSize, undefined, selectedSubcategory, nextPage);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.products || []);
        const transformed = transformProducts(products);
        
        if (transformed.length > 0) {
          setSubcategoryProducts(prev => [...prev, ...transformed]);
          setCurrentPage(nextPage);
          const hasMore = data.hasMore !== undefined ? data.hasMore : (transformed.length === pageSize);
          setHasMoreProducts(hasMore);
          console.log(`📜 Loaded page ${nextPage}: ${transformed.length} products, hasMore: ${hasMore}`);
        } else {
          setHasMoreProducts(false);
        }
      } else {
        setHasMoreProducts(false);
      }
    } catch (error) {
      console.error('❌ Error loading more products:', error);
      setHasMoreProducts(false);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Sort options for product discovery (what product to find)
  // Rule: Never let users sort by something they can't see (no price sorting here)
  // Clothing category doesn't show "Relevance" option
  const SORT_OPTIONS = useMemo(() => {
    if (categorySlug === 'clothing' || categorySlug === 'clothes') {
      return ['Popularity', 'New Arrivals'];
    }
    return ['Relevance', 'Popularity', 'New Arrivals'];
  }, [categorySlug]);
  
  // Search function - Uses FAST search endpoint (returns products immediately, no store prices)
  const performSearch = async (query: string, page: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    console.log(`🔍 Fast search STARTED with query: "${query}", page: ${page}, append: ${append}`);
    
    if (append) {
      setIsLoadingMoreSearch(true);
    } else {
      setIsSearching(true);
      setHasSearched(true);
    }
    
    try {
      // Use FAST search endpoint - returns products immediately without waiting for all store prices
      // Pass categorySlug instead of categoryId (more reliable - backend will look up the ID)
      // For pagination: request only the items for this page (6 items per page)
      const searchUrl = API_ENDPOINTS.products.fastSearch(query.trim(), 'auto', undefined, SEARCH_PAGE_SIZE, categorySlug, page);
      console.log('🔍 Fetching from FAST search URL:', searchUrl);
      
      const controller = new AbortController();
      // Increase timeout for pagination requests (page > 1) as they may take longer
      const timeoutDuration = page > 1 ? 20000 : 15000; // 20s for pagination, 15s for initial search
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
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
      console.log('📦 Fast search response:', {
        isArray: Array.isArray(data),
        productsCount: Array.isArray(data) ? data.length : 0,
        firstProduct: Array.isArray(data) && data.length > 0 ? data[0] : null,
      });
      
      // Fast search returns array of products (no store prices)
      const products = Array.isArray(data) ? data : [];
      
      if (products.length === 0) {
        console.warn('⚠️  Fast search returned no products');
        setSearchResults([]);
        setHasSearched(true);
        return;
      }
      
      // Transform products to match expected format
      // CRITICAL: Filter by categorySlug to ensure only relevant products show
      const transformedProducts = products
        .map((p: any) => ({
          id: p.id || `product-${Date.now()}-${Math.random()}`,
          name: p.name || 'Unknown Product',
          image: p.image || '',
          category: p.category || 'Uncategorized',
          categorySlug: p.categorySlug || null, // Include categorySlug for filtering
          storePrices: [], // No store prices in fast search - fetched when user clicks "View Price"
        }))
        .filter((p: any) => {
          // Filter out products that don't match the current category
          // Only filter if categorySlug is provided and product has a categorySlug
          if (categorySlug && p.categorySlug) {
            return p.categorySlug === categorySlug;
          }
          // If no categorySlug on product, include it (backend should handle filtering)
          return p && p.name && p.id;
        });
      
      console.log('✅ Fast search returned', transformedProducts.length, 'products');
      
      // Handle pagination: append or replace results
      if (append) {
        // Append new results for infinite scroll
        setSearchResults(prev => [...prev, ...transformedProducts]);
        // Check if we got fewer results than requested (means no more pages)
        // If we got 0 results, there are no more pages
        setHasMoreSearchResults(transformedProducts.length > 0 && transformedProducts.length >= SEARCH_PAGE_SIZE);
      } else {
        // Replace results for new search
        setSearchResults(transformedProducts);
        // Check if there are more results available
        setHasMoreSearchResults(transformedProducts.length >= SEARCH_PAGE_SIZE);
      }
      
      setHasSearched(true);
    } catch (error: any) {
      console.error('❌ Search error:', error);
      
      const isNetworkError = 
        error.message?.includes('Network request failed') || 
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('aborted') ||
        error.name === 'AbortError';
      
      if (isNetworkError) {
        console.log('⚠️ Network error, trying database search fallback...');
        try {
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
            if (transformedProducts.length > 0) {
              console.log('✅ Fallback search found products:', transformedProducts.length);
              setSearchResults(transformedProducts);
              setHasSearched(true);
              setIsSearching(false);
              return;
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback search also failed:', fallbackError);
        }
        
        const serverUrl = API_ENDPOINTS.products.compareMultiStore(query.trim(), 'auto').split('?')[0];
        Alert.alert(
          'Connection Error',
          `Cannot connect to server:\n${serverUrl}\n\nTroubleshooting:\n1. Is backend server running?\n2. Check IP address\n3. Same WiFi network?\n4. Firewall blocking?`,
          [{ text: 'OK' }]
        );
      } else {
        // Don't show alert for timeout/abort errors - just log
        if (error.name !== 'AbortError') {
          Alert.alert(
            'Search Error',
            error.message || 'Failed to search products. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
      
      setSearchResults([]);
      setHasSearched(true); // Mark as searched even on error so we show "no results" message
      setHasMoreSearchResults(false);
    } finally {
      setIsSearching(false);
      setIsLoadingMoreSearch(false);
    }
  };
  
  // Load more search results (infinite scroll)
  const loadMoreSearchResults = async () => {
    if (!searchQuery.trim() || isLoadingMoreSearch || !hasMoreSearchResults || isSearching) {
      return;
    }
    
    const nextPage = searchPage + 1;
    setSearchPage(nextPage);
    await performSearch(searchQuery, nextPage, true); // Append results
  };
  
  // Improved debounced search - waits for complete word before searching
  useEffect(() => {
    console.log('🔍 Search useEffect triggered, searchQuery:', searchQuery);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!searchQuery.trim()) {
      console.log('🔍 Search query is empty, clearing results');
      setSearchResults([]);
      setHasSearched(false);
      setSearchPage(1);
      setHasMoreSearchResults(false);
      return;
    }
    
    // Minimum query length: 3 characters to avoid irrelevant results
    const MIN_QUERY_LENGTH = 3;
    if (searchQuery.trim().length < MIN_QUERY_LENGTH) {
      console.log(`🔍 Query too short (${searchQuery.trim().length} < ${MIN_QUERY_LENGTH}), waiting for more input...`);
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    console.log('🔍 Setting up search timeout for:', searchQuery);
    // Wait 1.5 seconds after user stops typing to ensure they've completed the word
    // This prevents searching while user is still typing
    searchTimeoutRef.current = setTimeout(() => {
      console.log('🔍 Timeout fired, calling performSearch with:', searchQuery);
      // Reset pagination when new search starts
      setSearchPage(1);
      setHasMoreSearchResults(false);
      performSearch(searchQuery, 1); // Start from page 1
    }, 1500); // 1.5 seconds - wait for user to finish typing
    
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
    // Priority: Search results > Subcategory products > Default products
    const useSearchResults = hasSearched && searchQuery.trim();
    const useSubcategoryProducts = selectedSubcategory && subcategoryProducts.length > 0;
    
    // For search results, use all results (pagination handled separately)
    const products = useSearchResults 
      ? searchResults 
      : useSubcategoryProducts 
        ? subcategoryProducts 
        : defaultProducts;
    
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
    
    // Filter out any undefined/null products AND products without valid images AND test products
    const seenProductNames = new Set<string>();
    return Array.isArray(products) ? products.filter(p => {
      if (p == null || p.id == null) return false;
      
      // EXCLUDE TEST PRODUCTS
      const productName = (p.name || '').toLowerCase();
      if (productName.includes('test product')) {
        console.warn(`🚫 Filtering out test product: "${p.name}"`);
        return false;
      }
      
      // DEDUPLICATE: Remove duplicate products by name
      if (seenProductNames.has(productName)) {
        console.warn(`🔄 Filtering out duplicate product: "${p.name}"`);
        return false;
      }
      seenProductNames.add(productName);
      
      // Check if product has a valid image (exclude example.com test URLs)
      const hasValidImage = p.image && 
        typeof p.image === 'string' && 
        p.image.trim().length > 0 &&
        (p.image.startsWith('http://') || p.image.startsWith('https://')) &&
        !p.image.includes('placeholder') &&
        !p.image.includes('via.placeholder') &&
        !p.image.includes('example.com'); // Exclude example.com URLs (test images)
      
      if (!hasValidImage) {
        console.warn(`⚠️ Filtering out product "${p.name}" - no valid image`);
        return false;
      }
      
      return true;
    }) : [];
  }, [hasSearched, searchQuery, searchResults, defaultProducts, selectedSubcategory, subcategoryProducts]);
  
  // Removed store filtering logic - stores are filtered on comparison page, not category page

  // Simplified filtering - only by subcategory and sort (no store filtering on category page)
  const filteredProducts = useMemo(() => {
    let products = displayProducts;

    // Filter by subcategory
    if (selectedSubcategory) {
      products = products.filter(p => {
        if (!p) return false;
        if (p.subcategory && typeof p.subcategory === 'string') {
          return p.subcategory.toLowerCase() === selectedSubcategory.toLowerCase();
        }
        if (p.category && typeof p.category === 'string') {
          return p.category.toLowerCase() === selectedSubcategory.toLowerCase();
        }
        return false;
      });
    }

    // Clothing-specific filters: Gender and Size
    if (categorySlug === 'clothing' || categorySlug === 'clothes') {
      // Filter by Gender
      if (selectedGender && selectedGender !== 'All') {
        products = products.filter(p => {
          if (!p || !p.name || typeof p.name !== 'string') return false;
          const productName = p.name.toLowerCase();
          const gender = selectedGender && typeof selectedGender === 'string' ? selectedGender.toLowerCase() : '';
          
          // Check for gender keywords in product name
          if (gender === 'men' || gender === "men's") {
            return productName.includes("men") || productName.includes("men's") || 
                   productName.includes("male") || productName.includes("guy");
          } else if (gender === 'women' || gender === "women's") {
            return productName.includes("women") || productName.includes("women's") || 
                   productName.includes("female") || productName.includes("lady") ||
                   productName.includes("ladies");
          } else if (gender === 'kids' || gender === "kid's" || gender === "children's") {
            return productName.includes("kid") || productName.includes("child") || 
                   productName.includes("toddler") || productName.includes("youth");
          }
          return true;
        });
      }

      // Filter by Size
      if (selectedSize && selectedSize !== 'All Sizes') {
        products = products.filter(p => {
          if (!p || !p.name || typeof p.name !== 'string') return false;
          const productName = p.name.toLowerCase();
          const size = selectedSize && typeof selectedSize === 'string' ? selectedSize.toLowerCase() : '';
          
          // Check for size keywords in product name
          return productName.includes(size) || 
                 (size === 'xs' && productName.includes('extra small')) ||
                 (size === 's' && productName.includes(' small')) ||
                 (size === 'm' && productName.includes(' medium')) ||
                 (size === 'l' && productName.includes(' large')) ||
                 (size === 'xl' && (productName.includes('extra large') || productName.includes('x-large'))) ||
                 (size === 'xxl' && (productName.includes('xxl') || productName.includes('2xl')));
        });
      }
    }

    // Sort products (not store prices - that's for comparison page)
    // Rule: Never let users sort by something they can't see
    if (selectedSort === 'Popularity') {
      // Sort by maxSavings (products with better deals first)
      products = [...products].sort((a, b) => {
        const savingsA = a.maxSavings || 0;
        const savingsB = b.maxSavings || 0;
        return savingsB - savingsA;
      });
    } else if (selectedSort === 'New Arrivals') {
      // Sort by creation date (newest first) - using product ID as proxy for now
      // TODO: Add createdAt field to products for proper sorting
      products = [...products].sort((a, b) => {
        // For now, reverse order as placeholder (newest products added last)
        return 0; // Keep original order until we have createdAt
      });
    }
    // "Relevance" - keep original order (default)

    return products;
  }, [displayProducts, selectedSubcategory, selectedSort, categorySlug, selectedGender, selectedSize]);
  
  // Limit initial render to first 12 products for faster display
  // CRITICAL: Ensure no undefined products are included
  // For search results, show all results (infinite scroll handles pagination)
  // For other views, limit to 12 initially
  const productsToRender = useMemo(() => {
    const validProducts = filteredProducts.filter(p => p != null && p.id != null);
    const isSearching = hasSearched && searchQuery.trim();
    // If searching, show all results (pagination handled by backend)
    // If not searching, limit to initial view
    return isSearching ? validProducts : validProducts.slice(0, 12);
  }, [filteredProducts, hasSearched, searchQuery]);
  
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
  
  // Clothing-specific subcategories with icons
  const clothingSubcategories = useMemo(() => {
    if (categorySlug !== 'clothing' && categorySlug !== 'clothes') return [];
    
    return [
      { id: 'jeans', name: 'Jeans', icon: '👖' },
      { id: 't-shirts', name: 'T-Shirts', icon: '👕' },
      { id: 'jackets', name: 'Jackets', icon: '🧥' },
      { id: 'dresses', name: 'Dresses', icon: '👗' },
      { id: 'activewear', name: 'Activewear', icon: '🏃' },
      { id: 'hoodies', name: 'Hoodies', icon: '🧦' },
      { id: 'dress-shirts', name: 'Dress Shirts', icon: '👔' },
      { id: 'sweaters', name: 'Sweaters', icon: '🧶' },
    ];
  }, [categorySlug]);

  // Use clothing subcategories if available, otherwise use passed subcategories
  const displaySubcategories = useMemo(() => {
    if (clothingSubcategories.length > 0) {
      return clothingSubcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        count: subcategories.find(s => s.id === sub.id)?.count,
      }));
    }
    return subcategories;
  }, [clothingSubcategories, subcategories]);

  // Memoize subcategory emoji map to avoid recreating on every render
  const subcategoryEmojiMap = useMemo(() => ({
    // Clothing subcategories
    'jeans': '👖',
    't-shirts': '👕',
    'jackets': '🧥',
    'dresses': '👗',
    'activewear': '🏃',
    'hoodies': '🧦',
    'dress-shirts': '👔',
    'sweaters': '🧶',
    // Existing subcategories
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
        onScroll={({ nativeEvent }) => {
          // Infinite scroll: Load more when near bottom (TikTok-style)
          if (selectedSubcategory && hasMoreProducts && !isLoadingMore) {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 200; // Trigger 200px before bottom
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
            
            if (isCloseToBottom) {
              loadMoreProducts();
            }
          }
        }}
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
          
          {/* Top Bar: Search + Filters + Sort - Minimal and Clean */}
          <View style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
            marginBottom: 16,
          }}>
            {/* Search Bar - Full Width */}
            <View style={{
              width: '100%',
              marginBottom: (categorySlug === 'clothing' || categorySlug === 'clothes') ? 16 : 0,
            }}>
            {/* Search Input */}
            <View style={{ width: '100%', position: 'relative' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(139, 149, 168, 0.2)',
                paddingHorizontal: 12,
                height: 40,
              }}>
                <Ionicons name="search" size={18} color="#8b95a8" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder={
                    categorySlug === 'clothing' || categorySlug === 'clothes'
                      ? "Search clothing by brand, category"
                      : "Search for products..."
                  }
                  placeholderTextColor="rgba(139, 149, 168, 0.6)"
                  value={searchQuery}
                  onChangeText={(text) => {
                    console.log('🔍 TextInput onChangeText:', text);
                    setSearchQuery(text);
                  }}
                  onSubmitEditing={() => {
                    console.log('🔍 TextInput onSubmitEditing, triggering search now');
                    if (searchQuery.trim()) {
                      performSearch(searchQuery, 1, false);
                    }
                  }}
                  style={{
                    flex: 1,
                    color: '#e8edf4',
                    fontSize: 14,
                    lineHeight: 20,
                    paddingVertical: 0,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  }}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color="#60a5fa" style={{ marginLeft: 8 }} />
                )}
              </View>
            </View>

            {/* Clothing-specific filters: Gender and Size - Stacked Vertically */}
            {(categorySlug === 'clothing' || categorySlug === 'clothes') && (
              <View style={{
                flexDirection: 'column',
                gap: 16, // space-y-4 equivalent (16px vertical spacing)
              }}>
                {/* Gender Filter */}
                <View style={{ 
                  position: 'relative',
                  width: '100%',
                }}>
                  <Text style={{
                    color: '#e8edf4', // rgb(232, 237, 244) - white text
                    fontSize: 14,
                    marginBottom: 8,
                    fontWeight: '500',
                  }}>
                    Gender
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setGenderDropdownVisible(!genderDropdownVisible);
                      setSizeDropdownVisible(false); // Close size dropdown when opening gender
                    }}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: genderDropdownVisible ? '#14b8a6' : 'rgba(139, 149, 168, 0.2)', // Teal border when active
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      minHeight: 44,
                    }}
                  >
                    <Text style={{
                      color: '#e8edf4',
                      fontSize: 14,
                      flex: 1,
                    }} numberOfLines={1}>
                      {selectedGender}
                    </Text>
                    <Ionicons 
                      name={genderDropdownVisible ? "chevron-up" : "chevron-down"} 
                      size={14} 
                      color="#8b95a8" 
                    />
                  </TouchableOpacity>

                  {/* Gender Dropdown */}
                  {genderDropdownVisible && (
                    <View style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
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
                      minWidth: 120,
                    }}>
                      {['All', "Men's", "Women's", "Kids"].map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            setSelectedGender(option);
                            setGenderDropdownVisible(false);
                          }}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderBottomWidth: option !== "Kids" ? 1 : 0,
                            borderBottomColor: 'rgba(139, 149, 168, 0.1)',
                          }}
                        >
                          <Text style={{
                            color: selectedGender === option ? '#14b8a6' : '#e8edf4',
                            fontSize: 14,
                            fontWeight: selectedGender === option ? '600' : '400',
                          }}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Size Filter */}
                <View style={{ 
                  position: 'relative',
                  width: '100%',
                }}>
                  <Text style={{
                    color: '#e8edf4', // rgb(232, 237, 244) - white text
                    fontSize: 14,
                    marginBottom: 8,
                    fontWeight: '500',
                  }}>
                    Size
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSizeDropdownVisible(!sizeDropdownVisible);
                      setGenderDropdownVisible(false); // Close gender dropdown when opening size
                    }}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: sizeDropdownVisible ? '#14b8a6' : 'rgba(139, 149, 168, 0.2)', // Teal border when active
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      minHeight: 44,
                    }}
                  >
                    <Text style={{
                      color: '#e8edf4',
                      fontSize: 14,
                      flex: 1,
                    }} numberOfLines={1}>
                      {selectedSize}
                    </Text>
                    <Ionicons 
                      name={sizeDropdownVisible ? "chevron-up" : "chevron-down"} 
                      size={14} 
                      color="#8b95a8" 
                    />
                  </TouchableOpacity>

                  {/* Size Dropdown */}
                  {sizeDropdownVisible && (
                    <View style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
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
                      minWidth: 140,
                    }}>
                      {['All Sizes', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            setSelectedSize(option);
                            setSizeDropdownVisible(false);
                          }}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderBottomWidth: option !== 'XXL' ? 1 : 0,
                            borderBottomColor: 'rgba(139, 149, 168, 0.1)',
                          }}
                        >
                          <Text style={{
                            color: selectedSize === option ? '#14b8a6' : '#e8edf4',
                            fontSize: 14,
                            fontWeight: selectedSize === option ? '600' : '400',
                          }}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            </View>

            {/* Sort Button - Show in same row for non-clothing */}
            {!(categorySlug === 'clothing' || categorySlug === 'clothes') && (
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  onPress={() => {
                    setSortDropdownVisible(!sortDropdownVisible);
                  }}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(139, 149, 168, 0.2)',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    minWidth: 120,
                  }}
                >
                <Ionicons name="swap-vertical-outline" size={16} color="#8b95a8" />
                <Text style={{
                  color: '#e8edf4',
                  fontSize: 14,
                  flex: 1,
                }} numberOfLines={1}>
                  {selectedSort}
                </Text>
                <Ionicons 
                  name={sortDropdownVisible ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color="#8b95a8" 
                />
              </TouchableOpacity>

              {/* Sort Dropdown */}
              {sortDropdownVisible && (
                <View style={{
                  position: 'absolute',
                  top: '100%',
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
                  minWidth: 160,
                }}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        setSelectedSort(option);
                        setSortDropdownVisible(false);
                      }}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderBottomWidth: option !== SORT_OPTIONS[SORT_OPTIONS.length - 1] ? 1 : 0,
                        borderBottomColor: 'rgba(139, 149, 168, 0.1)',
                        backgroundColor: selectedSort === option ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                      }}
                    >
                      <Text style={{
                        color: selectedSort === option ? '#60a5fa' : '#e2e8f0',
                        fontSize: 14,
                        fontWeight: selectedSort === option ? '500' : '400',
                      }}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              </View>
            )}

            {/* Sort Button Row for Clothing (below filters) */}
            {(categorySlug === 'clothing' || categorySlug === 'clothes') && (
              <View style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginTop: 12,
              }}>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSortDropdownVisible(!sortDropdownVisible);
                      setGenderDropdownVisible(false);
                      setSizeDropdownVisible(false);
                    }}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(139, 149, 168, 0.2)',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      minWidth: 120,
                    }}
                  >
                    <Ionicons name="swap-vertical-outline" size={16} color="#8b95a8" />
                    <Text style={{
                      color: '#e8edf4',
                      fontSize: 14,
                      flex: 1,
                    }} numberOfLines={1}>
                      {selectedSort}
                    </Text>
                    <Ionicons 
                      name={sortDropdownVisible ? "chevron-up" : "chevron-down"} 
                      size={14} 
                      color="#8b95a8" 
                    />
                  </TouchableOpacity>

                  {/* Sort Dropdown */}
                  {sortDropdownVisible && (
                    <View style={{
                      position: 'absolute',
                      top: '100%',
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
                      minWidth: 160,
                    }}>
                      {SORT_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            setSelectedSort(option);
                            setSortDropdownVisible(false);
                          }}
                          activeOpacity={0.7}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderBottomWidth: option !== SORT_OPTIONS[SORT_OPTIONS.length - 1] ? 1 : 0,
                            borderBottomColor: 'rgba(139, 149, 168, 0.1)',
                            backgroundColor: selectedSort === option ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                          }}
                        >
                          <Text style={{
                            color: selectedSort === option ? '#60a5fa' : '#e2e8f0',
                            fontSize: 14,
                            fontWeight: selectedSort === option ? '500' : '400',
                          }}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Subcategory Section - Browse by Category */}
          {displaySubcategories.length > 0 && (
            <View style={{
              backgroundColor: 'rgba(21, 27, 40, 0.6)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(139, 149, 168, 0.15)',
              padding: 24,
              marginBottom: 24,
              gap: 24,
            }}>
              {/* Subcategory Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#60a5fa',
                }} />
                <Text style={{
                  fontSize: 18,
                  lineHeight: 28,
                  color: '#e2e8f0',
                  fontWeight: '600',
                }}>
                  Browse by Category
                </Text>
              </View>

              {/* Subcategory Grid - Responsive: 2 cols mobile, 3 cols md, 4 cols lg */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12, // calc(var(--spacing) * 3) = 12px
              }}>
                {displaySubcategories.map((subcat) => {
                  const isSelected = selectedSubcategory === subcat.id;
                  // Get icon from clothing subcategories or emoji map
                  const icon = clothingSubcategories.find(s => s.id === subcat.id)?.icon || subcategoryEmojiMap[subcat.id] || '📦';
                  
                  // Calculate width for responsive grid: 2 cols mobile, 3 cols md, 4 cols lg
                  // Using calc: (100% - gap) / columns
                  const getCardWidth = () => {
                    if (width >= 1024) {
                      // 4 columns: (100% - 3 gaps of 12px) / 4
                      return { width: 'calc((100% - 36px) / 4)' };
                    }
                    if (width >= 768) {
                      // 3 columns: (100% - 2 gaps of 12px) / 3
                      return { width: 'calc((100% - 24px) / 3)' };
                    }
                    // 2 columns: (100% - 1 gap of 12px) / 2
                    return { width: 'calc((100% - 12px) / 2)' };
                  };
                  
                  // React Native doesn't support calc(), so use percentage with flexBasis
                  const getCardWidthRN = () => {
                    if (width >= 1024) return { flexBasis: '23%', maxWidth: '23%' }; // 4 columns
                    if (width >= 768) return { flexBasis: '31%', maxWidth: '31%' }; // 3 columns
                    return { flexBasis: '47%', maxWidth: '47%' }; // 2 columns
                  };
                  
                  return (
                    <TouchableOpacity
                      key={subcat.id}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedSubcategory(null);
                        } else {
                          setSelectedSubcategory(subcat.id);
                        }
                      }}
                      activeOpacity={0.8}
                      style={{
                        ...getCardWidthRN(),
                        backgroundColor: isSelected 
                          ? 'rgba(6, 182, 212, 0.1)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isSelected 
                          ? 'rgba(6, 182, 212, 0.4)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12, // gap-3 equivalent
                        minHeight: 103, // Match grid row height from specs (102.913px rounded)
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Text style={{ 
                        fontSize: 24,
                        zIndex: 1,
                      }}>
                        {icon}
                      </Text>
                      <Text style={{
                        color: '#e8edf4', // text-slate-100 equivalent
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                        textAlign: 'center',
                        zIndex: 1,
                      }}>
                        {subcat.name}
                      </Text>
                      {subcat.count !== undefined && (
                        <Text style={{
                          color: '#94a3b8',
                          fontSize: 12,
                          zIndex: 1,
                        }}>
                          {subcat.count} items
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Optional: Subcategory Filter (if subcategories exist) - Simple chip style */}
          {displaySubcategories.length > 0 && (
            <View style={{
              paddingHorizontal: 16,
              marginBottom: 16,
            }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: 'row' }}
                contentContainerStyle={{ gap: 8 }}
              >
                {/* All Categories Chip */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedSubcategory(null)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: !selectedSubcategory 
                      ? 'rgba(96, 165, 250, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: !selectedSubcategory 
                      ? 'rgba(96, 165, 250, 0.4)' 
                      : 'rgba(139, 149, 168, 0.2)',
                  }}
                >
                  <Text style={{
                    color: !selectedSubcategory ? '#60a5fa' : '#e8edf4',
                    fontSize: 13,
                    fontWeight: !selectedSubcategory ? '600' : '400',
                  }}>
                    All
                  </Text>
                </TouchableOpacity>

                {/* Subcategory Chips */}
                {displaySubcategories
                  .filter(subcat => subcat != null && subcat.id != null)
                  .map((subcat) => {
                    const isSelected = selectedSubcategory === subcat.id;
                    return (
                      <TouchableOpacity
                        key={subcat.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedSubcategory(isSelected ? null : subcat.id)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isSelected 
                            ? 'rgba(96, 165, 250, 0.2)' 
                            : 'rgba(255, 255, 255, 0.05)',
                          borderWidth: 1,
                          borderColor: isSelected 
                            ? 'rgba(96, 165, 250, 0.4)' 
                            : 'rgba(139, 149, 168, 0.2)',
                        }}
                      >
                        <Text style={{
                          color: isSelected ? '#60a5fa' : '#e8edf4',
                          fontSize: 13,
                          fontWeight: isSelected ? '600' : '400',
                        }}>
                          {subcat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          )}

          
          
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
                ? displaySubcategories.find(s => s.id === selectedSubcategory)?.name || 'Products'
                : 'Popular Items'}
            </Text>
            
            {/* Product Cards - Infinite Scroll for Subcategory, Grid for Others */}
            {isSearching && searchQuery.trim() ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#60a5fa" />
                <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                  Searching products...
                </Text>
              </View>
            ) : selectedSubcategory && subcategoryProducts.length > 0 ? (
              // Infinite Scroll for Subcategory Products (TikTok-style)
              // Using View with onLayout to detect when user scrolls near bottom
              <>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 16,
                }}>
                  {subcategoryProducts
                    .filter(p => p && p.id && p.name) // Filter out invalid products
                    .map((product, index) => {
                    try {
                      if (!product || !product.id || !product.name) return null;
                      
                      const columnWidth = width >= 1024 ? '23%' : width >= 768 ? '31%' : '47%';
                      
                      // Trigger loadMore when rendering last few items (TikTok-style)
                      if (index === subcategoryProducts.length - 3 && hasMoreProducts && !isLoadingMore) {
                        // Small delay to avoid multiple calls
                        setTimeout(() => {
                          loadMoreProducts();
                        }, 100);
                      }
                      
                      return (
                        <View 
                          key={`${product.id}-${index}`}
                          style={{
                            width: columnWidth,
                            marginBottom: 16,
                          }}
                        >
                          <ProductCardSimple
                            product={product}
                            onPress={() => {
                              // Navigate to product comparison page
                              console.log('Product pressed:', product.name);
                            }}
                          />
                        </View>
                      );
                    } catch (error) {
                      console.error('Error rendering product card:', error);
                      return null;
                    }
                  })}
                </View>
                
                {/* Loading indicator at bottom */}
                {isLoadingMore && (
                  <View style={{ paddingVertical: 20, alignItems: 'center', width: '100%' }}>
                    <ActivityIndicator size="small" color="#60a5fa" />
                    <Text style={{ color: '#8b95a8', marginTop: 8, fontSize: 12 }}>
                      Loading more...
                    </Text>
                  </View>
                )}
                
                {/* End of list indicator */}
                {!hasMoreProducts && subcategoryProducts.length > 0 && !isLoadingMore && (
                  <View style={{ paddingVertical: 20, alignItems: 'center', width: '100%' }}>
                    <Text style={{ color: '#8b95a8', fontSize: 14 }}>
                      No more products
                    </Text>
                  </View>
                )}
              </>
            ) : selectedSubcategory && isLoadingSubcategory ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#60a5fa" />
                <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                  Loading {displaySubcategories.find(s => s.id === selectedSubcategory)?.name || 'products'}...
                </Text>
              </View>
            ) : selectedSubcategory && subcategoryProducts.length === 0 && !isLoadingSubcategory ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="search-outline" size={48} color="#8b95a8" />
                <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                  No products found for {displaySubcategories.find(s => s.id === selectedSubcategory)?.name || 'this category'}
                </Text>
                <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 12 }}>
                  Try a different category or check back later
                </Text>
              </View>
            ) : showProducts && productsToRender.length > 0 ? (
              (() => {
                // CRITICAL: Validate ProductCardSimple before rendering
                if (!ProductCardSimple) {
                  console.error('❌ ProductCardSimple is undefined!');
                  return (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                      <Ionicons name="alert-circle" size={48} color="#EF4444" />
                      <Text style={{ color: '#EF4444', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                        Error: ProductCardSimple component is undefined
                      </Text>
                    </View>
                  );
                }
                
                // Calculate grid columns: 1-2 on mobile, 3-4 on desktop
                const getColumnWidth = () => {
                  if (width >= 1024) return '23%'; // 4 columns
                  if (width >= 768) return '31%';  // 3 columns
                  if (width >= 480) return '47%';  // 2 columns
                  return '100%'; // 1 column
                };
                
                const columnWidth = getColumnWidth();
                
                // Render products in grid with ProductCardSimple
                return (
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}>
                    {productsToRender
                      .filter(product => product != null && product.id != null)
                      .map((product, index) => {
                        try {
                          // Trigger infinite scroll when near bottom (for search results)
                          const isSearching = hasSearched && searchQuery.trim();
                          if (isSearching && index === productsToRender.length - 3 && hasMoreSearchResults && !isLoadingMoreSearch) {
                            // Load more when rendering last 3 items
                            setTimeout(() => loadMoreSearchResults(), 100);
                          }
                          
                          // Calculate quick insights from store prices
                          const storeCount = product.storePrices?.length || 0;
                          const prices = product.storePrices?.map((sp: any) => 
                            parseFloat(sp.price.replace('$', '')) || 0
                          ) || [];
                          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                          
                          return (
                            <View key={product.id || `product-${index}`} style={{ width: columnWidth }}>
                              <ProductCardSimple
                                productId={product.id}
                                productName={product.name || 'Unnamed Product'}
                                productImage={product.image || ''}
                                category={product.category || 'Uncategorized'}
                                categorySlug={categorySlug}
                                storeCount={storeCount}
                                minPrice={minPrice}
                                fullProductData={product}
                              />
                            </View>
                          );
                        } catch (error) {
                          console.error(`❌ Error rendering ProductCardSimple for product ${product.id}:`, error);
                          return null;
                        }
                      })
                      .filter(Boolean)}
                    
                    {/* Loading indicator for search results infinite scroll */}
                    {hasSearched && searchQuery.trim() && isLoadingMoreSearch && (
                      <View style={{ paddingVertical: 20, alignItems: 'center', width: '100%' }}>
                        <ActivityIndicator size="small" color="#60a5fa" />
                        <Text style={{ color: '#8b95a8', marginTop: 8, fontSize: 12 }}>
                          Loading more products...
                        </Text>
                      </View>
                    )}
                    
                    {/* End of search results indicator */}
                    {hasSearched && searchQuery.trim() && !hasMoreSearchResults && searchResults.length > 0 && !isLoadingMoreSearch && (
                      <View style={{ paddingVertical: 20, alignItems: 'center', width: '100%' }}>
                        <Text style={{ color: '#8b95a8', fontSize: 14 }}>
                          Showing all {searchResults.length} results
                        </Text>
                      </View>
                    )}
                  </View>
                );
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


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
import CurrentCategoryBar from "@/components/CurrentCategoryBar";
import CategoryAdCard from "@/components/CategoryAdCard";
import { priceDataCache } from '@/utils/priceDataCache';
import BottomNav from "@/components/BottomNav";
import StoreChip from '../StoreChip';
import ProductCardSimple from '../ProductCardSimple';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import { getCategoryPlaceholderImage } from '../../constants/storeLogos';
import { transformProducts, transformCompareResponse } from '../../utils/apiTransform';
import { testBackendConnection } from '../../utils/testConnection';
import { theme } from '@/constants/theme';

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
  storeImage: string | number;
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
  iconGradient: string[]; // theme primary gradient (single app color)
  
  // Stores for this category
  stores: string[];
  
  // Subcategories (Level 1)
  subcategories?: Subcategory[];
  
  // Default products to show (when no search)
  defaultProducts: Product[];
  
  // Optional: Custom category ID for API filtering
  categoryId?: string;
  
  // Optional: Background image URL for category theme
  backgroundImage?: string;
  
  // Optional: Initial search query (from homepage search)
  initialSearchQuery?: string;
  
  /** When true, backend has finished loading (success or timeout). Used to show "No products" instead of endless "Loading products...". */
  initialLoadComplete?: boolean;
  /** If set, show a "server not reachable" hint when there are no products (frontend–backend link issue). */
  backendConnectionError?: string | null;
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
  backgroundImage,
  initialSearchQuery,
  initialLoadComplete = true,
  backendConnectionError = null,
  isProgressiveLoading = false,
}: PatternALayoutProps & { isProgressiveLoading?: boolean }) {
  // Safety check: Ensure CategoryIcon is always defined
  const SafeCategoryIcon = CategoryIcon || (({ size = 24, color = "#ffffff" }: { size?: number; color?: string }) => (
    <Ionicons name="cube-outline" size={size} color={color} />
  ));
  
  // Responsive design - mobile vs desktop
  const { width } = useWindowDimensions();
  const isMobile = width < 640; // md breakpoint
  
  // Sort dropdown removed; default sort used (no UI)
  const [selectedSort] = useState<string>(
    categorySlug === 'clothing' || categorySlug === 'clothes' ? 'Popularity' : 'Relevance'
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  // Clothing-specific filters
  const [genderDropdownVisible, setGenderDropdownVisible] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [sizeDropdownVisible, setSizeDropdownVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('All Sizes');
  
  // Search state - initialize with initialSearchQuery if provided
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Search pagination state (for infinite scroll)
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);
  const [isLoadingMoreSearch, setIsLoadingMoreSearch] = useState(false);
  const SEARCH_PAGE_SIZE = 6; // Load 6 items per page
  
  // Prefetch cache: stores pages 2-6 in memory for instant loading
  const prefetchedPagesRef = useRef<Map<number, Product[]>>(new Map());
  const isPrefetchingRef = useRef<boolean>(false);
  
  // CRITICAL: Store AbortControllers to cancel pending requests when category changes
  const abortControllersRef = useRef<Set<AbortController>>(new Set());
  
  // Subcategory products state with pagination
  const [subcategoryProducts, setSubcategoryProducts] = useState<Product[]>([]);
  const [isLoadingSubcategory, setIsLoadingSubcategory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Load 6 items at a time
  
  // Default products pagination (for infinite scroll when no search/subcategory)
  const [defaultProductsPage, setDefaultProductsPage] = useState(1);
  const [defaultProductsList, setDefaultProductsList] = useState<Product[]>([]);
  const [isLoadingMoreDefault, setIsLoadingMoreDefault] = useState(false);
  const [hasMoreDefaultProducts, setHasMoreDefaultProducts] = useState(true);
  
  // CRITICAL FIX: Always sync defaultProductsList with defaultProducts prop
  // For infinite scroll: Show first 6 items initially, fetch more from backend as user scrolls
  useEffect(() => {
    if (defaultProducts && Array.isArray(defaultProducts) && defaultProducts.length > 0) {
      // Show first 6 items initially (page 1)
      const initialProducts = defaultProducts.slice(0, 6);
      setDefaultProductsList(initialProducts);
      // Assume more products available if we got exactly 6 (backend pagination)
      setHasMoreDefaultProducts(defaultProducts.length >= 6);
      setDefaultProductsPage(1);
      
    } else if (!defaultProducts || (Array.isArray(defaultProducts) && defaultProducts.length === 0)) {
      // CRITICAL: Don't clear if we're still loading - keep existing products
      // Only clear if category changed or products explicitly set to empty array after loading
      if (defaultProducts === null || defaultProducts === undefined) {
        // Still loading - don't clear
      } else {
        // Explicitly empty array - clear
        setDefaultProductsList([]);
        setHasMoreDefaultProducts(true);
      }
    }
  }, [defaultProducts, categorySlug]);
  
  // Reset state when category changes (without remounting component)
  useEffect(() => {
    // CRITICAL: Cancel ALL pending requests to prevent race conditions
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore errors when aborting
      }
    });
    abortControllersRef.current.clear();
    
    // Reset all loading states IMMEDIATELY to prevent stuck loading indicators
    setIsSearching(false);
    setIsLoadingMoreSearch(false);
    setIsLoadingSubcategory(false);
    setIsLoadingMore(false);
    setIsLoadingMoreDefault(false);
    
    // Reset all state
    setSelectedSubcategory(null);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    prefetchedPagesRef.current.clear(); // Clear prefetch cache on category change
    priceDataCache.clear(); // Clear price data cache on category change
    setSubcategoryProducts([]);
    // Reset default products pagination
    setDefaultProductsPage(1);
    // Don't slice here - show all products immediately
    setDefaultProductsList(defaultProducts || []);
    setHasMoreDefaultProducts((defaultProducts?.length || 0) >= 6);
    // Reset clothing filters
    setSelectedGender('All');
    setSelectedSize('All Sizes');
    setGenderDropdownVisible(false);
    setSizeDropdownVisible(false);
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, [categorySlug, defaultProducts]);
  
  // Fetch products by subcategory when subcategory is selected (initial load)
  useEffect(() => {
    if (selectedSubcategory) {
      // Reset pagination when subcategory changes
      setCurrentPage(1);
      setHasMoreProducts(true);
      setIsLoadingSubcategory(true);
      
      const fetchSubcategoryProducts = async (page: number = 1, append: boolean = false) => {
        const controller = new AbortController();
        abortControllersRef.current.add(controller);
        
        try {
          // Use pagination endpoint
          const url = API_ENDPOINTS.products.popular(categorySlug, pageSize, undefined, selectedSubcategory, page);
          
          const timeoutId = setTimeout(() => {
            controller.abort();
            abortControllersRef.current.delete(controller);
          }, 10000); // 10s timeout
          
          const response = await fetch(url, {
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          abortControllersRef.current.delete(controller);
          if (response.ok) {
            const data = await response.json();
            
            const products = Array.isArray(data) ? data : (data.products || []);
            const transformed = transformProducts(products).filter(p => 
              p && 
              p.id && 
              p.name && 
              typeof p.name === 'string' &&
              (p.subcategory === null || typeof p.subcategory === 'string') &&
              (p.category === null || typeof p.category === 'string')
            );
            
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
        } catch (error: any) {
          // Don't log errors for aborted requests (expected when switching categories)
          const isAborted = error?.name === 'AbortError' || 
                           error?.message?.includes('Aborted') ||
                           error?.message?.includes('aborted') ||
                           error?.constructor?.name === 'AbortError';
          
          if (!isAborted) {
            console.error('❌ Error fetching subcategory products:', error);
          } else {
            // Silently ignore aborted requests - they're expected when switching categories
          }
          if (!append) {
            setSubcategoryProducts([]);
          }
          setHasMoreProducts(false);
        } finally {
          setIsLoadingSubcategory(false);
          setIsLoadingMore(false);
          abortControllersRef.current.delete(controller);
        }
      };
      
      fetchSubcategoryProducts(1, false);
    } else {
      setSubcategoryProducts([]);
      setCurrentPage(1);
      setHasMoreProducts(true);
    }
  }, [selectedSubcategory, categorySlug]);

  // Load more products (infinite scroll - TikTok-style) for subcategory
  const loadMoreProducts = async () => {
    if (!selectedSubcategory || isLoadingMore || !hasMoreProducts) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    
    try {
      const url = API_ENDPOINTS.products.popular(categorySlug, pageSize, undefined, selectedSubcategory, nextPage);
      const timeoutId = setTimeout(() => {
        controller.abort();
        abortControllersRef.current.delete(controller);
      }, 10000);
      
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      abortControllersRef.current.delete(controller);
      
      if (response.ok) {
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.products || []);
        const transformed = transformProducts(products);
        
        if (transformed.length > 0) {
          setSubcategoryProducts(prev => [...prev, ...transformed]);
          setCurrentPage(nextPage);
          const hasMore = data.hasMore !== undefined ? data.hasMore : (transformed.length === pageSize);
          setHasMoreProducts(hasMore);
        } else {
          setHasMoreProducts(false);
        }
      } else {
        setHasMoreProducts(false);
      }
    } catch (error: any) {
      // Don't log errors for aborted requests (expected when switching categories)
      const isAborted = error?.name === 'AbortError' || 
                       error?.message?.includes('Aborted') ||
                       error?.message?.includes('aborted') ||
                       error?.constructor?.name === 'AbortError';
      
      if (!isAborted) {
        console.error('❌ Error loading more products:', error);
      } else {
        // Silently ignore aborted requests - they're expected when switching categories
        console.log('ℹ️ Request aborted (category changed) - ignoring');
      }
      setHasMoreProducts(false);
    } finally {
      setIsLoadingMore(false);
      abortControllersRef.current.delete(controller);
    }
  };
  
  // Load more default products (infinite scroll) when no search/subcategory
  // This fetches the next page from the backend API as user scrolls
  const loadMoreDefaultProducts = async () => {
    if (isLoadingMoreDefault || !hasMoreDefaultProducts || hasSearched || selectedSubcategory) {
      return;
    }
    
    setIsLoadingMoreDefault(true);
    const nextPage = defaultProductsPage + 1;
    
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    
    try {
      const url = API_ENDPOINTS.products.popular(categorySlug, pageSize, undefined, undefined, nextPage);
      const timeoutId = setTimeout(() => {
        controller.abort();
        abortControllersRef.current.delete(controller);
      }, 15000); // 15s timeout for pagination
      
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      abortControllersRef.current.delete(controller);
      
      if (response.ok) {
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.products || []);
        const transformed = transformProducts(products);
        
        if (transformed.length > 0) {
          // Append new products to existing list
          setDefaultProductsList(prev => [...prev, ...transformed]);
          setDefaultProductsPage(nextPage);
          // Assume more available if we got a full page (6 items)
          const hasMore = data.hasMore !== undefined ? data.hasMore : (transformed.length >= pageSize);
          setHasMoreDefaultProducts(hasMore);
        } else {
          // No more products available
          setHasMoreDefaultProducts(false);
        }
      } else {
        setHasMoreDefaultProducts(false);
      }
    } catch (error: any) {
      // Don't log errors for aborted requests (expected when switching categories)
      const isAborted = error?.name === 'AbortError' || 
                       error?.message?.includes('Aborted') ||
                       error?.message?.includes('aborted') ||
                       error?.constructor?.name === 'AbortError';
      
      if (!isAborted) {
        console.error('❌ Error loading more default products:', error);
      } else {
        // Silently ignore aborted requests - they're expected when switching categories
        console.log('ℹ️ Request aborted (category changed) - ignoring');
      }
      setHasMoreDefaultProducts(false);
    } finally {
      setIsLoadingMoreDefault(false);
      // Clean up controller if it still exists
      try {
        abortControllersRef.current.delete(controller);
      } catch (e) {
        // Ignore if already deleted
      }
    }
  };
  
  /**
   * Prefetch "View Price" data (multi-store comparison) for a single product
   * Stores in cache so "View Price" loads instantly
   * Optimized for speed - runs in background, non-blocking, doesn't wait for completion
   * 
   * CRITICAL: This function is completely async and non-blocking
   * It doesn't return a promise that blocks - it just fires and forgets
   */
  const prefetchProductPriceData = async (productName: string, categorySlug?: string) => {
    // Skip if already cached
    if (priceDataCache.has(productName)) {
      return;
    }
    
    // Fire and forget - don't await, don't block
    // This runs completely independently
    (async () => {
      try {
        // Get category ID if categorySlug is provided (cache this to avoid repeated fetches)
        let categoryIdParam = '';
        if (categorySlug) {
          try {
            const categoryResponse = await fetch(`${API_ENDPOINTS.categories.bySlug(categorySlug)}`);
            if (categoryResponse.ok) {
              const categoryData = await categoryResponse.json();
              if (categoryData?.id) {
                categoryIdParam = `&categoryId=${encodeURIComponent(categoryData.id)}`;
              }
            }
          } catch (err) {
            // Ignore category fetch errors
          }
        }
        
        const searchUrl = `${API_ENDPOINTS.products.compareMultiStore(productName, 'auto')}${categoryIdParam}`;
        
        // Use shorter timeout for prefetch (10s) - if it takes longer, skip it
        const controller = new AbortController();
        abortControllersRef.current.add(controller); // Register controller for cleanup
        const timeoutId = setTimeout(() => {
          controller.abort();
          abortControllersRef.current.delete(controller);
        }, 10000); // 10s timeout for faster prefetch
        
        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        abortControllersRef.current.delete(controller); // Clean up controller
        
        if (response.ok) {
          const data = await response.json();
          
          // Only cache if we have valid product and prices
          if (data.product && data.prices && data.prices.length > 0) {
            priceDataCache.set(productName, data);
          }
        }
      } catch (error: any) {
        // Silently fail - this is background prefetch, don't block UI
        // Error is expected for some products (not available, API limits, etc.)
        // Don't log errors to avoid console spam
      }
    })(); // Immediately invoke - fire and forget
  };
  
  // Prefetch pages 2-6 in background after page 1 loads
  const prefetchNextPages = async (query: string, currentPage: number = 1) => {
    // Don't prefetch if already prefetching or if we're past page 1
    if (isPrefetchingRef.current || currentPage > 1) return;
    
    isPrefetchingRef.current = true;
    
    // Prefetch pages 2-6 in parallel (non-blocking)
    const prefetchPromises = [2, 3, 4, 5, 6].map(async (pageNum) => {
      try {
        const searchUrl = API_ENDPOINTS.products.fastSearch(query.trim(), 'auto', undefined, SEARCH_PAGE_SIZE, categorySlug, pageNum);
        const controller = new AbortController();
        abortControllersRef.current.add(controller); // Register controller for cleanup
        const timeoutId = setTimeout(() => {
          controller.abort();
          abortControllersRef.current.delete(controller);
        }, 20000);
        
        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        abortControllersRef.current.delete(controller); // Clean up controller
        
        if (!response.ok) {
          return null;
        }
        
        const data = await response.json();
        const products = Array.isArray(data) ? data : [];
        
        if (products.length === 0) {
          return null;
        }
        
        // Transform products same way as performSearch
        const transformedProducts = products
          .map((p: any) => ({
            id: p.id || `product-${Date.now()}-${Math.random()}`,
            name: p.name || 'Unknown Product',
            image: p.image || '',
            category: p.category || 'Uncategorized',
            categorySlug: p.categorySlug || null,
            storePrices: [],
          }))
          .filter((p: any) => {
            if (categorySlug && p.categorySlug) {
              return p.categorySlug === categorySlug;
            }
            return p && p.name && p.id;
          });
        
        // Store in cache
        prefetchedPagesRef.current.set(pageNum, transformedProducts);
        
        // 🚀 NEW: Prefetch "View Price" data for each product in background (parallel, non-blocking)
        // This makes "View Price" instant when user clicks it
        // Stagger requests slightly to avoid overwhelming the API
        transformedProducts.forEach((product, index) => {
          setTimeout(() => {
            prefetchProductPriceData(product.name, categorySlug).catch(() => {
              // Silently fail - don't log errors for background prefetch
            });
          }, index * 150); // Stagger by 150ms to avoid API rate limits
        });
        
        return transformedProducts;
      } catch (error: any) {
        // Silently fail prefetch - don't block user experience
        return null;
      }
    });
    
    // Wait for all prefetches to complete (but don't block UI)
    Promise.all(prefetchPromises).then(() => {
      isPrefetchingRef.current = false;
    });
  };
  
  // Search function - Uses FAST search endpoint (returns products immediately, no store prices)
  const performSearch = async (query: string, page: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false); // CRITICAL: Reset hasSearched when query is cleared
      setSearchPage(1); // Reset pagination
      prefetchedPagesRef.current.clear(); // Clear cache on new search
      priceDataCache.clear(); // Clear price data cache on new search
      // CRITICAL: When search is cleared, ensure default products are shown
      // The displayProducts useMemo will automatically switch to defaultProductsList
      // because useSearchResults will be false when searchQuery is empty
      return;
    }
    
    // Check cache first for instant loading (only for pages 2-6)
    if (append && page > 1 && prefetchedPagesRef.current.has(page)) {
      const cachedProducts = prefetchedPagesRef.current.get(page)!;
      setSearchResults(prev => [...prev, ...cachedProducts]);
      setHasMoreSearchResults(cachedProducts.length >= SEARCH_PAGE_SIZE);
      setIsLoadingMoreSearch(false);
      return; // Instant return - no API call needed! (no controller created, so no cleanup needed)
    }
    
    if (append) {
      setIsLoadingMoreSearch(true);
    } else {
      setIsSearching(true);
      setHasSearched(true);
      // Clear cache on new search
      prefetchedPagesRef.current.clear();
    }
    
    try {
      // Use FAST search endpoint - returns products immediately without waiting for all store prices
      // Pass categorySlug always (including 'all-retailers') so backend can order by popular brands (e.g. Apple, Bose, Sony for headphones)
      // For pagination: request only the items for this page (6 items per page)
      const searchUrl = API_ENDPOINTS.products.fastSearch(query.trim(), 'auto', undefined, SEARCH_PAGE_SIZE, categorySlug, page);
      
      console.log('🔍 Calling search URL:', searchUrl);
      console.log('🔍 Search params:', { query: query.trim(), categorySlug, page });
      
      const controller = new AbortController();
      // CRITICAL: Register controller so it can be cancelled when category changes
      abortControllersRef.current.add(controller);
      
      // Backend may call Serper (slow); use longer timeouts so "apple" in groceries etc. can complete
      const timeoutDuration = page > 1 ? 25000 : 35000; // 25s pagination, 35s initial search
      const timeoutId = setTimeout(() => {
        controller.abort();
        abortControllersRef.current.delete(controller);
      }, timeoutDuration);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      // Remove controller from set after request completes
      abortControllersRef.current.delete(controller);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('🔍 Search response:', { status: response.status, dataLength: Array.isArray(data) ? data.length : 'not array', dataType: typeof data });
      
      // Fast search returns array of products (no store prices)
      const products = Array.isArray(data) ? data : [];
      
      console.log('🔍 Products after parsing:', products.length);
      
      // If no products returned:
      // - For NEW search (append = false): Clear results and show "no items"
      // - For APPEND (infinite scroll): Just stop pagination, keep existing results
      if (products.length === 0) {
        if (!append) {
          // New search with no results - clear everything
          setSearchResults([]);
          setHasSearched(true);
        } else {
          // Infinite scroll reached end - stop loading more, but keep what we have
          setHasMoreSearchResults(false);
          setIsLoadingMoreSearch(false);
        }
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
          // For "all-retailers", show products from ALL categories (don't filter)
          // For other categories, filter by categorySlug
          if (categorySlug === 'all-retailers') {
            // Show all products regardless of category
            return p && p.name && p.id;
          }
          // Filter by categorySlug for specific categories
          if (categorySlug && p.categorySlug) {
            return p.categorySlug === categorySlug;
          }
          // If no categorySlug on product, include it (backend should handle filtering)
          return p && p.name && p.id;
        });
      
      console.log('✅ Fast search returned', transformedProducts.length, 'products');
      
      // CRITICAL: Check if search query was cleared while we were fetching
      // If query is now empty, don't update state (user cleared the search)
      const currentQuery = searchQuery.trim();
      if (!currentQuery || currentQuery !== query.trim()) {
        console.log(`⏭️ Search query was cleared/changed during fetch, ignoring results for "${query}"`);
        return;
      }
      
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
        
        // 🚀 CRITICAL: Prefetch "View Price" data for page 1 products IMMEDIATELY (parallel, non-blocking)
        // NO STAGGERING for page 1 - fetch all at once so they're ready instantly
        // This is completely independent from pages 2-6 prefetching
        if (transformedProducts.length > 0) {
          console.log(`🚀 Starting IMMEDIATE price prefetch for ${transformedProducts.length} page 1 products (no delay)...`);
          
          // Fire all page 1 prefetch requests IMMEDIATELY in parallel (no setTimeout delays)
          // Each request is independent and non-blocking - they run concurrently
          transformedProducts.forEach((product) => {
            // Start immediately - no delay, no waiting
            prefetchProductPriceData(product.name, categorySlug);
            // Note: prefetchProductPriceData is already fire-and-forget (wrapped in IIFE)
            // It won't block or wait for completion
          });
          
          // Also start prefetching pages 2-6 in background (completely separate, doesn't affect page 1)
          // Use setTimeout(0) to ensure it runs in next tick, but don't wait for it
          setTimeout(() => {
            prefetchNextPages(query, 1);
          }, 0);
        }
      }
      
      setHasSearched(true);
    } catch (error: any) {
      const isAborted = error?.name === 'AbortError' || error?.message?.includes('Aborted');
      if (!isAborted) {
        console.error('❌ Search error:', error);
      }

      const isNetworkError = 
        !isAborted &&
        (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch'));
      
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
        } catch (fallbackError: any) {
          if (fallbackError?.name !== 'AbortError' && !fallbackError?.message?.includes('Aborted')) {
            console.error('❌ Fallback search also failed:', fallbackError);
          }
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
      
      // CRITICAL: Only update state if query hasn't been cleared
      const currentQuery = searchQuery.trim();
      if (currentQuery && currentQuery === query.trim()) {
        setSearchResults([]);
        setHasSearched(true); // Mark as searched even on error so we show "no results" message
        setHasMoreSearchResults(false);
      } else {
        console.log(`⏭️ Search query was cleared during error handling, not updating state`);
      }
    } finally {
      // CRITICAL: Always reset loading states, even if request was aborted
      setIsSearching(false);
      setIsLoadingMoreSearch(false);
      // Remove controller from set if it's still there (only if it was created)
      // Note: controller might not exist if we returned early (e.g., from cache)
    }
  };
  
  // Load more search results (infinite scroll)
  const loadMoreSearchResults = async () => {
    if (!searchQuery.trim() || isLoadingMoreSearch || !hasMoreSearchResults || isSearching) {
      return;
    }
    
    const nextPage = searchPage + 1;
    
    // Check cache first - if available, use it instantly
    if (prefetchedPagesRef.current.has(nextPage)) {
      console.log(`⚡ Loading page ${nextPage} from cache - instant!`);
      const cachedProducts = prefetchedPagesRef.current.get(nextPage)!;
      setSearchPage(nextPage);
      setSearchResults(prev => [...prev, ...cachedProducts]);
      setHasMoreSearchResults(cachedProducts.length >= SEARCH_PAGE_SIZE);
      setIsLoadingMoreSearch(false);
      // Remove from cache after using (save memory)
      prefetchedPagesRef.current.delete(nextPage);
    } else {
      // Not in cache, fetch normally
      setSearchPage(nextPage);
      await performSearch(searchQuery, nextPage, true); // Append results
    }
  };
  
  // Keep search input in sync with initialSearchQuery (e.g. when navigating from homepage with ?q=)
  useEffect(() => {
    const q = initialSearchQuery?.trim();
    if (q) {
      setSearchQuery(q);
    }
  }, [initialSearchQuery]);

  // Auto-search when initialSearchQuery is provided (from homepage or deep link)
  const initialSearchDoneRef = useRef<string | null>(null);
  useEffect(() => {
    const q = initialSearchQuery?.trim();
    if (!q) {
      initialSearchDoneRef.current = null;
      return;
    }
    // Avoid running twice for the same query (e.g. strict mode or param arriving after mount)
    if (initialSearchDoneRef.current === q) return;
    initialSearchDoneRef.current = q;
    console.log('🔍 Auto-searching with initial query:', q);
    setSearchPage(1);
    setHasMoreSearchResults(false);
    setHasSearched(true);
    performSearch(q, 1);
  }, [initialSearchQuery]);

  // Improved debounced search - waits for complete word before searching
  useEffect(() => {
    console.log('🔍 Search useEffect triggered, searchQuery:', searchQuery);
    
    // Skip debounce if this is the initial search query (already handled above)
    if (initialSearchQuery && searchQuery === initialSearchQuery) {
      return;
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!searchQuery.trim()) {
      console.log('🔍 Search query is empty, clearing results');
      setSearchResults([]);
      setHasSearched(false); // CRITICAL: Reset hasSearched so default products are shown
      setHasSearched(false);
      setSearchPage(1);
      setHasMoreSearchResults(false);
      return;
    }
    
    // Minimum query length: 3 characters to avoid irrelevant results
    const MIN_QUERY_LENGTH = 3;
    // Allow common abbreviations like "TV", "PC", "PS5" even if < 3 chars
    const commonAbbreviations = ['tv', 'pc', 'ps5', 'ps4', 'xbox', 'iphone', 'ipad'];
    const isCommonAbbreviation = commonAbbreviations.includes(searchQuery.trim().toLowerCase());
    
    if (searchQuery.trim().length < MIN_QUERY_LENGTH && !isCommonAbbreviation) {
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
    // CRITICAL: Only use search results if query is NOT empty (prevents showing empty state when search is cleared)
    const useSearchResults = hasSearched && searchQuery.trim().length > 0;
    const useSubcategoryProducts = selectedSubcategory && subcategoryProducts.length > 0;
    
    // For search results, use all results (pagination handled separately)
    const products = useSearchResults 
      ? searchResults 
      : useSubcategoryProducts 
        ? subcategoryProducts 
        : defaultProductsList; // Use paginated default products instead of all defaultProducts
    
    console.log('📦 displayProducts calculation:', {
      hasSearched,
      searchQuery: searchQuery.trim(),
      useSearchResults,
      searchResultsCount: searchResults.length,
      defaultProductsCount: defaultProducts.length,
      defaultProductsListCount: defaultProductsList.length,
      finalProductsCount: products.length,
      firstProductImage: products[0]?.image,
      firstProductName: products[0]?.name,
      categorySlug,
    });
    
    // Filter out null/invalid and test products; ensure every product has a displayable image (use placeholder if missing)
    const seenProductNames = new Set<string>();
    const placeholderForCategory = getCategoryPlaceholderImage(categorySlug);
    return Array.isArray(products) ? products
      .filter(p => {
        if (p == null || p.id == null) return false;
        const productName = (p.name || '').toLowerCase();
        if (productName.includes('test product')) return false;
        if (seenProductNames.has(productName)) return false;
        seenProductNames.add(productName);
        return true;
      })
      .map(p => {
        const hasValidImage = p.image && typeof p.image === 'string' && p.image.trim().length > 0 &&
          (p.image.startsWith('http://') || p.image.startsWith('https://')) && !p.image.includes('example.com');
        if (!hasValidImage) {
          return { ...p, image: placeholderForCategory };
        }
        return p;
      }) : [];
  }, [hasSearched, searchQuery, searchResults, defaultProductsList, selectedSubcategory, subcategoryProducts, categorySlug]);
  
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
  
  // CRITICAL: Show ALL products immediately - no artificial limits
  // This fixes the issue where products don't display until you navigate away and back
  const productsToRender = useMemo(() => {
    const validProducts = filteredProducts.filter(p => p != null && p.id != null);
    // Show all valid products immediately - no slicing
    // Infinite scroll will handle loading more from backend if needed
    return validProducts;
  }, [filteredProducts]);
  
  // Show products immediately - don't defer (bad UX to hide products)
  const [showProducts, setShowProducts] = useState(true); // Always show products immediately
  
  // Reset showProducts when category changes (but show immediately, don't defer)
  useEffect(() => {
    // Always show products immediately - no deferring for better UX
    setShowProducts(true);
  }, [categorySlug]);
  
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.appHeaderSolid }}>
      {/* Background Image (if provided) */}
      {backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            opacity: 0.15, // Subtle background
          }}
          resizeMode="cover"
        />
      )}
      <AppHeader />
      <CurrentCategoryBar categoryName={categoryName} />
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
            backgroundColor: theme.colors.background.appHeader,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(139, 149, 168, 0.15)',
            marginBottom: 24,
            // Note: backdrop-filter not directly supported in React Native
            // Using overlay gradient to simulate the effect
            overflow: 'hidden',
          }}>
            {/* Gradient overlay - single app color (theme primary) */}
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.1)']}
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
          
          {/* Subcategory Section - Browse by Category (above search per client request) */}
          {/* Hide for groceries and electronics per client request - only show search bar */}
          {displaySubcategories.length > 0 && categorySlug !== 'groceries' && categorySlug !== 'electronics' && (
            <View style={{
              backgroundColor: theme.colors.background.appHeader,
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
                  backgroundColor: theme.colors.primary.main,
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
                          ? 'rgba(139, 92, 246, 0.15)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isSelected 
                          ? 'rgba(139, 92, 246, 0.4)' 
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
          {/* Hide for groceries and electronics per client request */}
          {displaySubcategories.length > 0 && categorySlug !== 'groceries' && categorySlug !== 'electronics' && (
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
                {/* All Categories Chip - single app color */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedSubcategory(null)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: !selectedSubcategory 
                      ? 'rgba(139, 92, 246, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: !selectedSubcategory 
                      ? 'rgba(139, 92, 246, 0.4)' 
                      : 'rgba(139, 149, 168, 0.2)',
                  }}
                >
                  <Text style={{
                    color: !selectedSubcategory ? theme.colors.primary.light : '#e8edf4',
                    fontSize: 13,
                    fontWeight: !selectedSubcategory ? '600' : '400',
                  }}>
                    All
                  </Text>
                </TouchableOpacity>

                {/* Subcategory Chips - single app color */}
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
                            ? 'rgba(139, 92, 246, 0.2)' 
                            : 'rgba(255, 255, 255, 0.05)',
                          borderWidth: 1,
                          borderColor: isSelected 
                            ? 'rgba(139, 92, 246, 0.4)' 
                            : 'rgba(139, 149, 168, 0.2)',
                        }}
                      >
                        <Text style={{
                          color: isSelected ? theme.colors.primary.light : '#e8edf4',
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

          {/* Search + Filters + Sort - Below subcategory (item cards appear below this) */}
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
            {/* Search Input - unified professional style for all categories */}
            <View style={{ width: '100%', position: 'relative' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(139, 149, 168, 0.2)',
                paddingHorizontal: 14,
                height: 48,
                minHeight: 48,
              }}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#94a3b8"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  placeholder={
                    categorySlug === 'groceries'
                      ? "Search groceries (e.g. milk, bread, apples)"
                      : categorySlug === 'electronics'
                      ? "Search electronics (e.g. iPhone, laptop, TV)"
                      : categorySlug === 'clothing' || categorySlug === 'clothes'
                      ? "Search clothing by brand or category"
                      : "Search products..."
                  }
                  placeholderTextColor="rgba(148, 163, 184, 0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => {
                    if (searchQuery.trim()) performSearch(searchQuery, 1, false);
                  }}
                  returnKeyType="search"
                  style={{
                    flex: 1,
                    color: '#e2e8f0',
                    fontSize: 15,
                    lineHeight: 22,
                    paddingVertical: 0,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                    fontWeight: '400',
                  }}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color={theme.colors.primary.main} style={{ marginLeft: 8 }} />
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
                      backgroundColor: theme.colors.background.appHeader,
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
                      backgroundColor: theme.colors.background.appHeader,
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
                ? displaySubcategories.find(s => s.id === selectedSubcategory)?.name || 'Products'
                : 'Popular Items'}
            </Text>
            
            {/* Product Cards - Infinite Scroll for Subcategory, Grid for Others */}
            {isSearching && searchQuery.trim() ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
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
                            productId={product.id}
                            productName={product.name || 'Unnamed Product'}
                            productImage={product.image || ''}
                            category={product.category || 'Uncategorized'}
                            categorySlug={categorySlug}
                            storeCount={product.storeCount || 0}
                            minPrice={product.minPrice || 0}
                            fullProductData={product}
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
                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
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
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
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
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                    }}
                  >
                    {productsToRender
                      .filter(product => product != null && product.id != null)
                      .map((product, index) => {
                        try {
                          // Trigger infinite scroll when near bottom (load earlier for smoother experience)
                          const isSearching = hasSearched && searchQuery.trim();
                          const isDefaultView = !hasSearched && !selectedSubcategory;
                          
                          // Load more when rendering items near the end (5 items before end for smoother loading)
                          const triggerIndex = Math.max(0, productsToRender.length - 5);
                          
                          if (isSearching && index === triggerIndex && hasMoreSearchResults && !isLoadingMoreSearch) {
                            // Load more search results when rendering 5 items before end
                            setTimeout(() => loadMoreSearchResults(), 100);
                          } else if (isDefaultView && index === triggerIndex && hasMoreDefaultProducts && !isLoadingMoreDefault) {
                            // Load more default products when rendering 5 items before end (infinite scroll for all categories)
                            setTimeout(() => loadMoreDefaultProducts(), 100);
                          }
                          
                          // Calculate quick insights from store prices
                          const storeCount = product.storePrices?.length || 0;
                          const prices = product.storePrices?.map((sp: any) => 
                            parseFloat(sp.price.replace('$', '')) || 0
                          ) || [];
                          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                          
                          return (
                            <View
                              key={product.id || `product-${index}`}
                              style={{
                                width: columnWidth,
                                marginBottom: 16,
                              }}
                            >
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
                    
                    {/* Loading indicator for infinite scroll (search results or default products) */}
                    {((hasSearched && searchQuery.trim() && isLoadingMoreSearch) || (!hasSearched && !selectedSubcategory && isLoadingMoreDefault)) && (
                      <View style={{ paddingVertical: 20, alignItems: 'center', width: '100%' }}>
                        <ActivityIndicator size="small" color={theme.colors.primary.main} />
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
                    
                    {/* End of default products indicator */}
                    {!hasSearched && !selectedSubcategory && !hasMoreDefaultProducts && defaultProductsList.length > 0 && !isLoadingMoreDefault && (
                      <View style={{ paddingVertical: 20, alignItems: 'center', width: '100%' }}>
                        <Text style={{ color: '#8b95a8', fontSize: 14 }}>
                          Showing all {defaultProductsList.length} products
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()
            ) : hasSearched && searchQuery.trim() && searchResults.length === 0 && !isSearching ? (
              // Only show "No products found" if:
              // 1. User has searched (hasSearched = true)
              // 2. Search query is not empty (searchQuery.trim() is truthy)
              // 3. No results found (searchResults.length === 0)
              // 4. Not currently searching (isSearching = false)
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="search-outline" size={48} color="#8b95a8" />
                <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                  No products found for "{searchQuery}"
                </Text>
                <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 12 }}>
                  Try a different search term
                </Text>
              </View>
            ) : (defaultProductsList.length === 0 && isProgressiveLoading) ? (
              // Show skeleton placeholders while loading progressively
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <View
                    key={`skeleton-${i}`}
                    style={{
                      width: width >= 1024 ? '23%' : width >= 768 ? '31%' : '47%',
                      marginBottom: 16,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(139, 149, 168, 0.2)',
                    }}
                  >
                    <View style={{
                      width: '100%',
                      height: 150,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      marginBottom: 12,
                    }} />
                    <View style={{
                      width: '80%',
                      height: 16,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 4,
                      marginBottom: 8,
                    }} />
                    <View style={{
                      width: '60%',
                      height: 14,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 4,
                    }} />
                  </View>
                ))}
              </View>
            ) : defaultProductsList.length === 0 && !hasSearched && !selectedSubcategory && !searchQuery.trim() ? (
              // Show loading state only while initial load is in progress; otherwise show "No products" or connection hint
              initialLoadComplete ? (
                <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 24 }}>
                  <Ionicons name={backendConnectionError ? 'cloud-offline-outline' : 'cube-outline'} size={48} color="#8b95a8" />
                  <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                    {backendConnectionError ? "Can't reach server" : 'No products available'}
                  </Text>
                  <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                    {backendConnectionError
                      ? 'Check that the backend is running (npm run start:dev) and that client/constants/api.ts API_BASE_URL matches your PC IP (same Wi‑Fi).'
                      : 'Try searching or check back later'}
                  </Text>
                </View>
              ) : (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.colors.primary.main} />
                  <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                    Loading products...
                  </Text>
                  <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 12 }}>
                    Fetching from stores...
                  </Text>
                </View>
              )
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="cube-outline" size={48} color="#8b95a8" />
                <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
                  No products available
                </Text>
                <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 12 }}>
                  Try searching or check back later
                </Text>
              </View>
            )}
          </View>

          {/* Sponsored ad at bottom – category-specific (e.g. groceries → grocery delivery) */}
          <CategoryAdCard categorySlug={categorySlug} />
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}


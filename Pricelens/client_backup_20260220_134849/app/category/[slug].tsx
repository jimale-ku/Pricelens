/**
 * Universal Category Page - Smart Router
 * Route: /category/[slug]
 * 
 * This file handles ALL 42 categories dynamically by:
 * 1. Reading the category slug from the route
 * 2. Looking up category data from categories.ts
 * 3. Determining which pattern (A, B, or C) to use
 * 4. Rendering the appropriate layout component
 * 
 * Note: Specific category files (like groceries.tsx, electronics.tsx) will override this
 * if they exist. This file serves as the fallback for all other categories.
 */

import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { CATEGORIES, CATEGORY_LIST } from '@/constants/categories';
import { getCategoryPattern } from '@/constants/categoryPatterns';
import PatternALayout from '@/components/category/PatternALayout';
import PatternBLayout from '@/components/category/PatternBLayout';
import PatternCLayout from '@/components/category/PatternCLayout';
import TiresLayout from '@/components/category/TiresLayout';
import HotelsLayout from '@/components/category/HotelsLayout';
import ApartmentsLayout from '@/components/category/ApartmentsLayout';
import FoodDeliveryLayout from '@/components/category/FoodDeliveryLayout';
import MassageLayout from '@/components/category/MassageLayout';
import SpaLayout from '@/components/category/SpaLayout';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { getIconName } from '@/utils/iconMapper';
import { SAMPLE_PRODUCTS } from '@/constants/groceryData';
import { SAMPLE_ELECTRONICS_PRODUCTS } from '@/constants/electronicsData';
import { generateSampleProducts } from '@/utils/generateSampleProducts';
import { fetchCategoryStores, fetchCategoryProducts, fetchSubcategoryCounts } from '@/services/categoryService';
import { trackEvent } from '@/utils/analytics';

// CRITICAL: Validate all imports at module level with DETAILED error messages
const validateComponent = (component: any, name: string) => {
  if (component === undefined) {
    const error = new Error(`[CRITICAL ERROR] ${name} is UNDEFINED. Check import path and export.`);
    console.error(`❌ ${name} validation failed:`, {
      component,
      type: typeof component,
      isUndefined: component === undefined,
      isNull: component === null,
      importPath: `@/components/category/${name}`,
    });
    throw error;
  }
  if (typeof component !== 'function' && typeof component !== 'object') {
    const error = new Error(`[CRITICAL ERROR] ${name} is not a valid component. Type: ${typeof component}`);
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
  validateComponent(PatternALayout, 'PatternALayout');
  validateComponent(PatternBLayout, 'PatternBLayout');
  validateComponent(PatternCLayout, 'PatternCLayout');
  validateComponent(TiresLayout, 'TiresLayout');
  validateComponent(HotelsLayout, 'HotelsLayout');
  validateComponent(ApartmentsLayout, 'ApartmentsLayout');
  validateComponent(FoodDeliveryLayout, 'FoodDeliveryLayout');
  validateComponent(MassageLayout, 'MassageLayout');
  validateComponent(SpaLayout, 'SpaLayout');
  validateComponent(AppHeader, 'AppHeader');
} catch (error) {
  console.error('🚨 FATAL: Component validation failed at module level:', error);
  throw error;
}

// Validate constants
if (typeof SAMPLE_PRODUCTS === 'undefined') {
  console.warn('⚠️ SAMPLE_PRODUCTS is undefined');
}
if (typeof SAMPLE_ELECTRONICS_PRODUCTS === 'undefined') {
  console.warn('⚠️ SAMPLE_ELECTRONICS_PRODUCTS is undefined');
}

// Helper to convert store slugs to display names - ALWAYS returns a string, never undefined
function formatStoreName(slug: string | undefined | null): string {
  // Safety check: ensure slug is valid
  if (!slug || typeof slug !== 'string') {
    console.warn('⚠️ formatStoreName received invalid slug:', slug);
    return 'Unknown Store';
  }
  
  const nameMap: Record<string, string> = {
    'walmart': 'Walmart',
    'target': 'Target',
    'wholefoods': 'Whole Foods',
    'kroger': 'Kroger',
    'safeway': 'Safeway',
    'kingsoopers': 'King Soopers',
    'amazonfresh': 'Amazon Fresh',
    'costco': 'Costco',
    'foodlion': 'Food Lion',
    'traderjoes': "Trader Joe's",
    'aldi': 'Aldi',
    'amazon': 'Amazon',
    'bestbuy': 'Best Buy',
    'newegg': 'Newegg',
    'bhphoto': 'B&H Photo',
    'microcenter': 'Micro Center',
    'samsclub': "Sam's Club",
  };
  
  // Always return a string, never undefined
  const formatted = nameMap[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '));
  return formatted || 'Unknown Store';
}

// Helper to create icon component - always returns a valid component
function createIconComponent(iconName: string | undefined): React.ComponentType<{ size?: number; color?: string }> {
  // Ensure we always have a valid icon name
  const safeIconName = iconName || 'package';
  const mappedIconName = getIconName(safeIconName);
  
  // Return a component that always renders something valid
  return ({ size = 24, color = "#ffffff" }: { size?: number; color?: string }) => {
    // Double-check that mappedIconName is valid
    if (!mappedIconName) {
      return <Ionicons name="cube-outline" size={size} color={color} />;
    }
    return <Ionicons name={mappedIconName as any} size={size} color={color} />;
  };
}

// Helper to get gradient colors from iconColor
function getGradientFromColor(color: string): string[] {
  const colorMap: Record<string, string[]> = {
    '#10B981': ['#10B981', '#059669'], // green
    '#3B82F6': ['#3B82F6', '#2563EB'], // blue
    '#F97316': ['#F97316', '#EA580C'], // orange
    '#06B6D4': ['#06B6D4', '#0891B2'], // cyan
    '#8B5CF6': ['#8B5CF6', '#7C3AED'], // purple
    '#EF4444': ['#EF4444', '#DC2626'], // red
    '#FBBF24': ['#FBBF24', '#F59E0B'], // yellow
    '#EC4899': ['#F472B6', '#EC4899'], // beauty pink gradient (softer to vibrant)
    '#6B7280': ['#6B7280', '#4B5563'], // gray
  };
  
  return colorMap[color] || ['#3B82F6', '#8B5CF6']; // default blue-purple
}

// Error Boundary Component - use only basic React Native components
function ErrorDisplay({ error, componentName }: { error: Error | string; componentName: string }) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <View style={{ flex: 1, backgroundColor: '#0B1020', padding: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
        Error: {componentName}
      </Text>
      <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center' }}>
        {errorMessage}
      </Text>
    </View>
  );
}

// React Error Boundary Class Component
class CategoryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Error caught by boundary
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // CRITICAL: Don't let error boundary cause navigation - show error on page
      console.error('🚨 Error Boundary caught error:', this.state.error);
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
          <AppHeader />
          <ErrorDisplay error={this.state.error} componentName="CategoryScreen (Error Boundary)" />
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function CategoryScreenContent() {
  const { slug, q } = useLocalSearchParams<{ slug: string; q?: string }>();
  const [renderError, setRenderError] = useState<{ error: Error | string; component: string } | null>(null);
  
  
  // State for backend data
  const [backendStores, setBackendStores] = useState<string[]>([]);
  const [backendProducts, setBackendProducts] = useState<any[]>([]);
  const [subcategoryCounts, setSubcategoryCounts] = useState<Record<string, number>>({});
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  // Progressive loading: show items as they arrive
  const [progressiveProducts, setProgressiveProducts] = useState<any[]>([]);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);
  
  // Validate AppHeader is available
  if (!AppHeader) {
    const errorMsg = `AppHeader is undefined! Type: ${typeof AppHeader}`;
    console.error('❌', errorMsg);
    return <ErrorDisplay error={errorMsg} componentName="AppHeader" />;
  }
  
  // Early return if slug is not available yet
  if (!slug) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <AppHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      </SafeAreaView>
    );
  }
  
  // Find category in CATEGORY_LIST (uses slug)
  const category = CATEGORY_LIST.find((c) => c.slug === slug);
  
  // Also try to find in CATEGORIES object (uses id)
  const categoryById = slug ? CATEGORIES[slug] : null;
  const categoryData = category || categoryById;
  
  // CRITICAL: Store AbortControllers to cancel pending requests when category changes
  const abortControllersRef = useRef<Set<AbortController>>(new Set());
  
  // Track category view analytics
  useEffect(() => {
    if (!slug || !categoryData) return;
    
    trackEvent({
      eventType: 'category_view',
      categorySlug: slug,
      categoryName: categoryData.name,
    });
  }, [slug, categoryData]);

  // Fetch stores and products from backend when category changes
  useEffect(() => {
    if (!slug || !categoryData) return;
    
    // CRITICAL: Cancel ALL pending requests from previous category
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore errors when aborting
      }
    });
    abortControllersRef.current.clear();
    
    // Reset loading state immediately
    setIsLoadingBackend(true);
    setBackendError(null);
    
    // Create new AbortController for this category
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    
    // Use 15s timeout for categories that rely on SerpAPI/backend (groceries, electronics, books, etc.)
    // so the product fetch has time to complete; avoids endless "Loading products..." when backend is slow
    const slowCategories = ['books', 'groceries', 'electronics', 'kitchen', 'beauty-products', 'beauty', 'video-games', 'sports-equipment', 'office', 'mattresses', 'pet-supplies', 'household', 'home-accessories', 'furniture', 'clothing', 'footwear'];
    const maxLoadingTimeoutDuration = slowCategories.includes(slug) ? 15000 : 8000;
    const maxLoadingTimeout = setTimeout(() => {
      if (!controller.signal.aborted) {
        setIsLoadingBackend(false);
        setBackendError('Request timed out. Check that the backend is running and API_BASE_URL in client/constants/api.ts matches your PC IP.');
      }
    }, maxLoadingTimeoutDuration);
    
    // Show loading state initially
    setIsProgressiveLoading(true);
    setProgressiveProducts([]);
    
    // Fetch stores and subcategory counts first (fast)
    Promise.all([
      fetchCategoryStores(slug),
      fetchSubcategoryCounts(slug),
    ])
      .then(([stores, counts]) => {
        if (controller.signal.aborted) return;
        
        const formattedStores = stores.length > 0
          ? ['All Stores', ...stores.filter(s => s && s.name).map(s => s.name)]
          : [];
        
        setBackendStores(formattedStores);
        setSubcategoryCounts(counts || {});
      })
      .catch(() => {
        // Ignore errors for stores/counts
      });
    
    // Fetch products - show immediately when loaded (no progressive delays)
    fetchCategoryProducts(slug, 6)
      .then((products) => {
        // CRITICAL: Check if request was aborted before updating state
        if (controller.signal.aborted) {
          return;
        }
        
        clearTimeout(maxLoadingTimeout);
        abortControllersRef.current.delete(controller);
        
        // Show all products immediately (no progressive delays)
        setProgressiveProducts(products);
        setBackendProducts(products);
        setIsLoadingBackend(false);
        setIsProgressiveLoading(false);
      })
      .catch((error) => {
        // CRITICAL: Don't update state if request was aborted
        if (controller.signal.aborted) {
          return;
        }
        
        clearTimeout(maxLoadingTimeout);
        abortControllersRef.current.delete(controller);
        
        setBackendError(error.message);
        setBackendStores([]);
        setBackendProducts([]);
        setProgressiveProducts([]);
        setIsLoadingBackend(false);
        setIsProgressiveLoading(false);
      });
    
    // Cleanup: Cancel requests when component unmounts or category changes
    return () => {
      controller.abort();
      abortControllersRef.current.delete(controller);
      clearTimeout(maxLoadingTimeout);
    };
  }, [slug, categoryData]);

  if (!categoryData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <AppHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine pattern
  const pattern = getCategoryPattern(slug || '');
  
  // Use backend stores if available, otherwise fallback to hardcoded stores
  const stores = useMemo(() => {
    // Priority 1: Backend stores (from database) - real stores that have products
    if (backendStores.length > 0) {
      // Filter out any undefined/null values
      return backendStores.filter(store => store && typeof store === 'string');
    }
    
    // Priority 2: Hardcoded stores from categories.ts (fallback)
    if (categoryData.stores && categoryData.stores.length > 0) {
      // Map and filter to ensure no undefined values
      const formattedStores = categoryData.stores
        .filter(store => store) // Remove null/undefined stores
        .map(formatStoreName)
        .filter(name => name && typeof name === 'string'); // Remove any undefined formatted names
      
      return ['All Stores', ...formattedStores];
    }
    
    // Default: Just "All Stores"
    return ['All Stores'];
  }, [backendStores, categoryData.stores, slug]);

  // Memoize gradient colors - ensure categoryData exists
  const iconGradient = useMemo(() => {
    if (!categoryData) return ['#3B82F6', '#8B5CF6']; // default gradient
    return getGradientFromColor(categoryData.iconColor || '#3B82F6');
  }, [categoryData?.iconColor]);

  // Memoize icon component creation - ensure it's always defined
  const IconComponent = useMemo(() => {
    // Always return a valid component, even if categoryData is not yet loaded
    const iconName = categoryData?.icon || 'package'; // 'package' maps to 'cube-outline'
    const component = createIconComponent(iconName);
    // Validate the component is actually a function
    if (!component || typeof component !== 'function') {
      console.error('❌ IconComponent creation failed:', component, typeof component);
      // Return a fallback component
      return ({ size = 24, color = "#ffffff" }: { size?: number; color?: string }) => (
        <Ionicons name="cube-outline" size={size} color={color} />
      );
    }
    return component;
  }, [categoryData?.icon]);

  // Memoize subcategories mapping - merge with real counts from backend
  const mappedSubcategories = useMemo(() => {
    if (!categoryData || !categoryData.subcategories) return [];
    return categoryData.subcategories
      .filter(sub => sub && sub.id && sub.name) // Filter out invalid subcategories
      .map(sub => {
        // Priority: Use real count from backend if available, otherwise use hardcoded count
        const realCount = subcategoryCounts[sub.id] ?? subcategoryCounts[sub.name.toLowerCase()];
        const count = realCount !== undefined ? realCount : ('count' in sub ? sub.count : undefined);
        
        return {
          id: sub.id,
          name: sub.name,
          count: count,
        };
      })
      .filter(sub => sub.id && sub.name); // Final filter to ensure all have required fields
  }, [categoryData?.subcategories, subcategoryCounts]);

  const useSampleData =
    // Opt-in only (disabled by default). Set EXPO_PUBLIC_USE_SAMPLE_DATA=true to enable.
    (process.env.EXPO_PUBLIC_USE_SAMPLE_DATA || '').toLowerCase() === 'true';

  // Use backend products if available, otherwise optional (opt-in) sample data - ensure no undefined
  // Use progressive products when available, otherwise fallback to backend products
  const defaultProducts = useMemo(() => {
    // Priority 1: Progressive products (shows items as they load)
    if (progressiveProducts.length > 0) {
      return progressiveProducts;
    }
    // Priority 2: All backend products
    if (backendProducts.length > 0) {
      return backendProducts;
    }
    
    // Original logic for fallback products
    let products: any[] = [];
    
    // Priority 1: Backend products (from database/PriceAPI)
    if (backendProducts && backendProducts.length > 0) {
      products = backendProducts;
    }
    // Optional fallback: sample data ONLY when explicitly enabled
    else if (useSampleData && slug === 'groceries') {
      products = SAMPLE_PRODUCTS || [];
    }
    else if (useSampleData && slug === 'electronics') {
      products = SAMPLE_ELECTRONICS_PRODUCTS || [];
    }
    else if (useSampleData && pattern === 'A' && categoryData && categoryData.stores && categoryData.stores.length > 0 && stores && stores.length > 1) {
      products = generateSampleProducts(
        slug || categoryData.id || 'unknown',
        categoryData.name || 'Category',
        stores,
        6
      ) || [];
    }
    
    // CRITICAL: Filter out any undefined/null products and ensure all have required fields
    return products.filter(product => {
      if (!product) {
        console.warn('⚠️ Filtered out null/undefined product');
        return false;
      }
      if (!product.id) {
        console.warn('⚠️ Filtered out product without id:', product);
        return false;
      }
      return true;
    });
  }, [progressiveProducts, backendProducts, slug, pattern, categoryData?.id, categoryData?.name, categoryData?.stores, stores, useSampleData]);
  
  // The PatternALayout component will handle showing products when they arrive

  // Render based on pattern with comprehensive error handling
  try {
    if (pattern === 'A') {
      // Pattern A: Two-Level System (Product Categories)
      // Validate all required components and props
      if (!PatternALayout) {
        const errorMsg = `PatternALayout is undefined! Type: ${typeof PatternALayout}`;
        console.error('❌', errorMsg);
        return <ErrorDisplay error={errorMsg} componentName="PatternALayout" />;
      }
      
      if (typeof PatternALayout !== 'function' && typeof PatternALayout !== 'object') {
        const errorMsg = `PatternALayout is not a valid component! Type: ${typeof PatternALayout}, Value: ${String(PatternALayout)}`;
        console.error('❌', errorMsg);
        return <ErrorDisplay error={errorMsg} componentName="PatternALayout" />;
      }
      
      // CRITICAL: Allow rendering even with empty products - show page with "No products" message
      // Don't block rendering - products will load in background
      if (!IconComponent || stores === undefined) {
        return (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
            <AppHeader />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#60a5fa" />
              <Text style={{ color: '#FFFFFF', fontSize: 18, marginTop: 12 }}>Loading...</Text>
            </View>
          </SafeAreaView>
        );
      }
      
      // Ensure defaultProducts is always an array (even if empty) - now includes progressive loading
      const safeDefaultProducts = Array.isArray(defaultProducts) ? defaultProducts : [];
      
      // Double-check that IconComponent is actually a function/component
      if (typeof IconComponent !== 'function') {
        const errorMsg = `IconComponent is not a function! Type: ${typeof IconComponent}`;
        console.error('❌', errorMsg);
        return <ErrorDisplay error={errorMsg} componentName="IconComponent" />;
      }
      
      // Final safety check: Ensure IconComponent is always a valid function
      const SafeIconComponent = IconComponent && typeof IconComponent === 'function' 
        ? IconComponent 
        : ({ size = 24, color = "#ffffff" }: { size?: number; color?: string }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          );
      
      // Ensure all arrays are valid and don't contain undefined
      // CRITICAL: Always provide an array (even if empty) - don't block rendering
      const safeStores = Array.isArray(stores) ? stores.filter(Boolean) : ['All Stores'];
      const safeSubcategories = Array.isArray(mappedSubcategories) ? mappedSubcategories.filter(Boolean) : [];
      const safeProducts = Array.isArray(defaultProducts) ? defaultProducts.filter(Boolean) : [];
      
      // Log for debugging
      console.log(`📦 [${slug}] Rendering PatternALayout with ${safeProducts.length} products, ${safeStores.length} stores`);
      
      // CRITICAL: Wrap in try-catch to prevent crashes that cause navigation
      try {
        return (
          <PatternALayout
            categorySlug={slug || ''}
            categoryName={categoryData?.name || 'Category'}
            categoryDescription={categoryData?.description || ''}
            categoryIcon={SafeIconComponent}
            iconGradient={iconGradient || ['#3B82F6', '#8B5CF6']}
            stores={safeStores}
            subcategories={safeSubcategories}
            defaultProducts={safeProducts}
            categoryId={categoryData?.id}
            backgroundImage={(categoryData as any)?.backgroundImage}
            initialSearchQuery={q ? String(q) : undefined}
            initialLoadComplete={!isLoadingBackend}
            backendConnectionError={backendError}
            isProgressiveLoading={isProgressiveLoading}
          />
        );
      } catch (renderError) {
        console.error('❌ Error rendering PatternALayout:', renderError);
        return (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
            <AppHeader />
            <ErrorDisplay error={renderError as Error} componentName="PatternALayout" />
          </SafeAreaView>
        );
      }
    } else if (pattern === 'B') {
      // Special case: Tires uses custom layout matching Figma design
      if (slug === 'tires') {
        if (!TiresLayout) {
          const errorMsg = `TiresLayout is undefined! Type: ${typeof TiresLayout}`;
          console.error('❌', errorMsg);
          return <ErrorDisplay error={errorMsg} componentName="TiresLayout" />;
        }
        
        try {
          return (
            <TiresLayout
              categorySlug={slug || ''}
              categoryName={categoryData?.name || 'Tires'}
              categoryDescription={categoryData?.description || 'Compare tire prices from top retailers and installers'}
              categoryIcon={categoryData?.icon || 'car'}
              iconGradient={iconGradient || ['#06B6D4', '#3B82F6']}
            />
          );
        } catch (renderError) {
          console.error('❌ Error rendering TiresLayout:', renderError);
          return <ErrorDisplay error={renderError as Error} componentName="TiresLayout" />;
        }
      }

      if (slug === 'hotels') {
        if (!HotelsLayout) {
          const errorMsg = `HotelsLayout is undefined! Type: ${typeof HotelsLayout}`;
          console.error('❌', errorMsg);
          return <ErrorDisplay error={errorMsg} componentName="HotelsLayout" />;
        }
        
        try {
          return (
            <HotelsLayout
              categorySlug={slug || ''}
              categoryName={categoryData?.name || 'Hotels'}
              categoryDescription={categoryData?.description || 'Compare hotel prices from top booking sites'}
              categoryIcon={categoryData?.icon || 'bed'}
              iconGradient={iconGradient || ['#06B6D4', '#8B5CF6']}
            />
          );
        } catch (renderError) {
          console.error('❌ Error rendering HotelsLayout:', renderError);
          return <ErrorDisplay error={renderError as Error} componentName="HotelsLayout" />;
        }
      }
      
      // Pattern B: Direct Comparison Table
      // Pattern B doesn't need backend data initially, so don't wait for it
      if (!PatternBLayout) {
        const errorMsg = `PatternBLayout is undefined! Type: ${typeof PatternBLayout}`;
        console.error('❌', errorMsg);
        return <ErrorDisplay error={errorMsg} componentName="PatternBLayout" />;
      }
      
      // Define search fields based on category
      let searchFields: Array<{
        id: string;
        label: string;
        type: 'text' | 'select';
        placeholder?: string;
        options?: Array<{ value: string; label: string }>;
      }> = [
        { id: 'zipCode', label: 'ZIP Code', type: 'text', placeholder: 'Enter ZIP code' },
      ];
      
      // Add category-specific fields for all Pattern B categories
      if (slug === 'gas-stations') {
        searchFields.push({
          id: 'gasType',
          label: 'Gas Type',
          type: 'select',
          options: [
            { value: 'regular', label: 'Regular (87)' },
            { value: 'midgrade', label: 'Mid-Grade (89)' },
            { value: 'premium', label: 'Premium (91+)' },
            { value: 'diesel', label: 'Diesel' },
          ],
        });
      } else if (slug === 'gym') {
        searchFields.push({
          id: 'membershipType',
          label: 'Membership Type',
          type: 'select',
          options: [
            { value: 'basic', label: 'Basic' },
            { value: 'premium', label: 'Premium' },
            { value: 'family', label: 'Family' },
          ],
        });
      } else if (slug === 'car-insurance') {
        // Car Insurance: 3 sections matching Figma design
        searchFields = [
          // Section 1: Vehicle Information
          {
            id: 'year',
            label: 'Year',
            type: 'text',
            placeholder: 'e.g., 2020',
            section: 'Vehicle Information',
          },
          {
            id: 'make',
            label: 'Make',
            type: 'text',
            placeholder: 'e.g., Honda, Toyota, Ford',
            section: 'Vehicle Information',
          },
          {
            id: 'model',
            label: 'Model',
            type: 'text',
            placeholder: 'e.g., Civic, Camry, F-150',
            section: 'Vehicle Information',
          },
          {
            id: 'trim',
            label: 'Trim',
            type: 'text',
            placeholder: 'e.g., LX, SE, XLT',
            section: 'Vehicle Information',
          },
          // Section 2: Location & Driver Information
          {
            id: 'zipCode',
            label: 'Zip Code',
            type: 'text',
            placeholder: 'e.g., 90210',
            section: 'Location & Driver Information',
          },
          {
            id: 'age',
            label: 'Age',
            type: 'text',
            placeholder: 'e.g., 30',
            section: 'Location & Driver Information',
          },
          {
            id: 'yearsDriving',
            label: 'Years Driving',
            type: 'text',
            placeholder: 'e.g., 10',
            section: 'Location & Driver Information',
          },
          {
            id: 'accidentsTickets',
            label: 'Accidents/Tickets (Last 3 Years)',
            type: 'select',
            placeholder: 'Select number',
            section: 'Location & Driver Information',
            options: [
              { value: '0', label: '0' },
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3+', label: '3+' },
            ],
          },
          // Section 3: Vehicle Usage
          {
            id: 'ownershipStatus',
            label: 'Ownership Status',
            type: 'select',
            placeholder: 'Select status',
            section: 'Vehicle Usage',
            options: [
              { value: 'owned', label: 'Owned' },
              { value: 'financed', label: 'Financed' },
              { value: 'leased', label: 'Leased' },
            ],
          },
          {
            id: 'dailyUsage',
            label: 'Daily Usage',
            type: 'select',
            placeholder: 'Select usage',
            section: 'Vehicle Usage',
            options: [
              { value: 'commute', label: 'Commute' },
              { value: 'business', label: 'Business' },
              { value: 'pleasure', label: 'Pleasure' },
              { value: 'other', label: 'Other' },
            ],
          },
          {
            id: 'annualMiles',
            label: 'Annual Miles',
            type: 'select',
            placeholder: 'Select mileage',
            section: 'Vehicle Usage',
            options: [
              { value: '0-5k', label: '0-5,000' },
              { value: '5k-10k', label: '5,000-10,000' },
              { value: '10k-15k', label: '10,000-15,000' },
              { value: '15k+', label: '15,000+' },
            ],
          },
          {
            id: 'coverage',
            label: 'Coverage Level',
            type: 'select',
            placeholder: 'Select coverage',
            section: 'Vehicle Usage',
            options: [
              { value: 'minimum', label: 'Minimum (State Required)' },
              { value: 'standard', label: 'Standard Coverage' },
              { value: 'full', label: 'Full Coverage' },
              { value: 'premium', label: 'Premium Coverage' },
            ],
          },
        ];
      } else if (slug === 'renters-insurance') {
        // Full form matching Figma: ZIP, Personal Property Value, Deductible, Liability, Residence Type, Security, Sprinklers, Pets
        searchFields = [
          { id: 'zipCode', label: 'ZIP Code', type: 'text', placeholder: 'e.g., 90210' },
          {
            id: 'personalPropertyValue',
            label: 'Personal Property Value',
            type: 'select',
            placeholder: 'Select coverage amount',
            options: [
              { value: '15k', label: '$15,000' },
              { value: '25k', label: '$25,000' },
              { value: '50k', label: '$50,000' },
              { value: '75k', label: '$75,000' },
              { value: '100k', label: '$100,000' },
            ],
          },
          {
            id: 'deductible',
            label: 'Deductible',
            type: 'select',
            placeholder: 'Select deductible',
            options: [
              { value: '250', label: '$250' },
              { value: '500', label: '$500' },
              { value: '1000', label: '$1,000' },
              { value: '2500', label: '$2,500' },
            ],
          },
          {
            id: 'liabilityCoverage',
            label: 'Liability Coverage',
            type: 'select',
            placeholder: 'Select liability amount',
            options: [
              { value: '100k', label: '$100,000' },
              { value: '300k', label: '$300,000' },
              { value: '500k', label: '$500,000' },
            ],
          },
          {
            id: 'residenceType',
            label: 'Residence Type',
            type: 'select',
            placeholder: 'Select type',
            options: [
              { value: 'apartment', label: 'Apartment' },
              { value: 'condo', label: 'Condo' },
              { value: 'house', label: 'House' },
              { value: 'studio', label: 'Studio' },
            ],
          },
          {
            id: 'securitySystem',
            label: 'Security System?',
            type: 'select',
            placeholder: 'Select',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
          },
          {
            id: 'fireSprinklers',
            label: 'Fire Sprinklers?',
            type: 'select',
            placeholder: 'Select',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
          },
          {
            id: 'pets',
            label: 'Do You Have Pets?',
            type: 'select',
            placeholder: 'Select',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
          },
        ];
      } else if (slug === 'tires') {
        // Tires uses custom fields matching Figma design: Year, Make, Model (required), Tire Size (optional), Zip Code (required)
        searchFields.push(
          {
            id: 'year',
            label: 'Year *',
            type: 'text',
            placeholder: 'e.g., 2020',
          },
          {
            id: 'make',
            label: 'Make *',
            type: 'text',
            placeholder: 'e.g., Toyota',
          },
          {
            id: 'model',
            label: 'Model *',
            type: 'text',
            placeholder: 'e.g., RAV4',
          },
          {
            id: 'tireSize',
            label: 'Tire Size (Optional)',
            type: 'text',
            placeholder: 'e.g., P225/65R17',
          },
          {
            id: 'zipCode',
            label: 'Zip Code *',
            type: 'text',
            placeholder: 'e.g., 90210',
          }
        );
      } else if (slug === 'mattresses') {
        searchFields.push({
          id: 'size',
          label: 'Mattress Size',
          type: 'select',
          options: [
            { value: 'twin', label: 'Twin' },
            { value: 'full', label: 'Full' },
            { value: 'queen', label: 'Queen' },
            { value: 'king', label: 'King' },
          ],
        });
      } else if (slug === 'oil-changes') {
        searchFields.push({
          id: 'vehicleType',
          label: 'Vehicle Type',
          type: 'select',
          options: [
            { value: 'sedan', label: 'Sedan' },
            { value: 'suv', label: 'SUV' },
            { value: 'truck', label: 'Truck' },
            { value: 'luxury', label: 'Luxury' },
          ],
        });
      } else if (slug === 'car-washes') {
        searchFields.push({
          id: 'serviceType',
          label: 'Service Type',
          type: 'select',
          options: [
            { value: 'basic', label: 'Basic Wash' },
            { value: 'deluxe', label: 'Deluxe Wash' },
            { value: 'full', label: 'Full Service' },
          ],
        });
      } else if (slug === 'nail-salons') {
        searchFields = [
          { id: 'zipCode', label: 'ZIP Code', type: 'text', placeholder: 'Enter ZIP code' },
          {
            id: 'serviceType',
            label: 'Service Type',
            type: 'select',
            placeholder: 'Select service',
            options: [
              { value: 'manicure', label: 'Manicure' },
              { value: 'pedicure', label: 'Pedicure' },
              { value: 'both', label: 'Manicure + Pedicure' },
              { value: 'gel', label: 'Gel Manicure' },
              { value: 'acrylic', label: 'Acrylic Nails' },
            ],
          },
          {
            id: 'duration',
            label: 'Duration',
            type: 'select',
            placeholder: 'Select duration',
            options: [
              { value: '30min', label: '30 minutes' },
              { value: '45min', label: '45 minutes' },
              { value: '60min', label: '60 minutes' },
              { value: '90min', label: '90 minutes' },
            ],
          },
        ];
      } else if (slug === 'rental-cars') {
        searchFields = [
          { id: 'location', label: 'Pickup Location', type: 'text', placeholder: 'Enter city or airport' },
          { id: 'dates', label: 'Rental Dates', type: 'text', placeholder: 'Select dates' },
          {
            id: 'carType',
            label: 'Car Type',
            type: 'select',
            options: [
              { value: 'economy', label: 'Economy' },
              { value: 'compact', label: 'Compact' },
              { value: 'suv', label: 'SUV' },
              { value: 'luxury', label: 'Luxury' },
            ],
          },
        ];
      } else if (slug === 'moving') {
        searchFields = [
          { id: 'distance', label: 'Distance (miles)', type: 'text', placeholder: 'e.g., 50' },
          {
            id: 'homeSize',
            label: 'Home Size',
            type: 'select',
            placeholder: 'Select size',
            options: [
              { value: 'studio', label: 'Studio' },
              { value: '1br', label: '1 Bedroom' },
              { value: '2br', label: '2 Bedroom' },
              { value: '3br', label: '3 Bedroom' },
              { value: '4br', label: '4+ Bedroom' },
              { value: 'house-small', label: 'Small House' },
              { value: 'house-medium', label: 'Medium House' },
              { value: 'house-large', label: 'Large House' },
            ],
          },
          { id: 'fromZip', label: 'From ZIP', type: 'text', placeholder: 'e.g., 90210' },
          { id: 'toZip', label: 'To ZIP', type: 'text', placeholder: 'e.g., 10001' },
        ];
      } else if (slug === 'hotels') {
        searchFields = [
          { id: 'location', label: 'Location', type: 'text', placeholder: 'Enter city or address' },
          { id: 'checkIn', label: 'Check-in Date', type: 'text', placeholder: 'Select date' },
          { id: 'checkOut', label: 'Check-out Date', type: 'text', placeholder: 'Select date' },
          {
            id: 'guests',
            label: 'Guests',
            type: 'select',
            options: [
              { value: '1', label: '1 Guest' },
              { value: '2', label: '2 Guests' },
              { value: '3', label: '3 Guests' },
              { value: '4+', label: '4+ Guests' },
            ],
          },
        ];
      } else if (slug === 'airfare') {
        searchFields = [
          { id: 'origin', label: 'Origin', type: 'text', placeholder: 'Departure city/airport' },
          { id: 'destination', label: 'Destination', type: 'text', placeholder: 'Arrival city/airport' },
          { id: 'departDate', label: 'Departure Date', type: 'text', placeholder: 'Select date' },
          { id: 'returnDate', label: 'Return Date', type: 'text', placeholder: 'Select date (optional)' },
          {
            id: 'passengers',
            label: 'Passengers',
            type: 'select',
            options: [
              { value: '1', label: '1 Passenger' },
              { value: '2', label: '2 Passengers' },
              { value: '3', label: '3 Passengers' },
              { value: '4+', label: '4+ Passengers' },
            ],
          },
        ];
      } else if (slug === 'storage') {
        searchFields.push({
          id: 'unitSize',
          label: 'Unit Size',
          type: 'select',
          options: [
            { value: '5x5', label: '5x5 (25 sq ft)' },
            { value: '5x10', label: '5x10 (50 sq ft)' },
            { value: '10x10', label: '10x10 (100 sq ft)' },
            { value: '10x20', label: '10x20 (200 sq ft)' },
            { value: '10x30', label: '10x30 (300 sq ft)' },
          ],
        });
      } else if (slug === 'meal-kits') {
        searchFields.push({
          id: 'mealType',
          label: 'Meal Type',
          type: 'select',
          options: [
            { value: 'vegetarian', label: 'Vegetarian' },
            { value: 'meat', label: 'Meat & Fish' },
            { value: 'vegan', label: 'Vegan' },
            { value: 'family', label: 'Family-Friendly' },
          ],
        });
      }
      
      // Define table columns based on category
      let tableColumns: Array<{ id: string; label: string }> | undefined;
      
      if (slug === 'gas-stations') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'station', label: 'Station' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price' },
          { id: 'distance', label: 'Distance' },
        ];
      } else if (slug === 'gym') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'gym', label: 'Gym' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price/Month' },
          { id: 'distance', label: 'Distance' },
        ];
      } else if (slug === 'car-insurance' || slug === 'renters-insurance') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'company', label: 'Company' },
          { id: 'price', label: 'Price/Month' },
          { id: 'coverage', label: 'Coverage' },
        ];
      } else if (slug === 'tires' || slug === 'oil-changes') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'shop', label: 'Shop' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price' },
          { id: 'distance', label: 'Distance' },
        ];
      } else if (slug === 'mattresses') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'store', label: 'Store' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price' },
          { id: 'distance', label: 'Distance' },
        ];
      } else if (slug === 'car-washes') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'location', label: 'Location' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price' },
          { id: 'distance', label: 'Distance' },
        ];
      } else if (slug === 'rental-cars') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'company', label: 'Company' },
          { id: 'price', label: 'Price/Day' },
          { id: 'dates', label: 'Dates' },
        ];
      } else if (slug === 'hotels') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'hotel', label: 'Hotel' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price/Night' },
          { id: 'rating', label: 'Rating' },
        ];
      } else if (slug === 'airfare') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'airline', label: 'Airline' },
          { id: 'price', label: 'Price' },
          { id: 'times', label: 'Times' },
        ];
      } else if (slug === 'storage') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'facility', label: 'Facility' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price/Month' },
          { id: 'size', label: 'Size' },
        ];
      } else if (slug === 'meal-kits') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'service', label: 'Service' },
          { id: 'price', label: 'Price/Week' },
          { id: 'meals', label: 'Meals/Week' },
        ];
      } else if (slug === 'nail-salons') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'salon', label: 'Salon' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price' },
          { id: 'distance', label: 'Distance' },
        ];
      } else if (slug === 'moving') {
        tableColumns = [
          { id: 'rank', label: 'Rank' },
          { id: 'company', label: 'Company' },
          { id: 'address', label: 'Address' },
          { id: 'price', label: 'Price' },
          { id: 'distance', label: 'Distance' },
        ];
      }
      
      // Renters Insurance: Figma content (Did you know?, tips, Ready to Save, providers)
      const rentersDidYouKnow = slug === 'renters-insurance'
        ? {
            title: 'Did you know?',
            body: '95% of renters are underinsured or have no coverage at all. Renters insurance typically costs only $15-30/month and protects your belongings, liability, and temporary housing costs.',
          }
        : undefined;
      const rentersTips = slug === 'renters-insurance'
        ? [
            'Bundle with auto insurance for 15-25% discount on both policies',
            'Increase your deductible to lower monthly premiums (if you have emergency savings)',
            'Install security systems, smoke detectors, and deadbolts for safety discounts',
            'Pay annually instead of monthly to save on processing fees (typically 5-10%)',
            'Ask about discounts for being claims-free, military/student status, or professional affiliations',
            'Document your belongings with photos/videos for easier claims and accurate coverage',
            "Review coverage annually - don't over-insure if you've downsized or sold items",
          ]
        : undefined;
      const rentersProviders = slug === 'renters-insurance'
        ? ['Lemonade', 'State Farm', 'GEICO', 'Progressive', 'USAA', '+5 more']
        : undefined;
      
      // Nail Salons: Add-ons section
      const nailAddOns = slug === 'nail-salons'
        ? [
            { id: 'cuticle-care', label: 'Cuticle Care', price: '+$5' },
            { id: 'paraffin-treatment', label: 'Paraffin Treatment', price: '+$10' },
            { id: 'hand-foot-massage', label: 'Hand/Foot Massage', price: '+$8' },
            { id: 'polish-change', label: 'Polish Change', price: '+$12' },
            { id: 'nail-art', label: 'Nail Art', price: '+$15' },
            { id: 'french-tips', label: 'French Tips', price: '+$10' },
            { id: 'gel-removal', label: 'Gel Removal', price: '+$10' },
          ]
        : undefined;
      
      // Gym: Amenities section (checkboxes without prices)
      const gymAmenities = slug === 'gym'
        ? [
            { id: 'basketball-court', label: 'Basketball Court', price: '' },
            { id: 'rock-climbing', label: 'Rock Climbing', price: '' },
            { id: 'cafe-juice-bar', label: 'Cafe/Juice Bar', price: '' },
            { id: 'showers-lockers', label: 'Showers/Lockers', price: '' },
          ]
        : undefined;
      
      // Moving: Tip section
      const movingTip = slug === 'moving'
        ? {
            title: 'Tip: Book 4-6 weeks in advance',
            body: 'Summer months (May-Sept) are peak season with higher prices.',
          }
        : undefined;

      try {
        return (
          <PatternBLayout
            categorySlug={slug || ''}
            categoryName={categoryData?.name || 'Category'}
            categoryDescription={categoryData?.description || ''}
            categoryIcon={categoryData?.icon || 'cube'}
            iconGradient={iconGradient || ['#3B82F6', '#8B5CF6']}
            searchFields={searchFields}
            tableColumns={tableColumns}
            didYouKnow={rentersDidYouKnow}
            moneySavingTips={rentersTips}
            readyToSaveLabel={slug === 'renters-insurance' ? 'Ready to Save?' : undefined}
            providerTags={rentersProviders}
            formTitle={slug === 'renters-insurance' ? 'Get Your Quotes' : slug === 'car-insurance' ? 'Get Your Personalized Quotes' : slug === 'moving' ? 'Get Moving Quotes' : undefined}
            searchButtonLabel={slug === 'renters-insurance' ? 'Get Quotes' : slug === 'car-insurance' ? 'Get Personalized Quotes' : slug === 'nail-salons' ? 'Compare Prices' : slug === 'gym' ? 'Compare Memberships' : slug === 'moving' ? 'Compare Quotes' : undefined}
            searchButtonIcon={slug === 'nail-salons' || slug === 'gym' ? 'star' : slug === 'moving' ? 'search' : undefined}
            showResetButton={slug === 'renters-insurance' || slug === 'car-insurance' || slug === 'moving'}
            heroBadge={slug === 'renters-insurance' ? 'Plus Exclusive' : undefined}
            formHeaderIcon={slug === 'car-insurance' ? 'shield' : slug === 'moving' ? 'car' : undefined}
            addOns={nailAddOns || gymAmenities}
            addOnsTitle={slug === 'gym' ? 'Amenities' : undefined}
            tip={movingTip}
          />
        );
      } catch (renderError) {
        console.error('❌ Error rendering PatternBLayout:', renderError);
        return <ErrorDisplay error={renderError as Error} componentName="PatternBLayout" />;
      }
    } else if (pattern === 'C') {
      // Special case: Apartments uses custom layout matching Figma design
      if (slug === 'apartments') {
        if (!ApartmentsLayout) {
          const errorMsg = `ApartmentsLayout is undefined! Type: ${typeof ApartmentsLayout}`;
          console.error('❌', errorMsg);
          return <ErrorDisplay error={errorMsg} componentName="ApartmentsLayout" />;
        }
        
        try {
          return (
            <ApartmentsLayout
              categorySlug={slug || ''}
              categoryName={categoryData?.name || 'Apartments'}
              categoryDescription={categoryData?.description || 'Compare apartment rental prices and amenities'}
              categoryIcon={categoryData?.icon || 'building'}
              iconGradient={iconGradient || ['#8B5CF6', '#7C3AED']}
            />
          );
        } catch (renderError) {
          console.error('❌ Error rendering ApartmentsLayout:', renderError);
          return <ErrorDisplay error={renderError as Error} componentName="ApartmentsLayout" />;
        }
      }

      // Special case: Food Delivery uses custom layout matching Figma design
      if (slug === 'food-delivery') {
        if (!FoodDeliveryLayout) {
          const errorMsg = `FoodDeliveryLayout is undefined! Type: ${typeof FoodDeliveryLayout}`;
          console.error('❌', errorMsg);
          return <ErrorDisplay error={errorMsg} componentName="FoodDeliveryLayout" />;
        }
        
        try {
          return (
            <FoodDeliveryLayout
              categorySlug={slug || ''}
              categoryName={categoryData?.name || 'Food Delivery'}
              categoryDescription={categoryData?.description || 'Compare delivery prices on Uber Eats, DoorDash & more'}
              categoryIcon={categoryData?.icon || 'utensils'}
              iconGradient={iconGradient || ['#F97316', '#EC4899']}
            />
          );
        } catch (renderError) {
          console.error('❌ Error rendering FoodDeliveryLayout:', renderError);
          return <ErrorDisplay error={renderError as Error} componentName="FoodDeliveryLayout" />;
        }
      }

      // Special case: Massage uses custom layout matching Figma design
      if (slug === 'massage') {
        if (!MassageLayout) {
          const errorMsg = `MassageLayout is undefined! Type: ${typeof MassageLayout}`;
          console.error('❌', errorMsg);
          return <ErrorDisplay error={errorMsg} componentName="MassageLayout" />;
        }
        
        try {
          return (
            <MassageLayout
              categorySlug={slug || ''}
              categoryName={categoryData?.name || 'Massage Parlors'}
              categoryDescription={categoryData?.description || 'Compare massage services and prices near you'}
              categoryIcon={categoryData?.icon || 'heart'}
              iconGradient={iconGradient || ['#EC4899', '#F97316']}
            />
          );
        } catch (renderError) {
          console.error('❌ Error rendering MassageLayout:', renderError);
          return <ErrorDisplay error={renderError as Error} componentName="MassageLayout" />;
        }
      }

      // Special case: Spa uses custom layout matching Figma design
      if (slug === 'spa') {
        if (!SpaLayout) {
          const errorMsg = `SpaLayout is undefined! Type: ${typeof SpaLayout}`;
          console.error('❌', errorMsg);
          return <ErrorDisplay error={errorMsg} componentName="SpaLayout" />;
        }
        
        try {
          return (
            <SpaLayout
              categorySlug={slug || ''}
              categoryName={categoryData?.name || 'Spa Services'}
              categoryDescription={categoryData?.description || 'Compare spa services and treatment prices'}
              categoryIcon={categoryData?.icon || 'sparkles'}
              iconGradient={iconGradient || ['#EC4899', '#F97316']}
            />
          );
        } catch (renderError) {
          console.error('❌ Error rendering SpaLayout:', renderError);
          return <ErrorDisplay error={renderError as Error} componentName="SpaLayout" />;
        }
      }

      // Pattern C: Service Listings
      // Pattern C doesn't need backend data initially, so don't wait for it
      if (!PatternCLayout) {
        const errorMsg = `PatternCLayout is undefined! Type: ${typeof PatternCLayout}`;
        console.error('❌', errorMsg);
        return <ErrorDisplay error={errorMsg} componentName="PatternCLayout" />;
      }
      
      // Define service types based on category
      let serviceTypes: Array<{ id: string; name: string; emoji?: string }> = [];
      
      if (slug === 'haircuts') {
        serviceTypes = [
          { id: 'mens', name: "Men's Haircut", emoji: '👨' },
          { id: 'womens', name: "Women's Haircut", emoji: '👩' },
          { id: 'kids', name: "Kid's Haircut", emoji: '👶' },
        ];
      } else if (slug === 'nail-salons') {
        serviceTypes = [
          { id: 'manicure', name: 'Manicure', emoji: '💅' },
          { id: 'pedicure', name: 'Pedicure', emoji: '🦶' },
          { id: 'both', name: 'Manicure + Pedicure', emoji: '✨' },
        ];
      } else if (slug === 'moving') {
        serviceTypes = [
          { id: 'local', name: 'Local Move', emoji: '🚚' },
          { id: 'long', name: 'Long Distance', emoji: '🚛' },
          { id: 'packing', name: 'Packing Service', emoji: '📦' },
        ];
      } else if (slug === 'services') {
        serviceTypes = [
          { id: 'cleaning', name: 'Cleaning', emoji: '🧹' },
          { id: 'plumbing', name: 'Plumbing', emoji: '🔧' },
          { id: 'electrical', name: 'Electrical', emoji: '⚡' },
        ];
      } else {
        // Default service types
        serviceTypes = [
          { id: 'basic', name: 'Basic Service', emoji: '⭐' },
          { id: 'premium', name: 'Premium Service', emoji: '✨' },
        ];
      }

      try {
        return (
          <PatternCLayout
            categorySlug={slug || ''}
            categoryName={categoryData?.name || 'Category'}
            categoryDescription={categoryData?.description || ''}
            categoryIcon={categoryData?.icon || 'cube'}
            iconGradient={iconGradient || ['#3B82F6', '#8B5CF6']}
            serviceTypes={serviceTypes || []}
            defaultServiceType={serviceTypes[0]?.id}
          />
        );
      } catch (renderError) {
        console.error('❌ Error rendering PatternCLayout:', renderError);
        return <ErrorDisplay error={renderError as Error} componentName="PatternCLayout" />;
      }
    }
  } catch (error) {
    console.error('❌ FATAL ERROR in CategoryScreen render:', error);
    // CRITICAL: Don't let errors cause navigation - show error on page
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <AppHeader />
        <ErrorDisplay error={error as Error} componentName="CategoryScreen" />
      </SafeAreaView>
    );
  }

  // Fallback (should never reach here)
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18 }}>
          Pattern not configured for {categoryData.name}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Wrap CategoryScreenContent in Error Boundary
export default function CategoryScreen() {
  return (
    <CategoryErrorBoundary>
      <CategoryScreenContent />
    </CategoryErrorBoundary>
  );
}

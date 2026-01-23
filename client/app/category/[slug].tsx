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
import React, { useMemo, useState, useEffect } from 'react';
import { CATEGORIES, CATEGORY_LIST } from '@/constants/categories';
import { getCategoryPattern } from '@/constants/categoryPatterns';
import PatternALayout from '@/components/category/PatternALayout';
import PatternBLayout from '@/components/category/PatternBLayout';
import PatternCLayout from '@/components/category/PatternCLayout';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { getIconName } from '@/utils/iconMapper';
import { SAMPLE_PRODUCTS } from '@/constants/groceryData';
import { SAMPLE_ELECTRONICS_PRODUCTS } from '@/constants/electronicsData';
import { generateSampleProducts } from '@/utils/generateSampleProducts';
import { fetchCategoryStores, fetchCategoryProducts, fetchSubcategoryCounts } from '@/services/categoryService';

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
    '#EC4899': ['#EC4899', '#DB2777'], // pink
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
      return <ErrorDisplay error={this.state.error} componentName="CategoryScreen (Error Boundary)" />;
    }
    return this.props.children;
  }
}

function CategoryScreenContent() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [renderError, setRenderError] = useState<{ error: Error | string; component: string } | null>(null);
  
  
  // State for backend data
  const [backendStores, setBackendStores] = useState<string[]>([]);
  const [backendProducts, setBackendProducts] = useState<any[]>([]);
  const [subcategoryCounts, setSubcategoryCounts] = useState<Record<string, number>>({});
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  
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
  
  // Fetch stores and products from backend when category changes
  useEffect(() => {
    if (!slug || !categoryData) return;
    
    setIsLoadingBackend(true);
    setBackendError(null);
    
    // Set a maximum loading time - if backend doesn't respond in 8 seconds, show page anyway
    const maxLoadingTimeout = setTimeout(() => {
      console.warn(`⏱️ Backend fetch timeout for ${slug}, showing page with fallback data`);
      setIsLoadingBackend(false);
    }, 8000);
    
    // Fetch data from backend (stores, products, and subcategory counts)
    Promise.all([
      fetchCategoryStores(slug),
      fetchCategoryProducts(slug, 6),
      fetchSubcategoryCounts(slug),
    ])
      .then(([stores, products, counts]) => {
        clearTimeout(maxLoadingTimeout);
        
        // Format stores: ['All Stores', ...store names]
        // Filter out any undefined/null stores
        const formattedStores = stores.length > 0
          ? ['All Stores', ...stores.filter(s => s && s.name).map(s => s.name)]
          : [];
        
        setBackendStores(formattedStores);
        setBackendProducts(products);
        setSubcategoryCounts(counts || {});
        setIsLoadingBackend(false);
      })
      .catch((error) => {
        clearTimeout(maxLoadingTimeout);
        
        // Silently handle network errors - app will use fallback data
        // Only log if it's not a network error (which is expected when backend is offline)
        if (error?.name !== 'AbortError' && error?.message && !error.message.includes('Network request failed') && !error.message.includes('aborted')) {
          console.error('Error fetching category data from backend:', error);
        }
        setBackendError(error.message);
        setBackendStores([]);
        setBackendProducts([]);
        setIsLoadingBackend(false);
      });
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
  const defaultProducts = useMemo(() => {
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
  }, [backendProducts, slug, pattern, categoryData?.id, categoryData?.name, categoryData?.stores, stores, useSampleData]);

  // Show loading state while fetching from backend (with timeout)
  // Only show loading for Pattern A, Pattern B and C don't need backend data initially
  if (isLoadingBackend && pattern === 'A') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <AppHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
            Loading {categoryData.name}...
          </Text>
          <Text style={{ color: '#64748b', marginTop: 8, fontSize: 12 }}>
            Using fallback data if backend unavailable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
      
      if (!IconComponent || stores === undefined || defaultProducts === undefined) {
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
      const safeStores = Array.isArray(stores) ? stores.filter(Boolean) : ['All Stores'];
      const safeSubcategories = Array.isArray(mappedSubcategories) ? mappedSubcategories.filter(Boolean) : [];
      const safeProducts = Array.isArray(defaultProducts) ? defaultProducts.filter(Boolean) : [];
      
      
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
        />
      );
    } else if (pattern === 'B') {
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
        searchFields.push(
          {
            id: 'carType',
            label: 'Car Type',
            type: 'select',
            options: [
              { value: 'sedan', label: 'Sedan' },
              { value: 'suv', label: 'SUV' },
              { value: 'truck', label: 'Truck' },
              { value: 'coupe', label: 'Coupe' },
            ],
          },
          {
            id: 'coverage',
            label: 'Coverage Level',
            type: 'select',
            options: [
              { value: 'liability', label: 'Liability Only' },
              { value: 'full', label: 'Full Coverage' },
              { value: 'comprehensive', label: 'Comprehensive' },
            ],
          }
        );
      } else if (slug === 'renters-insurance') {
        searchFields.push({
          id: 'apartmentSize',
          label: 'Apartment Size',
          type: 'select',
          options: [
            { value: 'studio', label: 'Studio' },
            { value: '1br', label: '1 Bedroom' },
            { value: '2br', label: '2 Bedroom' },
            { value: '3br', label: '3+ Bedroom' },
          ],
        });
      } else if (slug === 'tires') {
        searchFields.push(
          {
            id: 'tireSize',
            label: 'Tire Size',
            type: 'text',
            placeholder: 'e.g., 205/55R16',
          },
          {
            id: 'vehicle',
            label: 'Vehicle Type',
            type: 'select',
            options: [
              { value: 'sedan', label: 'Sedan' },
              { value: 'suv', label: 'SUV' },
              { value: 'truck', label: 'Truck' },
            ],
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
      }
      
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
          />
        );
      } catch (renderError) {
        console.error('❌ Error rendering PatternBLayout:', renderError);
        return <ErrorDisplay error={renderError as Error} componentName="PatternBLayout" />;
      }
    } else if (pattern === 'C') {
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
      } else if (slug === 'massage' || slug === 'spa') {
        serviceTypes = [
          { id: 'swedish', name: 'Swedish Massage', emoji: '💆' },
          { id: 'deep', name: 'Deep Tissue', emoji: '💪' },
          { id: 'hot', name: 'Hot Stone', emoji: '🔥' },
        ];
      } else if (slug === 'nail-salons') {
        serviceTypes = [
          { id: 'manicure', name: 'Manicure', emoji: '💅' },
          { id: 'pedicure', name: 'Pedicure', emoji: '🦶' },
          { id: 'both', name: 'Manicure + Pedicure', emoji: '✨' },
        ];
      } else if (slug === 'apartments') {
        serviceTypes = [
          { id: 'studio', name: 'Studio', emoji: '🏠' },
          { id: '1br', name: '1 Bedroom', emoji: '🏡' },
          { id: '2br', name: '2 Bedroom', emoji: '🏘️' },
          { id: '3br', name: '3+ Bedroom', emoji: '🏛️' },
        ];
      } else if (slug === 'moving') {
        serviceTypes = [
          { id: 'local', name: 'Local Move', emoji: '🚚' },
          { id: 'long', name: 'Long Distance', emoji: '🚛' },
          { id: 'packing', name: 'Packing Service', emoji: '📦' },
        ];
      } else if (slug === 'food-delivery') {
        serviceTypes = [
          { id: 'restaurant', name: 'Restaurant', emoji: '🍔' },
          { id: 'grocery', name: 'Grocery', emoji: '🛒' },
          { id: 'alcohol', name: 'Alcohol', emoji: '🍷' },
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
    return <ErrorDisplay error={error as Error} componentName="CategoryScreen" />;
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

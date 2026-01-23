/**
 * Product Comparison Page Route
 * Route: /category/[slug]/[productSlug]/compare
 * 
 * This page shows store prices for a single product.
 * Fetches product data from backend and displays comparison.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductComparisonPage from '@/components/ProductComparisonPage';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import { transformCompareResponse } from '@/utils/apiTransform';

export default function ProductCompareScreen() {
  const { slug, productSlug, productId } = useLocalSearchParams<{ 
    slug: string; 
    productSlug: string; 
    productId?: string;
  }>();
  const router = useRouter();
  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !productSlug) {
      setError('Missing category or product slug');
      setIsLoading(false);
      return;
    }

    // Convert product slug back to search query
    // e.g., "iphone-15" -> "iPhone 15"
    const searchQuery = productSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Fetch product data from backend
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Priority 1: If product ID is provided, fetch directly by ID (FAST - no API calls)
        if (productId) {
          console.log('🔍 Fetching product by ID:', productId);
          try {
            const productResponse = await fetch(`${API_BASE_URL}/products/${productId}`);
            if (productResponse.ok) {
              const productData = await productResponse.json();
              console.log('✅ Found product by ID:', productData.name);
              
              // CRITICAL: Always fetch multi-store prices for "View Price" to get 20+ stores
              // Database might only have 1-2 stores (from initial search), but user expects 20+ stores
              // Fetch multi-store prices using actual product name
              const actualProductName = productData.name;
              console.log('🔍 Product found in database with', productData.prices?.length || 0, 'stores');
              console.log('🔍 Fetching multi-store prices for comprehensive comparison:', actualProductName);
              
              // Always fetch multi-store prices to ensure 20+ stores
              const searchUrl = `${API_ENDPOINTS.products.compareMultiStore(actualProductName, 'auto')}&categoryId=${encodeURIComponent(productData.category?.id || '')}`;
              console.log('🔍 Fetching multi-store prices from:', searchUrl);
              
              try {
                const multiStoreResponse = await fetch(searchUrl);
                if (multiStoreResponse.ok) {
                  const multiStoreData = await multiStoreResponse.json();
                  console.log('📦 Multi-store data received:', {
                    hasProduct: !!multiStoreData.product,
                    pricesCount: multiStoreData.prices?.length || 0,
                    stores: multiStoreData.prices?.slice(0, 5).map((p: any) => p.store?.name),
                  });
                  
                  if (multiStoreData.product && multiStoreData.prices && multiStoreData.prices.length > 0) {
                    const transformedProduct = transformCompareResponse(multiStoreData);
                    if (transformedProduct) {
                      console.log(`✅ Using multi-store data: ${transformedProduct.storePrices?.length || 0} stores`);
                      setProductData(transformedProduct);
                      return;
                    }
                  }
                }
              } catch (multiStoreError: any) {
                console.warn('⚠️ Multi-store fetch failed, using database prices:', multiStoreError.message);
              }
              
              // Fallback: Use database prices if multi-store fetch failed
              if (productData.prices && productData.prices.length > 0) {
                console.log(`⚠️ Using database prices (${productData.prices.length} stores) - multi-store fetch may have failed`);
                // Convert findOne response format to compareMultiStore format
                const prices = (productData.prices || []).map((price: any, index: number) => ({
                  rank: index + 1,
                  store: {
                    name: price.store?.name || 'Unknown Store',
                    logo: price.store?.logo,
                    url: price.store?.websiteUrl,
                  },
                  price: Number(price.price) || 0,
                  totalPrice: Number(price.price) || 0,
                  shippingCost: price.shippingCost || 0,
                  savings: 0, // Will be calculated by transformCompareResponse
                  isBestPrice: index === 0, // First price is best (already sorted by price)
                  inStock: price.inStock !== false,
                  currency: 'USD',
                  productUrl: price.productUrl || price.url,
                }));
                
                // Transform the product data to match the expected format
                const transformedProduct = transformCompareResponse({
                  product: {
                    id: productData.id,
                    name: productData.name,
                    image: productData.image || productData.images?.[0],
                    barcode: productData.barcode,
                    category: productData.category ? {
                      id: productData.category.id,
                      name: productData.category.name,
                    } : null,
                  },
                  prices: prices,
                  metadata: {
                    totalStores: prices.length,
                    source: 'database',
                    lowestPrice: productData.lowestPrice,
                    highestPrice: productData.highestPrice,
                    maxSavings: productData.savings || 0,
                  },
                });
                
                if (transformedProduct) {
                  setProductData(transformedProduct);
                  return;
                }
              } else {
                // Product exists but has no prices - fetch multi-store prices using actual product name
                console.log('⚠️ Product found but no prices, fetching multi-store prices...');
                const actualProductName = productData.name;
                console.log('🔍 Using actual product name for multi-store search:', actualProductName);
                
                // Use actual product name instead of slug-converted name
                const searchUrl = `${API_ENDPOINTS.products.compareMultiStore(actualProductName, 'auto')}&categoryId=${encodeURIComponent(productData.category?.id || '')}`;
                console.log('🔍 Fetching multi-store prices from:', searchUrl);
                
                const multiStoreResponse = await fetch(searchUrl);
                if (multiStoreResponse.ok) {
                  const multiStoreData = await multiStoreResponse.json();
                  if (multiStoreData.product && multiStoreData.prices && multiStoreData.prices.length > 0) {
                    const transformedProduct = transformCompareResponse(multiStoreData);
                    if (transformedProduct) {
                      setProductData(transformedProduct);
                      return;
                    }
                  }
                }
                
                // If multi-store fetch failed, show product with no prices
                const transformedProduct = transformCompareResponse({
                  product: {
                    id: productData.id,
                    name: productData.name,
                    image: productData.image || productData.images?.[0],
                    barcode: productData.barcode,
                    category: productData.category ? {
                      id: productData.category.id,
                      name: productData.category.name,
                    } : null,
                  },
                  prices: [],
                  metadata: {
                    totalStores: 0,
                    source: 'database',
                    message: 'Product found but no prices available. Try searching for this product to fetch prices.',
                  },
                });
                
                if (transformedProduct) {
                  setProductData(transformedProduct);
                  return;
                }
              }
            } else if (productResponse.status === 404) {
              // Product ID not found - try searching by name
              console.warn('⚠️ Product not found by ID, falling back to name search');
            } else {
              throw new Error(`HTTP ${productResponse.status}: ${productResponse.statusText}`);
            }
          } catch (err: any) {
            console.warn('⚠️ Error fetching by ID:', err.message);
            // If productId was provided but fetch failed, don't fall back to name search
            // Show error instead
            if (productId) {
              throw new Error(`Failed to load product. The product may have been removed.`);
            }
            // Fall through to name search only if no productId was provided
          }
        }

        // Priority 2: Search by name (only if no productId was provided)
        console.log('🔍 Searching by product name:', searchQuery);

        // Get category ID from slug to improve search relevance
        let categoryIdParam = '';
        try {
          const categoryResponse = await fetch(`${API_ENDPOINTS.categories.bySlug(slug)}`);
          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            if (categoryData?.id) {
              categoryIdParam = `&categoryId=${encodeURIComponent(categoryData.id)}`;
              console.log('📋 Using category ID for search:', categoryData.id);
            }
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch category ID:', err);
        }

        const searchUrl = `${API_ENDPOINTS.products.compareMultiStore(searchQuery, 'auto')}${categoryIdParam}`;
        console.log('🔍 Fetching product data from:', searchUrl);
        console.log('🔍 Search query:', searchQuery);
        console.log('🔍 Category slug:', slug);

        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const storeNames = data.prices?.map((p: any) => p.store?.name || 'Unknown') || [];
        console.log('📦 Product data received:', {
          hasProduct: !!data.product,
          productName: data.product?.name,
          pricesCount: data.prices?.length || 0,
          stores: storeNames,
          metadata: data.metadata,
        });
        
        // CRITICAL: Log detailed price information
        console.log('🏪 DETAILED PRICE DATA:', {
          totalPrices: data.prices?.length || 0,
          prices: data.prices?.slice(0, 5).map((p: any) => ({
            store: p.store?.name,
            price: p.price,
            priceType: typeof p.price,
            isBestPrice: p.isBestPrice,
            inStock: p.inStock,
          })),
        });
        
        // Check if product was found
        // Backend returns { product, prices, metadata } - check for product and prices
        if (!data.product || !data.prices || data.prices.length === 0) {
          // Get user-friendly error message from metadata
          const errorMessage = data.metadata?.message || 
            `No products found for "${searchQuery}". Try searching for a specific product name instead of a category or genre.`;
          throw new Error(errorMessage);
        }
        
        // Log if only one store (Amazon) is returned
        if (data.prices && data.prices.length === 1) {
          console.warn('⚠️ Only one store found (likely Amazon only). SerpAPI may not have returned results.');
          console.warn('   Store:', storeNames[0]);
          console.warn('   This could mean:');
          console.warn('   1. Product is in database with only Amazon prices');
          console.warn('   2. SerpAPI search failed or returned no results');
          console.warn('   3. Multi-store scraping service not configured');
        } else if (data.prices && data.prices.length > 1) {
          console.log(`✅ Found ${data.prices.length} stores: ${storeNames.join(', ')}`);
        }

        const transformedProduct = transformCompareResponse(data);
        console.log('🔄 TRANSFORMED PRODUCT:', {
          hasProduct: !!transformedProduct,
          productName: transformedProduct?.name,
          storePricesCount: transformedProduct?.storePrices?.length || 0,
          storePrices: transformedProduct?.storePrices?.slice(0, 5).map((sp: any) => ({
            storeName: sp.storeName,
            price: sp.price,
            isBestDeal: sp.isBestDeal,
          })),
        });
        
        if (transformedProduct) {
          console.log(`✅ Setting product data with ${transformedProduct.storePrices?.length || 0} store prices`);
          setProductData(transformedProduct);
        } else {
          console.error('❌ transformCompareResponse returned null');
          throw new Error('Failed to transform product data');
        }
      } catch (err: any) {
        console.error('❌ Error fetching product data:', err);
        setError(err.message || 'Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [slug, productSlug]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={{ color: '#8b95a8', marginTop: 12, fontSize: 14 }}>
            Loading product comparison...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !productData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#ef4444', fontSize: 24, fontWeight: '700', marginBottom: 12 }}>
            Product Not Found
          </Text>
          <Text style={{ color: '#8b95a8', fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
            {error || 'Product not found'}
          </Text>
          
          <View style={{ gap: 12, width: '100%', maxWidth: 300 }}>
            <Text style={{ color: '#60a5fa', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              💡 Tips for better results:
            </Text>
            <Text style={{ color: '#8b95a8', fontSize: 13, textAlign: 'left', lineHeight: 20 }}>
              • Search for specific product names (e.g., "Steve Jobs Biography" instead of "Biography"){'\n'}
              • Include brand names when possible{'\n'}
              • Try different search terms or check spelling
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 32,
              backgroundColor: '#3B82F6',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate insights
  const storeCount = productData.storePrices?.length || 0;
  const prices = productData.storePrices?.map((sp: any) => 
    parseFloat(sp.price.replace('$', '')) || 0
  ) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const priceRange = maxPrice - minPrice;

  // CRITICAL: Log what we're passing to ProductComparisonPage
  console.log('📤 PASSING TO ProductComparisonPage:', {
    productName: productData.name,
    storePricesCount: productData.storePrices?.length || 0,
    storePrices: productData.storePrices?.slice(0, 5).map((sp: any) => ({
      storeName: sp.storeName,
      price: sp.price,
    })),
    minPrice,
    maxPrice,
    totalStores: storeCount,
  });

  return (
    <ProductComparisonPage
      productId={productData.id}
      productName={productData.name}
      productImage={productData.image}
      category={productData.category}
      categorySlug={slug || ''}
      storePrices={productData.storePrices || []}
      minPrice={minPrice}
      maxPrice={maxPrice}
      priceRange={priceRange}
      totalStores={storeCount}
    />
  );
}


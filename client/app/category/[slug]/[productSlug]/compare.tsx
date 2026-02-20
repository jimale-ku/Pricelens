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
import { priceDataCache, getProductImageForCompare, getProductImageForCompareByName } from '@/utils/priceDataCache';

/**
 * Generate fallback search queries when exact match fails
 * Example: "Playstation 5 Console Ghost Of Yotei Gold Limited Edition Bundle"
 * -> ["Playstation 5 Console", "Playstation 5", "PS5"]
 */
function generateFallbackQueries(fullQuery: string): string[] {
  const words = fullQuery.split(' ');
  const fallbacks: string[] = [];
  
  // Strategy 1: Take first 3-4 words (usually brand + model)
  if (words.length > 3) {
    fallbacks.push(words.slice(0, 3).join(' ')); // "Playstation 5 Console"
    fallbacks.push(words.slice(0, 2).join(' ')); // "Playstation 5"
  } else if (words.length > 2) {
    fallbacks.push(words.slice(0, 2).join(' ')); // "Playstation 5"
  }
  
  // Strategy 2: Try with proper capitalization for common tech terms
  // "Full Hd 1080p Led Smart Tv" -> "Full HD 1080p LED Smart TV"
  const properCaseQuery = fullQuery
    .replace(/\bHd\b/gi, 'HD')
    .replace(/\bLed\b/gi, 'LED')
    .replace(/\bTv\b/gi, 'TV')
    .replace(/\b4k\b/gi, '4K')
    .replace(/\b8k\b/gi, '8K')
    .replace(/\bUsb\b/gi, 'USB')
    .replace(/\bHdmi\b/gi, 'HDMI')
    .replace(/\bWifi\b/gi, 'WiFi');
  
  if (properCaseQuery !== fullQuery) {
    fallbacks.push(properCaseQuery);
  }
  
  // Strategy 3: Look for common abbreviations (PS5, iPhone, etc.)
  const lowerQuery = fullQuery.toLowerCase();
  if (lowerQuery.includes('playstation') && lowerQuery.includes('5')) {
    fallbacks.push('PS5');
  }
  if (lowerQuery.includes('playstation') && lowerQuery.includes('4')) {
    fallbacks.push('PS4');
  }
  if (lowerQuery.includes('xbox') && lowerQuery.includes('series')) {
    fallbacks.push('Xbox Series X');
  }
  if (lowerQuery.includes('iphone')) {
    // Extract iPhone model (e.g., "iPhone 15 Pro Max" -> "iPhone 15")
    const iphoneMatch = fullQuery.match(/iPhone\s+(\d+)/i);
    if (iphoneMatch) {
      fallbacks.push(`iPhone ${iphoneMatch[1]}`);
    }
  }
  
  // Strategy 4: For TV products, extract brand + model/size intelligently
  // IMPORTANT: For TVs, never use just the brand name (e.g., "Samsung") as it's too generic
  if (lowerQuery.includes('tv') || lowerQuery.includes('television') || lowerQuery.includes('class')) {
    // Extract brand (first word, usually)
    const brand = words[0];
    
    // PRIORITY: Try to extract model number FIRST (e.g., "U7900F", "QN85A", etc.)
    // Model numbers are usually alphanumeric codes like "U7900F", "QN85A", "X90K"
    // Pattern: Letter(s) followed by numbers, optionally followed by more letters/numbers
    const modelMatch = fullQuery.match(/\b([A-Z][A-Z0-9]*\d+[A-Z0-9]*)\b/);
    if (modelMatch && brand) {
      const model = modelMatch[1];
      // Model number is the most specific identifier - prioritize it
      fallbacks.unshift(`${brand} ${model}`); // Add to front (highest priority)
      fallbacks.unshift(`${brand} ${model} TV`);
      
      // Try to extract size in inches (e.g., "Samsung 43 Class" -> "43")
      const sizeMatch = fullQuery.match(/(\d+)\s*(?:class|inch|in|"|'|-inch)/i);
      if (sizeMatch) {
        const size = sizeMatch[1];
        // Combine brand + size + model (most specific)
        fallbacks.unshift(`${brand} ${size} ${model}`);
        fallbacks.unshift(`${brand} ${size} ${model} TV`);
        // Also add brand + size (without model)
        fallbacks.push(`${brand} ${size}`);
        fallbacks.push(`${brand} ${size} TV`);
      }
    } else {
      // No model number found - try size
      const sizeMatch = fullQuery.match(/(\d+)\s*(?:class|inch|in|"|'|-inch)/i);
      if (sizeMatch && brand) {
        const size = sizeMatch[1];
        fallbacks.push(`${brand} ${size}`);
        fallbacks.push(`${brand} ${size} TV`);
        fallbacks.push(`${brand} ${size} Class TV`);
      }
    }
    
    // For complex TV names like "Samsung Class Crystal UHD U7900F 4K Smart TV"
    // Include model number in the word-based fallbacks if found
    if (modelMatch) {
      const model = modelMatch[1];
      // Try brand + descriptors + model
      if (words.length >= 2) {
        const brandAndDescriptors = words.slice(0, Math.min(3, words.length)).join(' ');
        // Check if model is already in the first few words
        if (!brandAndDescriptors.includes(model)) {
          fallbacks.push(`${brandAndDescriptors} ${model}`);
        }
      }
    } else {
      // No model number - use first 3-4 words (brand + descriptors)
      if (words.length >= 3) {
        fallbacks.push(words.slice(0, 3).join(' ')); // "Samsung Class Crystal"
        if (words.length >= 4) {
          fallbacks.push(words.slice(0, 4).join(' ')); // "Samsung Class Crystal UHD"
        }
      }
    }
    
    // For TVs, DO NOT add just the brand name (e.g., "Samsung") as it's too generic
    // This prevents matching phones when searching for TVs
  } else if (words.length > 1) {
    // For non-TV products, brand alone is OK
    fallbacks.push(words[0]); // "Playstation" or "Vizio"
  }
  
  // Remove duplicates and empty strings
  return [...new Set(fallbacks.filter(q => q.trim().length > 0))];
}

export default function ProductCompareScreen() {
  const { slug, productSlug, productId, productName } = useLocalSearchParams<{ 
    slug: string; 
    productSlug: string; 
    productId?: string;
    productName?: string; // Actual product name from the card (more accurate than slug conversion)
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

    // Use actual product name if provided (more accurate), otherwise convert slug
    // Priority: productName (from card) > slug conversion
    const searchQuery = productName || productSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    console.log('🔍 Product lookup:', {
      productId: productId || 'not provided',
      productName: productName || 'not provided (will use slug conversion)',
      searchQuery: searchQuery,
      categorySlug: slug,
      productSlug: productSlug,
    });
    
    // Warn if productName is not provided (it should be passed from ProductCardSimple)
    if (!productName) {
      console.warn('⚠️ productName parameter not provided! Using slug conversion which may be inaccurate.');
      console.warn('   This can cause product mismatches. Ensure ProductCardSimple passes productName.');
    }

    // Fetch product data from backend
    const fetchProductData = async () => {
      try {
        setError(null);

        // 🚀 PRIORITY 0: Check cache FIRST (before setting loading state) - instant load!
        // Cache normalizes to lowercase, so try the search query (which will be normalized)
        if (priceDataCache.has(searchQuery)) {
          console.log(`⚡ Using cached price data for "${searchQuery}" - instant load!`);
          const cachedData = priceDataCache.get(searchQuery)!;
          
          // 🔍 CRITICAL VALIDATION: Ensure cached product matches what we clicked
          if (productName && cachedData.product) {
            const cachedName = (cachedData.product.name || '').toLowerCase();
            const expectedName = productName.toLowerCase();
            
            const cachedWords = cachedName.split(/\s+/).filter(w => w.length > 2);
            const expectedWords = expectedName.split(/\s+/).filter(w => w.length > 2);
            const sharedWords = expectedWords.filter(w => cachedWords.includes(w));
            
            const nameMatch = cachedName === expectedName || 
                            cachedName.includes(expectedName) || 
                            expectedName.includes(cachedName) ||
                            sharedWords.length >= Math.min(2, expectedWords.length / 2);
            
            if (!nameMatch) {
              console.warn(`⚠️ Cached product doesn't match! Expected "${productName}", got "${cachedData.product.name}"`);
              console.warn(`   Skipping cache and fetching fresh data...`);
              // Don't use cache, continue to fetch fresh data
            } else {
              console.log(`✅ Cached product validated: "${cachedData.product.name}" matches "${productName}"`);
              const transformedProduct = transformCompareResponse(cachedData);
              if (transformedProduct) {
                console.log(`✅ Loaded from cache: ${transformedProduct.storePrices?.length || 0} stores`);
                setProductData(transformedProduct);
                setIsLoading(false);
                return; // Instant return - no API call, no loading spinner!
              }
            }
          } else {
            // No productName to validate, or no product in cache - proceed normally
            const transformedProduct = transformCompareResponse(cachedData);
            if (transformedProduct) {
              console.log(`✅ Loaded from cache: ${transformedProduct.storePrices?.length || 0} stores`);
              setProductData(transformedProduct);
              setIsLoading(false);
              return; // Instant return - no API call, no loading spinner!
            }
          }
        }
        
        // Cache miss - set loading state and fetch from API
        setIsLoading(true);

        // Priority 1: If product ID is provided, fetch directly by ID (FAST - no API calls)
        // Note: SerpAPI product IDs (starting with "serpapi-") may not be in database yet
        if (productId) {
          console.log('🔍 Fetching product by ID:', productId);
          let productIdFound = false;
          try {
            const productResponse = await fetch(`${API_BASE_URL}/products/${productId}`);
            if (productResponse.ok) {
              productIdFound = true;
              const productData = await productResponse.json();
              console.log('✅ Found product by ID:', productData.name);
              
              // 🔍 CRITICAL VALIDATION: Check if the fetched product matches what was clicked
              if (productName) {
                const fetchedName = (productData.name || '').toLowerCase();
                const expectedName = productName.toLowerCase();
                
                // Check if names match (allowing for minor variations)
                const fetchedWords = fetchedName.split(/\s+/).filter(w => w.length > 2);
                const expectedWords = expectedName.split(/\s+/).filter(w => w.length > 2);
                const sharedWords = expectedWords.filter(w => fetchedWords.includes(w));
                
                // Require at least 50% word overlap or exact name match
                const nameMatch = fetchedName === expectedName || 
                                fetchedName.includes(expectedName) || 
                                expectedName.includes(fetchedName) ||
                                sharedWords.length >= Math.min(2, expectedWords.length / 2);
                
                if (!nameMatch) {
                  console.error(`❌ CRITICAL: Product ID ${productId} returned different product!`);
                  console.error(`   Expected (from card): "${productName}"`);
                  console.error(`   Got (from database): "${productData.name}"`);
                  console.error(`   Shared words: ${sharedWords.join(', ') || 'none'}`);
                  console.error(`   Rejecting database product and using name search instead...`);
                  productIdFound = false; // Force name-based search instead
                } else {
                  console.log(`✅ Product ID validation passed: "${productData.name}" matches "${productName}"`);
                }
              }
              
              if (productIdFound) {
                // 🚀 PRIORITY: Check cache FIRST before fetching from API
                const actualProductName = productData.name;
                console.log('🔍 Product found in database with', productData.prices?.length || 0, 'stores');
              
              // 🚀 Check cache FIRST (before API call) - cache normalizes to lowercase
              if (priceDataCache.has(actualProductName)) {
                console.log(`⚡ Using cached price data for "${actualProductName}" - instant load!`);
                const cachedData = priceDataCache.get(actualProductName)!;
                const transformedProduct = transformCompareResponse(cachedData);
                if (transformedProduct) {
                  console.log(`✅ Loaded from cache: ${transformedProduct.storePrices?.length || 0} stores`);
                  setProductData(transformedProduct);
                  setIsLoading(false);
                  return; // Instant return - no API call needed!
                }
              }
              
              // Cache miss - fetch multi-store prices for comprehensive comparison
              console.log('🔍 Cache miss - Fetching multi-store prices for comprehensive comparison:', actualProductName);
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
                    // 🔍 CRITICAL VALIDATION: Ensure multi-store product matches what we clicked
                    if (productName) {
                      const multiStoreName = (multiStoreData.product.name || '').toLowerCase();
                      const expectedName = productName.toLowerCase();
                      const dbName = actualProductName.toLowerCase();
                      
                      // Check if multi-store product matches expected OR database product
                      const multiStoreWords = multiStoreName.split(/\s+/).filter(w => w.length > 2);
                      const expectedWords = expectedName.split(/\s+/).filter(w => w.length > 2);
                      const dbWords = dbName.split(/\s+/).filter(w => w.length > 2);
                      
                      const matchesExpected = multiStoreName === expectedName || 
                                            multiStoreName.includes(expectedName) || 
                                            expectedName.includes(multiStoreName) ||
                                            expectedWords.filter(w => multiStoreWords.includes(w)).length >= Math.min(2, expectedWords.length / 2);
                      
                      const matchesDb = multiStoreName === dbName || 
                                      multiStoreName.includes(dbName) || 
                                      dbName.includes(multiStoreName) ||
                                      dbWords.filter(w => multiStoreWords.includes(w)).length >= Math.min(2, dbWords.length / 2);
                      
                      if (!matchesExpected && !matchesDb) {
                        console.error(`❌ CRITICAL: Multi-store search returned different product!`);
                        console.error(`   Expected (from card): "${productName}"`);
                        console.error(`   Database product: "${actualProductName}"`);
                        console.error(`   Multi-store returned: "${multiStoreData.product.name}"`);
                        console.error(`   Rejecting multi-store result and using database product instead...`);
                        // Fall through to use database prices instead
                      } else {
                        console.log(`✅ Multi-store product validated: "${multiStoreData.product.name}" matches`);
                        const transformedProduct = transformCompareResponse(multiStoreData);
                        if (transformedProduct) {
                          console.log(`✅ Using multi-store data: ${transformedProduct.storePrices?.length || 0} stores`);
                          
                          // Cache the fetched data for future use (cache normalizes to lowercase automatically)
                          if (!priceDataCache.has(actualProductName)) {
                            priceDataCache.set(actualProductName, multiStoreData);
                            console.log(`💰 Cached price data for "${actualProductName}"`);
                          }
                          
                          setProductData(transformedProduct);
                          return;
                        }
                      }
                    } else {
                      // No productName to validate against, proceed normally
                      const transformedProduct = transformCompareResponse(multiStoreData);
                      if (transformedProduct) {
                        console.log(`✅ Using multi-store data: ${transformedProduct.storePrices?.length || 0} stores`);
                        
                        // Cache the fetched data for future use (cache normalizes to lowercase automatically)
                        if (!priceDataCache.has(actualProductName)) {
                          priceDataCache.set(actualProductName, multiStoreData);
                          console.log(`💰 Cached price data for "${actualProductName}"`);
                        }
                        
                        setProductData(transformedProduct);
                        return;
                      }
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
                  } as any as { source: string; totalStores: number; lowestPrice: number; highestPrice: number; maxSavings: number; message?: string },
                });
                
                if (transformedProduct) {
                  setProductData(transformedProduct);
                  return;
                }
              }
              } // Close if (productIdFound)
            } // Close if (productResponse.ok)
            else if (productResponse.status === 404) {
              // Product ID not found - this is common for SerpAPI products that haven't been saved yet
              // Try searching by name using the slug-converted query
              console.warn('⚠️ Product not found by ID (404), falling back to name search');
              console.warn('   This is normal for SerpAPI products that haven\'t been saved to database yet');
              // Don't throw error, fall through to name search below
              productIdFound = false;
            } else {
              // For other HTTP errors, try to get error message
              const errorText = await productResponse.text().catch(() => '');
              throw new Error(`HTTP ${productResponse.status}: ${errorText || productResponse.statusText}`);
            }
          } catch (err: any) {
            console.warn('⚠️ Error fetching by ID:', err.message);
            // If productId was provided but fetch failed, check if it's a 404
            // 404 is expected for SerpAPI products that haven't been saved to DB yet
            // In that case, fall through to name search
            if (productId) {
              // Check if it's a network error or non-404 HTTP error
              const is404 = err.message.includes('404') || 
                           err.message.includes('not found') ||
                           err.message.includes('Not Found');
              
              if (!is404) {
                // Only throw error for non-404 errors (network issues, 500, etc.)
                throw new Error(`Failed to load product: ${err.message}`);
              }
              // For 404, fall through to name search (expected for SerpAPI products)
              console.warn('   Product ID not in database, will search by name instead');
            }
            // Fall through to name search for 404 errors or if no productId was provided
            productIdFound = false;
          }
          
          // If product was found by ID, we already returned above
          // If not found (404), continue to name search below
          if (productIdFound) {
            return; // Product was found and processed, exit early
          }
        }

        // Priority 2: Search by name (fallback if productId not found or not provided)
        // This is normal for SerpAPI products that haven't been saved to database yet
        console.log('🔍 Searching by product name:', searchQuery);
        console.log('   Using actual product name from card:', productName || 'not provided');
        console.log('   Slug-converted name:', productSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        
        // 🚀 Check cache (cache normalizes to lowercase automatically)
        // Try both the actual product name and slug-converted name
        const cacheKeys = [searchQuery];
        if (productName && productName !== searchQuery) {
          cacheKeys.push(productName);
        }
        
        for (const cacheKey of cacheKeys) {
          if (priceDataCache.has(cacheKey)) {
            console.log(`⚡ Using cached price data for "${cacheKey}" - instant load!`);
            const cachedData = priceDataCache.get(cacheKey)!;
            const transformedProduct = transformCompareResponse(cachedData);
            if (transformedProduct) {
              // Validate that the cached product matches what we're looking for
              const cachedName = (transformedProduct.name || '').toLowerCase();
              const searchName = searchQuery.toLowerCase();
              const productNameLower = (productName || '').toLowerCase();
              
              // Check if cached product name contains search terms (fuzzy match)
              const isMatch = cachedName.includes(searchName) || 
                            searchName.includes(cachedName) ||
                            (productNameLower && (cachedName.includes(productNameLower) || productNameLower.includes(cachedName)));
              
              if (isMatch || !productName) {
                console.log(`✅ Loaded from cache: ${transformedProduct.storePrices?.length || 0} stores`);
                console.log(`   Cached product: "${transformedProduct.name}"`);
                setProductData(transformedProduct);
                setIsLoading(false);
                return; // Instant return - no API call needed!
              } else {
                console.warn(`⚠️ Cached product name mismatch: "${transformedProduct.name}" vs "${searchQuery}"`);
                console.warn('   Skipping cache, will search fresh');
              }
            }
          }
        }

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
        
        // Validate: Check if the returned product matches what we're looking for
        let productMatches = true;
        if (data.product && productName) {
          const returnedName = (data.product.name || '').toLowerCase();
          const expectedName = productName.toLowerCase();
          
          // Extract key words from both names (brand, model numbers, etc.)
          const expectedWords = expectedName.split(/\s+/).filter(w => w.length > 2);
          const returnedWords = returnedName.split(/\s+/).filter(w => w.length > 2);
          
          // Check if names are similar (fuzzy match)
          // Match if: names contain each other, or share significant words
          const nameContains = returnedName.includes(expectedName) || expectedName.includes(returnedName);
          const sharedWords = expectedWords.filter(w => returnedWords.includes(w));
          const significantMatch = sharedWords.length >= Math.min(2, expectedWords.length / 2);
          
          const isMatch = nameContains || significantMatch;
          
          if (!isMatch && returnedName.length > 0) {
            console.warn(`⚠️ Product name mismatch detected!`);
            console.warn(`   Expected: "${productName}"`);
            console.warn(`   Got: "${data.product.name}"`);
            console.warn(`   Shared words: ${sharedWords.join(', ') || 'none'}`);
            console.warn(`   This might be the wrong product - will try fallback queries`);
            // Don't use this product, fall through to fallback queries
            productMatches = false;
          } else if (isMatch) {
            console.log(`✅ Product name matches: "${data.product.name}"`);
            console.log(`   Shared words: ${sharedWords.join(', ')}`);
          }
        }
        
        // Check if product was found AND matches
        // Backend returns { product, prices, metadata } - check for product and prices
        if (!data.product || !data.prices || data.prices.length === 0 || !productMatches) {
          if (!productMatches) {
            console.warn(`⚠️ Product found but name doesn't match - trying fallback queries`);
          } else {
            console.warn(`⚠️ Exact search failed for: "${searchQuery}"`);
          }
          console.warn(`⚠️ Exact search failed for: "${searchQuery}"`);
          
          // Validate: Check if the returned product name matches what we're looking for
          if (data.product && productName) {
            const returnedName = (data.product.name || '').toLowerCase();
            const expectedName = productName.toLowerCase();
            
            // Check if names are similar (fuzzy match)
            const isSimilar = returnedName.includes(expectedName) || 
                            expectedName.includes(returnedName) ||
                            returnedName.split(' ').some(word => expectedName.includes(word)) ||
                            expectedName.split(' ').some(word => returnedName.includes(word));
            
            if (!isSimilar && returnedName.length > 0) {
              console.warn(`⚠️ Product name mismatch!`);
              console.warn(`   Expected: "${productName}"`);
              console.warn(`   Got: "${data.product.name}"`);
              console.warn(`   This might be the wrong product - trying fallback queries...`);
            }
          }
          
          // Fallback: Try simpler search queries (e.g., "Playstation 5 Console Ghost Of Yotei Gold Limited Edition Bundle" -> "Playstation 5")
          // Use actual productName if available for better fallback generation
          const fallbackBaseQuery = productName || searchQuery;
          const fallbackQueries = generateFallbackQueries(fallbackBaseQuery);
          console.log('🔄 Trying fallback queries:', fallbackQueries);
          
          for (const fallbackQuery of fallbackQueries) {
            try {
              const fallbackUrl = `${API_ENDPOINTS.products.compareMultiStore(fallbackQuery, 'auto')}${categoryIdParam}`;
              console.log(`🔄 Trying fallback query: "${fallbackQuery}"`);
              
              const fallbackResponse = await fetch(fallbackUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              });
              
                if (fallbackResponse.ok) {
                  const fallbackData = await fallbackResponse.json();
                  
                  if (fallbackData.product && fallbackData.prices && fallbackData.prices.length > 0) {
                    // STRICT Validation: Check if fallback product matches what we're looking for
                    if (productName) {
                      const fallbackName = (fallbackData.product.name || '').toLowerCase();
                      const expectedName = productName.toLowerCase();
                      
                      // Extract key identifying words (brand, model, type)
                      const expectedWords = expectedName.split(/\s+/).filter(w => w.length > 2);
                      const returnedWords = fallbackName.split(/\s+/).filter(w => w.length > 2);
                      
                      // Check for category mismatch (e.g., TV vs Phone)
                      const expectedIsTV = expectedName.includes('tv') || expectedName.includes('television') || expectedName.includes('class');
                      const returnedIsTV = fallbackName.includes('tv') || fallbackName.includes('television') || fallbackName.includes('class');
                      // Phone detection: "galaxy s", "galaxy s25", "iphone", "pixel", etc.
                      const expectedIsPhone = expectedName.includes('phone') || 
                                             /galaxy\s+s\d+/i.test(expectedName) || 
                                             /iphone\s+\d+/i.test(expectedName) ||
                                             expectedName.includes('pixel');
                      const returnedIsPhone = fallbackName.includes('phone') || 
                                            /galaxy\s+s\d+/i.test(fallbackName) || 
                                            /iphone\s+\d+/i.test(fallbackName) ||
                                            fallbackName.includes('pixel');
                      
                      // Reject if category mismatch (TV vs Phone, etc.)
                      if ((expectedIsTV && returnedIsPhone) || (expectedIsPhone && returnedIsTV)) {
                        console.warn(`❌ Category mismatch! Rejecting fallback product.`);
                        console.warn(`   Expected: "${productName}" (${expectedIsTV ? 'TV' : expectedIsPhone ? 'Phone' : 'Other'})`);
                        console.warn(`   Got: "${fallbackData.product.name}" (${returnedIsTV ? 'TV' : returnedIsPhone ? 'Phone' : 'Other'})`);
                        continue; // Try next fallback
                      }
                      
                      // Check for brand and key identifier match
                      const brandMatch = expectedWords[0] && returnedWords[0] && expectedWords[0] === returnedWords[0];
                      const sharedWords = expectedWords.filter(w => returnedWords.includes(w));
                      
                      // For TVs, require brand + (size OR model number) match
                      if (expectedIsTV) {
                        // Check for size match (e.g., "43", "55", "65")
                        const sizeMatch = expectedWords.some(w => /^\d+$/.test(w) && returnedWords.includes(w));
                        
                        // Check for model number match (e.g., "U7900F", "QN85A", "X90K")
                        const expectedModelMatch = expectedName.match(/\b([A-Z]\d+[A-Z]?[A-Z0-9]*)\b/);
                        const returnedModelMatch = fallbackName.match(/\b([A-Z]\d+[A-Z]?[A-Z0-9]*)\b/);
                        const modelMatch = expectedModelMatch && returnedModelMatch && 
                                         expectedModelMatch[1].toLowerCase() === returnedModelMatch[1].toLowerCase();
                        
                        // Check for shared significant words (e.g., "Class", "Crystal", "UHD", "4K")
                        const significantWords = ['class', 'crystal', 'uhd', '4k', '8k', 'smart', 'led', 'oled', 'qled'];
                        const sharedSignificantWords = expectedWords.filter(w => 
                          returnedWords.includes(w) && significantWords.includes(w.toLowerCase())
                        );
                        
                        // Accept if: (brand + size) OR (brand + model) OR (brand + significant words)
                        const isValidTVMatch = brandMatch && (sizeMatch || modelMatch || sharedSignificantWords.length >= 2);
                        
                        if (!isValidTVMatch) {
                          console.warn(`❌ TV validation failed:`);
                          console.warn(`   Brand match: ${brandMatch}, Size match: ${sizeMatch}, Model match: ${modelMatch}`);
                          console.warn(`   Shared significant words: ${sharedSignificantWords.join(', ') || 'none'}`);
                          console.warn(`   Expected: "${productName}"`);
                          console.warn(`   Got: "${fallbackData.product.name}"`);
                          continue; // Try next fallback
                        }
                      }
                      
                      // General validation: names should share significant words
                      const isMatch = fallbackName.includes(expectedName) || 
                                    expectedName.includes(fallbackName) ||
                                    (brandMatch && sharedWords.length >= 2);
                      
                      if (!isMatch) {
                        console.warn(`⚠️ Fallback product name mismatch: "${fallbackData.product.name}" vs "${productName}"`);
                        console.warn(`   Shared words: ${sharedWords.join(', ') || 'none'}`);
                        console.warn('   Continuing to next fallback...');
                        continue; // Try next fallback
                      }
                      
                      console.log(`✅ Fallback product validated: "${fallbackData.product.name}" matches "${productName}"`);
                    }
                    
                    console.log(`✅ Fallback query succeeded: "${fallbackQuery}" - Found ${fallbackData.prices.length} stores`);
                    console.log(`   Product: "${fallbackData.product.name}"`);
                    const transformedProduct = transformCompareResponse(fallbackData);
                    if (transformedProduct) {
                      setProductData(transformedProduct);
                      return; // Success! Exit early
                    }
                  }
                }
            } catch (fallbackError: any) {
              console.log(`⚠️ Fallback query "${fallbackQuery}" failed:`, fallbackError.message);
              // Continue to next fallback
            }
          }
          
          // All fallbacks failed - show error
          const errorMessage = (data.metadata as any)?.message || 
            `No products found for "${searchQuery}". Try searching for a simpler product name (e.g., "Playstation 5" instead of the full bundle name).`;
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

        // Final validation: Double-check product name before displaying
        if (data.product && productName) {
          const returnedName = (data.product.name || '').toLowerCase();
          const expectedName = productName.toLowerCase();
          
          // Extract key identifying words (brand, model numbers, size, etc.)
          const expectedWords = expectedName.split(/\s+/).filter(w => w.length > 2);
          const returnedWords = returnedName.split(/\s+/).filter(w => w.length > 2);
          const sharedWords = expectedWords.filter(w => returnedWords.includes(w));
          
          // Detect product category to prevent mismatches (TV vs Phone, etc.)
          const expectedIsTV = expectedName.includes('tv') || expectedName.includes('television') || expectedName.includes('class');
          const returnedIsTV = returnedName.includes('tv') || returnedName.includes('television') || returnedName.includes('class');
          // Phone detection: "galaxy s", "galaxy s25", "iphone", "pixel", etc.
          const expectedIsPhone = expectedName.includes('phone') || 
                                 /galaxy\s+s\d+/i.test(expectedName) || 
                                 /iphone\s+\d+/i.test(expectedName) ||
                                 expectedName.includes('pixel');
          const returnedIsPhone = returnedName.includes('phone') || 
                                /galaxy\s+s\d+/i.test(returnedName) || 
                                /iphone\s+\d+/i.test(returnedName) ||
                                returnedName.includes('pixel');
          
          // CRITICAL: Reject if category mismatch (TV vs Phone, etc.)
          if ((expectedIsTV && returnedIsPhone) || (expectedIsPhone && returnedIsTV)) {
            console.error(`❌ CRITICAL: Category mismatch! Rejecting wrong product.`);
            console.error(`   Expected: "${productName}" (${expectedIsTV ? 'TV' : expectedIsPhone ? 'Phone' : 'Other'})`);
            console.error(`   Got: "${data.product.name}" (${returnedIsTV ? 'TV' : returnedIsPhone ? 'Phone' : 'Other'})`);
            throw new Error(`Product mismatch: Expected a ${expectedIsTV ? 'TV' : expectedIsPhone ? 'phone' : 'product'} but got a ${returnedIsTV ? 'TV' : returnedIsPhone ? 'phone' : 'different product'}. Please try searching again.`);
          }
          
          // For TVs, require brand + (size OR model number OR significant words) match
          const brandMatch = expectedWords[0] && returnedWords[0] && expectedWords[0] === returnedWords[0];
          const sizeMatch = expectedWords.some(w => /^\d+$/.test(w) && returnedWords.includes(w));
          
          // Check for model number match (e.g., "U7900F", "QN85A")
          const expectedModelMatch = expectedName.match(/\b([A-Z]\d+[A-Z]?[A-Z0-9]*)\b/);
          const returnedModelMatch = returnedName.match(/\b([A-Z]\d+[A-Z]?[A-Z0-9]*)\b/);
          const modelMatch = expectedModelMatch && returnedModelMatch && 
                           expectedModelMatch[1].toLowerCase() === returnedModelMatch[1].toLowerCase();
          
          // Check for shared significant words (e.g., "Class", "Crystal", "UHD", "4K")
          const significantWords = ['class', 'crystal', 'uhd', '4k', '8k', 'smart', 'led', 'oled', 'qled'];
          const sharedSignificantWords = expectedWords.filter(w => 
            returnedWords.includes(w) && significantWords.includes(w.toLowerCase())
          );
          
          let isMatch = false;
          if (expectedIsTV) {
            // For TVs, accept if: (brand + size) OR (brand + model) OR (brand + significant words) OR (contains expected name)
            isMatch = returnedName.includes(expectedName) || 
                     expectedName.includes(returnedName) ||
                     (brandMatch && (sizeMatch || modelMatch || sharedSignificantWords.length >= 2));
            if (!isMatch) {
              console.error(`❌ TV validation failed:`);
              console.error(`   Brand match: ${brandMatch}, Size match: ${sizeMatch}, Model match: ${modelMatch}`);
              console.error(`   Shared significant words: ${sharedSignificantWords.join(', ') || 'none'}`);
            }
          } else {
            // For other products, use general matching
            isMatch = returnedName.includes(expectedName) || 
                     expectedName.includes(returnedName) ||
                     (brandMatch && sharedWords.length >= 2);
          }
          
          if (!isMatch) {
            console.error(`❌ CRITICAL: Product name mismatch! Not showing wrong product.`);
            console.error(`   Expected: "${productName}"`);
            console.error(`   Got: "${data.product.name}"`);
            console.error(`   Shared words: ${sharedWords.join(', ') || 'none'}`);
            throw new Error(`Product mismatch: Expected "${productName}" but got "${data.product.name}". Please try searching again.`);
          }
          
          console.log(`✅ Product validation passed: "${data.product.name}" matches "${productName}"`);
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
          
          // 🚀 NEW: Cache the fetched data for future use (if not already cached)
          if (!priceDataCache.has(searchQuery)) {
            priceDataCache.set(searchQuery, data);
            console.log(`💰 Cached price data for "${searchQuery}" for future instant loads`);
          }
          
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

  // Resolve product image: API first, then cache by id (card id), then cache by name (works when API returns different id or no image)
  const resolvedImage =
    productData.image ||
    getProductImageForCompare(productData.id) ||
    getProductImageForCompareByName(productData.name) ||
    (productName ? getProductImageForCompareByName(productName as string) : '') ||
    '';

  return (
    <ProductComparisonPage
      productId={productData.id}
      productName={productData.name}
      productImage={resolvedImage}
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


/**
 * Utility functions to transform backend API responses to frontend format
 */

interface BackendPrice {
  id: string;
  price: number;
  store: {
    id: string;
    name: string;
    logo?: string;
  };
}

interface BackendProduct {
  id: string;
  name: string;
  image?: string;
  images?: string[]; // Backend returns images as array
  subcategory?: string | null; // Subcategory field from backend
  category: {
    id: string;
    name: string;
    slug: string;
  };
  prices: BackendPrice[];
  lowestPrice?: number;
  highestPrice?: number;
  savings?: number;
}

// Response format from compareProductAcrossStores endpoint
interface CompareMultiStoreResponse {
  product: {
    id?: string;
    name: string;
    image?: string;
    barcode?: string;
    category?: {
      id: string;
      name: string;
      slug?: string; // Category slug for navigation
    } | string | null; // Can be object (new format) or string (legacy)
  } | null;
  prices: Array<{
    rank: number;
    store: {
      name: string;
      logo?: string;
      url?: string;
    };
    price: number;
    totalPrice: number;
    shippingCost?: number;
    savings: number;
    isBestPrice: boolean;
    inStock?: boolean;
    currency?: string;
    productUrl?: string; // Direct URL to the product page
  }>;
  metadata?: {
    source: string;
    totalStores: number;
    lowestPrice: number;
    highestPrice: number;
    maxSavings: number;
  };
}

interface FrontendStorePrice {
  rank: number;
  storeName: string;
  price: string;
  storeImage: string;
  isBestDeal?: boolean;
  shippingInfo?: string;
  totalPrice?: number;
  savings?: number;
  priceDifference?: string; // e.g., "+$0.04 more"
  productUrl?: string; // URL to the product on the store's website
}

interface FrontendProduct {
  id: string | number;
  name: string;
  image: string;
  category: string;
  categorySlug?: string;
  subcategory?: string | null; // Subcategory field for filtering
  storePrices: FrontendStorePrice[];
  maxSavings?: number;
  bestPrice?: number;
  bestPriceStore?: string;
}

/**
 * Transform backend product to frontend format (for regular search endpoint)
 * Handles both /products/search and /products/popular endpoints
 */
export function transformProduct(backendProduct: BackendProduct): FrontendProduct | null {
  // EXCLUDE TEST PRODUCTS - Filter out products with "Test Product" in the name
  const productName = (backendProduct.name || '').toLowerCase();
  if (productName.includes('test product')) {
    console.warn(`🚫 Filtering out test product: "${backendProduct.name}"`);
    return null;
  }
  
  // Extract image URL - allow products without images to display with placeholder
  let productImage: string = '';
  if (backendProduct.images && Array.isArray(backendProduct.images) && backendProduct.images.length > 0) {
    const validImages = backendProduct.images.filter((img: string) => 
      img && typeof img === 'string' && 
      img.trim().length > 0 && 
      (img.startsWith('http://') || img.startsWith('https://')) &&
      !img.includes('example.com')
    );
    if (validImages.length > 0) productImage = validImages[0];
  }
  if (!productImage && typeof backendProduct.images === 'string' && backendProduct.images.trim().startsWith('http')) {
    productImage = backendProduct.images.trim();
  }
  if (!productImage && backendProduct.image && typeof backendProduct.image === 'string' && backendProduct.image.trim().startsWith('http')) {
    productImage = backendProduct.image.trim();
  }
  
  // Use placeholder if no image found (don't filter out product)
  if (!productImage) {
    productImage = 'https://via.placeholder.com/200x200/1e2736/8b95a8?text=No+Image';
  }
  
  // Handle missing prices array
  const prices = backendProduct.prices || [];

  const toNumberOrNull = (val: any): number | null => {
    if (val == null) return null;
    if (typeof val === 'number') return Number.isFinite(val) ? val : null;
    if (typeof val === 'string') {
      const n = Number.parseFloat(val);
      return Number.isFinite(n) ? n : null;
    }
    // Prisma Decimal (or similar) support
    if (typeof val?.toNumber === 'function') {
      const n = val.toNumber();
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };
  
  // Normalize & filter out invalid prices first, then sort by price value (ascending)
  const normalizedPrices = prices
    .map((p: any) => {
      const n = toNumberOrNull(p?.price);
      return { ...p, __priceNumber: n };
    })
    .filter((p: any) => typeof p.__priceNumber === 'number' && p.__priceNumber > 0);
  
  const sortedPrices = [...normalizedPrices].sort((a: any, b: any) => a.__priceNumber - b.__priceNumber);
  
  // Get the lowest price for best deal indicator
  const lowestPrice = sortedPrices.length > 0 ? sortedPrices[0].__priceNumber : 0;
  const highestPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1].__priceNumber : 0;
  const maxSavings = highestPrice - lowestPrice;
  
  // Transform prices to frontend format
  // sortedPrices is already filtered and sorted, so we can use it directly
  let storePrices: FrontendStorePrice[] = sortedPrices.map((price, index) => {
    const priceNumber = price.__priceNumber as number;
    const isBestDeal = priceNumber === lowestPrice && lowestPrice > 0;
    
    // Format price as string (e.g., "$4.99" or "$4.99/lb")
    // price.price is guaranteed to be a valid number due to filter above
    const formattedPrice = `$${priceNumber.toFixed(2)}`;
    
    // Use store logo if available, otherwise use Clearbit Logo API
    const storeName = price.store?.name || 'Unknown Store';
    const storeImage = price.store?.logo || 
      `https://logo.clearbit.com/${storeName.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com` ||
      'https://via.placeholder.com/40';
    
    // Calculate price difference for non-best-deal stores
    let priceDifference: string | undefined;
    if (!isBestDeal && lowestPrice > 0) {
      const diff = priceNumber - lowestPrice;
      if (diff > 0) {
        priceDifference = `+$${diff.toFixed(2)} more`;
      }
    }
    
    return {
      rank: index + 1,
      storeName,
      price: formattedPrice,
      storeImage,
      isBestDeal,
      totalPrice: priceNumber,
      priceDifference,
      productUrl: (price as any).productUrl || (price.store as any)?.url || (price.store as any)?.websiteUrl, // Include product URL if available
    };
  });
  
  // CRITICAL: Do NOT generate fake prices - only show products with REAL prices from stores
  // If no prices from backend, return null to filter out this product (it's not ready for display)
  if (storePrices.length === 0) {
    return null; // Filter out products without real prices
  }
  
  // productImage is already set above (with placeholder if no image found)
  return {
    id: backendProduct.id,
    name: backendProduct.name || 'Unnamed Product',
    image: productImage, // Use first image from images array
    category: backendProduct.category?.name || 'Uncategorized',
    categorySlug: backendProduct.category?.slug,
    subcategory: backendProduct.subcategory || null, // Include subcategory for filtering
    storePrices,
    maxSavings: backendProduct.savings || maxSavings,
    bestPrice: lowestPrice,
    bestPriceStore: sortedPrices.length > 0 ? sortedPrices[0].store?.name : undefined,
  };
}

/**
 * Transform array of backend products to frontend format (for regular search endpoint)
 */
export function transformProducts(backendProducts: BackendProduct[]): FrontendProduct[] {
  return backendProducts
    .map(transformProduct)
    .filter((p): p is FrontendProduct => p !== null && p !== undefined);
}

/**
 * Transform compareProductAcrossStores response to frontend format
 * This endpoint uses PriceAPI and returns a single product with multiple store prices
 */
export function transformCompareResponse(response: CompareMultiStoreResponse): FrontendProduct | null {
  if (!response.product) {
    return null;
  }
  
  const { product, prices } = response;
  
  // Store product name for URL generation fallback (clean it for URL encoding)
  const productName = (product.name || '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  
  // Transform prices array to frontend format
  // Filter out prices with invalid price values first
  const validPrices = prices.filter(p => 
    p && 
    typeof p.price === 'number' && 
    !isNaN(p.price) && 
    p.price > 0
  );
  
  const storePrices: FrontendStorePrice[] = validPrices.map((price) => {
    // Format price as string
    // price.price is guaranteed to be a valid number due to filter above
    const formattedPrice = `$${price.price.toFixed(2)}`;
    
    // Use store logo if available, otherwise generate from store name using Clearbit
    const storeName = price.store.name || 'Unknown Store';
    const storeImage = price.store.logo || 
      `https://logo.clearbit.com/${storeName.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')}.com` ||
      'https://via.placeholder.com/40';
    
    // Determine shipping info from shippingCost or totalPrice
    let shippingInfo = 'Free Shipping';
    const shippingCost = price.shippingCost || (price.totalPrice && price.totalPrice > price.price ? price.totalPrice - price.price : 0);
    if (shippingCost > 0) {
      shippingInfo = `$${shippingCost.toFixed(2)} Shipping`;
    } else if (price.inStock === false) {
      shippingInfo = 'Out of Stock';
    } else if (price.store.name.toLowerCase().includes('amazon')) {
      shippingInfo = 'Free Prime';
    } else if (price.store.name.toLowerCase().includes('micro center')) {
      shippingInfo = 'In-Store Only';
    }
    
    // Calculate price difference for non-best-price stores
    let priceDifference: string | undefined;
    if (!price.isBestPrice && validPrices.length > 0) {
      const bestPrice = validPrices.find(p => p.isBestPrice)?.price || validPrices[0]?.price || 0;
      if (bestPrice > 0 && price.price > bestPrice) {
        const diff = price.price - bestPrice;
        priceDifference = `+$${diff.toFixed(2)} more`;
      }
    }
    
    // For now, use store homepage URL (simpler and always works)
    // Later, we can use specific product URLs when available
    let productUrl = price.productUrl || 
                     price.store?.url || 
                     price.store?.websiteUrl ||
                     undefined;
    
    // If still no URL, generate store homepage based on store name
    if (!productUrl) {
      const storeLower = storeName.toLowerCase();
      if (storeLower.includes('amazon')) {
        productUrl = 'https://www.amazon.com';
      } else if (storeLower.includes('walmart')) {
        productUrl = 'https://www.walmart.com';
      } else if (storeLower.includes('target')) {
        productUrl = 'https://www.target.com';
      } else if (storeLower.includes('best buy') || storeLower.includes('bestbuy')) {
        productUrl = 'https://www.bestbuy.com';
      } else if (storeLower.includes('costco')) {
        productUrl = 'https://www.costco.com';
      } else if (storeLower.includes('ebay')) {
        productUrl = 'https://www.ebay.com';
      } else if (storeLower.includes('home depot') || storeLower.includes('homedepot')) {
        productUrl = 'https://www.homedepot.com';
      } else if (storeLower.includes('office depot') || storeLower.includes('officedepot')) {
        productUrl = 'https://www.officedepot.com';
      } else {
        // Generic fallback
        productUrl = `https://www.${storeName.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com`;
      }
      
      // Reduced logging - commented out to improve performance
      // console.log(`🔗 Generated store homepage URL for ${storeName}: ${productUrl}`);
    }
    
    // Reduced logging - commented out to improve performance (was causing 5s delays)
    // console.log(`🔗 Transform price for ${price.store.name}: Using URL: ${productUrl}`);
    
    return {
      rank: price.rank,
      storeName: price.store.name,
      price: formattedPrice,
      storeImage,
      isBestDeal: price.isBestPrice,
      productUrl: productUrl, // Use product URL or store URL as fallback
      shippingInfo,
      totalPrice: price.totalPrice,
      savings: price.savings,
      priceDifference,
    };
  });
  
  // Calculate max savings from metadata
  const maxSavings = response.metadata?.maxSavings || 0;
  
  // Extract image - check multiple possible fields
  let productImage = product.image || 
    (product as any).imageUrl || 
    (product as any).images?.[0] || 
    null;
  
  console.log('🖼️ transformCompareResponse - Raw image fields:', {
    'product.image': product.image,
    'product.imageUrl': (product as any).imageUrl,
    'product.images[0]': (product as any).images?.[0],
    'final productImage': productImage,
  });
  
  // Validate image URL - must be http/https and not placeholder
  if (productImage && typeof productImage === 'string') {
    const trimmed = productImage.trim();
    const isPlaceholder = trimmed.includes('placeholder') || trimmed.includes('via.placeholder');
    
    if (trimmed.startsWith('http') && !isPlaceholder) {
      productImage = trimmed;
      console.log('✅ Valid image URL:', productImage);
    } else {
      console.log('❌ Invalid image URL (rejected):', trimmed, {
        startsWithHttp: trimmed.startsWith('http'),
        isPlaceholder,
      });
      productImage = null;
    }
  } else {
    console.log('❌ No image found or invalid type:', productImage, typeof productImage);
    productImage = null;
  }
  
  // Use placeholder if no valid image
  if (!productImage) {
    productImage = 'https://via.placeholder.com/96x96/1e2736/8b95a8?text=No+Image';
    console.log('⚠️ Using placeholder image');
  }
  
  console.log('🖼️ transformCompareResponse - Final productImage:', productImage);
  
  // Extract category info - backend now returns category as object with id, name, slug
  let categoryName = 'Uncategorized';
  let categorySlug: string | undefined;
  
  if (product.category) {
    if (typeof product.category === 'string') {
      // Legacy: If category is a string, use it and derive slug
      categoryName = product.category;
      categorySlug = product.category.toLowerCase().replace(/\s+/g, '-');
    } else if (product.category && typeof product.category === 'object') {
      // New format: category is an object with id, name, slug
      categoryName = product.category.name || 'Uncategorized';
      categorySlug = product.category.slug;
    }
  }
  
  return {
    id: product.id || 'temp-' + Date.now(),
    name: product.name,
    image: productImage,
    category: categoryName,
    categorySlug: categorySlug, // Add categorySlug for navigation
    storePrices,
    maxSavings, // Add maxSavings to the product for the "Save up to" callout
    bestPrice: response.metadata?.lowestPrice || 0,
    bestPriceStore: prices.find(p => p.isBestPrice)?.store.name || '',
  };
}

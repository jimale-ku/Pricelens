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
    } | null;
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
}

interface FrontendProduct {
  id: string | number;
  name: string;
  image: string;
  category: string;
  storePrices: FrontendStorePrice[];
  maxSavings?: number;
  bestPrice?: number;
  bestPriceStore?: string;
}

/**
 * Transform backend product to frontend format (for regular search endpoint)
 * Handles both /products/search and /products/popular endpoints
 */
export function transformProduct(backendProduct: BackendProduct): FrontendProduct {
  // Handle missing prices array
  const prices = backendProduct.prices || [];
  
  // Sort prices by price value (ascending)
  const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
  
  // Get the lowest price for best deal indicator
  const lowestPrice = sortedPrices.length > 0 ? sortedPrices[0].price : 0;
  const highestPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1].price : 0;
  const maxSavings = highestPrice - lowestPrice;
  
  // Transform prices to frontend format
  const storePrices: FrontendStorePrice[] = sortedPrices.map((price, index) => {
    const isBestDeal = price.price === lowestPrice && lowestPrice > 0;
    
    // Format price as string (e.g., "$4.99" or "$4.99/lb")
    const formattedPrice = `$${price.price.toFixed(2)}`;
    
    // Use store logo if available, otherwise use Clearbit Logo API
    const storeName = price.store?.name || 'Unknown Store';
    const storeImage = price.store?.logo || 
      `https://logo.clearbit.com/${storeName.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and')}.com` ||
      'https://via.placeholder.com/40';
    
    return {
      rank: index + 1,
      storeName,
      price: formattedPrice,
      storeImage,
      isBestDeal,
    };
  });
  
  // Extract image - backend returns images[] array, use first image
  // Handle both array and string formats
  let productImage = 'https://via.placeholder.com/96';
  
  if (backendProduct.images) {
    if (Array.isArray(backendProduct.images) && backendProduct.images.length > 0) {
      // Filter out empty strings and invalid URLs
      const validImages = backendProduct.images.filter(img => 
        img && typeof img === 'string' && img.length > 0 && img.startsWith('http')
      );
      if (validImages.length > 0) {
        productImage = validImages[0];
      }
    } else if (typeof backendProduct.images === 'string' && backendProduct.images.length > 0) {
      productImage = backendProduct.images;
    }
  }
  
  // Fallback to image field if images array is empty
  if (productImage === 'https://via.placeholder.com/96' && backendProduct.image) {
    if (typeof backendProduct.image === 'string' && backendProduct.image.startsWith('http')) {
      productImage = backendProduct.image;
    }
  }
  
  console.log(`🖼️ Product image for ${backendProduct.name}:`, productImage);
  
  return {
    id: backendProduct.id,
    name: backendProduct.name || 'Unnamed Product',
    image: productImage, // Use first image from images array
    category: backendProduct.category?.name || 'Uncategorized',
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
  return backendProducts.map(transformProduct);
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
  
  // Transform prices array to frontend format
  const storePrices: FrontendStorePrice[] = prices.map((price) => {
    // Format price as string
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
    
    return {
      rank: price.rank,
      storeName: price.store.name,
      price: formattedPrice,
      storeImage,
      isBestDeal: price.isBestPrice,
      shippingInfo,
      totalPrice: price.totalPrice,
      savings: price.savings,
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
  
  return {
    id: product.id || 'temp-' + Date.now(),
    name: product.name,
    image: productImage,
    category: product.category?.name || 'Uncategorized',
    storePrices,
    maxSavings, // Add maxSavings to the product for the "Save up to" callout
    bestPrice: response.metadata?.lowestPrice || 0,
    bestPriceStore: prices.find(p => p.isBestPrice)?.store.name || '',
  };
}

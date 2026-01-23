/**
 * Generate sample products for any category
 * Used when category-specific data doesn't exist yet
 * 
 * OPTIMIZED: Pre-generates products for common categories and uses slug-based caching
 */

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
}

// Cache for generated products - uses slug as key for faster lookups
const productCache = new Map<string, Product[]>();

// Pre-generated products for common categories (eager loading)
const PREGENERATED_CATEGORIES = new Set([
  'kitchen',
  'homeaccessories',
  'clothing',
  'footwear',
  'books',
  'household',
  'medicine',
  'beauty',
  'videogames',
  'sports',
  'office',
  'furniture',
  'homedecor',
  'tools',
  'pets',
]);

/**
 * Generate sample products - OPTIMIZED with slug-based caching
 * @param categorySlug - Category slug (e.g., 'kitchen', 'groceries')
 * @param categoryName - Category display name (e.g., 'Kitchen & Appliances')
 * @param stores - Array of store names (already formatted)
 * @param count - Number of products to generate (default: 6)
 */
export function generateSampleProducts(
  categorySlug: string,
  categoryName: string,
  stores: string[],
  count: number = 6
): Product[] {
  // Use slug-based cache key (more stable than name-based)
  // Store count in key but use consistent store order for cache hits
  const storeKey = stores.filter(s => s !== 'All Stores').sort().join(',');
  const cacheKey = `${categorySlug}-${storeKey}-${count}`;
  
  // Return cached if exists (instant return)
  if (productCache.has(cacheKey)) {
    return productCache.get(cacheKey)!;
  }
  
  const sampleProducts: Product[] = [];
  const storeNames = stores.filter(s => s !== 'All Stores');
  
  // Generate sample product names based on category
  const productNames = getProductNamesForCategory(categoryName);
  
  // Use deterministic pricing (no Math.random) for faster generation
  for (let i = 0; i < Math.min(count, productNames.length); i++) {
    const productName = productNames[i] || `${categoryName} Item ${i + 1}`;
    const basePrice = 10 + (i * 5); // Varying prices
    
    // Generate store prices with deterministic variation (faster than random)
    const storePrices: StorePrice[] = storeNames.map((store, index) => {
      // Use index-based variation instead of Math.random for speed
      const priceVariation = (index % 3) * 2 - 2; // -2, 0, 2 pattern
      const price = Math.max(1, basePrice + priceVariation); // Ensure positive
      const isBestDeal = index === 0; // First store is best deal
      
      // Generate Clearbit logo URL from store name
      const storeLogo = getStoreLogo(store);
      
      return {
        rank: index + 1,
        storeName: store,
        price: `$${price.toFixed(2)}`,
        storeImage: storeLogo,
        isBestDeal,
      };
    });
    
    // Generate real product image URL based on product name
    const productImage = getProductImage(productName, categoryName, categorySlug);
    
    sampleProducts.push({
      id: `sample-${categorySlug}-${i + 1}`,
      name: productName,
      image: productImage,
      category: categoryName,
      storePrices,
    });
  }
  
  // Cache the result
  productCache.set(cacheKey, sampleProducts);
  
  return sampleProducts;
}

/**
 * Pre-generate products for common categories to eliminate delay
 * Call this at module load time for instant access
 */
export function pregenerateCommonCategoryProducts(
  categorySlug: string,
  categoryName: string,
  stores: string[]
): void {
  if (PREGENERATED_CATEGORIES.has(categorySlug)) {
    // Pre-generate and cache
    generateSampleProducts(categorySlug, categoryName, stores, 6);
  }
}

/**
 * Get store logo URL using Clearbit Logo API
 * Falls back to placeholder if store not found
 */
function getStoreLogo(storeName: string): string {
  // Map common store names to their Clearbit URLs
  const storeLogoMap: Record<string, string> = {
    'Walmart': 'https://logo.clearbit.com/walmart.com',
    'Target': 'https://logo.clearbit.com/target.com',
    'Amazon': 'https://logo.clearbit.com/amazon.com',
    'Costco': 'https://logo.clearbit.com/costco.com',
    'Best Buy': 'https://logo.clearbit.com/bestbuy.com',
    'Whole Foods': 'https://logo.clearbit.com/wholefoodsmarket.com',
    'Kroger': 'https://logo.clearbit.com/kroger.com',
    'Safeway': 'https://logo.clearbit.com/safeway.com',
    "Trader Joe's": 'https://logo.clearbit.com/traderjoes.com',
    'Aldi': 'https://logo.clearbit.com/aldi.us',
    'Newegg': 'https://logo.clearbit.com/newegg.com',
    'B&H Photo': 'https://logo.clearbit.com/bhphotovideo.com',
    'Micro Center': 'https://logo.clearbit.com/microcenter.com',
    "Sam's Club": 'https://logo.clearbit.com/samsclub.com',
    'Amazon Fresh': 'https://logo.clearbit.com/amazon.com',
    'King Soopers': 'https://logo.clearbit.com/kingsoopers.com',
    'Food Lion': 'https://logo.clearbit.com/foodlion.com',
  };
  
  // Check if we have a direct mapping
  if (storeLogoMap[storeName]) {
    return storeLogoMap[storeName];
  }
  
  // Otherwise, generate Clearbit URL from store name
  const cleanName = storeName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
  
  return `https://logo.clearbit.com/${cleanName}.com`;
}

function getProductNamesForCategory(categoryName: string): string[] {
  const productMap: Record<string, string[]> = {
    'Kitchen & Appliances': [
      'Instant Pot 6-Quart',
      'KitchenAid Stand Mixer',
      'Air Fryer XL',
      'Coffee Maker',
      'Blender Pro',
      'Toaster Oven',
    ],
    'Home Accessories': [
      'Decorative Pillow Set',
      'Table Lamp',
      'Wall Art',
      'Throw Blanket',
      'Vase Set',
      'Candle Holder',
    ],
    'Clothing': [
      'Cotton T-Shirt',
      'Denim Jeans',
      'Hooded Sweatshirt',
      'Dress Shirt',
      'Athletic Shorts',
      'Winter Jacket',
    ],
    'Footwear': [
      'Running Shoes',
      'Casual Sneakers',
      'Dress Shoes',
      'Boots',
      'Sandals',
      'Athletic Shoes',
    ],
    'Books': [
      'Bestseller Novel',
      'Cookbook',
      'Biography',
      'Science Fiction',
      'Mystery Thriller',
      'Self-Help Guide',
    ],
    'Household Items': [
      'Laundry Detergent',
      'Paper Towels',
      'Trash Bags',
      'Cleaning Supplies',
      'Storage Bins',
      'Light Bulbs',
    ],
    'Medicine & Health': [
      'Pain Reliever',
      'Vitamins',
      'First Aid Kit',
      'Thermometer',
      'Bandages',
      'Cough Syrup',
    ],
    'Beauty Products': [
      'Moisturizer',
      'Lipstick',
      'Foundation',
      'Mascara',
      'Face Mask',
      'Sunscreen',
    ],
    'Video Games': [
      'Action Adventure Game',
      'Racing Game',
      'Sports Game',
      'Puzzle Game',
      'RPG Game',
      'Strategy Game',
    ],
    'Sports Equipment': [
      'Basketball',
      'Tennis Racket',
      'Yoga Mat',
      'Dumbbells',
      'Running Shoes',
      'Golf Clubs',
    ],
    'Office Supplies': [
      'Notebook Set',
      'Pen Pack',
      'Desk Organizer',
      'Stapler',
      'Paper Clips',
      'File Folders',
    ],
    'Furniture': [
      'Coffee Table',
      'Dining Chair',
      'Bookshelf',
      'Desk',
      'Side Table',
      'Sofa',
    ],
    'Home Decor': [
      'Wall Clock',
      'Picture Frame',
      'Rug',
      'Curtains',
      'Mirror',
      'Plant Pot',
    ],
    'Tools & Hardware': [
      'Drill Set',
      'Hammer',
      'Screwdriver Set',
      'Wrench Set',
      'Measuring Tape',
      'Toolbox',
    ],
    'Pet Supplies': [
      'Dog Food',
      'Cat Litter',
      'Pet Toys',
      'Leash',
      'Pet Bed',
      'Food Bowl',
    ],
  };
  
  return productMap[categoryName] || [
    `${categoryName} Product 1`,
    `${categoryName} Product 2`,
    `${categoryName} Product 3`,
    `${categoryName} Product 4`,
    `${categoryName} Product 5`,
    `${categoryName} Product 6`,
  ];
}

/**
 * Get product image URL using product name and category
 * Uses a combination of product-specific and category-specific image URLs
 */
function getProductImage(productName: string, categoryName: string, categorySlug: string): string {
  // Product-specific image map for common products
  const productImageMap: Record<string, string> = {
    // Kitchen & Appliances
    'Instant Pot 6-Quart': 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=96&h=96&fit=crop',
    'KitchenAid Stand Mixer': 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=96&h=96&fit=crop',
    'Air Fryer XL': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=96&h=96&fit=crop',
    'Coffee Maker': 'https://images.unsplash.com/photo-1517668808823-98c5c60e5e1a?w=96&h=96&fit=crop',
    'Blender Pro': 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=96&h=96&fit=crop',
    'Toaster Oven': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=96&h=96&fit=crop',
    
    // Home Accessories
    'Decorative Pillow Set': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=96&h=96&fit=crop',
    'Table Lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=96&h=96&fit=crop',
    'Wall Art': 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=96&h=96&fit=crop',
    'Throw Blanket': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=96&h=96&fit=crop',
    'Vase Set': 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=96&h=96&fit=crop',
    'Candle Holder': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=96&h=96&fit=crop',
    
    // Clothing
    'Cotton T-Shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=96&h=96&fit=crop',
    'Denim Jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=96&h=96&fit=crop',
    'Hooded Sweatshirt': 'https://images.unsplash.com/photo-1556821840-3a63f95609a4?w=96&h=96&fit=crop',
    'Dress Shirt': 'https://images.unsplash.com/photo-1594938291221-94f18e0e0a6a?w=96&h=96&fit=crop',
    'Athletic Shorts': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=96&h=96&fit=crop',
    'Winter Jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=96&h=96&fit=crop',
    
    // Footwear
    'Running Shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=96&h=96&fit=crop',
    'Casual Sneakers': 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=96&h=96&fit=crop',
    'Dress Shoes': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=96&h=96&fit=crop',
    'Boots': 'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=96&h=96&fit=crop',
    'Sandals': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=96&h=96&fit=crop',
    'Athletic Shoes': 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=96&h=96&fit=crop',
    
    // Books
    'Bestseller Novel': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=96&h=96&fit=crop',
    'Cookbook': 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=96&h=96&fit=crop',
    'Biography': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=96&h=96&fit=crop',
    'Science Fiction': 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=96&h=96&fit=crop',
    'Mystery Thriller': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=96&h=96&fit=crop',
    'Self-Help Guide': 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=96&h=96&fit=crop',
    
    // Household Items
    'Laundry Detergent': 'https://images.unsplash.com/photo-1625772452859-1c18360b8a49?w=96&h=96&fit=crop',
    'Paper Towels': 'https://images.unsplash.com/photo-1625772452859-1c18360b8a49?w=96&h=96&fit=crop',
    'Trash Bags': 'https://images.unsplash.com/photo-1625772452859-1c18360b8a49?w=96&h=96&fit=crop',
    'Cleaning Supplies': 'https://images.unsplash.com/photo-1625772452859-1c18360b8a49?w=96&h=96&fit=crop',
    'Storage Bins': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=96&h=96&fit=crop',
    'Light Bulbs': 'https://images.unsplash.com/photo-1625772452859-1c18360b8a49?w=96&h=96&fit=crop',
    
    // Medicine & Health
    'Pain Reliever': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=96&h=96&fit=crop',
    'Vitamins': 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=96&h=96&fit=crop',
    'First Aid Kit': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=96&h=96&fit=crop',
    'Thermometer': 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=96&h=96&fit=crop',
    'Bandages': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=96&h=96&fit=crop',
    'Cough Syrup': 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=96&h=96&fit=crop',
    
    // Beauty Products
    'Moisturizer': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=96&h=96&fit=crop',
    'Lipstick': 'https://images.unsplash.com/photo-1631214524020-7eae0a38b7a1?w=96&h=96&fit=crop',
    'Foundation': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=96&h=96&fit=crop',
    'Mascara': 'https://images.unsplash.com/photo-1631214524020-7eae0a38b7a1?w=96&h=96&fit=crop',
    'Face Mask': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=96&h=96&fit=crop',
    'Sunscreen': 'https://images.unsplash.com/photo-1631214524020-7eae0a38b7a1?w=96&h=96&fit=crop',
    
    // Video Games
    'Action Adventure Game': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=96&h=96&fit=crop',
    'Racing Game': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=96&h=96&fit=crop',
    'Sports Game': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=96&h=96&fit=crop',
    'Puzzle Game': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=96&h=96&fit=crop',
    'RPG Game': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=96&h=96&fit=crop',
    'Strategy Game': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=96&h=96&fit=crop',
    
    // Sports Equipment
    'Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=96&h=96&fit=crop',
    'Tennis Racket': 'https://images.unsplash.com/photo-1622163642999-8bd7a686d14c?w=96&h=96&fit=crop',
    'Yoga Mat': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=96&h=96&fit=crop',
    'Dumbbells': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=96&h=96&fit=crop',
    'Golf Clubs': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=96&h=96&fit=crop',
    
    // Office Supplies
    'Notebook Set': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=96&h=96&fit=crop',
    'Pen Pack': 'https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=96&h=96&fit=crop',
    'Desk Organizer': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=96&h=96&fit=crop',
    'Stapler': 'https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=96&h=96&fit=crop',
    'Paper Clips': 'https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=96&h=96&fit=crop',
    'File Folders': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=96&h=96&fit=crop',
    
    // Furniture
    'Coffee Table': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=96&h=96&fit=crop',
    'Dining Chair': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=96&h=96&fit=crop',
    'Bookshelf': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=96&h=96&fit=crop',
    'Desk': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=96&h=96&fit=crop',
    'Side Table': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=96&h=96&fit=crop',
    'Sofa': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=96&h=96&fit=crop',
    
    // Home Decor
    'Wall Clock': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=96&h=96&fit=crop',
    'Picture Frame': 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=96&h=96&fit=crop',
    'Rug': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=96&h=96&fit=crop',
    'Curtains': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=96&h=96&fit=crop',
    'Mirror': 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=96&h=96&fit=crop',
    'Plant Pot': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=96&h=96&fit=crop',
    
    // Tools & Hardware
    'Drill Set': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=96&h=96&fit=crop',
    'Hammer': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=96&h=96&fit=crop',
    'Screwdriver Set': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=96&h=96&fit=crop',
    'Wrench Set': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=96&h=96&fit=crop',
    'Measuring Tape': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=96&h=96&fit=crop',
    'Toolbox': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=96&h=96&fit=crop',
    
    // Pet Supplies
    'Dog Food': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=96&h=96&fit=crop',
    'Cat Litter': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=96&h=96&fit=crop',
    'Pet Toys': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=96&h=96&fit=crop',
    'Leash': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=96&h=96&fit=crop',
    'Pet Bed': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=96&h=96&fit=crop',
    'Food Bowl': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=96&h=96&fit=crop',
  };
  
  // Check if we have a specific image for this product
  if (productImageMap[productName]) {
    return productImageMap[productName];
  }
  
  // Category-specific fallback images
  const categoryImageMap: Record<string, string> = {
    'Kitchen & Appliances': 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=96&h=96&fit=crop',
    'Home Accessories': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=96&h=96&fit=crop',
    'Clothing': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=96&h=96&fit=crop',
    'Footwear': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=96&h=96&fit=crop',
    'Books': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=96&h=96&fit=crop',
    'Household Items': 'https://images.unsplash.com/photo-1625772452859-1c18360b8a49?w=96&h=96&fit=crop',
    'Medicine & Health': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=96&h=96&fit=crop',
    'Beauty Products': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=96&h=96&fit=crop',
    'Video Games': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=96&h=96&fit=crop',
    'Sports Equipment': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=96&h=96&fit=crop',
    'Office Supplies': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=96&h=96&fit=crop',
    'Furniture': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=96&h=96&fit=crop',
    'Home Decor': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=96&h=96&fit=crop',
    'Tools & Hardware': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=96&h=96&fit=crop',
    'Pet Supplies': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=96&h=96&fit=crop',
  };
  
  // Use category-specific image if available
  if (categoryImageMap[categoryName]) {
    return categoryImageMap[categoryName];
  }
  
  // Final fallback: use a generic product image
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=96&h=96&fit=crop';
}


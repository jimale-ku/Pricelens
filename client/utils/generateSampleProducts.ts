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
    
    sampleProducts.push({
      id: `sample-${categorySlug}-${i + 1}`,
      name: productName,
      image: 'https://via.placeholder.com/96',
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


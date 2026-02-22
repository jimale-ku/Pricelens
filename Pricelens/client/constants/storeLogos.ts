/**
 * Store logos: we support many stores without a huge manual list.
 *
 * 1. Backend sends Clearbit URL from the store’s product link domain (logo.clearbit.com/domain).
 * 2. If no backend logo, we use STORE_LOGO_MAP for known chains (50+ retailers).
 * 3. Else we build Clearbit from the main store name (e.g. "Walmart - SUSR" → walmart.com).
 * 4. When the logo image fails to load (404 or network), StoreCard shows the store’s initial letter in a circle (never blank, no third-party favicon).
 */

const STORE_LOGO_MAP: Record<string, string> = {
  Amazon: 'https://logo.clearbit.com/amazon.com',
  'Amazon Fresh': 'https://logo.clearbit.com/amazon.com',
  Walmart: 'https://logo.clearbit.com/walmart.com',
  Target: 'https://logo.clearbit.com/target.com',
  'Best Buy': 'https://logo.clearbit.com/bestbuy.com',
  Costco: 'https://logo.clearbit.com/costco.com',
  "Sam's Club": 'https://logo.clearbit.com/samsclub.com',
  Kroger: 'https://logo.clearbit.com/kroger.com',
  'King Soopers': 'https://logo.clearbit.com/kroger.com',
  Safeway: 'https://logo.clearbit.com/safeway.com',
  'Whole Foods': 'https://logo.clearbit.com/wholefoodsmarket.com',
  "Trader Joe's": 'https://logo.clearbit.com/traderjoes.com',
  Aldi: 'https://logo.clearbit.com/aldi.us',
  'Food Lion': 'https://logo.clearbit.com/foodlion.com',
  Newegg: 'https://logo.clearbit.com/newegg.com',
  'B&H Photo': 'https://logo.clearbit.com/bhphotovideo.com',
  'Micro Center': 'https://logo.clearbit.com/microcenter.com',
  'Home Depot': 'https://logo.clearbit.com/homedepot.com',
  "Lowe's": 'https://logo.clearbit.com/lowes.com',
  eBay: 'https://logo.clearbit.com/ebay.com',
  Apple: 'https://logo.clearbit.com/apple.com',
  'Google Store': 'https://logo.clearbit.com/store.google.com',
  Samsung: 'https://logo.clearbit.com/samsung.com',
  GameStop: 'https://logo.clearbit.com/gamestop.com',
  CVS: 'https://logo.clearbit.com/cvs.com',
  Walgreens: 'https://logo.clearbit.com/walgreens.com',
  "Macy's": 'https://logo.clearbit.com/macys.com',
  "Kohl's": 'https://logo.clearbit.com/kohls.com',
  Nordstrom: 'https://logo.clearbit.com/nordstrom.com',
  'Office Depot': 'https://logo.clearbit.com/officedepot.com',
  Staples: 'https://logo.clearbit.com/staples.com',
  Wayfair: 'https://logo.clearbit.com/wayfair.com',
  Overstock: 'https://logo.clearbit.com/overstock.com',
  Etsy: 'https://logo.clearbit.com/etsy.com',
  'Bed Bath & Beyond': 'https://logo.clearbit.com/bedbathandbeyond.com',
  'Williams-Sonoma': 'https://logo.clearbit.com/williams-sonoma.com',
  'Petco': 'https://logo.clearbit.com/petco.com',
  'PetSmart': 'https://logo.clearbit.com/petsmart.com',
  'Barnes & Noble': 'https://logo.clearbit.com/barnesandnoble.com',
  'Books-A-Million': 'https://logo.clearbit.com/booksamillion.com',
  // Electronics / multi-store (known domains)
  'B&H': 'https://logo.clearbit.com/bhphotovideo.com',
  Adorama: 'https://logo.clearbit.com/adorama.com',
  Lenovo: 'https://logo.clearbit.com/lenovo.com',
  Dell: 'https://logo.clearbit.com/dell.com',
  HP: 'https://logo.clearbit.com/hp.com',
  'JCPenney': 'https://logo.clearbit.com/jcpenney.com',
  "J.C. Penney": 'https://logo.clearbit.com/jcpenney.com',
  QVC: 'https://logo.clearbit.com/qvc.com',
  'HSN': 'https://logo.clearbit.com/hsn.com',
  'Back Market': 'https://logo.clearbit.com/backmarket.com',
  'Woot': 'https://logo.clearbit.com/woot.com',
  'Ant Online': 'https://logo.clearbit.com/antonline.com',
  'Focus Camera': 'https://logo.clearbit.com/focuscamera.com',
  'Beach Camera': 'https://logo.clearbit.com/beachcamera.com',
};

const PLACEHOLDER_40 = 'https://via.placeholder.com/40/1e2736/8b95a8?text=';

/** Extract main store name for logo lookup (e.g. "Walmart - SUSR" -> "Walmart", "Best Buy" -> "Best Buy") */
function getMainStoreName(storeName: string): string {
  const s = (storeName || '').trim();
  const main = s.split(/\s*[-–|]\s*/)[0].trim();
  return main || s;
}

/**
 * Returns a logo URL for the given store name.
 * Order: backend logo (caller passes) → known-good map → Clearbit → placeholder with initial.
 */
/** Clearbit domain from main name: "Best Buy" -> "bestbuy", "Walmart" -> "walmart" */
function mainNameToClearbitDomain(mainName: string): string {
  return mainName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

export function getStoreLogoUrl(storeName: string, backendLogo?: string | null): string {
  if (backendLogo && typeof backendLogo === 'string' && backendLogo.startsWith('http')) {
    return backendLogo;
  }
  const name = (storeName || '').trim();
  if (!name) return PLACEHOLDER_40 + '?';

  if (STORE_LOGO_MAP[name]) {
    return STORE_LOGO_MAP[name];
  }

  const mainName = getMainStoreName(name);
  if (STORE_LOGO_MAP[mainName]) {
    return STORE_LOGO_MAP[mainName];
  }
  // Match any map key that appears at start of name or equals mainName (e.g. "Best Buy - Store" -> Best Buy)
  const mainLower = mainName.toLowerCase();
  const matchedKey = Object.keys(STORE_LOGO_MAP).find(
    (key) => key.toLowerCase() === mainLower || mainLower.startsWith(key.toLowerCase())
  );
  if (matchedKey) return STORE_LOGO_MAP[matchedKey];

  const clean = mainNameToClearbitDomain(mainName);
  if (clean) {
    return `https://logo.clearbit.com/${clean}.com`;
  }

  const initial = name.charAt(0).toUpperCase() || '?';
  return PLACEHOLDER_40 + encodeURIComponent(initial);
}

/**
 * Category-based placeholder images for popular items (e.g. groceries) when product has no image.
 */
export const CATEGORY_PLACEHOLDER_IMAGES: Record<string, string> = {
  groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
  kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  'home-accessories': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
  clothing: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
  mattresses: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400',
  'beauty-products': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'pet-supplies': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
  books: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
  'sports-equipment': 'https://images.unsplash.com/photo-1461896836934-ff607b4f5c5e?w=400',
};
const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';

export function getCategoryPlaceholderImage(categorySlug: string | undefined | null): string {
  if (!categorySlug) return DEFAULT_CATEGORY_IMAGE;
  return CATEGORY_PLACEHOLDER_IMAGES[categorySlug] || DEFAULT_CATEGORY_IMAGE;
}

/**
 * US store display order: most popular retailers first.
 * Used so barcode/price results show Walmart, Amazon, Target, etc. at the top.
 * Store names are matched case-insensitively; others follow in API order.
 */
export const US_STORE_PRIORITY_ORDER: string[] = [
  'Walmart',
  'Amazon',
  'Target',
  'Costco',
  'Best Buy',
  'Home Depot',
  'Lowe\'s',
  'Kroger',
  'Walgreens',
  'CVS',
  'Staples',
  'Office Depot',
  'Dell',
  'HP',
  'Apple',
  'Newegg',
  'B&H Photo',
  'Micro Center',
  'GameStop',
  'Ebay',
  'eBay',
  'QVC',
  'HSN',
  'Overstock',
  'Wayfair',
  'Bed Bath & Beyond',
  'Kohl\'s',
  'Macy\'s',
  'Nordstrom',
  'Sears',
  'Sam\'s Club',
  'BJ\'s',
  'Publix',
  'Safeway',
  'Albertsons',
  'Aldi',
  'Lidl',
  'Dollar General',
  'Dollar Tree',
  'Family Dollar',
  'Petco',
  'PetSmart',
  'AutoZone',
  'Advance Auto',
  'O\'Reilly',
  'Dick\'s Sporting Goods',
  'Academy Sports',
  'Bass Pro',
  'Cabela\'s',
  'Nike',
  'Adidas',
  'Woot',
  'Rakuten',
  'Wish',
  'AliExpress',
  'Walmart.com',
  'Target.com',
  'Costco.com',
  'BestBuy.com',
  'Amazon.com',
];

/**
 * Sort store prices so most popular US retailers appear first.
 * Exact name match wins; then "Walmart.com" matches "Walmart", etc.
 */
export function sortStoresByPriority<T extends { store: string }>(items: T[]): T[] {
  if (!items?.length) return items;
  const order = US_STORE_PRIORITY_ORDER;
  const byName = (name: string) => {
    const lower = name.toLowerCase().trim();
    const exact = order.findIndex((s) => s.toLowerCase() === lower);
    if (exact >= 0) return exact;
    const partial = order.findIndex(
      (s) => lower.includes(s.toLowerCase()) || s.toLowerCase().includes(lower),
    );
    return partial >= 0 ? partial : order.length;
  };
  return [...items].sort((a, b) => byName(a.store) - byName(b.store));
}

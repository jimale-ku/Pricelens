/**
 * Category Pattern Mapping
 * Maps each category slug to its pattern type (A, B, or C)
 * 
 * Pattern A: Two-Level System (Product Categories)
 * Pattern B: Direct Comparison Table (Location-based services)
 * Pattern C: Service Listings (Business/service comparison)
 */

export type CategoryPattern = 'A' | 'B' | 'C';

export const CATEGORY_PATTERN_MAP: Record<string, CategoryPattern> = {
  // Pattern A: Product Categories (Two-Level System)
  'groceries': 'A',
  'electronics': 'A',
  'kitchen': 'A',
  'home-accessories': 'A',
  'clothing': 'A',
  'footwear': 'A',
  'books': 'A',
  'household': 'A',
  'medicine': 'A',
  'beauty': 'A',
  'video-games': 'A',
  'sports': 'A',
  'office': 'A',
  'furniture': 'A',
  'home-decor': 'A',
  'tools': 'A',
  'pet-supplies': 'A',
  
  // Pattern B: Direct Comparison Table (Location-based)
  'gas-stations': 'B',
  'gym': 'B',
  'car-insurance': 'B',
  'renters-insurance': 'B',
  'tires': 'B',
  'mattresses': 'B',
  'oil-changes': 'B',
  'car-washes': 'B',
  'rental-cars': 'B',
  'hotels': 'B',
  'airfare': 'B',
  'storage': 'B',
  'meal-kits': 'B',
  
  // Pattern C: Service Listings (Business/service comparison)
  'haircuts': 'C',
  'massage': 'C',
  'nail-salons': 'C',
  'spa': 'C',
  'apartments': 'C',
  'moving': 'C',
  'food-delivery': 'C',
  'services': 'C',
};

/**
 * Get pattern for a category slug
 */
export function getCategoryPattern(slug: string): CategoryPattern {
  return CATEGORY_PATTERN_MAP[slug] || 'A'; // Default to Pattern A
}


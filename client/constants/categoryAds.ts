/**
 * Category-specific sponsored ad content for Pattern A categories.
 * Used to show relevant ads at the bottom of category pages (e.g. groceries → grocery delivery).
 * Replace placeholder URLs and copy with real advertiser content for monetization.
 */

export interface CategoryAdContent {
  /** Small label above image, e.g. "ADVERTISEMENT" */
  label: string;
  /** Sponsor name shown top-right, e.g. "Sponsored by FreshMart Delivery" */
  sponsorName: string;
  /** Headline under the image */
  headline: string;
  /** Body text (one short paragraph) */
  body: string;
  /** CTA button text */
  ctaText: string;
  /** URL opened when user taps CTA (optional – no-op if not set) */
  ctaUrl?: string;
  /** Image URL for the ad creative */
  imageUrl: string;
}

/** Map category slug to ad content. Add entries as you sign advertisers per category. */
export const CATEGORY_ADS: Record<string, CategoryAdContent> = {
  groceries: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by FreshMart Delivery',
    headline: 'Get Your Groceries Delivered - $20 Off First Order!',
    body: 'Fresh produce, quality meats, and pantry staples delivered to your door. Free delivery on orders over $50.',
    ctaText: 'Order Now',
    ctaUrl: 'https://example.com/freshmart',
    imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
  },
  electronics: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by TechDeals',
    headline: 'Compare Electronics Prices - Best Deals on TVs & Gadgets',
    body: 'Find the lowest prices on TVs, laptops, headphones, and more. We compare top retailers so you get the best deal.',
    ctaText: 'Shop Deals',
    ctaUrl: 'https://example.com/techdeals',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
  },
  kitchen: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by KitchenPro',
    headline: 'Upgrade Your Kitchen - Appliances & Cookware on Sale',
    body: 'Compare prices on blenders, coffee makers, cookware, and major appliances. Free shipping on orders over $99.',
    ctaText: 'View Deals',
    ctaUrl: 'https://example.com/kitchenpro',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  },
  'home-accessories': {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by HomeStyle',
    headline: 'Home Decor & Accessories - Best Prices Online',
    body: 'Rugs, lighting, frames, and accent pieces. Compare prices across top home retailers and save.',
    ctaText: 'Shop Home',
    ctaUrl: 'https://example.com/homestyle',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
  },
  clothing: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by FashionDeals',
    headline: 'Compare Clothing Prices - Save on Fashion',
    body: 'We compare prices on apparel from top brands and retailers. Find the best deal before you buy.',
    ctaText: 'Find Deals',
    ctaUrl: 'https://example.com/fashiondeals',
    imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
  },
  footwear: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by ShoeDeals',
    headline: 'Best Shoe Prices - Compare Sneakers, Boots & More',
    body: 'Compare footwear prices across retailers. Athletic, casual, and dress shoes from top brands.',
    ctaText: 'Shop Shoes',
    ctaUrl: 'https://example.com/shoedeals',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
  },
  books: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by BookHub',
    headline: 'Compare Book Prices - New & Used, All Genres',
    body: 'Find the best price on textbooks, bestsellers, and e-books. We check multiple sellers so you save.',
    ctaText: 'Find Books',
    ctaUrl: 'https://example.com/bookhub',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
  },
  household: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by HomeEssentials',
    headline: 'Household Essentials - Compare & Save',
    body: 'Cleaning supplies, paper goods, and everyday essentials. Compare prices and get them delivered.',
    ctaText: 'Shop Now',
    ctaUrl: 'https://example.com/homeessentials',
    imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800',
  },
  medicine: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by HealthMart',
    headline: 'Compare Pharmacy & Health Product Prices',
    body: 'Over-the-counter meds, vitamins, and health essentials. Compare prices and pick up or get delivery.',
    ctaText: 'Compare Prices',
    ctaUrl: 'https://example.com/healthmart',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
  },
  beauty: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by BeautyDeals',
    headline: 'Beauty & Personal Care - Best Prices Compared',
    body: 'Skincare, makeup, and hair care from your favorite brands. We find the lowest prices for you.',
    ctaText: 'Shop Beauty',
    ctaUrl: 'https://example.com/beautydeals',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
  },
  'video-games': {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by GameDeals',
    headline: 'Video Game Deals - Compare Prices on New Releases',
    body: 'Compare prices on games for PlayStation, Xbox, Nintendo, and PC. Pre-orders and new releases.',
    ctaText: 'Find Deals',
    ctaUrl: 'https://example.com/gamedeals',
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
  },
  sports: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by SportsGear',
    headline: 'Sports & Fitness - Compare Gear Prices',
    body: 'Equipment, apparel, and accessories for your sport. We compare prices so you get the best deal.',
    ctaText: 'Shop Sports',
    ctaUrl: 'https://example.com/sportsgear',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  },
  'sports-equipment': {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by SportsGear',
    headline: 'Sports Equipment - Best Prices Online',
    body: 'Compare prices on bikes, weights, outdoor gear, and more. Find the right equipment at the right price.',
    ctaText: 'Compare Now',
    ctaUrl: 'https://example.com/sportsequipment',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
  },
  office: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by OfficeSupply',
    headline: 'Office Supplies & Furniture - Compare Prices',
    body: 'Desks, chairs, paper, and tech. Compare office supply retailers and save on your next order.',
    ctaText: 'Shop Office',
    ctaUrl: 'https://example.com/officesupply',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
  },
  furniture: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by FurnitureDeals',
    headline: 'Furniture Price Comparison - Living, Bedroom & More',
    body: 'Compare furniture prices across retailers. Sofas, beds, tables, and decor with delivery options.',
    ctaText: 'Compare Furniture',
    ctaUrl: 'https://example.com/furnituredeals',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  },
  tools: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by ToolPro',
    headline: 'Tools & Hardware - Compare Prices',
    body: 'Power tools, hand tools, and hardware. Compare prices from top retailers and get the job done for less.',
    ctaText: 'Shop Tools',
    ctaUrl: 'https://example.com/toolpro',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800',
  },
  'pet-supplies': {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by PetCare',
    headline: 'Pet Supplies - Compare Food, Toys & More',
    body: 'Compare prices on pet food, treats, toys, and supplies. We check multiple retailers so your pet saves too.',
    ctaText: 'Shop Pet',
    ctaUrl: 'https://example.com/petcare',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
  },
  mattresses: {
    label: 'ADVERTISEMENT',
    sponsorName: 'Sponsored by SleepWell',
    headline: 'Compare Mattress Prices - Find Your Best Deal',
    body: 'We compare mattress prices so you can sleep better for less. All sizes and types from top brands.',
    ctaText: 'Compare Mattresses',
    ctaUrl: 'https://example.com/sleepwell',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
  },
};

/**
 * Get ad content for a category. Returns undefined if no ad is configured.
 */
export function getAdForCategory(categorySlug: string): CategoryAdContent | undefined {
  return CATEGORY_ADS[categorySlug];
}

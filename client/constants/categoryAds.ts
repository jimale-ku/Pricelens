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
    ctaUrl: 'https://example.com/freshmart', // Replace with real partner URL
    imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800', // Shopping carts / grocery
  },
  // Add more categories as you sign advertisers, e.g.:
  // electronics: { ... },
  // clothing: { ... },
};

/**
 * Get ad content for a category. Returns undefined if no ad is configured.
 */
export function getAdForCategory(categorySlug: string): CategoryAdContent | undefined {
  return CATEGORY_ADS[categorySlug];
}

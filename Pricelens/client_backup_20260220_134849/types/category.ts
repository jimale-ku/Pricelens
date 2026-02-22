/**
 * Category Type Definitions
 */

export type CategoryType = 'product' | 'service';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // Icon name from expo vector icons
  iconColor: string;
  type: CategoryType;
  stores: string[]; // Store IDs
  subcategories?: Subcategory[];
  isNew?: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  count?: number;
  icon?: string;
}

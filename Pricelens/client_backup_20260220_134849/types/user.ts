/**
 * User Type Definitions
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  location?: UserLocation;
  preferences?: UserPreferences;
  createdAt: Date;
}

export interface UserLocation {
  zipCode: string;
  city?: string;
  state?: string;
}

export interface UserPreferences {
  favoriteStores: string[];
  favoriteCategories: string[];
  priceAlerts: boolean;
  emailNotifications: boolean;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: Date;
}

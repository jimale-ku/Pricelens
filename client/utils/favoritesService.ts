/**
 * Favorites Service - Manages user favorites
 * Uses AsyncStorage for React Native, localStorage for web
 */

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage not available (web environment)
}

const STORAGE_KEY = 'pricelens-favorites';

// Platform-agnostic storage helper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (AsyncStorage) {
        return await AsyncStorage.getItem(key);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error('❌ Error reading from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('❌ Error writing to storage:', error);
    }
  },
};

export interface FavoriteProduct {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  categorySlug: string;
  minPrice?: number;
  storeCount?: number;
  favoritedAt: string;
}

/**
 * Get all favorites
 */
export async function getAllFavorites(): Promise<FavoriteProduct[]> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('❌ Error reading favorites:', error);
    return [];
  }
}

/**
 * Check if product is favorited
 */
export async function isFavorite(productId: string): Promise<boolean> {
  const favorites = await getAllFavorites();
  return favorites.some(f => f.productId === productId.toString());
}

/**
 * Add product to favorites
 */
export async function addFavorite(product: FavoriteProduct): Promise<{ success: boolean; message: string }> {
  try {
    const favorites = await getAllFavorites();
    
    // Check if already favorited
    if (favorites.some(f => f.productId === product.productId.toString())) {
      return { success: false, message: 'Already in favorites' };
    }
    
    favorites.push({
      ...product,
      favoritedAt: new Date().toISOString(),
    });
    
    await storage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return { success: true, message: 'Added to favorites!' };
  } catch (error) {
    console.error('❌ Error adding favorite:', error);
    return { success: false, message: 'Failed to add favorite' };
  }
}

/**
 * Remove product from favorites
 */
export async function removeFavorite(productId: string): Promise<{ success: boolean; message: string }> {
  try {
    const favorites = await getAllFavorites();
    const filtered = favorites.filter(f => f.productId !== productId.toString());
    
    if (filtered.length === favorites.length) {
      return { success: false, message: 'Favorite not found' };
    }
    
    await storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return { success: true, message: 'Removed from favorites' };
  } catch (error) {
    console.error('❌ Error removing favorite:', error);
    return { success: false, message: 'Failed to remove favorite' };
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(product: FavoriteProduct): Promise<{ success: boolean; isFavorite: boolean; message: string }> {
  const currentlyFavorite = await isFavorite(product.productId);
  
  if (currentlyFavorite) {
    const result = await removeFavorite(product.productId);
    return { ...result, isFavorite: false };
  } else {
    const result = await addFavorite(product);
    return { ...result, isFavorite: true };
  }
}

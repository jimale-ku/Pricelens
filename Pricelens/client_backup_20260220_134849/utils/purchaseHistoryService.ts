/**
 * Purchase History Service - Tracks items users have purchased
 * Uses AsyncStorage for React Native, localStorage for web
 */

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage not available (web environment)
}

const STORAGE_KEY = 'pricelens-purchase-history';

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

export interface PurchaseRecord {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  storeName: string;
  storeImage?: string;
  price: number;
  quantity: number;
  purchasedAt: string;
  productUrl?: string; // URL where they purchased from
}

/**
 * Get all purchase history
 */
export async function getPurchaseHistory(): Promise<PurchaseRecord[]> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    // Sort by most recent first
    return parsed.sort((a: PurchaseRecord, b: PurchaseRecord) => 
      new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
  } catch (error) {
    console.error('❌ Error reading purchase history:', error);
    return [];
  }
}

/**
 * Add purchase record
 * This is called when user clicks "Shop Now" and we want to track purchases
 */
export async function addPurchaseRecord(
  productId: string,
  productName: string,
  productImage: string,
  category: string,
  storeName: string,
  price: number,
  quantity: number = 1,
  storeImage?: string,
  productUrl?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const history = await getPurchaseHistory();
    
    const newRecord: PurchaseRecord = {
      id: `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productName,
      productImage,
      category,
      storeName,
      storeImage,
      price,
      quantity,
      purchasedAt: new Date().toISOString(),
      productUrl,
    };
    
    history.unshift(newRecord); // Add to beginning
    await storage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    return { success: true, message: 'Purchase recorded' };
  } catch (error) {
    console.error('❌ Error adding purchase record:', error);
    return { success: false, message: 'Failed to record purchase' };
  }
}

/**
 * Remove purchase record
 */
export async function removePurchaseRecord(purchaseId: string): Promise<{ success: boolean; message: string }> {
  try {
    const history = await getPurchaseHistory();
    const filtered = history.filter(h => h.id !== purchaseId);
    
    if (filtered.length === history.length) {
      return { success: false, message: 'Purchase record not found' };
    }
    
    await storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return { success: true, message: 'Purchase record removed' };
  } catch (error) {
    console.error('❌ Error removing purchase record:', error);
    return { success: false, message: 'Failed to remove purchase record' };
  }
}

/**
 * Get purchase history for a specific product
 */
export async function getProductPurchaseHistory(productId: string): Promise<PurchaseRecord[]> {
  const history = await getPurchaseHistory();
  return history.filter(h => h.productId === productId.toString());
}

/**
 * Get total spent
 */
export async function getTotalSpent(): Promise<number> {
  const history = await getPurchaseHistory();
  return history.reduce((total, record) => total + (record.price * record.quantity), 0);
}

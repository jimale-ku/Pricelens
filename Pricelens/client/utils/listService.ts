/**
 * List Service - Manages shopping lists in storage
 * Simple implementation without authentication
 * Uses AsyncStorage for React Native, localStorage for web
 */

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage not available (web environment)
}

// Platform-agnostic storage helper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Try AsyncStorage first (React Native)
      if (AsyncStorage) {
        const value = await AsyncStorage.getItem(key);
        return value;
      }
      // Fallback to localStorage (web)
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
      // Try AsyncStorage first (React Native)
      if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
        return;
      }
      // Fallback to localStorage (web)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('❌ Error writing to storage:', error);
    }
  },
};

export interface ListItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  storePrices: Array<{
    rank: number;
    storeName: string;
    price: string;
    storeImage: string;
    isBestDeal?: boolean;
  }>;
  bestPrice?: number;
  bestPriceStore?: string;
  quantity: number;
  addedAt: string;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ListItem[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_LIST_NAME = 'My Shopping List';
const STORAGE_KEY = 'pricelens-shopping-lists';

/**
 * Get all lists from storage (async for AsyncStorage)
 */
export async function getAllLists(): Promise<ShoppingList[]> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    
    if (!stored) {
      // Create default list if none exists
      const defaultList: ShoppingList = {
        id: 'default-list',
        name: DEFAULT_LIST_NAME,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveAllLists([defaultList]);
      return [defaultList];
    }
    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.error('❌ Error reading lists from storage:', error);
    return [];
  }
}

/**
 * Synchronous version for backward compatibility (returns cached data)
 */
let cachedLists: ShoppingList[] | null = null;
export function getAllListsSync(): ShoppingList[] {
  if (cachedLists) return cachedLists;
  // Return empty array if not cached yet (will be populated by async call)
  return [];
}

/**
 * Save all lists to storage (async)
 */
async function saveAllLists(lists: ShoppingList[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(lists);
    await storage.setItem(STORAGE_KEY, jsonData);
    // Update cache
    cachedLists = lists;
  } catch (error) {
    console.error('❌ Error saving lists to storage:', error);
  }
}

/**
 * Get default list (async)
 */
export async function getDefaultList(): Promise<ShoppingList> {
  const lists = await getAllLists();
  if (lists.length === 0) {
    const defaultList: ShoppingList = {
      id: 'default-list',
      name: DEFAULT_LIST_NAME,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveAllLists([defaultList]);
    return defaultList;
  }
  return lists[0];
}

/**
 * Get current shopping list (grocery list or default) - for adding items quickly
 */
export async function getCurrentList(): Promise<ShoppingList> {
  const lists = await getAllLists();
  // Try to find grocery list first
  const grocery = lists.find(
    (l) =>
      l.name.toLowerCase().includes('grocery') ||
      l.name.toLowerCase() === 'groceries list' ||
      l.name.toLowerCase().includes('shopping')
  );
  if (grocery) {
    return grocery;
  }
  // Fall back to first list or create default
  if (lists.length > 0) {
    return lists[0];
  }
  return await getDefaultList();
}

/**
 * Get or create category-specific list (async)
 */
async function getOrCreateCategoryList(category: string): Promise<ShoppingList> {
  const lists = await getAllLists();
  const categoryListName = `${category} List`;
  
  // Try to find existing category list
  let categoryList = lists.find(l => 
    l.name.toLowerCase() === categoryListName.toLowerCase() ||
    l.name.toLowerCase().includes(category.toLowerCase())
  );
  
  if (!categoryList) {
    // Create new category-specific list
    categoryList = {
      id: `list-${category.toLowerCase()}-${Date.now()}`,
      name: categoryListName,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    lists.push(categoryList);
    await saveAllLists(lists);
  }
  
  return categoryList;
}

/**
 * Add item to list - smart category detection (async)
 */
export async function addItemToList(
  productId: string,
  productName: string,
  productImage: string,
  category: string,
  storePrices: ListItem['storePrices'],
  bestPrice?: number,
  bestPriceStore?: string,
  listId?: string
): Promise<{ success: boolean; message: string; listName?: string }> {
  try {
    const lists = await getAllLists();
    console.log('📦 addItemToList: All lists:', lists.map(l => ({ id: l.id, name: l.name, itemCount: l.items.length })));
    console.log('📦 addItemToList: Looking for listId:', listId);
    
    let targetList: ShoppingList;
    let targetListIndex = -1;
    
    if (listId) {
      // Use specified list
      targetListIndex = lists.findIndex(l => l.id === listId);
      if (targetListIndex >= 0) {
        targetList = lists[targetListIndex];
        console.log('📦 addItemToList: Found list:', targetList.name, 'at index', targetListIndex);
      } else {
        console.log('📦 addItemToList: List not found, using default');
        targetList = await getDefaultList();
        // Reload lists to ensure we have the latest version
        const updatedLists = await getAllLists();
        targetListIndex = updatedLists.findIndex(l => l.id === targetList.id);
        if (targetListIndex >= 0) {
          // Use the list from the updated array
          lists.length = 0;
          lists.push(...updatedLists);
          targetList = lists[targetListIndex];
        }
      }
    } else {
      // Smart: Use category-specific list or create one
      targetList = await getOrCreateCategoryList(category);
      // Reload lists to ensure we have the latest version (in case a new list was created)
      const updatedLists = await getAllLists();
      targetListIndex = updatedLists.findIndex(l => l.id === targetList.id);
      if (targetListIndex >= 0) {
        // Use the list from the updated array
        lists.length = 0;
        lists.push(...updatedLists);
        targetList = lists[targetListIndex];
      }
    }

    // Check if item already exists
    const existingItemIndex = targetList.items.findIndex(
      item => item.productId === productId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      targetList.items[existingItemIndex].quantity += 1;
      targetList.items[existingItemIndex].addedAt = new Date().toISOString();
      // Update prices if new data is available
      if (storePrices && storePrices.length > 0) {
        targetList.items[existingItemIndex].storePrices = storePrices;
      }
      if (bestPrice !== undefined) {
        targetList.items[existingItemIndex].bestPrice = bestPrice;
      }
      if (bestPriceStore) {
        targetList.items[existingItemIndex].bestPriceStore = bestPriceStore;
      }
    } else {
      // Add new item
      const newItem: ListItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId,
        productName,
        productImage,
        category,
        storePrices,
        bestPrice,
        bestPriceStore,
        quantity: 1,
        addedAt: new Date().toISOString(),
      };
      targetList.items.push(newItem);
    }

    targetList.updatedAt = new Date().toISOString();
    
    // Update the list in the arrays (important: modify the actual list object)
    if (targetListIndex >= 0) {
      lists[targetListIndex] = targetList;
    } else {
      // If list wasn't in array (shouldn't happen), add it
      lists.push(targetList);
    }
    
    console.log('📦 addItemToList: Saving lists, target list now has', targetList.items.length, 'items');
    await saveAllLists(lists);
    console.log('📦 addItemToList: Lists saved successfully');

    return { 
      success: true, 
      message: `Added to ${targetList.name}!`,
      listName: targetList.name,
    };
  } catch (error) {
    console.error('❌ Error adding item to list:', error);
    return { success: false, message: `Failed to add item to list: ${error}` };
  }
}

/**
 * Add multiple items by name to a list (bulk paste). Uses minimal item data; prices can be filled later.
 */
export async function addBulkItemsToList(
  listId: string,
  itemNames: string[]
): Promise<{ added: number; skipped: number; message: string }> {
  try {
    const lists = await getAllLists();
    const list = lists.find(l => l.id === listId);
    if (!list) {
      return { added: 0, skipped: itemNames.length, message: 'List not found' };
    }

    const trimmed = itemNames.map(n => n.trim()).filter(n => n.length > 0);
    if (trimmed.length === 0) {
      return { added: 0, skipped: 0, message: 'No valid items to add' };
    }

    let added = 0;
    for (const name of trimmed) {
      const key = name.toLowerCase();
      const existing = list.items.find(
        i => i.productName.toLowerCase() === key
      );
      if (existing) {
        existing.quantity += 1;
        existing.addedAt = new Date().toISOString();
        added += 1;
        continue;
      }
      const newItem: ListItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: `bulk-${key.replace(/\s+/g, '-')}-${Date.now()}`,
        productName: name,
        productImage: '',
        category: 'General',
        storePrices: [],
        quantity: 1,
        addedAt: new Date().toISOString(),
      };
      list.items.push(newItem);
      added += 1;
    }

    list.updatedAt = new Date().toISOString();
    await saveAllLists(lists);
    const skipped = trimmed.length - added;
    return {
      added,
      skipped,
      message: added > 0
        ? `Added ${added} item${added !== 1 ? 's' : ''} to ${list.name}.`
        : 'No new items added.',
    };
  } catch (error) {
    console.error('❌ Error in addBulkItemsToList:', error);
    return {
      added: 0,
      skipped: itemNames.length,
      message: `Failed to add items: ${error}`,
    };
  }
}

/**
 * Remove item from list (async)
 */
export async function removeItemFromList(listId: string, itemId: string): Promise<{ success: boolean; message: string }> {
  try {
    const lists = await getAllLists();
    const list = lists.find(l => l.id === listId);
    
    if (!list) {
      return { success: false, message: 'List not found' };
    }

    list.items = list.items.filter(item => item.id !== itemId);
    list.updatedAt = new Date().toISOString();
    await saveAllLists(lists);

    return { success: true, message: 'Item removed from list' };
  } catch (error) {
    console.error('Error removing item from list:', error);
    return { success: false, message: 'Failed to remove item' };
  }
}

/**
 * Update item quantity (async)
 */
export async function updateItemQuantity(
  listId: string,
  itemId: string,
  quantity: number
): Promise<{ success: boolean; message: string }> {
  try {
    const lists = await getAllLists();
    const list = lists.find(l => l.id === listId);
    
    if (!list) {
      return { success: false, message: 'List not found' };
    }

    const item = list.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return await removeItemFromList(listId, itemId);
    }

    item.quantity = quantity;
    list.updatedAt = new Date().toISOString();
    await saveAllLists(lists);

    return { success: true, message: 'Quantity updated' };
  } catch (error) {
    console.error('Error updating item quantity:', error);
    return { success: false, message: 'Failed to update quantity' };
  }
}

/**
 * Get list by ID (async)
 */
export async function getListById(listId: string): Promise<ShoppingList | null> {
  const lists = await getAllLists();
  return lists.find(l => l.id === listId) || null;
}

/**
 * Synchronous version for backward compatibility
 */
export function getListByIdSync(listId: string): ShoppingList | null {
  const lists = getAllListsSync();
  return lists.find(l => l.id === listId) || null;
}

/**
 * Calculate total cost for a list
 */
export function calculateListTotal(list: ShoppingList): {
  total: number;
  byStore: Record<string, number>;
} {
  const byStore: Record<string, number> = {};
  let total = 0;

  list.items.forEach(item => {
    if (item.bestPrice) {
      const itemTotal = item.bestPrice * item.quantity;
      total += itemTotal;
      
      if (item.bestPriceStore) {
        byStore[item.bestPriceStore] = (byStore[item.bestPriceStore] || 0) + itemTotal;
      }
    }
  });

  return { total, byStore };
}

/**
 * Create a new list (async)
 */
export async function createList(name: string): Promise<ShoppingList> {
  const lists = await getAllLists();
  const newList: ShoppingList = {
    id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  lists.push(newList);
  await saveAllLists(lists);
  return newList;
}

/**
 * Delete a list (async)
 */
export async function deleteList(listId: string): Promise<{ success: boolean; message: string }> {
  try {
    const lists = await getAllLists();
    const filtered = lists.filter(l => l.id !== listId);
    
    if (filtered.length === lists.length) {
      return { success: false, message: 'List not found' };
    }

    await saveAllLists(filtered);
    return { success: true, message: 'List deleted' };
  } catch (error) {
    console.error('Error deleting list:', error);
    return { success: false, message: 'Failed to delete list' };
  }
}

